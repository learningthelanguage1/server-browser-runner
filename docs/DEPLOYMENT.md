# Deployment

Target server: Ubuntu 24.04 LTS.

Server layout:

```txt
/srv/ff-browser-runner/
  app/
  config/runner.yaml
  config/runner.env
  profiles/
  spool/runner.sqlite
  artifacts/
  approval/
  logs/
```

Install:

```bash
scripts/install-ubuntu.sh
pnpm install
pnpm build
sudo rsync -a --delete ./ /srv/ff-browser-runner/app/
sudo cp config/runner.example.yaml /srv/ff-browser-runner/config/runner.yaml
scripts/install-systemd.sh
```

Create `/srv/ff-browser-runner/config/runner.env` only after the shared Brain
runner secret has been approved and installed:

```bash
sudo install -o ffrunner -g ffrunner -m 600 /dev/null /srv/ff-browser-runner/config/runner.env
sudoedit /srv/ff-browser-runner/config/runner.env
```

Expected content:

```txt
FF_RUNNER_SECRET=replace-with-approved-shared-secret
```

Do not commit this file. The systemd unit reads it with `EnvironmentFile`.

Run:

```bash
sudo systemctl start ff-runner-xvfb ff-runner-wm ff-runner-vnc ff-browser-runner
```

VNC is localhost-only. Access it through an SSH tunnel:

```bash
ssh -L 5901:localhost:5901 your-server
```
