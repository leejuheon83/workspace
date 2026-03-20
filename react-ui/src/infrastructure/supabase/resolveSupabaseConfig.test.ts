import { describe, expect, it } from "vitest";
import {
  isSupabaseConfigured,
  resolveSupabaseConfig,
} from "./resolveSupabaseConfig";

describe("resolveSupabaseConfig", () => {
  it("URL·anon key 가 모두 있으면 정규화된 값을 반환한다", () => {
    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: " https://xxx.supabase.co ",
        VITE_SUPABASE_ANON_KEY: " eyJhbG ",
      }),
    ).toEqual({
      url: "https://xxx.supabase.co",
      anonKey: "eyJhbG",
    });
  });

  it("하나라도 비어 있으면 에러를 던진다", () => {
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_ANON_KEY: "k",
      }),
    ).toThrow(/Supabase 환경 변수/);
  });
});

describe("isSupabaseConfigured", () => {
  it("둘 다 있으면 true", () => {
    expect(
      isSupabaseConfigured({
        VITE_SUPABASE_URL: "https://a.supabase.co",
        VITE_SUPABASE_ANON_KEY: "key",
      }),
    ).toBe(true);
  });

  it("하나라도 없으면 false", () => {
    expect(
      isSupabaseConfigured({
        VITE_SUPABASE_URL: "https://a.supabase.co",
      }),
    ).toBe(false);
  });
});
