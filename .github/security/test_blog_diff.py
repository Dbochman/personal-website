import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("blog_diff", Path(__file__).with_name("blog-diff-check.py"))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class BlogDiffTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        previous = Path.cwd()
        os.chdir(self.directory.name)
        self.addCleanup(os.chdir, previous)
        self.git("init", "-q")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        Path("content/blog").mkdir(parents=True)
        Path("content/blog/existing.txt").write_text("Original post")
        Path("package.json").write_text("{}")
        self.base = self.commit()

    def git(self, *args):
        return subprocess.check_output(["git", *args], stderr=subprocess.DEVNULL).decode().strip()

    def commit(self):
        self.git("add", ".")
        self.git("commit", "-qm", "fixture")
        return self.git("rev-parse", "HEAD")

    def merge(self, head, tree=None, base=None):
        return subprocess.check_output([
            "git", "commit-tree", tree or self.git("rev-parse", head + "^{tree}"),
            "-p", base or self.base, "-p", head], input=b"merge\n").decode().strip()

    def test_add_and_edit_require_exact_merge_parents_and_blob(self):
        Path("content/blog/new.txt").write_text("New post")
        Path("content/blog/existing.txt").write_text("Updated post")
        head = self.commit()
        merge = self.merge(head)
        self.assertEqual(policy.verify(self.base, head, merge),
                         ["content/blog/existing.txt", "content/blog/new.txt"])
        with self.assertRaisesRegex(ValueError, "parents"):
            policy.verify(self.base, head, head)
        Path("content/blog/new.txt").write_text("Unreviewed merge content")
        changed = self.commit()
        with self.assertRaisesRegex(ValueError, "content"):
            policy.verify(self.base, head, self.merge(head, self.git("rev-parse", changed + "^{tree}")))

    def test_code_config_or_companion_notes_are_not_blog_only(self):
        Path("content/blog/new.txt").write_text("New post")
        for file in ("package.json", ".github/workflows/test.yml", ".claude/session-notes.md",
                     "content/blog/other.mdx", "content/blog/nested/post.txt"):
            with self.subTest(file=file):
                p = Path(file); p.parent.mkdir(parents=True, exist_ok=True); p.write_text("changed")
                head = self.commit()
                with self.assertRaises(ValueError): policy.blog_changes(self.base, head)
                self.git("reset", "--hard", self.base)  # Disposable fixture only.
                Path("content/blog/new.txt").write_text("New post")

    def test_deletion_rename_symlink_and_executable_fail(self):
        for kind in ("delete", "rename", "symlink", "executable"):
            with self.subTest(kind=kind):
                p = Path("content/blog/existing.txt")
                if kind == "delete": p.unlink()
                if kind == "rename": p.rename("content/blog/renamed.txt")
                if kind == "symlink": p.unlink(); p.symlink_to("../../package.json")
                if kind == "executable": p.chmod(0o755)
                head = self.commit()
                with self.assertRaises(ValueError): policy.blog_changes(self.base, head)
                self.git("reset", "--hard", self.base)

    def test_empty_and_oversized_changes_fail(self):
        with self.assertRaises(ValueError): policy.blog_changes(self.base, self.base)
        Path("content/blog/new.txt").write_bytes(b"x" * (1024 * 1024 + 1))
        with self.assertRaises(ValueError): policy.blog_changes(self.base, self.commit())


if __name__ == "__main__":
    unittest.main()
