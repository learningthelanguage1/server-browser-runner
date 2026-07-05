#!/usr/bin/env bash
set -euo pipefail

sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ff-runner-xvfb ff-runner-wm ff-runner-vnc ff-browser-runner
