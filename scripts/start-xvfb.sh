#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:99}"
exec Xvfb "$DISPLAY" -screen 0 1920x1080x24 -ac
