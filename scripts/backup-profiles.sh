#!/usr/bin/env bash
set -euo pipefail

src="${1:-/srv/ff-browser-runner/profiles}"
dest="${2:-/srv/ff-browser-runner/backups/profiles-$(date -u +%Y%m%dT%H%M%SZ).tar.gz}"
mkdir -p "$(dirname "$dest")"
tar -czf "$dest" -C "$(dirname "$src")" "$(basename "$src")"
chmod 600 "$dest"
