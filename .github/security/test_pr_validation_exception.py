import copy
from datetime import datetime, timedelta, timezone
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("exception_policy", Path(__file__).with_name("pr-validation-exception.py"))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class ExceptionTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 24, 15, tzinfo=timezone.utc)
        repo = "Dbochman/personal-website"
        self.env = {
            "GITHUB_ACTIONS": "true", "GITHUB_REPOSITORY": repo,
            "GITHUB_EVENT_NAME": "pull_request", "GITHUB_JOB": "test",
            "GITHUB_REF": "refs/pull/339/merge", "GITHUB_BASE_REF": "main",
            "GITHUB_HEAD_REF": "fix/node-security-runtime",
            "GITHUB_WORKFLOW_REF": repo + "/.github/workflows/pr-checks.yml@refs/pull/339/merge",
            "PR_339_APPROVED_HEAD": "a" * 40, "PR_339_APPROVED_BASE": "b" * 40,
        }
        self.event = {"number": 339, "action": "reopened", "pull_request": {
            "number": 339,
            "head": {"repo": {"full_name": repo}, "ref": "fix/node-security-runtime", "sha": "a" * 40},
            "base": {"repo": {"full_name": repo}, "ref": "main", "sha": "b" * 40},
        }}

    def allowed(self, **kwargs):
        return policy.allow_pr_validation_exception(
            kwargs.get("version", "v24.21.0"), kwargs.get("env", self.env),
            kwargs.get("event", self.event), kwargs.get("now", self.now))

    def test_exact_reviewed_pr_and_known_runtime_only(self):
        self.assertTrue(self.allowed())
        for version in ("v24.22.0", "v24.20.0", "v20.19.0", "v24.21.0-custom", "bad"):
            self.assertFalse(self.allowed(version=version))

    def test_missing_or_different_environment_fails_closed(self):
        for key in self.env:
            for replacement in (None, "other"):
                env = dict(self.env)
                if replacement is None:
                    env.pop(key)
                else:
                    env[key] = replacement
                with self.subTest(key=key, replacement=replacement):
                    self.assertFalse(self.allowed(env=env))
        for name in ("push", "pull_request_target", "workflow_dispatch"):
            self.assertFalse(self.allowed(env={**self.env, "GITHUB_EVENT_NAME": name}))
        self.assertFalse(self.allowed(env={**self.env, "GITHUB_JOB": "deploy"}))

    def test_expiry_reserves_full_job_budget_and_cannot_be_extended_by_env(self):
        self.assertFalse(self.allowed(now=policy.EXCEPTION_START - timedelta(seconds=1)))
        self.assertTrue(self.allowed(now=policy.EXCEPTION_START))
        self.assertTrue(self.allowed(now=policy.EXCEPTION_EXPIRY - timedelta(minutes=31)))
        for now in (policy.EXCEPTION_EXPIRY - timedelta(minutes=30),
                    policy.EXCEPTION_EXPIRY, policy.EXCEPTION_EXPIRY + timedelta(days=1)):
            self.assertFalse(self.allowed(now=now, env={**self.env, "EXCEPTION_EXPIRY": "2099-01-01"}))
        self.assertFalse(self.allowed(now=datetime(2026, 10, 24)))

    def test_forks_other_branches_new_commits_and_bases_are_not_approved(self):
        for side in ("head", "base"):
            for field, value in (("ref", "other"), ("sha", "c" * 40),
                                 ("repo", {"full_name": "someone/fork"})):
                event = copy.deepcopy(self.event)
                event["pull_request"][side][field] = value
                self.assertFalse(self.allowed(event=event))

    def test_other_pr_closed_or_malformed_event_fails_closed(self):
        for event in ({}, {**self.event, "number": 340}, {**self.event, "action": "closed"},
                      {**self.event, "pull_request": None}):
            self.assertFalse(self.allowed(event=event))


if __name__ == "__main__":
    unittest.main()
