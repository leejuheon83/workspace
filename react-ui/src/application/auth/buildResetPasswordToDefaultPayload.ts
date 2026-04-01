import { getEffectiveLoginEmailDomain, localLoginIdFromInput, resolveLoginEmail } from "./resolveLoginEmail";
import { initialPasswordFromLoginId, MIN_PASSWORD_LENGTH } from "./validatePasswordChange";

export type ResetPasswordToDefaultPayload = {
  loginId: string;
  emailDomain: string;
  /** Supabase Auth 로그인용 전체 이메일 */
  email: string;
};

/**
 * Edge Function `reset-password-to-default` 호출 본문을 만듭니다.
 * `resolveLoginEmail`과 동일 규칙으로 이메일·사번을 검증합니다.
 */
export function buildResetPasswordToDefaultPayload(
  raw: string,
  viteEmailDomain: string | undefined,
):
  | { ok: true; payload: ResetPasswordToDefaultPayload }
  | { ok: false; message: string } {
  try {
    const resolved = resolveLoginEmail(raw, viteEmailDomain);
    const loginId = localLoginIdFromInput(raw);
    const initialPw = initialPasswordFromLoginId(loginId);
    if (!initialPw) {
      return {
        ok: false,
        message: `최초 비밀번호는 사번과 같습니다. 사번이 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
      };
    }
    const at = resolved.lastIndexOf("@");
    const emailDomain =
      at > 0 ? resolved.slice(at + 1) : getEffectiveLoginEmailDomain(viteEmailDomain);
    return { ok: true, payload: { loginId, emailDomain, email: resolved } };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "입력을 확인해 주세요.",
    };
  }
}
