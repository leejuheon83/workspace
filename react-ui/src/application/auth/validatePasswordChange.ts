/** Supabase 기본 정책과 맞춘 최소 길이 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * 최초 비밀번호 = 사번(로그인 ID)과 동일. Supabase 최소 길이를 못 맞추면 `null`.
 */
export function initialPasswordFromLoginId(loginId: string): string | null {
  const id = loginId.trim();
  if (!id || id.length < MIN_PASSWORD_LENGTH) return null;
  return id;
}

/**
 * 로그인 상태에서 비밀번호 변경 시 새 비밀번호·확인 검증.
 * 통과 시 `null`, 실패 시 사용자에게 보여 줄 한글 메시지.
 */
export function validateNewPasswordPair(newPassword: string, confirmPassword: string): string | null {
  const p = newPassword.trim();
  const q = confirmPassword.trim();
  if (!p) return "새 비밀번호를 입력해 주세요.";
  if (p.length < MIN_PASSWORD_LENGTH) {
    return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  }
  if (p !== q) return "새 비밀번호가 일치하지 않습니다.";
  return null;
}
