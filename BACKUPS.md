# Backups & rollback

Code is fully recoverable via git/GitHub + Netlify redeploy. The **database** is
not covered by git, and Supabase Free has no automatic backups — so this is the
data safety net. Two independent layers:

## 1. In-DB snapshot (instant undo for a bad migration)

Run [`supabase/snapshot.sql`](supabase/snapshot.sql) once in the Supabase SQL
editor. It installs a `backups` schema + `backups.snapshot()` and takes one
snapshot immediately. Before any risky change, take a fresh one:

```sql
select backups.snapshot('before <feature>');
select * from backups.snapshot_log order by taken_at desc;  -- list snapshots
```

Restore steps are in the comments at the bottom of `snapshot.sql`. This lives in
the same DB instance — great for rolling back a feature/migration, not disaster
recovery.

## 2. pg_dump → iCloud (off-box backup)

A full compressed dump to your iCloud Drive.

**Setup (once):**
1. `cp scripts/.backup.env.example scripts/.backup.env`
2. Put your DB connection string in `scripts/.backup.env` (gitignored). Supabase →
   Project Settings → Database → Connection string → URI → **Session pooler**
   (IPv4-friendly), with your DB password.
3. `pg_dump` is installed via Homebrew `libpq` (the script adds its path).
4. Test it: `./scripts/backup.sh` → writes
   `~/Library/Mobile Documents/.../Claude/Renovator-backups/renovator-<stamp>.sql.gz`.

**Automate (daily):**
```sh
cp scripts/com.renovator.backup.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.renovator.backup.plist
```
Runs daily at 20:00, keeps the newest 30 dumps. Logs: `/tmp/renovator-backup.log`,
`/tmp/renovator-backup.err`.

**Restore a dump:** `gunzip -c renovator-<stamp>.sql.gz | psql "$SUPABASE_DB_URL"`
(into a clean/empty database, or the target of your choice).

> Never commit `scripts/.backup.env` or `*.sql.gz` — both are gitignored. They
> contain the DB password / your data.
