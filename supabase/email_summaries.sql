-- Daily "Verbouwing" email summary feature. Run once in the SQL editor (or applied
-- via psql). Additive; never touches budget tables.
--
-- The daily job writes with the Supabase service role (bypasses RLS). The frontend
-- reads email_summaries while logged in. processing_runs is service-role only.

create extension if not exists "uuid-ossp";

create table if not exists email_summaries (
  id uuid primary key default uuid_generate_v4(),
  gmail_message_id text not null unique,            -- idempotency key
  gmail_thread_id text,
  rfc822_message_id text,                           -- Message-ID header, for Gmail deep links
  received_at timestamptz not null,                 -- UTC
  sender text,
  subject text,
  category text not null default 'other'
    check (category in ('quote', 'invoice', 'architect', 'other')),
  summary_text text,
  key_points jsonb not null default '[]'::jsonb,
  has_attachments boolean not null default false,
  attachment_names jsonb not null default '[]'::jsonb,
  action_needed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists email_summaries_received_idx on email_summaries (received_at desc);

create table if not exists processing_runs (
  id uuid primary key default uuid_generate_v4(),
  ran_at timestamptz not null default now(),
  cursor_used text,
  new_cursor text,
  messages_processed int not null default 0,
  status text check (status in ('success', 'partial', 'failed')),
  error_detail text
);
create index if not exists processing_runs_ran_idx on processing_runs (ran_at desc);

alter table email_summaries enable row level security;
alter table processing_runs enable row level security;

-- Frontend (authenticated) may read summaries. Writes happen via the service role,
-- which bypasses RLS, so no write policy is granted to authenticated users.
drop policy if exists "authenticated_read_email_summaries" on email_summaries;
create policy "authenticated_read_email_summaries" on email_summaries
  for select to authenticated using (auth.uid() is not null);

-- processing_runs has RLS enabled with no policy → only the service role can touch it.
