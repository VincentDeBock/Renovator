#!/usr/bin/env bash
set -euo pipefail

# Renovator database backup → compressed pg_dump into iCloud.
#
# Setup (once):
#   1. cp scripts/.backup.env.example scripts/.backup.env
#   2. Put your DB connection string in scripts/.backup.env (it is gitignored).
#      Supabase dashboard → Project Settings → Database → Connection string →
#      URI → "Session pooler" (IPv4-friendly), including your DB password.
#   3. Ensure pg_dump is installed (brew install libpq).
#   4. Run: ./scripts/backup.sh
#
# Note: housekeeping (pruning, counting) runs BEFORE the dump on purpose. When this
# runs as a background launchd agent, macOS sandboxing lets it create a file in
# iCloud but is finicky about enumerating that folder afterwards — doing the
# enumeration first means the dump write is the last thing the job does.

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

# Prune old dumps first (best-effort; never fail the backup over housekeeping).
( ls -1t "$DEST"/renovator-*.sql.gz 2>/dev/null | tail -n +"$KEEP" \
  | while read -r f; do rm -f "$f"; done ) || true

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/renovator-$STAMP.sql.gz"

echo "Backing up Renovator DB → $OUT"
# Judge success by pg_dump's real exit status, not the file size (iCloud can lag
# on reporting a freshly written file's size).
set +e
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$OUT"
dump_status=${PIPESTATUS[0]}
set -e

if [[ $dump_status -ne 0 ]]; then
  echo "pg_dump failed (status $dump_status) — removing partial file." >&2
  rm -f "$OUT"
  exit 1
fi

echo "Done. Backup written to $OUT"
exit 0
