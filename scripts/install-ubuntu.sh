#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y nodejs npm xvfb fluxbox x11vnc sqlite3
sudo corepack enable
sudo useradd --system --create-home --shell /bin/bash ffrunner || true
sudo mkdir -p /srv/ff-browser-runner/{app,config,profiles,spool,artifacts,approval,logs}
sudo chown -R ffrunner:ffrunner /srv/ff-browser-runner
sudo chmod -R 700 /srv/ff-browser-runner/profiles
