import { describe, expect, it } from "vitest";
import { initialPasswordFromLoginId, validateNewPasswordPair } from "./validatePasswordChange";

describe("validateNewPasswordPair", () => {
  it("빈 비밀번호", () => {
    expect(validateNewPasswordPair("", "")).toMatch(/입력/);
  });

  it("짧은 비밀번호", () => {
    expect(validateNewPasswordPair("12345", "12345")).toMatch(/6자/);
  });

  it("불일치", () => {
    expect(validateNewPasswordPair("secret1", "secret2")).toMatch(/일치/);
  });

  it("통과", () => {
    expect(validateNewPasswordPair("secret12", "secret12")).toBeNull();
    expect(validateNewPasswordPair("  secret12  ", "  secret12  ")).toBeNull();
  });
});

describe("initialPasswordFromLoginId", () => {
  it("빈 값·짧은 사번은 null", () => {
    expect(initialPasswordFromLoginId("")).toBeNull();
    expect(initialPasswordFromLoginId("   ")).toBeNull();
    expect(initialPasswordFromLoginId("12345")).toBeNull();
  });

  it("6자 이상 사번은 그대로", () => {
    expect(initialPasswordFromLoginId("120032")).toBe("120032");
    expect(initialPasswordFromLoginId("  120032  ")).toBe("120032");
  });
});
