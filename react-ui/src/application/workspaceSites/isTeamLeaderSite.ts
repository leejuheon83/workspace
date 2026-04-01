/** 카드에「팀장용」배지를 붙일지 판별 (DB 필드 없이 제목·설명 키워드로 추정) */
export function isTeamLeaderWorkspaceSite(title: string, description: string): boolean {
  const t = title.trim();
  const d = description;
  if (t.includes("팀장용")) return true;
  if (d.includes("팀장용")) return true;
  if (/only\s*팀장|only팀장/i.test(d)) return true;
  if (/팀장\s*전용|팀장만/i.test(t) || /팀장\s*전용|팀장만/i.test(d)) return true;
  return false;
}
