# Deployment Guide

> **Production VPS:** `root@137.184.223.241`
> **Repo:** `git@github.com:Technest-Tech/alrayan-system.git`
> **Branch deployed:** `system/stable`
> **App root on server:** `/var/www/alrayan`
> **Hosts served by nginx:** `app.alrayanquran.com` (frontend), `system.alrayanquran.com` (API)
>
> Frontend is **self-hosted with PM2** on the same VPS (not Vercel). Backend is plain Laravel 11 behind nginx + php-fpm 8.3.

---

## TL;DR — one-shot deploy

From your laptop after committing locally:

```bash
git push origin system/stable
```

Then on the VPS:

```bash
ssh root@137.184.223.241 "bash /var/www/alrayan/deploy.sh"
```

`deploy.sh` (kept on the VPS, see below) pulls, runs migrations, rebuilds caches, restarts the queue worker, rebuilds the frontend, and reloads PM2.

If you don't have `deploy.sh` yet (fresh box), follow the [manual sequence](#manual-deploy-step-by-step) once and write it.

---

## Server topology

| Piece | What runs it | Where |
|---|---|---|
| **Frontend** (Next.js 16) | PM2 process `alrayan-frontend` (cluster mode) | `/var/www/alrayan/frontend` |
| **Backend** (Laravel 11) | nginx → php-fpm 8.3 | `/var/www/alrayan/backend` |
| **Queue worker** | systemd unit `alrayan-queue.service` | runs `php artisan queue:work` |
| **Scheduler** | root cron `* * * * * php artisan schedule:run` | log: `/var/log/alrayan-schedule.log` |
| **Database** | MySQL on `localhost` | DB: `alrayan_prod` |

Useful one-liners:

```bash
# Check everything at once
ssh root@137.184.223.241 "
  echo '--- pm2 ---';        pm2 list --no-color
  echo '--- queue ---';      systemctl is-active alrayan-queue
  echo '--- nginx ---';      systemctl is-active nginx
  echo '--- cron ---';       crontab -l | grep schedule:run
  echo '--- migrations ---'; cd /var/www/alrayan/backend && php artisan migrate:status | tail -3
  echo '--- recent reminders ---'; tail -5 /var/log/alrayan-schedule.log
"
```

---

## Manual deploy (step by step)

Use this when something needs special attention or when you're setting up `deploy.sh` for the first time.

```bash
ssh root@137.184.223.241

# ── 1. Pull latest ──
cd /var/www/alrayan
git fetch origin system/stable
git reset --hard origin/system/stable

# ── 2. Backend ──
cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan down --retry=15
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan storage:link    # idempotent; ignore "already exists"
systemctl restart alrayan-queue
php artisan up

# ── 3. Frontend ──
cd ../frontend
pnpm install --prod=false
pnpm build
pm2 reload alrayan-frontend
```

### The `deploy.sh` to keep on the VPS

