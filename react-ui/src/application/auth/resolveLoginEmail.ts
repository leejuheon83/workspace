/** Supabase Auth는 이메일 필드가 필요하므로, 사번만 입력 시 이 접미사를 붙입니다. */
export const DEFAULT_LOGIN_EMAIL_DOMAIN = "sbsmc.workspace";

/** 로컬 파트로 허용: 사번·번호·일반 이메일 아이디 (ASCII) */
const LOCAL_PART_RE = /^[a-zA-Z0-9._+-]+$/;

/** env(`VITE_LOGIN_EMAIL_DOMAIN`)가 비어 있으면 기본 도메인 */
export function getEffectiveLoginEmailDomain(emailDomain: string | undefined): string {
  const d = (emailDomain ?? "").trim().replace(/^@/, "");
  return d || DEFAULT_LOGIN_EMAIL_DOMAIN;
}

/**
 * Supabase Email 로그인용 주소로 정규화합니다.
 * - `@`가 있으면 그대로(트림만) 사용합니다.
 * - 없으면 `사번@도메인`으로 만듭니다. 도메인은 env 우선, 없으면 기본값.
 */
export function resolveLoginEmail(raw: string, emailDomain: string | undefined): string {
  const s = raw.trim();
  if (!s) {
    throw new Error("사번을 입력해 주세요.");
  }
  if (s.includes("@")) {
    return s;
  }
  const domain = getEffectiveLoginEmailDomain(emailDomain);
  if (!LOCAL_PART_RE.test(s)) {
    throw new Error("사번은 영문, 숫자, . _ + - 만 사용할 수 있습니다.");
  }
  return `${s}@${domain}`;
}

/** 헤더 등에 표시: 기본 도메인으로 로그인한 경우 사번만 보여 줌 */
export function displayLoginIdFromEmail(
  email: string | undefined,
  emailDomain: string | undefined,
): string {
  if (!email) return "";
  const domain = getEffectiveLoginEmailDomain(emailDomain);
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const dom = email.slice(at + 1);
  if (dom.toLowerCase() === domain.toLowerCase()) return local;
  return email;
}
