import importlib.util
import os
from pathlib import Path
import ssl
import subprocess
import tempfile
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location("bootstrap", Path(__file__).with_name("bootstrap.py"))
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)


class TrustTests(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.object(bootstrap, "verify_runner_node")
        patcher.start()
        self.addCleanup(patcher.stop)

    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.directory.cleanup)
        cls.certs = []
        # Locally generated public test certificates; no production material.
        for name in ("keep", "exclude"):
            path = Path(cls.directory.name) / name
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                "-keyout", str(path.with_suffix(".key")), "-out", str(path),
                "-days", "1", "-subj", f"/CN={name}",
            ], check=True, capture_output=True, timeout=20)
            cls.certs.append(path.read_bytes())

    def test_removes_public_key_not_subject_or_filename(self):
        keep, exclude = self.certs
        bundle, removed = bootstrap.filter_bundle(keep + exclude, {bootstrap.public_key_hash(exclude)})
        self.assertEqual(removed, 1)
        self.assertIn(keep.strip(), bundle)
        self.assertNotIn(exclude.strip(), bundle)
        ssl.create_default_context(cadata=bundle.decode())

    def test_already_filtered_bundle_is_idempotent(self):
        bundle, removed = bootstrap.filter_bundle(self.certs[0])
        self.assertEqual(removed, 0)
        self.assertEqual(bootstrap.filter_bundle(bundle), (bundle, 0))

    def test_empty_truncated_and_malformed_fail_closed(self):
        for value in (b"", b"-----BEGIN CERTIFICATE-----", b"-----BEGIN CERTIFICATE-----bad-----END CERTIFICATE-----"):
            with self.subTest(value=value), self.assertRaises((ValueError, subprocess.CalledProcessError)):
                bootstrap.filter_bundle(value)

    def test_cannot_remove_every_root(self):
        with self.assertRaises(ValueError):
            bootstrap.filter_bundle(self.certs[0], {bootstrap.public_key_hash(self.certs[0])})

    def test_known_incident_public_keys_are_complete(self):
        self.assertEqual(len(bootstrap.BLOCKED_KEYS), 3)
        self.assertTrue(all(len(key) == 64 for key in bootstrap.BLOCKED_KEYS))

    def test_environment_selects_only_filtered_file_and_empty_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            env_file = Path(temporary) / "environment"
            env_file.touch()
            with mock.patch.dict(os.environ, {"RUNNER_TEMP": temporary, "GITHUB_ENV": str(env_file)}), \
                    mock.patch.object(bootstrap.Path, "read_bytes", return_value=self.certs[0]):
                bootstrap.main()
            settings = dict(line.split("=", 1) for line in env_file.read_text().splitlines())
            self.assertNotIn("NODE_OPTIONS", settings)
            self.assertEqual(settings["SSL_CERT_FILE"], settings["GIT_SSL_CAINFO"])
            self.assertEqual(settings["SSL_CERT_DIR"], settings["GIT_SSL_CAPATH"])
            self.assertEqual(list(Path(settings["SSL_CERT_DIR"]).iterdir()), [])
            self.assertEqual(Path(settings["SSL_CERT_FILE"]).stat().st_mode & 0o777, 0o644)
            self.assertEqual(Path(settings["SSL_CERT_FILE"]).parent.stat().st_mode & 0o777, 0o755)
            ssl.create_default_context(cafile=settings["SSL_CERT_FILE"])

    def test_invalid_bundle_cannot_publish_environment(self):
        with tempfile.TemporaryDirectory() as temporary:
            env_file = Path(temporary) / "environment"
            env_file.touch()
            with mock.patch.dict(os.environ, {"RUNNER_TEMP": temporary, "GITHUB_ENV": str(env_file)}), \
                    mock.patch.object(bootstrap.Path, "read_bytes", return_value=b"invalid"), \
                    self.assertRaises(ValueError):
                bootstrap.main()
            self.assertEqual(env_file.read_text(), "")

    def test_blog_candidate_emits_mandatory_gate_but_setup_does_not(self):
        for scope in ("blog", "reviewed-setup", None):
            with self.subTest(scope=scope), tempfile.TemporaryDirectory() as temporary:
                output = Path(temporary) / "environment"
                with mock.patch.dict(os.environ, {"RUNNER_TEMP": temporary, "GITHUB_ENV": str(output)}), \
                        mock.patch.object(bootstrap, "verify_runner_node", return_value=scope), \
                        mock.patch.object(bootstrap.Path, "read_bytes", return_value=self.certs[0]):
                    bootstrap.main()
                self.assertEqual("BLOG_CONTENT_GATE=required" in output.read_text(), scope == "blog")


class RuntimeTests(unittest.TestCase):
    def test_default_stays_strict_and_only_explicit_callback_can_allow_exception(self):
        result = subprocess.CompletedProcess([], 0, stdout="v24.21.0\n")
        with mock.patch.object(bootstrap, "runner_node", return_value=Path('/runner/node')), \
                mock.patch.object(bootstrap.subprocess, "run", return_value=result):
            with self.assertRaises(ValueError):
                bootstrap.verify_runner_node()
            with self.assertRaises(ValueError):
                bootstrap.verify_runner_node(exception=lambda _: False)
            approved = mock.Mock(return_value=True)
            bootstrap.verify_runner_node(exception=approved)
            approved.assert_called_once_with("v24.21.0")

    def test_patched_runner_needs_no_exception(self):
        result = subprocess.CompletedProcess([], 0, stdout="v24.22.1\n")
        with mock.patch.object(bootstrap, "runner_node", return_value=Path('/runner/node')), \
                mock.patch.object(bootstrap.subprocess, "run", return_value=result):
            approved = mock.Mock(side_effect=AssertionError("exception not needed"))
            bootstrap.verify_runner_node(exception=approved)
            approved.assert_not_called()

    def test_supported_patched_releases(self):
        for version in ("v22.23.4", "v24.22.1", "v26.12.1", "v24.23.0"):
            bootstrap.require_patched_node(version)

    def test_affected_eol_unknown_and_prerelease_fail_closed(self):
        for version in ("v22.23.3", "v24.21.0", "v24.22.0", "v26.12.0",
                        "v25.9.0", "v20.99.0", "v28.1.0", "v24.22.1-rc.1", "bad"):
            with self.subTest(version=version), self.assertRaises(ValueError):
                bootstrap.require_patched_node(version)

    def test_resolves_worker_from_actual_ancestry(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            worker = root / "runner/bin/Runner.Worker"
            worker.parent.mkdir(parents=True)
            worker.touch()
            node = root / "runner/externals/node24/bin/node"
            node.parent.mkdir(parents=True)
            node.touch()
            for pid, executable, parent in ((10, Path('/bin/sh'), 9), (9, worker, 1)):
                process = root / str(pid)
                process.mkdir()
                (process / "exe").symlink_to(executable)
                (process / "status").write_text(f"PPid:\t{parent}\n")
            self.assertEqual(bootstrap.runner_node(root, 10), node.resolve())
            node.unlink()
            with self.assertRaises(ValueError):
                bootstrap.runner_node(root, 10)

    def test_failed_runtime_gate_does_not_publish_trust(self):
        with mock.patch.object(bootstrap, "verify_runner_node", side_effect=ValueError), \
                mock.patch.object(bootstrap, "filter_bundle") as filtering:
            with self.assertRaises(ValueError):
                bootstrap.main()
            filtering.assert_not_called()


if __name__ == "__main__":
    unittest.main()
