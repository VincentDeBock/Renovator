# Renovator

A webapp to manage and track the expenses of a complete house renovation.

This repository is the **Phase 0 scaffold**: a working React + Vite shell wired to
Supabase and ready to deploy on Netlify. The screen it ships with only verifies the
connection. The real features start in Phase 1.

## Stack

- React + Vite (frontend)
- Supabase (Postgres, auth, file storage, realtime)
- Netlify (hosting, CI/CD from GitHub)

## One-time setup (about 30 minutes)

1. **Create the Supabase project** at supabase.com. Once it exists, open the SQL
   editor, paste the contents of `supabase/schema.sql`, and run it. This creates the
   tables and seeds one project row.

2. **Get your keys.** In Supabase: Project settings > API. Copy the Project URL and
   the anon public key.

3. **Local env.** Copy `.env.example` to `.env` and paste the two values in.

4. **Run it locally** to confirm the connection:
   ```
   npm install
   npm run dev
   ```
   You should see a green "Connected" status showing the seeded project.

5. **Push to GitHub.** Create an empty repo and push this folder to it.

6. **Connect Netlify.** New site from Git, pick the repo. Netlify reads
   `netlify.toml` automatically. Add the same two env vars
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under Site settings >
   Environment variables, then deploy.

7. **Point your domain.** In Netlify, add a custom domain such as
   `renovator.yourdomain.com` and follow the DNS instructions on one.com. Your
   existing one.com hosting stays untouched.

## Security note

Until Phase 4 (auth), the database uses permissive RLS policies, so anyone with the
app URL can read and write. Keep the Netlify site behind password protection, or add
Supabase auth early, before storing anything sensitive.

## Roadmap

- **Phase 0 (done):** scaffold, schema, deploy pipeline.
- **Phase 1:** the Overzicht budget table (sections, items, R/B/O/F amounts, Y/N
  toggle, live totals, inline edit).
- **Phase 2:** drag-and-drop reordering, add/delete.
- **Phase 3:** file upload and in-app viewer (Supabase Storage).
- **Phase 4:** Supabase auth (Vincent and Karo), audit trail, comments.
