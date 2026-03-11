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
mkdir -p /home/sergey/yamal_brand/input
cp -a /root/projects/yamal_brand/input/Макеты1 /home/sergey/yamal_brand/input/
chown -R sergey:sergey /home/sergey/yamal_brand
```

Put runtime data there (once):
- `/home/sergey/yamal_brand/input/Макеты1`
- `/home/sergey/yamal_brand/max_bot_sqlite/.env`
- optional runtime analytics DB path in `.env`: `RUNTIME_DB_PATH=/home/sergey/yamal_brand/max_bot_runtime.db`
- Node.js is bootstrapped automatically into `/home/sergey/yamal_brand/.runtime/node` during deploy if the server does not have `node`/`npm` installed.
- `MAX_BOT_TOKEN` can be injected automatically from GitHub Actions Secret `MAX_BOT_TOKEN`

Set the repo secret once:

```bash
gh secret set MAX_BOT_TOKEN -R <YOUR_GH>/<YOUR_REPO>
```

Allow the runner user to manage the bot service:

```bash
printf '%s\n' 'sergey ALL=(root) NOPASSWD: /usr/bin/systemctl, /usr/bin/cp, /usr/bin/journalctl' > /etc/sudoers.d/yamal-bot
chmod 440 /etc/sudoers.d/yamal-bot
visudo -cf /etc/sudoers.d/yamal-bot
```

If passwordless `sudo` is not available, deploy fails:
- this project now treats it as a deployment error
- the runner must be able to run `cp`, `systemctl` and `journalctl` through `sudo -n`
- this keeps the bot under one normal `systemd` service and avoids duplicate processes

## 4) Run autodeploy

Push to `main` or run workflow manually:
- GitHub -> `Actions` -> `Deploy Yamal MAX Bot` -> `Run workflow`.

For the public REG.RU website there is a separate archive-import workflow:
- GitHub -> `Actions` -> `Import REG.RU Catalog Archive` -> `Run workflow`
- pass a direct `zip`, `tar`, `tar.gz`, or `tar.xz` URL with the `Макеты1` files
- the workflow downloads the archive, backs up current `data/files`, uploads new files to `брендямал.рф`, deletes `max_catalog.db` and triggers automatic rebuild

For PHP code updates of the public REG.RU catalog site there is a separate workflow:
- GitHub -> `Actions` -> `Deploy REG.RU PHP Catalog Site` -> `Run workflow`
- it uploads `index.php`, `api.php`, `download.php`, `assets/`, `src/` and keeps `data/` untouched
- this workflow is used for visual refinements too, including the current restrained white layout aligned with the Yamal brandbook structure

To inspect the real catalog structure on the production runner:
- GitHub -> `Actions` -> `Inspect Catalog Structure` -> `Run workflow`.

To inspect the local archive with brand examples on the production runner:
- GitHub -> `Actions` -> `Inspect Examples Archive` -> `Run workflow`
- workflow prints the contents of `/home/sergey/yamal_brand/input/Примеры внедрения бренда территории.tar.xz`
- use it when the public site picks the wrong example photos and you need the exact folder/file names from the source archive

To inspect bot health and recent runtime errors on the production runner:
- GitHub -> `Actions` -> `Diagnose Runner Filesystem` -> `Run workflow`
- optional inputs:
  - `lookback_hours` for how much journal history to inspect
  - `journal_lines` for how many recent lines to print

## 5) Verify on server

```bash
systemctl status max_yamal_bot.service --no-pager
journalctl -u max_yamal_bot.service -n 80 --no-pager
LOOKBACK_HOURS=12 JOURNAL_LINES=120 /home/sergey/yamal_brand/scripts/diagnose_bot_service.sh max_yamal_bot.service
python3 /home/sergey/yamal_brand/scripts/report_bot_usage.py --catalog-db /home/sergey/yamal_brand/max_catalog.db --runtime-db /home/sergey/yamal_brand/max_bot_runtime.db
python3 /home/sergey/yamal_brand/scripts/backup_bot_data.py --catalog-db /home/sergey/yamal_brand/max_catalog.db --runtime-db /home/sergey/yamal_brand/max_bot_runtime.db --output-dir /home/sergey/yamal_brand/backups
```

## Notes
- Workflow preserves runtime files: `input/`, `.env`, `*.db`, `node_modules/`, `.runtime/`, `logs/`, `run/`.
- That means both `max_catalog.db` and `max_bot_runtime.db` survive redeploys.
- If you changed service file, deploy script re-installs it into `/etc/systemd/system/max_yamal_bot.service`.
- During migration from the old user-managed mode, deploy stops the legacy process and removes its `@reboot` crontab entry before enabling `systemd`.
- Bot-side network calls now retry short-lived MAX API failures such as header/connect timeouts and `Attachment not ready`.
