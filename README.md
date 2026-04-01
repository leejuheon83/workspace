# e-hub

Workspace portal (React UI under `react-ui`, Supabase under `supabase/`).

## GitHub + Vercel

- **한글 요약:** **[docs/VERCEL_빠른연동.md](./docs/VERCEL_빠른연동.md)** — 대시보드 Import / CLI `vercel link` 순서.
- GitHub 저장소 만들기·푸시·연동 체크리스트: **[docs/GITHUB_VERCEL.md](./docs/GITHUB_VERCEL.md)**

## Deploy to Vercel

상세(환경 변수, GitHub Actions, CLI): **[docs/VERCEL.md](./docs/VERCEL.md)**

요약:

- Vercel에서 이 repo를 Import하고 **Root Directory**는 **저장소 루트**(`vercel.json`이 `react-ui` 빌드) 또는 **`react-ui`**(Vite 프리셋) 중 하나로 설정.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 는 Vercel 프로젝트 환경 변수에 필수.

## Local UI

```bash
cd react-ui
npm install
npm run dev
```
