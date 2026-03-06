# Supabase setup for Developer One-Click Setup Manager

## One-time setup (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Paste and run **`run-all.sql`** (creates table, RLS, indexes, and seeds the default catalog; safe to re-run).

## Individual scripts (optional)

If you prefer to run steps separately: **001_create_software_list.sql** → **003_add_icon_url.sql** (only if the table already existed without `icon_url`) → **002_seed_software_list.sql**.

## Table: `software_list`

| Column      | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | uuid (PK) | Auto-generated                 |
| name       | text      | Display name                   |
| winget_id  | text      | e.g. `Microsoft.VisualStudioCode` |
| category   | text      | e.g. `browser`, `Development Tools` |
| enabled    | boolean   | Include in catalog / install   |
| icon_url   | text      | Optional URL for software icon (app shows it in catalog) |
| created_at | timestamptz | Set automatically            |

The app uses the **anon** key to read from this table. No extra config is needed if `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
