# Feature Handoff: Daily "Verbouwing" Email Summary

## For the implementing agent (Claude Code)

This document specifies one feature for an existing personal web app that tracks a house renovation budget. Read it fully, then **confirm the assumptions in the "Stack assumptions" section against the actual repository before writing code.** Where the repo differs, adapt to the repo's conventions rather than introducing a new stack.

---

## 1. Problem statement

Renovation communication arrives daily by email: quotes (offertes), invoices, and messages from the architect and contractors. All of it lands in one Gmail mailbox under the label `Verbouwing`. Keeping up means manually opening and reading each thread. The owner wants a once-a-day, readable summary of that traffic surfaced inside the app, so they can stay current without living in the inbox.

## 2. Goal

Produce a daily, app-visible summary of new emails labeled `Verbouwing`, enriched with context extracted from any PDF attachments (quotes, invoices), so the owner can see at a glance what was communicated and whether anything needs their attention.

## 3. Non-goals (explicitly out of scope)

- **No automatic budget mutations.** This feature does not create, edit, link, or delete budget line items. PDF content is read **only** to enrich the summary text. The budget tables are never written to by this feature.
- **No write-back to Gmail.** Do not mark messages read, archive, relabel, reply, or delete. Read-only Gmail access.
- **No real-time / push.** A once-per-day batch run is sufficient. Sub-day latency is not required.
- **No multi-mailbox or multi-label support.** Single mailbox, single label (`Verbouwing`).

## 4. Stack assumptions (confirm against repo first)

The owner's existing tooling suggests:

- Backend data store: **Supabase (Postgres)**.
- Frontend reads from Supabase and renders the app.
- Daily job host: **either** a scheduled **GitHub Actions** workflow **or** a **Supabase scheduled Edge Function**. Pick whichever matches what the repo already uses. If neither exists yet, default to a scheduled GitHub Action (simplest, no server to maintain).
- Summarization: **Anthropic API** (the owner already uses Claude heavily).

If the real repo uses a different database, framework, or scheduler, follow the repo. The pipeline below is stack-agnostic.

## 5. Architecture / daily pipeline

A single scheduled job runs once per day and performs:

1. **Authenticate to Gmail** using a stored OAuth refresh token (read-only scope `https://www.googleapis.com/auth/gmail.readonly`).
2. **Determine the window incrementally.** Read the last processing cursor from the DB (a stored timestamp, or the set of already-seen Gmail message IDs). Query Gmail for messages newer than that cursor with the label filter, e.g. `label:Verbouwing after:<cursor>`. Do **not** rely on `newer_than:1d` alone, because a missed run would leave a gap. Fall back to `newer_than:2d` only if no cursor exists yet (first run can use a sensible backfill window, e.g. 7 days).
3. **Fetch each new message** via `users.messages.get`. Pull headers (`From`, `Subject`, `Date`, `Message-ID`), and decode the body. Bodies are base64url-encoded and multipart MIME: walk the parts recursively, prefer `text/plain`, fall back to stripped `text/html`.
4. **Fetch PDF attachments only.** For parts with a `filename` and `body.attachmentId` where the MIME type is `application/pdf`, fetch via `users.messages.attachments.get`. Apply a size guard (skip or truncate files above a sane cap, e.g. 10 MB). Ignore non-PDF attachments for context, but record that they exist.
5. **Summarize via the Anthropic API.** Send, per message: sender, subject, date, body text, and any PDF attachments as document blocks (base64). Request a single structured JSON object per message (schema in section 7). The prompt must instruct the model to extract amounts, vendors, dates, and deadlines from the body **and** the PDFs, and must explicitly state that it should **not** propose or perform any budget changes. It only describes what was communicated.
6. **Persist results** to the database (section 6). Upsert keyed on the Gmail message ID for idempotency. Advance and store the cursor.
7. **Frontend** reads stored summaries and displays them grouped by day, newest first (section 8).

Process messages **one at a time with per-message error handling** so a single bad email or oversized PDF does not abort the whole run or lose progress on the others.

## 6. Data model

Create the following (adapt naming to repo conventions). Two tables:

**`email_summaries`**
- `id` (uuid, pk)
- `gmail_message_id` (text, **unique**) - idempotency key
- `gmail_thread_id` (text)
- `rfc822_message_id` (text) - the `Message-ID` header, used for deep-linking back to Gmail
- `received_at` (timestamptz, store UTC)
- `sender` (text)
- `subject` (text)
- `category` (text enum-like: `quote` | `invoice` | `architect` | `other`)
- `summary_text` (text)
- `key_points` (jsonb) - array of short strings: amounts, dates, deadlines mentioned
- `has_attachments` (boolean)
- `attachment_names` (jsonb) - array of filenames, for visibility
- `action_needed` (boolean)
- `created_at` (timestamptz, default now)

**`processing_runs`** (operational record + cursor)
- `id` (uuid, pk)
- `ran_at` (timestamptz)
- `cursor_used` (text) - the window start applied this run
- `new_cursor` (text) - the advanced cursor stored for next run
- `messages_processed` (int)
- `status` (text: `success` | `partial` | `failed`)
- `error_detail` (text, nullable)

