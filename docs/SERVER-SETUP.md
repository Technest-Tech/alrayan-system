# Server Setup

Two production environments to provision:

1. **Frontend** — Vercel (managed; minimal setup)
2. **Backend** — Hostinger VPS or DigitalOcean Droplet (Linux, manual)

---

## 1. Frontend on Vercel

### Initial setup
1. Push `site/frontend` to GitHub (or use the monorepo and set Vercel root directory)
2. Vercel → **New Project** → import the GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework Preset: **Next.js** (auto-detected)
5. Build command: `pnpm build` · Install command: `pnpm install` · Output: `.next`

### Domains
- Production: `alrayan-academy.com` and `www.alrayan-academy.com` (CNAME to `cname.vercel-dns.com`)
- Staging: `staging.alrayan-academy.com`

### Environment variables (Vercel dashboard)

| Var | Production | Staging | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://alrayan-academy.com` | `https://staging.alrayan-academy.com` | Used in canonicals + sitemap |
| `NEXT_PUBLIC_API_URL` | `https://api.alrayan-academy.com` | `https://api-staging.alrayan-academy.com` | Laravel backend |
| `NEXT_PUBLIC_WHATSAPP` | `+201000000000` | same | Owner replaces with real number |
| `REVALIDATE_SECRET` | (32-char random) | (different) | Shared with Laravel for ISR webhook |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `alrayan-academy.com` | — | Optional |

### Build-time checks
- `pnpm typecheck` and `pnpm lint` run as part of `pnpm build` (configured in Sprint 1)
- A failed typecheck blocks deploy — this is the desired behavior

---

## 2. Backend on a VPS (Hostinger / DigitalOcean)

### Recommended spec
- 2 vCPU, 4 GB RAM, 80 GB SSD (Hostinger KVM 2 ≈ $6/mo, DO basic ≈ $24/mo)
- Ubuntu **22.04 LTS** or **24.04 LTS**
- Region: closest to primary audience (US-East for USA market)

### Server provisioning steps

```bash
# 1. SSH in as root, then create a non-root user
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# 2. Install LEMP stack
apt update && apt upgrade -y
apt install -y nginx mysql-server php8.3-fpm php8.3-cli php8.3-mysql \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-gd \
  php8.3-bcmath php8.3-intl unzip git certbot python3-certbot-nginx

# 3. Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 4. Secure MySQL
mysql_secure_installation

# 5. Create database and user
mysql -u root -p
> CREATE DATABASE alrayan_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'alrayan'@'localhost' IDENTIFIED BY '<strong-password>';
> GRANT ALL ON alrayan_prod.* TO 'alrayan'@'localhost';
> FLUSH PRIVILEGES;

# 6. Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Deploy Laravel app

```bash
# As deploy user
cd /var/www
sudo git clone git@github.com:<owner>/alrayan-academy.git alrayan
sudo chown -R deploy:www-data alrayan
cd alrayan/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env (see template below)
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Permissions
sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Nginx config (`/etc/nginx/sites-available/api.alrayan-academy.com`)

```nginx
server {
    listen 80;
    server_name api.alrayan-academy.com;
    root /var/www/alrayan/backend/public;
    index index.php;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.alrayan-academy.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.alrayan-academy.com
```

### Backend `.env` template

```env
APP_NAME="Alrayan Academy API"
APP_ENV=production
APP_KEY=                      # php artisan key:generate sets this
APP_DEBUG=false
APP_URL=https://api.alrayan-academy.com

LOG_CHANNEL=daily
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alrayan_prod
DB_USERNAME=alrayan
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_DOMAIN=.alrayan-academy.com
SANCTUM_STATEFUL_DOMAINS=alrayan-academy.com,www.alrayan-academy.com,staging.alrayan-academy.com

MAIL_MAILER=resend
RESEND_API_KEY=
MAIL_FROM_ADDRESS="info@alrayan-academy.com"
MAIL_FROM_NAME="Alrayan Academy"
ADMIN_NOTIFICATION_EMAIL=info@alrayan-academy.com

CORS_ALLOWED_ORIGINS=https://alrayan-academy.com,https://www.alrayan-academy.com,https://staging.alrayan-academy.com

NEXT_REVALIDATE_URL=https://alrayan-academy.com/api/revalidate
NEXT_REVALIDATE_SECRET=       # same as Vercel's REVALIDATE_SECRET

HCAPTCHA_SECRET=
SENTRY_LARAVEL_DSN=
```

### Queue worker (Sprint 4+)

Email is queued to keep form submission snappy.

```bash
# /etc/systemd/system/alrayan-queue.service
[Unit]
Description=Alrayan Queue Worker
After=network.target

[Service]
User=deploy
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/alrayan/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable alrayan-queue && sudo systemctl start alrayan-queue
```

### Scheduler

```cron
# crontab -e (as deploy user)
* * * * * cd /var/www/alrayan/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 3. DNS (Cloudflare)

| Record | Name | Value | Proxy |
|---|---|---|---|
| A or CNAME | `@` | Vercel IP / `cname.vercel-dns.com` | DNS only (Vercel handles SSL) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |
| CNAME | `staging` | `cname.vercel-dns.com` | DNS only |
| A | `api` | VPS IP | Proxied (orange cloud) |
| A | `api-staging` | VPS IP | Proxied |
| MX | `@` | (provided by mail host) | DNS only |
| TXT | `@` | SPF + DKIM + DMARC (Resend dashboard provides) | DNS only |

---

## 4. Backups

| What | How | Frequency | Retention |
|---|---|---|---|
| MySQL DB | `mysqldump` to `/var/backups/`, then rsync to off-site (Backblaze B2 ≈ $1/mo) | Daily 03:00 UTC | 30 days |
| Uploaded files | `rsync` `storage/app/public` to B2 | Daily | 30 days |
| Code | GitHub (already off-site) | Per push | Indefinite |

Backup script lives at `/usr/local/bin/alrayan-backup.sh` — written in Sprint 7.

---

## 5. Monitoring

- **UptimeRobot:** monitor `https://alrayan-academy.com/` and `https://api.alrayan-academy.com/up` (Laravel built-in health endpoint), 5-min interval, alert email + Telegram
- **Sentry:** wired into both Next.js and Laravel from Sprint 1
- **Vercel Analytics:** enabled by default
- **Server health:** `htop`, `df -h`, log rotation already on by default (`logrotate`)
