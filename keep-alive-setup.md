# Supabase Keep-Alive Setup (Optimized)

To prevent your Supabase project from pausing after 7 days of inactivity, I have implemented a direct ping system.

Follow these steps to complete the setup:

## 1. Apply Database Table
Go to the [Supabase SQL Editor](https://supabase.com/dashboard/project/kmavsrezejnnoripnunz/sql) and run the following script to create the `keep_alive` table:

```sql
CREATE TABLE IF NOT EXISTS public.keep_alive (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access" ON public.keep_alive
    USING (true)
    WITH CHECK (true);

INSERT INTO public.keep_alive (checked_at) VALUES (NOW());
```

## 2. Get Your Supabase Keys
1. Go to **Project Settings > API** in your Supabase Dashboard.
2. Copy the **Project URL**.
3. Copy the **service_role** secret key (needed for full access).

## 3. GitHub Configuration
Go to your GitHub repository: **Settings > Secrets and variables > Actions**.
Add the following **Repository secrets**:

| Secret Name | Value |
| :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_KEY` | Your **service_role** secret key |

sb_secret_E7wlsl9NU0U6Ohtf7Cn9Bw_4NL-xFMx
https://kmavsrezejnnoripnunz.supabase.co
## How it Works
1. **GitHub Action**: Every day at **4:30 PM PKT**, GitHub triggers an inline Node.js script.
2. **Ping**: The script connects to Supabase and selects data from the `keep_alive` table.
3. **Prevention**: This database activity signals to Supabase that the project is in use, preventing the automatic 7-day pause.

> [!TIP]
> You can manually trigger this anytime from the **Actions** tab in your GitHub repository to verify it's working.
