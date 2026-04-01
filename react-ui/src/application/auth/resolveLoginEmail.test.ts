import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOGIN_EMAIL_DOMAIN,
  displayLoginIdFromEmail,
  getEffectiveLoginEmailDomain,
  localLoginIdFromInput,
  resolveLoginEmail,
} from "./resolveLoginEmail";

describe("resolveLoginEmail", () => {
  it("@가 있으면 그대로 사용", () => {
    expect(resolveLoginEmail("  a@B.com ", undefined)).toBe("a@B.com");
  });

  it("도메인 env가 있으면 그걸 쓴다", () => {
    expect(resolveLoginEmail("12345", "sbsmc.workspace")).toBe("12345@sbsmc.workspace");
  });

  it("도메인 앞의 @는 제거한다", () => {
    expect(resolveLoginEmail("001", "@corp.local")).toBe("001@corp.local");
  });

  it("도메인이 비어 있으면 기본 도메인을 붙인다", () => {
    expect(resolveLoginEmail("12345", undefined)).toBe(`12345@${DEFAULT_LOGIN_EMAIL_DOMAIN}`);
    expect(resolveLoginEmail("12345", "   ")).toBe(`12345@${DEFAULT_LOGIN_EMAIL_DOMAIN}`);
  });

  it("허용되지 않는 문자는 에러", () => {
    expect(() => resolveLoginEmail("12 34", "x.y")).toThrow(/사번은/);
  });
});

describe("getEffectiveLoginEmailDomain", () => {
  it("빈 값이면 기본 도메인", () => {
    expect(getEffectiveLoginEmailDomain(undefined)).toBe(DEFAULT_LOGIN_EMAIL_DOMAIN);
    expect(getEffectiveLoginEmailDomain("")).toBe(DEFAULT_LOGIN_EMAIL_DOMAIN);
  });

  it("설정값이 있으면 그대로", () => {
    expect(getEffectiveLoginEmailDomain("corp.internal")).toBe("corp.internal");
  });
});

describe("localLoginIdFromInput", () => {
  it("사번만이면 트림만", () => {
    expect(localLoginIdFromInput("  120032  ")).toBe("120032");
  });

  it("이메일이면 @ 앞만", () => {
    expect(localLoginIdFromInput("120032@sbsmc.workspace")).toBe("120032");
  });
});

describe("displayLoginIdFromEmail", () => {
  it("기본 도메인과 일치하면 로컬만 반환", () => {
    expect(
      displayLoginIdFromEmail(`99@${DEFAULT_LOGIN_EMAIL_DOMAIN}`, undefined),
    ).toBe("99");
  });

  it("다른 도메인이면 전체 이메일", () => {
    expect(displayLoginIdFromEmail("a@gmail.com", undefined)).toBe("a@gmail.com");
  });
});
