"""Offline, pre-checkout trust bootstrap for GitHub-hosted Ubuntu jobs.

Inlined into workflows by sync-workflows.mjs; never downloaded at job runtime.
Temporary root exclusions match Homebrew ca-certificates 2026-10-20:
https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/c/ca-certificates.rb
"""

import hashlib
import os
from pathlib import Path
import re
import ssl
import subprocess
import tempfile


BLOCKED_KEYS = frozenset({
    "bd153ed7b0434f6886b17bce8bbe84ed340c7132d702a8f4fa318f756ecbd6f3",
    "c619e4780ed8e0abeda24ad732567de4383a7ea941338f6d1a7d1b49ac792fe9",
    "8d417db2dd8bf5e3084d1e3f196d583849d81bdd4c00c70b9d39369e96b8c782",
})


def public_key_hash(pem):
    key = subprocess.run(
        ["openssl", "x509", "-pubkey", "-noout"], input=pem,
        capture_output=True, check=True, timeout=5,
    ).stdout
    der = subprocess.run(
        ["openssl", "pkey", "-pubin", "-outform", "DER"], input=key,
        capture_output=True, check=True, timeout=5,
    ).stdout
    return hashlib.sha256(der).hexdigest()


def filter_bundle(source, blocked=BLOCKED_KEYS):
    certs = re.findall(
        rb"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", source, re.S,
    )
    if not certs or len(certs) != source.count(b"-----BEGIN CERTIFICATE-----"):
        raise ValueError("empty or truncated CA bundle")
    kept = [cert for cert in certs if public_key_hash(cert) not in blocked]
    if not kept:
        raise ValueError("no trusted certificates remain")
    result = b"\n".join(kept) + b"\n"
    ssl.create_default_context(cadata=result.decode("ascii"))
    return result, len(certs) - len(kept)


def main():
    # No network, sudo, checkout, third-party imports, or credentials required.
    bundle, removed = filter_bundle(Path("/etc/ssl/certs/ca-certificates.crt").read_bytes())
    directory = Path(tempfile.mkdtemp(prefix="ci-tls-", dir=os.environ["RUNNER_TEMP"]))
    # Public roots must remain readable by subsequent privilege-dropped steps.
    directory.chmod(0o755)
    ca_file = directory / "ca.pem"
    ca_file.write_bytes(bundle)
    ca_file.chmod(0o644)
    empty = directory / "empty"
    empty.mkdir()
    # A clean CA file alone is insufficient: OpenSSL can also load its hash dir.
    settings = {key: str(ca_file) for key in (
        "SSL_CERT_FILE", "CURL_CA_BUNDLE", "GIT_SSL_CAINFO",
        "REQUESTS_CA_BUNDLE", "PIP_CERT", "GRPC_DEFAULT_SSL_ROOTS_FILE_PATH",
    )}
    settings.update(SSL_CERT_DIR=str(empty), GIT_SSL_CAPATH=str(empty))
    # NODE_OPTIONS must be declared in YAML; GITHUB_ENV explicitly forbids it.
    with Path(os.environ["GITHUB_ENV"]).open("a", encoding="utf-8") as output:
        for key, value in settings.items():
            if "\n" in value or "\r" in value:
                raise ValueError("invalid environment path")
            output.write(f"{key}={value}\n")
    print(f"CI trust bundle ready; excluded {removed} root certificate(s)")


if __name__ == "__main__":
    main()
