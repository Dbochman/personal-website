#!/usr/bin/env bash
# Inlined after the offline trust gate: no checkout/setup-node JS actions,
# auth headers, caches, persisted Git credentials or deployment artifacts.
set -euo pipefail

[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]
git init .
git remote add origin https://github.com/Dbochman/personal-website.git
git -c credential.helper= fetch --no-tags --depth=1 origin "$GITHUB_SHA"
git checkout --detach FETCH_HEAD
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"

runtime_dir=$(mktemp -d "$RUNNER_TEMP/pr-patched-node.XXXXXX")
archive="$runtime_dir/node.tar.xz"
# Pinned against the official v24.22.1 SHASUMS256.txt, inspected 2026-10-24.
# curl uses the bootstrap's filtered bundle; no redirects or remote scripts.
curl --fail --silent --show-error --proto '=https' --tlsv1.2 \
  --connect-timeout 20 --max-time 180 \
  https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-x64.tar.xz --output "$archive"
printf '%s  %s\n' \
  6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6 \
  "$archive" | sha256sum --check --strict -
tar -xJf "$archive" -C "$runtime_dir"
node_bin="$runtime_dir/node-v24.22.1-linux-x64/bin"
test "$("$node_bin/node" --version)" = v24.22.1
printf '%s\n' "$node_bin" >> "$GITHUB_PATH"
printf 'Patched build runtime verified: %s\n' "$("$node_bin/node" --version)"
