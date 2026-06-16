#!/usr/bin/env bash
set -euo pipefail

# Renovator database backup → compressed pg_dump into iCloud.
#
# Setup (once):
#   1. cp scripts/.backup.env.example scripts/.backup.env
#   2. Put your DB connection string in scripts/.backup.env (it is gitignored).
#      Supabase dashboard → Project Settings → Database → Connection string →
#      URI. Use the "Session pooler" URI (IPv4-friendly) and include your DB
#      password.
#   3. Ensure pg_dump is installed (brew install libpq).
#   4. Run: ./scripts/backup.sh
#
# Output: a timestamped renovator-YYYYMMDD-HHMMSS.sql.gz in your iCloud backups
# folder. Keeps the most recent BACKUP_KEEP dumps (default 30).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.backup.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .backup.env.example to .backup.env and fill it in." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set in .backup.env}"

DEST="${BACKUP_DIR:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/Claude/Renovator-backups}"
KEEP="${BACKUP_KEEP:-30}"

# pg_dump from Homebrew's libpq keg is not on PATH by default.
export PATH="/opt/homebrew/opt/libpq/bin:/usr/local/opt/libpq/bin:$PATH"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install it with: brew install libpq" >&2
  exit 1
fi

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/renovator-$STAMP.sql.gz"

echo "Backing up Renovator DB → $OUT"
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$OUT"

# Refuse to keep an empty/failed dump.
if [[ ! -s "$OUT" ]]; then
  echo "Backup produced an empty file — removing and failing." >&2
  rm -f "$OUT"
  exit 1
fi

# Prune: keep only the newest $KEEP dumps.
ls -1t "$DEST"/renovator-*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r f; do
  rm -f "$f"
done

COUNT="$(ls -1 "$DEST"/renovator-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')"
echo "Done. $(du -h "$OUT" | cut -f1) written; $COUNT backup(s) retained in $DEST"
