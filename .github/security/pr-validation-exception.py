"""Owner-approved, expiring exception for one credential-free PR validation.

Embedded ONLY in pr-checks.yml. Never used by deployment or publishing jobs.
Approval hashes are repository variables set after reviewing each revision;
missing/mismatched approvals fail closed without network or credentials.
"""

from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re


EXCEPTION_START = datetime(2026, 10, 24, 14, tzinfo=timezone.utc)
EXCEPTION_EXPIRY = datetime(2026, 10, 26, 14, tzinfo=timezone.utc)


def allow_pr_validation_exception(version, env=None, event=None, now=None):
    env = os.environ if env is None else env
    now = datetime.now(timezone.utc) if now is None else now
    # Reserve the entire enforced 30-minute job timeout before expiry.
    if (version != "v24.21.0" or now.tzinfo is None or now < EXCEPTION_START
            or now + timedelta(minutes=30) >= EXCEPTION_EXPIRY):
        return False
    repository = "Dbochman/personal-website"
    expected = {
        "GITHUB_ACTIONS": "true", "GITHUB_REPOSITORY": repository,
        "GITHUB_EVENT_NAME": "pull_request", "GITHUB_JOB": "test",
        "GITHUB_REF": "refs/pull/339/merge", "GITHUB_BASE_REF": "main",
        "GITHUB_HEAD_REF": "fix/node-security-runtime",
        "GITHUB_WORKFLOW_REF": repository + "/.github/workflows/pr-checks.yml@refs/pull/339/merge",
    }
    if any(env.get(key) != value for key, value in expected.items()):
        return False
    head = env.get("PR_339_APPROVED_HEAD", "")
    base = env.get("PR_339_APPROVED_BASE", "")
    if not all(re.fullmatch(r"[0-9a-f]{40}", sha) for sha in (head, base)):
        return False
    try:
        if event is None:
            event = json.loads(Path(env["GITHUB_EVENT_PATH"]).read_text())
        pr = event["pull_request"]
        return (event["number"] == 339 and pr["number"] == 339
                and event["action"] in {"opened", "synchronize", "reopened"}
                and pr["head"]["repo"]["full_name"] == repository
                and pr["base"]["repo"]["full_name"] == repository
                and pr["head"]["ref"] == "fix/node-security-runtime"
                and pr["base"]["ref"] == "main"
                and pr["head"]["sha"] == head and pr["base"]["sha"] == base)
    except (OSError, ValueError, KeyError, TypeError):
        return False
