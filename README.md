# e-hub

Workspace portal (React UI under `react-ui`, Supabase under `supabase/`).

## Deploy to Vercel

See **[docs/VERCEL.md](./docs/VERCEL.md)** for dashboard setup, environment variables, optional GitHub Actions, and CLI commands.

Quick hints:

- Import this repo in Vercel and set **Root Directory** to **`react-ui`** *or* keep repo root and rely on root **`vercel.json`**.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.

## Local UI

```bash
cd react-ui
npm install
npm run dev
```
