# GitHub 저장 + Vercel 연동 (체크리스트)

이 PC에서는 **GitHub 로그인·저장소 생성·`git push`·Vercel 로그인**을 대신할 수 없습니다. 아래 순서대로 진행하면 됩니다.

## 1. GitHub에 새 저장소 만들기

1. [github.com/new](https://github.com/new) 에서 **New repository** 생성 (예: `e-hub`).
2. **README / .gitignore 추가하지 않음** (이미 로컬에 있음).
3. 생성 후 표시되는 URL을 복사합니다.  
   `https://github.com/<계정>/e-hub.git`

## 2. 로컬에서 원격 연결 후 푸시

PowerShell에서 프로젝트 루트(`e-hub`)로 이동한 뒤:

```powershell
cd "C:\Users\USER\Desktop\Cursor_주헌\e-hub"
git remote add origin https://github.com/<계정>/e-hub.git
git push -u origin main
```

- HTTPS 대신 SSH를 쓰면: `git@github.com:<계정>/e-hub.git`
- 첫 푸시 시 GitHub 인증(브라우저 또는 Personal Access Token)이 필요합니다.

이미 `git init`과 첫 커밋(`main`)은 로컬에 준비된 상태입니다.

## 3. Vercel 연동

1. [vercel.com](https://vercel.com) 로그인 → **Add New… → Project**.
2. **Import**에서 방금 만든 GitHub 저장소 `e-hub` 선택.
3. **Root Directory** (둘 중 하나):
   - **`react-ui`** — Vite 자동 인식, `react-ui/vercel.json` 사용.
   - **저장소 루트** — 루트 `vercel.json`이 `react-ui` 빌드를 실행합니다.
4. **Environment Variables**에 최소한 다음을 추가 (Production / Preview 모두):

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (선택) `VITE_LOGIN_EMAIL_DOMAIN`, `VITE_ADMIN_EMPLOYEE_IDS` — 설명은 `react-ui/.env.example` 참고.

5. **Deploy** 클릭.

자세한 설명은 [VERCEL.md](./VERCEL.md) 를 참고하세요.

## 4. (선택) GitHub Actions로 Vercel 배포

저장소 **Settings → Secrets and variables → Actions**에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 넣으면 `.github/workflows/vercel-deploy.yml`이 동작합니다. 시크릿이 없으면 워크플로는 스킵되며, **Vercel 대시보드 Git 연동만**으로도 배포됩니다.

## 보안

- `.env.local`, 서비스 롤 키, `supabase/.temp/` 는 **커밋하지 마세요** (`.gitignore`에 반영됨).
