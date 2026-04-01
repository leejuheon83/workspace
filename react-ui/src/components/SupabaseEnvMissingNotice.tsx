/**
 * Vercel 등 배포 환경에서 VITE_SUPABASE_* 가 비어 있을 때 표시합니다.
 * (빌드에 변수가 없으면 런타임 예외로 전체 화면이 하얗게 보일 수 있음)
 */
export default function SupabaseEnvMissingNotice() {
  return (
    <div className="workspace">
      <div className="hero" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="hero-badge">배포 설정</div>
        <h1 className="hero-title">Supabase 환경 변수가 필요합니다</h1>
        <p className="hero-desc" style={{ marginTop: 8 }}>
          Vercel 프로젝트 <strong>Settings → Environment Variables</strong>에{" "}
          <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>를 Production(및 Preview)에
          넣은 뒤 <strong>Redeploy</strong> 하세요. 이전에 쓰던 Vercel 프로젝트에 같은 변수가 있으면 그
          값을 복사하면 됩니다.
        </p>
        <p className="hero-desc" style={{ marginTop: 8 }}>
          예전 도메인과 주소가 다르면, CLI나 대시보드에서 <strong>새 Vercel 프로젝트</strong>가 만들어졌을
          수 있습니다. <strong>Settings → Domains</strong>에서 커스텀 도메인을 쓸 프로젝트에 다시 연결하거나,{" "}
          <code>npx vercel link</code>로 기존 프로젝트에 맞춘 뒤 배포하세요.
        </p>
      </div>
    </div>
  );
}
