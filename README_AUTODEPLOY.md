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
- optional admin list in `.env`: `ADMIN_USER_IDS=23325864` for `/admin` and `/stats`
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

## 4.1) Migrate bot to BOTSGSN

The private server `10.10.68.10` is connected to this repository as the
self-hosted runner `BOTSGSN` with label `yamal-botsgsn`.

After the service is already on BOTSGSN, use `Deploy Yamal MAX Bot To BOTSGSN`
for direct production updates on the online runner. It preserves
`max_bot_sqlite/.env`, `input/`, `.runtime/`, `max_catalog.db`, and
`max_bot_runtime.db`, updates runtime paths and `ADMIN_USER_IDS=23325864`, then
rebuilds the catalog and restarts `max_yamal_bot.service`.

The bot refreshes MAX command hints during startup and writes sanitized
`[update]` journal lines for incoming events. Those lines contain only event
type, user/chat identifiers, and whether text or callback payload exists; they
do not print message text or tokens.

If the bot fails after a bad token overwrite, run `Recover BOTSGSN MAX Bot Token`;
it searches local BOTSGSN env/service files for previous `MAX_BOT_TOKEN`
candidates without printing them, restores the first candidate that makes
`max_yamal_bot.service` active, and keeps a timestamped env backup.

If GitHub shows `BOTSGSN` as offline with `runner registration has been deleted`
in the local journal, run `Repair BOTSGSN GitHub Runner`. It runs from the
repository-scoped `yamal-control` runner, connects to `10.10.68.10` over SSH,
reconfigures
`/home/maxbot/actions-runner-yamal-brand` as `BOTSGSN` with label
`yamal-botsgsn`, and starts the runner service. Remove any stale offline
`BOTSGSN` entry from repository runners first if GitHub still lists one. The
workflow needs a fresh GitHub runner registration token in `registration_token`;
generate it from repository settings or the Actions runners API immediately
before dispatching the workflow. The control runner must have a route to
`10.10.68.10:22`; the workflow checks this first and exits with a direct network
error instead of waiting on SSH when the private BOTSGSN network is unavailable.

Use `Migrate Yamal MAX Bot To BOTSGSN` for the controlled move from the old
`yamal-max-prod` runner:

- first run with `start_new_service=0` and `stop_old_service=0`; this copies
  runtime files from `/home/sergey/yamal_brand` to BOTSGSN over SSH/rsync,
  deploys code to `/home/localadmin/yamal_brand`, rewrites local catalog paths
  in `max_bot_sqlite/.env`, installs dependencies, rebuilds `max_catalog.db`,
  and installs `max_yamal_bot.service` without starting it
- after the deploy job is green, rerun with `start_new_service=1` and
  `stop_old_service=0`; this starts the bot on BOTSGSN while leaving the old
  host untouched for rollback
- after checking MAX manually and reviewing logs, rerun with
  `start_new_service=1` and `stop_old_service=1` to stop the old
  `max_yamal_bot.service`

The migration workflow transfers:

- `max_bot_sqlite/.env`
- `input/Макеты1`
- `.runtime/node` when present
- `max_catalog.db` when present
- `max_bot_runtime.db` when present

The BOTSGSN service is written with `User=localadmin` and paths under
`/home/localadmin/yamal_brand`; it does not reuse the checked-in
`max_bot_sqlite/systemd/max_yamal_bot.service`, because that unit intentionally
describes the old `/home/sergey/yamal_brand` host.

For the public REG.RU website there is a separate archive-import workflow:
- GitHub -> `Actions` -> `Import REG.RU Catalog Archive` -> `Run workflow`
- pass a direct `zip`, `tar`, `tar.gz`, or `tar.xz` URL with the `Макеты1` files
- the workflow downloads the archive, backs up current `data/files`, uploads new files to `брендямал.рф`, deletes `max_catalog.db` and triggers automatic rebuild

For the local archive with brand examples on the production runner there is a separate partial-sync workflow:
- GitHub -> `Actions` -> `Sync REG.RU Examples Archive` -> `Run workflow`
- it reads `/home/sergey/yamal_brand/input/Примеры внедрения бренда территории.tar.xz`
- it replaces only `Примеры внедрения бренда территории` inside the live catalog and keeps the rest of `data/files` untouched
- use this workflow when the public site shows the wrong `Хорошие` or `Спорные` examples

For PHP code updates of the public REG.RU catalog site there is a separate workflow:
- GitHub -> `Actions` -> `Deploy REG.RU PHP Catalog Site` -> `Run workflow`
- it uploads `index.php`, `api.php`, `download.php`, `assets/`, `src/` and keeps `data/` untouched
- this workflow is used for visual refinements too, including the current restrained white layout aligned with the Yamal brandbook structure
- if you want the site consultant to use the optional OpenAI deep-answer mode, add repository secrets `OPENAI_API_KEY`, optionally `CONSULTANT_LLM_ENABLED`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `OPENAI_MAX_OUTPUT_TOKENS`, `OPENAI_TIMEOUT_SECONDS`, `OPENAI_BASE_URL`, `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID`
- the deploy script will upsert these values into the remote PHP `.env`; without them the assistant stays in grounded local mode

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

To inspect the BOTSGSN deployment:
- GitHub -> `Actions` -> `Diagnose BOTSGSN MAX Bot` -> `Run workflow`
- the BOTSGSN service runs from `/home/localadmin/yamal_brand` as
  `localadmin`, while the GitHub runner runs as `maxbot`, so the workflow reads
  the restricted `.env` through sudo and prints only redacted token values.

## 5) Verify on server

```bash
systemctl status max_yamal_bot.service --no-pager
journalctl -u max_yamal_bot.service -n 80 --no-pager
LOOKBACK_HOURS=12 JOURNAL_LINES=120 /home/sergey/yamal_brand/scripts/diagnose_bot_service.sh max_yamal_bot.service
python3 /home/sergey/yamal_brand/scripts/report_bot_usage.py --catalog-db /home/sergey/yamal_brand/max_catalog.db --runtime-db /home/sergey/yamal_brand/max_bot_runtime.db --days 7
python3 /home/sergey/yamal_brand/scripts/backup_bot_data.py --catalog-db /home/sergey/yamal_brand/max_catalog.db --runtime-db /home/sergey/yamal_brand/max_bot_runtime.db --output-dir /home/sergey/yamal_brand/backups
```

## Notes
- Workflow preserves runtime files: `input/`, `.env`, `*.db`, `node_modules/`, `.runtime/`, `logs/`, `run/`.
- That means both `max_catalog.db` and `max_bot_runtime.db` survive redeploys.
- If you changed service file, deploy script re-installs it into `/etc/systemd/system/max_yamal_bot.service`.
- During migration from the old user-managed mode, deploy stops the legacy process and removes its `@reboot` crontab entry before enabling `systemd`.
- Bot-side network calls now retry short-lived MAX API failures such as header/connect timeouts and `Attachment not ready`.
