# CI TLS trust during the eMudhra incident

Every Ubuntu job starts with an offline bootstrap, before checkout, GitHub API
actions, setup-node, npm, or credential-bearing scripts. It filters the runner's
existing CA bundle by three public-key hashes (AAA Certificate Services and the
two emSign G3 roots), matching Homebrew's 2026-10-20 mitigation. It never fetches
trust material over the connection it is trying to repair, installs packages,
uses sudo, or edits the runner's system trust store.
Failure/always upload and notification steps also require a successful trust
bootstrap; they cannot bypass it when reporting another step's failure.

Provenance: [Homebrew formula](https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/c/ca-certificates.rb),
[Node blocklist fix](https://github.com/nodejs/node/pull/66871),
[incident canaries](https://emudhra.we-have-a-problem.com/).

The job selects the filtered file for OpenSSL, curl, Git, Requests, pip and
gRPC; an empty CA directory prevents OpenSSL/Git from finding excluded roots
through hashed directory lookup. Workflow-level `NODE_OPTIONS=--use-openssl-ca`
selects this trust for JavaScript actions and setup-node's Node. Extra/system CA
augmentation is disabled. GitHub explicitly forbids exporting `NODE_OPTIONS`
through `GITHUB_ENV`; it belongs in YAML. No verification-disable flag is used.

`bootstrap.py` is the canonical source. A local composite action would require
checkout first, so `sync-workflows.mjs` embeds it into each workflow, with YAML
anchors sharing it between that workflow's jobs. The generator's `--check` mode
enforces identical first steps and rejects later Node/OpenSSL trust overrides.

```sh
node .github/security/sync-workflows.mjs
node .github/security/sync-workflows.mjs --check
python3 -m unittest discover -s .github/security -p 'test_*.py'
node .github/security/probe.mjs
```

PR CI checks both Node `https` and `fetch` against all 12 incident canaries and
two normal controls. Network failures, expiry/hostname errors, and unexpected
acceptance fail the check; they are never reported as successful protection.
This temporary live test depends on the researcher keeping those canaries
available. If they change or disappear, investigate and replace the check in a
reviewed PR rather than treating a timeout as a pass.

## Limits and removal

- Root removal is deliberately broader than revoking only the compromised
  intermediates; otherwise legitimate chains through these roots can fail too.
  Handle an affected dependency explicitly, not by disabling TLS verification.
- This protects default clients honoring these settings. Explicit `ca` options,
  vendored/native trust stores, browser networking, containers, and tools that
  override the environment need their own checks. It does not attest to every
  library in the job, or protect GitHub's runner/control plane and action
  downloads that happen before any user step executes.
- Netlify/Cloudflare builds and Worker outbound connections are provider-managed
  and are not changed by these GitHub workflows. Valid public site certificates
  do not establish the safety of those outbound clients.
- Remove the temporary root exclusions only after testing released fixes in
  both the runner's action Node and setup-node's runtime, plus the other clients.
  A merged upstream PR or a new Node major alone is insufficient. Test both
  compromised-chain rejection and ordinary dependencies before removal.

The incident post describes local evidence separately from the PR's CI evidence.
No production deployment is implied by a local passing test.
