# Deployment Guide

## Frontend → Vercel

### First deploy
1. Push monorepo to GitHub.
2. Vercel → New Project → import repo.
3. Set **Root Directory** = `frontend`.
4. Add env vars from [SERVER-SETUP.md](SERVER-SETUP.md#environment-variables-vercel-dashboard).
5. Deploy.
6. Add custom domain `alrayan-academy.com` and `www.alrayan-academy.com`. Vercel auto-issues SSL.

### Subsequent deploys
- Push to `main` → Vercel deploys to production.
- Push to any other branch → Vercel creates a preview URL (great for sharing with the owner).
- PR comments include the preview URL automatically.

### Rollback
- Vercel dashboard → **Deployments** → click any prior successful deploy → **Promote to Production**. ~10 seconds.

---

## Backend → VPS (manual deploy script)

After initial provisioning ([SERVER-SETUP.md](SERVER-SETUP.md)), use this script to deploy updates.

### `/var/www/alrayan/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/alrayan
git fetch --all
git reset --hard origin/main

cd backend
composer install --no-dev --optimize-autoloader
php artisan down --retry=15
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
sudo systemctl restart alrayan-queue
php artisan up
```

### Trigger from GitHub Actions (Sprint 7)

`.github/workflows/backend-deploy.yml`:

```yaml
name: Backend Deploy
on:
  push:
    branches: [main]
    paths: ['backend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: bash /var/www/alrayan/deploy.sh
```

### Rollback
```bash
cd /var/www/alrayan
git log --oneline -10           # find the SHA before the bad deploy
git reset --hard <good-sha>
cd backend && composer install --no-dev && php artisan migrate:rollback   # only if migration was the issue
php artisan config:cache
sudo systemctl restart alrayan-queue
```

---

## Pre-deploy checklist

- [ ] All tests pass (`pnpm test` and `php artisan test`)
- [ ] Lighthouse score ≥ 90 (perf/SEO/access/best-practices) on home + 1 course page + 1 country page
- [ ] No `console.log` or `dd()` left in code
- [ ] Env vars set in Vercel and on VPS
- [ ] DNS records propagated (`dig +short alrayan-academy.com`)
- [ ] SSL certs valid (Vercel auto, VPS via certbot)
- [ ] WhatsApp number, email, prices verified in `frontend/src/config/site.ts`
- [ ] Sitemap reachable: `curl https://alrayan-academy.com/sitemap.xml`
- [ ] Robots.txt reachable: `curl https://alrayan-academy.com/robots.txt`
- [ ] Trial booking form submits successfully end-to-end (form → email received)
- [ ] Mobile QA on iPhone Safari + Android Chrome
- [ ] Search Console + GA4 + Plausible verified

---

## Post-deploy smoke test

```bash
# Frontend
curl -I https://alrayan-academy.com/ | head -1                 # 200
curl -I https://alrayan-academy.com/pricing | head -1          # 200
curl -I https://alrayan-academy.com/courses/tajweed-course     # 200

# Backend
curl https://api.alrayan-academy.com/up                        # {"status":"ok"}
curl -X POST https://api.alrayan-academy.com/api/v1/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"smoke test"}'
# 201 + reference
```

---

## Hostinger-specific notes

If the owner is on **Hostinger Shared Hosting** (not VPS), Laravel can still run — but:
- No SSH for systemd queue worker → use `database` queue with a cron job hitting `php artisan queue:work --once` every minute
- No certbot needed — Hostinger provides AutoSSL
- Upload via `git pull` from Hostinger's hPanel terminal (or SFTP if no terminal)
- File permissions: `storage` and `bootstrap/cache` need `755`/`775`

This setup works but is fragile. **Strongly recommend** the KVM 2 VPS upgrade once ad budget begins.

---

## Netlify alternative (frontend only)

If Vercel is not preferred, Netlify works the same way:
- Build command: `pnpm build`
- Publish directory: `.next` (Netlify auto-detects Next.js)
- Use the official `@netlify/plugin-nextjs` (auto-installed)

Vercel is recommended because Next.js is a Vercel product → first-class support, fewer edge cases.
