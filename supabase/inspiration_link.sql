-- Inspiration board link: a public Pinterest board URL per item.
-- Additive only. Applied once in the Supabase SQL editor (both the real project and
-- the Renofix-demo project), mirroring the additive pattern of the other migrations.
-- NULL = no board linked → the item detail page falls back to the photo-upload gallery.

alter table entries add column if not exists pinterest_url text;
