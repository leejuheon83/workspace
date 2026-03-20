import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isEhubAdmin, parseAdminEmployeeIdsFromEnv } from "./isEhubAdmin";

function u(partial: Partial<User>): User {
  return {
    id: "x",
    aud: "a",
    role: "authenticated",
    email: "a@b.c",
    app_metadata: {},
    user_metadata: {},
    created_at: "",
    updated_at: "",
    ...partial,
  } as User;
}

describe("parseAdminEmployeeIdsFromEnv", () => {
  it("빈 값이면 기본 120032", () => {
    expect(parseAdminEmployeeIdsFromEnv(undefined)).toEqual(["120032"]);
    expect(parseAdminEmployeeIdsFromEnv("")).toEqual(["120032"]);
  });

  it("콤마 구분 파싱", () => {
    expect(parseAdminEmployeeIdsFromEnv("120032, 999")).toEqual(["120032", "999"]);
  });
});

describe("isEhubAdmin", () => {
  it("null 이면 false", () => {
    expect(isEhubAdmin(null)).toBe(false);
  });

  it("app_metadata.ehub_admin true", () => {
    expect(isEhubAdmin(u({ app_metadata: { ehub_admin: true } }))).toBe(true);
  });

  it("user_metadata.ehub_admin 문자열 true", () => {
    expect(isEhubAdmin(u({ user_metadata: { ehub_admin: "true" } }))).toBe(true);
  });

  it("이메일 로컬이 120032 이면 관리자 (기본 목록)", () => {
    expect(isEhubAdmin(u({ email: "120032@sbsmc.workspace" }))).toBe(true);
  });

  it("employee_id 가 120032 면 관리자", () => {
    expect(isEhubAdmin(u({ email: "x@y.z", user_metadata: { employee_id: "120032" } }))).toBe(
      true,
    );
  });

  it("다른 사번이면 false", () => {
    expect(isEhubAdmin(u({ email: "120033@sbsmc.workspace" }))).toBe(false);
  });

  it("메타·사번 없으면 false", () => {
    expect(isEhubAdmin(u({}))).toBe(false);
  });
});
