# Autodeploy via GitHub Actions (self-hosted runner)

## Why this mode
Your server (`10.10.68.36`) is private, so GitHub-hosted runners cannot reach it by SSH.
Use a **self-hosted runner on the same server** and deploy locally there.

## Added files
- `.github/workflows/deploy.yml`
- `scripts/deploy_remote.sh`

## 1) Prepare Git repo locally

```bash
cd /root/projects/yamal_brand
git init
git checkout -b main
git add .
git commit -m "Initial Yamal MAX bot + autodeploy"
```

Create empty GitHub repo and push:

```bash
git remote add origin https://github.com/<YOUR_GH>/<YOUR_REPO>.git
git push -u origin main
```

## 2) Install self-hosted runner on target server

Run on `10.10.68.36` (as root or with sudo):

```bash
mkdir -p /opt/actions-runner-yamal
cd /opt/actions-runner-yamal
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.325.0/actions-runner-linux-x64-2.325.0.tar.gz
tar xzf actions-runner.tar.gz
```

Generate runner token in GitHub:
- Repo -> `Settings` -> `Actions` -> `Runners` -> `New self-hosted runner`.

Configure runner (replace token and URL):

```bash
./config.sh --url https://github.com/<YOUR_GH>/<YOUR_REPO> --token <RUNNER_TOKEN> --name yamal-max-runner --labels self-hosted,linux,yamal-max-prod --work _work --unattended --replace
./svc.sh install
./svc.sh start
./svc.sh status
```

## 3) Prepare deploy directory on server

```bash
mkdir -p /root/projects/yamal_brand
```

Put runtime data there (once):
- `/root/projects/yamal_brand/input/Макеты1`
- `/root/projects/yamal_brand/max_bot_sqlite/.env` with valid `MAX_BOT_TOKEN`

## 4) Run autodeploy

Push to `main` or run workflow manually:
- GitHub -> `Actions` -> `Deploy Yamal MAX Bot` -> `Run workflow`.

## 5) Verify on server

```bash
systemctl status max_yamal_bot.service --no-pager
journalctl -u max_yamal_bot.service -n 80 --no-pager
```

## Notes
- Workflow preserves runtime files: `input/`, `.env`, `*.db`, `node_modules/`.
- If you changed service file, deploy script re-installs it into `/etc/systemd/system/max_yamal_bot.service`.
