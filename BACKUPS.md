# Backups & rollback

Code is fully recoverable via git/GitHub + Netlify redeploy. The **database** is not
covered by git, and Supabase Free has no automatic backups — so this is the data
safety net. Three layers:

## 1. In-DB snapshot (instant undo for a bad migration)

Run [`supabase/snapshot.sql`](supabase/snapshot.sql) once in the Supabase SQL
editor. It installs a `backups` schema + `backups.snapshot()` and takes one
snapshot immediately. Before any risky change:

```sql
select backups.snapshot('before <feature>');
select * from backups.snapshot_log order by taken_at desc;  -- list snapshots
```

Restore steps are in the comments at the bottom of `snapshot.sql`. Same DB
instance — great for rolling back a feature/migration, not disaster recovery.

## 2. Manual off-box dump → iCloud

```sh
./scripts/backup.sh
```

Writes a compressed dump to
`~/Library/Mobile Documents/.../Claude/Renovator-backups/renovator-<stamp>.sql.gz`,
which iCloud syncs off-box. Connection string lives in the gitignored
`scripts/.backup.env`. Run this from your terminal anytime — it's the off-box copy.

## 3. Automated daily dump → local folder (launchd)

A launchd agent runs daily at 20:00 and writes to
`~/Library/Application Support/Renovator/backups/` (newest 30 kept).

**Why local, not iCloud:** macOS sandboxing kills a *background* agent when it
finalizes a write into iCloud Drive (a foreground terminal run is fine — that's why
layer 2 works). So the scheduled job saves locally; use layer 2 for the off-box
copy. The agent runs a **local copy** of the script at
`~/Library/Application Support/Renovator/backup.sh` with its own `.backup.env`
(`BACKUP_DIR` points at the local folder). If you edit `scripts/backup.sh`, re-copy
it there.

```sh
# already installed + loaded; to manage it:
launchctl list | grep renovator                                   # status (col 2 = last exit, 0 = ok)
launchctl unload ~/Library/LaunchAgents/com.renovator.backup.plist # disable
launchctl load   ~/Library/LaunchAgents/com.renovator.backup.plist # enable
```

Logs: `/tmp/renovator-backup.log`, `/tmp/renovator-backup.err`.

**Want fully hands-off *off-box* backups?** A scheduled GitHub Action (cloud cron)
can run `pg_dump` daily regardless of whether the Mac is on, storing dumps as
artifacts. Ask and I'll set it up (one repo secret needed).

## Restore a dump

```sh
gunzip -c renovator-<stamp>.sql.gz | psql "$SUPABASE_DB_URL"
```

into a clean/empty database (or your chosen target).

> Never commit `scripts/.backup.env` or `*.sql.gz` — both are gitignored.
