# e-hub

Workspace portal (React UI under `react-ui`, Supabase under `supabase/`).

## GitHub + Vercel

로컬에 Git 저장소와 첫 커밋(`main`)이 준비되어 있습니다. 원격 저장소 생성·푸시·Vercel 연동은 **[docs/GITHUB_VERCEL.md](./docs/GITHUB_VERCEL.md)** 를 따르세요.

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