Idempotency: the unique constraint on `gmail_message_id` plus upsert means re-running the job never duplicates summaries. The cursor lives on `processing_runs` (or a small singleton settings row), so a missed day is caught up on the next run.

## 7. Anthropic API specifics

- **Model**: use `claude-sonnet-4-6` for a good cost/quality balance. `claude-haiku-4-5` is acceptable if cost needs to be lower; the task is light.
- **PDF input**: pass each PDF as a base64 `document` content block alongside the text. The API reads PDFs natively, so no separate OCR/extraction library is needed.
- **Output**: instruct the model to return **only** a JSON object, no prose or code fences, matching this shape, and parse it defensively (strip any stray fences, wrap in try/catch):

```json
{
  "category": "quote | invoice | architect | other",
  "summary_text": "2-4 sentence plain-language summary of what this email communicated, including any figures found in attached PDFs",
  "key_points": ["e.g. Quote total EUR 12.450", "Valid until 30 June", "Awaiting your approval"],
  "action_needed": true
}
```

- The prompt must include a hard instruction: the model describes and summarizes only; it must never recommend, create, or imply budget line entries or any write action.

## 8. Frontend

Add a page/section (suggested label "Communicatie" or "Updates"):

- List summaries grouped by calendar day, newest day first, newest message first within a day.
- Each item is a card showing: sender, subject, a category badge, the summary text, the key points, an "action needed" highlight when `action_needed` is true, and the attachment filenames if any.
- Provide a deep link to open the original in Gmail using the stored RFC822 Message-ID:
  `https://mail.google.com/mail/u/0/#search/rfc822msgid:<rfc822_message_id>`
- Empty state: if a day had no `Verbouwing` mail, show a quiet "Nothing new today" rather than a blank screen.
- Display timestamps in `Europe/Brussels` (store UTC, convert on render).

## 9. Edge cases to handle

- **No new emails**: write a `processing_runs` record with `messages_processed = 0`; frontend shows the empty state.
- **Email with no readable body** (attachments only): summarize from the PDFs and subject.
- **HTML-only email**: strip to text before summarizing.
- **Non-PDF attachments**: record the filename in `attachment_names`, do not send to the model.
- **Oversized PDF**: skip the attachment, note it in `key_points` (e.g. "Large attachment not analyzed: <name>"), still summarize the rest.
- **Reply within an existing thread**: summarize the new message; it is fine to note it continues a thread.
- **Missed run / catch-up**: cursor-based windowing must process everything since the last successful cursor, not just the last 24 hours.
- **Partial failure**: if some messages fail, mark the run `partial`, record the error, still persist the successes, and still advance the cursor only past successfully processed messages (do not skip failures permanently without a record).
- **API rate limits / transient errors**: retry with backoff a small number of times per message before recording a failure.

## 10. Secrets and security

Store as CI/job secrets (GitHub Actions secrets or Supabase function secrets), never in code or the frontend bundle:

- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

The Supabase service role key is server-side only and must never reach the browser. Gmail scope is read-only. The OAuth consent screen can stay in "testing" mode with the owner added as the sole test user.

## 11. Scheduling

If GitHub Actions: a `schedule` cron, e.g. daily at 05:30 UTC (06:30/07:30 Brussels depending on DST):

```yaml
on:
  schedule:
    - cron: "30 5 * * *"
  workflow_dispatch: {}   # allow manual runs for testing
```

If Supabase scheduled Edge Function: configure the equivalent daily schedule. Include a manual trigger path either way so the job can be run on demand during development.

## 12. Acceptance criteria

- [ ] Running the job ingests every `Verbouwing` email received since the last stored cursor (verified with a backfill window on first run).
- [ ] Each ingested email produces one stored summary row with category, summary text, and key points.
- [ ] When an email has PDF attachments, figures or terms from those PDFs appear in the summary or key points.
- [ ] Re-running the job does not create duplicate rows (idempotent on `gmail_message_id`).
- [ ] A missed day is fully caught up on the next run (no gap).
- [ ] No row in any budget table is created, modified, or deleted by this feature.
- [ ] Gmail is never written to (no read flags, labels, replies, deletions).
- [ ] The frontend shows summaries grouped by day, newest first, with action-needed items visually highlighted and a working Gmail deep link.
- [ ] Secrets are read from the job's secret store, not committed.

## 13. Open questions (confirm with the owner or the repo)

- Which scheduler does the repo already use, if any (decides GitHub Actions vs Supabase function)?
- Existing table naming and migration conventions to match.
- Frontend framework and where a new page should be registered in routing.
- Is a 7-day first-run backfill window acceptable, or should it start fresh from deployment day?
- Preferred run time of day in Brussels.

## 14. Suggested build order

1. Gmail OAuth + read-only fetch of labeled messages (print to console).
2. Body decode + PDF attachment fetch.
3. Anthropic summarization with the JSON schema and PDF document blocks.
4. DB schema + idempotent upsert + cursor.
5. Scheduler wiring + manual trigger.
6. Frontend page reading from `email_summaries`.
7. Edge cases and error handling pass.
