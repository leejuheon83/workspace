export type SiteIconKind = "company" | "personal";

/** 제목·도메인 힌트로 카드 아이콘 이모지 선택 (일관된 기본값 포함) */
const TITLE_RULES: Array<{ re: RegExp; emoji: string }> = [
  { re: /결재|approval|전자결|e-?approval/i, emoji: "📋" },
  { re: /공지|notice|announce|알림/i, emoji: "📢" },
  { re: /복지|복리|benefit|welfare|후생/i, emoji: "🎁" },
  { re: /문서|docs|자료|양식|sharepoint|onedrive|드라이브|drive/i, emoji: "📁" },
  { re: /메일|mail|outlook|gmail|이메일/i, emoji: "✉️" },
  { re: /캘린더|calendar|일정|스케줄/i, emoji: "📅" },
  { re: /채팅|슬랙|slack|teams|메신저|협업톡|messenger/i, emoji: "💬" },
  { re: /회의|meet|zoom|webex|화상|영상회의/i, emoji: "🎥" },
  { re: /인사|hr|채용|talent/i, emoji: "👥" },
  { re: /교육|learning|lms|아카데미|academy|이러닝/i, emoji: "📚" },
  { re: /회계|재무|finance|erp|예산/i, emoji: "💰" },
  { re: /법무|legal|계약/i, emoji: "⚖️" },
  { re: /보안|security|sso|인증/i, emoji: "🔐" },
  { re: /헬프|helpdesk|it\s*지원|티켓|support/i, emoji: "🛠️" },
  { re: /디자인|figma|sketch|ui|ux/i, emoji: "🎨" },
  { re: /개발|github|gitlab|bitbucket|코드|jira|confluence/i, emoji: "💻" },
  { re: /데이터|bi|analytics|대시보드|dashboard|리포트/i, emoji: "📊" },
  { re: /클라우드|aws|azure|gcp/i, emoji: "☁️" },
  { re: /notion|위키|wiki|노트/i, emoji: "📔" },
  { re: /출장|여행|travel/i, emoji: "✈️" },
  { re: /구매|쇼핑|mall|마켓|나눔/i, emoji: "🛒" },
  { re: /뉴스|news|미디어|방송/i, emoji: "📰" },
  { re: /지도|map|오시는/i, emoji: "🗺️" },
];

const COMPANY_FALLBACKS = ["🌐", "🏢", "🏛️", "📍", "🛡️", "🔷"] as const;
const PERSONAL_FALLBACKS = ["✨", "🔗", "🌟", "💫", "🎯", "📎"] as const;

function stablePick(text: string, pool: readonly string[]): string {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % pool.length;
  return pool[idx] ?? pool[0];
}

export function siteTitleEmoji(title: string, kind: SiteIconKind): string {
  const t = title.trim();
  for (const { re, emoji } of TITLE_RULES) {
    if (re.test(t)) return emoji;
  }
  if (!t) {
    return kind === "company" ? "🏢" : "✨";
  }
  return stablePick(t, kind === "company" ? COMPANY_FALLBACKS : PERSONAL_FALLBACKS);
}
