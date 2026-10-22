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

## Node security floor (October 21, 2026)

Before writing any environment settings, the offline bootstrap follows its Linux
parent process chain to `Runner.Worker` and checks that worker's
`externals/node24/bin/node`. It requires Node 24.22.1 or a later stable 24.x release.
Missing ownership evidence, an affected version, or an unknown build fails the
job before JavaScript actions run. Existing failure handlers remain gated on
bootstrap success. No runner binaries are replaced and no network is needed.

This intentionally blocks hosted runners that have not received the vendor fix.
The runner itself and action preparation before the first step are outside this
gate; it does not claim to secure all of GitHub's infrastructure. The currently
pinned actions use the runner's Node 24 execution path. Review that contract when
changing action versions or introducing container/composite actions.

`setup-node` separately selects exactly 24.22.1 for builds. Its toolcache selection
does not patch JavaScript action execution. Do not relax the first-step gate to
make CI green. Verify a new hosted run after publication before claiming rollout.

Sources: [Node security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases),
[runner executable selection](https://github.com/actions/runner/blob/v2.338.0/src/Runner.Worker/Handlers/NodeScriptActionHandler.cs).

`bootstrap.py` is the canonical source. A local composite action would require
checkout first, so `sync-workflows.mjs` embeds it into each workflow, with YAML
anchors sharing it between that workflow's jobs. The generator's `--check` mode
enforces identical first steps and rejects later Node/OpenSSL trust overrides.

```sh
node .github/security/sync-workflows.mjs
node .github/security/sync-workflows.mjs --check
node --test .github/security/test_sync_workflows.mjs
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

### October 21 operational hold

Hosted run `39699339521` confirmed action Node **24.21.0**, so the gate blocked
checkout. All 13 repository-owned workflows were then disabled to stop scheduled
main-branch jobs using the older unguarded configuration. The static site remains
available; automated updates, analytics and reviews are paused. GitHub-managed
Dependabot and external provider builds are not covered by this hold.

To restore service, first obtain vendor evidence of a patched runner. An attended
validation may temporarily enable only a selected workflow and run the guarded
PR revision, never the old main revision. Confirm the actual action runtime and
all required checks, then merge the guarded changes before restoring schedules
and the other previously enabled workflows. If validation still fails, disable
that workflow again. Do not remove the version gate or replace runner binaries
to work around this hold. The operator retained the prior workflow states in
the protected deployment record.

### Readiness monitoring and required merge checks

The Mini runs an independent hourly watcher for up to seven days, with private
state at `~/.local/state/github-runner-readiness/status.json`. It reads a stable
runner release's immutable source commit and notifies this PR if its declared
Node 24 version meets the floor. That is only a candidate for the attended
hosted validation above; it does not attest to packaged binaries or fleet rollout.
It cannot merge, enable workflows or change protection. It reports startup,
three consecutive polling errors and expiry as well, with deduplicated comments.

Main now requires the `test` check from the GitHub Actions app (ID 15368), with
strict up-to-date checking and administrator enforcement. This job includes the
offline runtime gate, audit, lint, typechecks, unit tests, build, bundle budgets
and smoke tests. Its PR trigger has no path exclusions and includes reopened
PRs. The workflow validator guards that contract. A missing check now blocks
merging even when the external Cloudflare preview succeeds. Code review and
blog-specific checks remain part of attended readiness; they are not replaced
by this single required check. Existing admin enforcement and force-push/deletion
restrictions were preserved; prior settings are in the protected operator record.

Required checks also prevent unvalidated direct-main bot pushes. Keep the
analytics/content/changelog jobs that write main paused until their publishing
path uses reviewed PRs or another explicitly reviewed design. Do not restore
all old workflow states blindly, or give those bots a bypass. Restore eligible
checks and deployment first after the guarded merge.

### Scope limitations

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