`/var/www/alrayan/deploy.sh` (made executable: `chmod +x deploy.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/alrayan
git fetch origin system/stable
git reset --hard origin/system/stable

# ── Backend ──
cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan down --retry=15
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan storage:link 2>/dev/null || true
systemctl restart alrayan-queue
php artisan up

# ── Frontend ──
cd ../frontend
pnpm install --prod=false
pnpm build
pm2 reload alrayan-frontend
```

After that, every deploy is a single SSH command (see TL;DR).

---

## Background work that MUST be running

These are easy to forget. Sanity-check after every fresh box / major rebuild.

### 1. Cron scheduler (Laravel scheduler)

Without this, 16 scheduled jobs — session reminders, payment reminders, lead follow-ups, monthly invoice generation, etc. — **never fire**.

Install once (idempotent):

```bash
ssh root@137.184.223.241 "
  ( crontab -l 2>/dev/null | grep -v 'artisan schedule:run' ;
    echo '* * * * * cd /var/www/alrayan/backend && /usr/bin/php artisan schedule:run >> /var/log/alrayan-schedule.log 2>&1' ) | crontab -
"
```

Verify:
```bash
ssh root@137.184.223.241 "crontab -l && tail -10 /var/log/alrayan-schedule.log"
```

### 2. Queue worker (systemd)

`/etc/systemd/system/alrayan-queue.service` (already provisioned):

```ini
[Unit]
Description=Alrayan Laravel Queue Worker
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/alrayan/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Commands:
```bash
systemctl status alrayan-queue
systemctl restart alrayan-queue     # always restart after deploy
journalctl -u alrayan-queue -n 50   # debug failing jobs
```

### 3. Wassender (WhatsApp delivery)

If `WASSENDER_ENABLED=false` or no API key, the container binds the **Fake** client and every send silently no-ops. Confirm both env + DB setting:

```bash
ssh root@137.184.223.241 "
  cd /var/www/alrayan/backend
  grep WASSENDER .env
  php artisan tinker --execute='
    echo \"feature: \".(config(\"system.features.wassender\")?\"on\":\"OFF\").\"\n\";
    \$c = app(\App\Services\Integrations\Wassender\WassenderClient::class);
    echo \"client: \".get_class(\$c).\"\n\";
    echo \"status ping: \".(\$c->status()->success ? \"ok\" : \"FAIL\").\"\n\";
  '
"
```

`client` should be `App\Services\Integrations\Wassender\WassenderClient` (NOT `FakeWassenderClient`).

### 4. PM2 boot persistence

```bash
ssh root@137.184.223.241 "pm2 save && pm2 startup systemd -u root --hp /root"
```

Already configured. Re-run if you change PM2 apps.

---

## Environment variables

### Backend (`/var/www/alrayan/backend/.env`)

Critical keys (others are standard Laravel):

```
APP_ENV=production
APP_URL=https://system.alrayanquran.com

DB_DATABASE=alrayan_prod
DB_USERNAME=alrayan
DB_PASSWORD=<vault>

# Frontend origin — used to build pay links in WhatsApp/email
SYSTEM_FRONTEND_URL=https://app.alrayanquran.com

# Wassender
WASSENDER_ENABLED=true
WASSENDER_API_KEY=<from secrets vault>

# Paymob (optional)
PAYMOB_API_KEY=<...>

# Queue
QUEUE_CONNECTION=database
```

After editing: `php artisan config:cache`.

### Frontend (`/var/www/alrayan/frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=https://system.alrayanquran.com
NEXT_PUBLIC_SYSTEM_API_PREFIX=/api/system
NEXT_PUBLIC_SITE_URL=https://app.alrayanquran.com
```

After editing: `pnpm build && pm2 reload alrayan-frontend`.

---

## Smoke tests after deploy

```bash
ssh root@137.184.223.241 "
  echo '--- API health ---'
  curl -sk -o /dev/null -w '%{http_code}\n' https://127.0.0.1/api/system/health -H 'Host: system.alrayanquran.com'
  echo '--- Frontend ---'
  curl -sk -o /dev/null -w '%{http_code}\n' https://127.0.0.1/ -H 'Host: app.alrayanquran.com'
  echo '--- Latest migrations ---'
  cd /var/www/alrayan/backend && php artisan migrate:status | tail -3
  echo '--- Latest scheduler log ---'
  tail -3 /var/log/alrayan-schedule.log
"
```

Both `200`, latest migration shown as `Ran`, scheduler log shows recent `DONE` lines = healthy.

External (from your machine, after DNS is happy):
```bash
curl -I https://app.alrayanquran.com/         # 200
curl -I https://system.alrayanquran.com/api/system/health     # 200
```

---

## Rollback

```bash
ssh root@137.184.223.241
cd /var/www/alrayan
git log --oneline -10                # find the SHA before the bad deploy
git reset --hard <good-sha>
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate:rollback         # ONLY if a migration was the issue — destructive
php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache
systemctl restart alrayan-queue
cd ../frontend
pnpm install --prod=false
pnpm build
pm2 reload alrayan-frontend
```

Migrations rolled back must be re-applied next deploy — best to roll back code and skip the migration rollback if you can.

---

## Pre-deploy checklist

- [ ] Local build green: `cd frontend && pnpm build` AND `cd backend && php artisan route:list` runs without errors
- [ ] No `console.log`, `dd()`, or `var_dump()` left in code
- [ ] If you added a migration, you tested it on a copy of prod data
- [ ] Wassender / Paymob API keys haven't drifted in `.env`
- [ ] `php artisan test` passes (where tests exist)
- [ ] You're on `system/stable` and it's pushed to `origin`

---

## Hostinger / cheap-host fallback

If the VPS is unavailable and you need a temporary backend on Hostinger shared hosting:
- No SSH for `queue:work` → switch `QUEUE_CONNECTION=database` and add a `* * * * * php artisan queue:work --once` cron
- No certbot needed — Hostinger AutoSSL
- Upload via `git pull` from Hostinger's hPanel terminal (or SFTP if no terminal)
- `storage` and `bootstrap/cache` need `755`/`775`

This works but is fragile. Stick to the KVM VPS for production.
