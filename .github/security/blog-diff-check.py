"""Inlined before checkout: verify approved blog trees using native Git only."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile


def git(*args):
    return subprocess.run(["git", "-c", "credential.helper=", *args],
                          check=True, capture_output=True, timeout=30).stdout


def blog_changes(base, target):
    raw = git("diff", "--raw", "--no-abbrev", "--no-renames", "-z", base, target)
    fields = raw.split(b"\0")
    if not raw or fields[-1] != b"" or (len(fields) - 1) % 2:
        raise ValueError("empty or malformed blog diff")
    paths = []
    for header, path in zip(fields[:-1:2], fields[1::2]):
        oldmode, newmode, _, blob, status = header.decode("ascii").split()
        name = path.decode("utf-8")
        if (oldmode not in (":000000", ":100644") or newmode != "100644"
                or status not in ("A", "M")
                or not re.fullmatch(r"content/blog/[a-z0-9][a-z0-9-]*\.txt", name)
                or int(git("cat-file", "-s", blob)) > 1024 * 1024):
            raise ValueError("change is outside the plain blog-content scope")
        paths.append(name)
    if len(paths) > 100:
        raise ValueError("blog change exceeds bounded file count")
    return paths


def verify(base, head, merge):
    if not all(re.fullmatch(r"[0-9a-f]{40}", sha) for sha in (base, head, merge)):
        raise ValueError("invalid approved revision")
    parents = re.findall(rb"^parent ([0-9a-f]{40})$", git("cat-file", "-p", merge), re.M)
    if parents != [base.encode(), head.encode()]:
        raise ValueError("merge parents do not match approved base/head")
    head_paths = blog_changes(base, head)
    if blog_changes(base, merge) != head_paths:
        raise ValueError("merge changes differ from approved blog changes")
    # A merge must not introduce content different from the reviewed head.
    for name in head_paths:
        if git("rev-parse", f"{head}:{name}") != git("rev-parse", f"{merge}:{name}"):
            raise ValueError("merge changed reviewed blog content")
    return head_paths


def main():
    if os.environ.get("BLOG_CONTENT_GATE") != "required":
        return
    base = os.environ["BLOG_APPROVED_BASE"]
    head = os.environ["BLOG_APPROVED_HEAD"]
    if not all(re.fullmatch(r"[0-9a-f]{40}", sha) for sha in (base, head)):
        raise ValueError("invalid approved revision")
    git("fetch", "--no-tags", "--depth=1", "origin", base, head)
    paths = verify(base, head, os.environ["GITHUB_SHA"])
    fd, name = tempfile.mkstemp(prefix="approved-blog-", suffix=".json", dir=os.environ["RUNNER_TEMP"])
    with os.fdopen(fd, "w") as output:
        json.dump(paths, output)
    if "\n" in name or "\r" in name:
        raise ValueError("invalid manifest path")
    with Path(os.environ["GITHUB_ENV"]).open("a") as output:
        output.write(f"BLOG_CONTENT_FILES={name}\n")
    print(f"Approved Git trees contain only {len(paths)} regular blog text file(s)")


if __name__ == "__main__":
    main()
