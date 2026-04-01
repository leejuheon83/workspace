# Vercel 연동 (빠른 안내)

이 저장소는 **루트 `vercel.json`** 또는 **`react-ui` 루트** 둘 다로 배포할 수 있습니다.

## 방법 1 — Vercel 웹에서 Git 연결 (가장 흔함)

1. [vercel.com](https://vercel.com) 로그인 → **Add New… → Project**.
2. GitHub/GitLab/Bitbucket에서 **`e-hub` 저장소**를 Import.
3. **Root Directory** 선택:
   - **`.` (저장소 루트)** — 루트의 `vercel.json`이 `react-ui` 빌드 후 `react-ui/dist`를 배포합니다.
   - **`react-ui`** — Vite 자동 감지, `react-ui/vercel.json`의 SPA rewrite가 적용됩니다.
4. **Environment Variables** (Production / Preview 필요 시 둘 다):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - (선택) `VITE_LOGIN_EMAIL_DOMAIN`, `VITE_ADMIN_EMPLOYEE_IDS`, `VITE_EHUB_PASSWORD_RESET_SECRET` 등 — 설명은 `react-ui/.env.example`.
5. **Deploy** 클릭.

배포 후 Supabase **Authentication → URL Configuration**에 Vercel 도메인(Site URL / Redirect URLs)을 넣으세요.

## 방법 2 — CLI로 프로젝트만 연결 (Git 없이 배포 테스트)

```powershell
cd react-ui
npx vercel login
npx vercel link    # 팀·프로젝트 선택 (또는 새로 생성)
npx vercel         # 프리뷰
npx vercel --prod  # 프로덕션
```

환경 변수는 Vercel 대시보드 **Project → Settings → Environment Variables**에서 설정하거나, `npx vercel env pull`로 로컬 `.env.local`을 맞출 수 있습니다.

## 자세한 문서

- [VERCEL.md](./VERCEL.md) — 대시보드·Actions·CLI 전체
- [GITHUB_VERCEL.md](./GITHUB_VERCEL.md) — GitHub 푸시 후 연동 체크리스트
