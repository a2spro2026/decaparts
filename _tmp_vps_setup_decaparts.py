#!/usr/bin/env python3
"""Create decaparts.a2spr.com on VPS A2S if missing, then deploy."""
import os
import secrets
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "51.255.162.99"
USER = "ubuntu"
PW = os.environ.get("VPS_SSH_PASSWORD", "A2sprVps2026!Secure")
FQDN = "decaparts.a2spr.com"
ROOT = f"/var/www/{FQDN}"
APP = f"{ROOT}/app"
PUBLIC = f"{ROOT}/public"
LOCAL = Path(__file__).resolve().parent
DB_NAME = "decaparts"
DB_USER = "decaparts"
DB_PASS = os.environ.get("DECAPARTS_DB_PASSWORD", secrets.token_urlsafe(16))

EXCLUDE_DIRS = {".git", "node_modules", "vendor", "_tmp_vps", ".cursor"}
EXCLUDE_FILES = {".env", ".env.local", ".env.production"}
EXCLUDE_PREFIXES = ("_tmp_vps_",)


def should_exclude(path: Path, root: Path) -> bool:
    rel = path.relative_to(root)
    if any(p in EXCLUDE_DIRS for p in rel.parts):
        return True
    if path.name in EXCLUDE_FILES:
        return True
    if any(path.name.startswith(p) for p in EXCLUDE_PREFIXES):
        return True
    return False


def make_tarball() -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp.close()
    tar_path = Path(tmp.name)
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in LOCAL.rglob("*"):
            if should_exclude(item, LOCAL):
                continue
            if item.is_file():
                tar.add(item, arcname=item.relative_to(LOCAL).as_posix())
    return tar_path


def run(c, cmd, t=900, check=True):
    print(f"\n>>> {cmd[:280]}", flush=True)
    _stdin, stdout, stderr = c.exec_command(cmd, timeout=t, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    text = (out + "\n" + err).strip()
    if text:
        print(text[-8000:], flush=True)
    if check and code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd[:120]}")
    return code, text


def ensure_laravel_layout(c):
    """Match batixpert/yallahgo: app/ + public -> app/public symlink."""
    code, _ = run(c, f"test -d {ROOT}", check=False)
    if code != 0:
        print("Creating site decaparts ...", flush=True)
        run(c, "sudo new-site decaparts php", t=300)

    run(c, f"mkdir -p {APP}")

    code, _ = run(c, f"test -L {PUBLIC}", check=False)
    if code != 0:
        print("Fixing public symlink -> app/public ...", flush=True)
        run(c, f"sudo rm -rf {PUBLIC}")
        run(c, f"sudo ln -s {APP}/public {PUBLIC}")
        run(c, f"sudo chown -h ubuntu:www-data {PUBLIC}", check=False)


def main():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PW, timeout=30, allow_agent=False, look_for_keys=False)

    tar_path = None
    try:
        ensure_laravel_layout(c)

        code, _ = run(c, f"test -f {APP}/.env", check=False)
        if code != 0:
            print("Initializing database and .env ...", flush=True)
            sql = f"""CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '{DB_USER}'@'localhost' IDENTIFIED BY '{DB_PASS}';
ALTER USER '{DB_USER}'@'localhost' IDENTIFIED BY '{DB_PASS}';
GRANT ALL PRIVILEGES ON {DB_NAME}.* TO '{DB_USER}'@'localhost';
FLUSH PRIVILEGES;"""
            run(c, f"sudo mysql <<'SQL'\n{sql}\nSQL", t=120)

            env = f"""APP_NAME=DecaParts
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://{FQDN}

APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE={DB_NAME}
DB_USERNAME={DB_USER}
DB_PASSWORD={DB_PASS}

SESSION_DRIVER=database
SESSION_LIFETIME=120
QUEUE_CONNECTION=database
CACHE_STORE=database

LOG_CHANNEL=stack
LOG_LEVEL=error
"""
            run(c, f"cat > {APP}/.env << 'ENVEOF'\n{env}ENVEOF", t=60)

        tar_path = make_tarball()
        remote_tar = f"/tmp/decaparts_deploy_{int(time.time())}.tar.gz"
        sftp = c.open_sftp()
        print(f"Uploading {tar_path} -> {remote_tar}", flush=True)
        sftp.put(str(tar_path), remote_tar)
        sftp.close()

        run(c, f"cp {APP}/.env /tmp/decaparts_env_backup 2>/dev/null || true", check=False)
        run(c, f"cd {APP} && tar -xzf {remote_tar} --strip-components=0")
        run(c, f"cp /tmp/decaparts_env_backup {APP}/.env", check=False)
        run(c, f"rm -f {remote_tar}")

        run(c, f"cd {APP} && composer install --no-dev --optimize-autoloader --no-interaction")
        run(c, f"cd {APP} && php artisan key:generate --force", check=False)
        run(c, f"cd {APP} && npm ci && npm run build", t=1200)
        run(c, f"cd {APP} && php artisan migrate --force --seed")
        run(c, f"cd {APP} && php artisan storage:link", check=False)
        run(c, f"cd {APP} && php artisan config:cache && php artisan route:cache && php artisan view:cache")
        run(c, f"sudo chown -R ubuntu:www-data {APP} && sudo chmod -R g+w {APP}/storage {APP}/bootstrap/cache")

        code, _ = run(c, f"test -f /etc/letsencrypt/live/{FQDN}/fullchain.pem", check=False)
        if code != 0:
            run(
                c,
                f"sudo certbot --nginx -d {FQDN} --non-interactive --agree-tos -m admin@a2spr.com --redirect",
                t=300,
                check=False,
            )

        _, text = run(c, f"curl -s -o /dev/null -w '%{{http_code}}' https://{FQDN}/", check=False)
        if "200" not in text and "302" not in text:
            _, text = run(c, f"curl -s -o /dev/null -w '%{{http_code}}' http://{FQDN}/", check=False)
        print(f"\nHTTPS status: {text.strip()}", flush=True)
        print(f"\nDone: https://{FQDN}", flush=True)
        print(f"App login: https://{FQDN}/app/login", flush=True)
    finally:
        c.close()
        try:
            tar_path.unlink(missing_ok=True)
        except Exception:
            pass


if __name__ == "__main__":
    main()
