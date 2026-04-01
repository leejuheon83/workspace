import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIN_EMAIL_DOMAIN } from "./resolveLoginEmail";
import { buildResetPasswordToDefaultPayload } from "./buildResetPasswordToDefaultPayload";

describe("buildResetPasswordToDefaultPayload", () => {
  it("사번만 입력 시 기본 도메인으로 페이로드", () => {
    const r = buildResetPasswordToDefaultPayload("120032", undefined);
    expect(r).toEqual({
      ok: true,
      payload: {
        loginId: "120032",
        emailDomain: DEFAULT_LOGIN_EMAIL_DOMAIN,
        email: `120032@${DEFAULT_LOGIN_EMAIL_DOMAIN}`,
      },
    });
  });

  it("짧은 사번은 실패", () => {
    const r = buildResetPasswordToDefaultPayload("12345", undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/6자/);
  });

  it("전체 이메일이면 해당 도메인 사용", () => {
    const r = buildResetPasswordToDefaultPayload("abcdef@corp.example", undefined);
    expect(r).toEqual({
      ok: true,
      payload: {
        loginId: "abcdef",
        emailDomain: "corp.example",
        email: "abcdef@corp.example",
      },
    });
  });
});
