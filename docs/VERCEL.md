# Vercel deployment (e-hub)

The production UI lives in **`react-ui`** (Vite + React).

## Option A — Vercel dashboard (recommended)

1. [Vercel](https://vercel.com) → **Add New…** → **Project** → import this Git repository.
2. **Root Directory**: choose one:
   - **`react-ui`** — Framework Preset **Vite** is auto-detected; `react-ui/vercel.json` applies (SPA fallback).
   - **Repository root** — leave root as default; the root **`vercel.json`** runs `cd react-ui && npm ci && npm run build` and publishes **`react-ui/dist`**.
3. **Environment Variables** (Project → Settings → Environment Variables), for *Production* and *Preview* as needed:

| Name | Notes |
|------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_LOGIN_EMAIL_DOMAIN` | Optional; login email domain |
| `VITE_ADMIN_EMPLOYEE_IDS` | Optional; comma-separated admin employee ids |

See `react-ui/.env.example` for descriptions.

4. Deploy. After the first deploy, add your Vercel URL under **Supabase → Authentication → URL Configuration** (Site URL / Redirect URLs) if you use email redirects.

## Option B — GitHub Actions

1. Locally: `cd react-ui && npx vercel link` (log in, link project). Copy **`orgId`** and **`projectId`** from `react-ui/.vercel/project.json`.
2. Create a Vercel token: **Account Settings → Tokens**.
3. In the GitHub repo: **Settings → Secrets and variables → Actions**, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` (same as `orgId`)
- `VERCEL_PROJECT_ID` (same as `projectId`)

4. Push to `main` / `master` or open a PR; the workflow **Deploy Vercel** runs only when `VERCEL_TOKEN` is set (so dashboard-only users are not blocked).

## Local CLI

```bash
cd react-ui
npx vercel        # preview
npx vercel --prod # production
```

Ensure env vars exist locally (e.g. `.env.local`) or are pulled with `npx vercel env pull`.
