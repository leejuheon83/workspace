import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./resolveSiteUrl";

describe("resolveSiteUrl", () => {
  it("스킴이 없으면 https를 붙인다", () => {
    const r = resolveSiteUrl("approval.sbsmc.co.kr");
    expect(r).toEqual({ ok: true, url: "https://approval.sbsmc.co.kr/" });
  });

  it("http/https는 그대로 유지한다", () => {
    expect(resolveSiteUrl("http://intra.local")).toEqual({
      ok: true,
      url: "http://intra.local/",
    });
    expect(resolveSiteUrl("https://intra.local/path?a=1")).toEqual({
      ok: true,
      url: "https://intra.local/path?a=1",
    });
  });

  it("잘못된 입력은 오류를 반환한다", () => {
    const empty = resolveSiteUrl("   ");
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.message).toMatch(/입력/);

    const invalid = resolveSiteUrl("ht^tp://bad url");
    expect(invalid.ok).toBe(false);
  });

  it("javascript: / data: 등 비 http(s) 스킴은 차단한다", () => {
    expect(resolveSiteUrl("javascript:alert(1)").ok).toBe(false);
    expect(resolveSiteUrl("data:text/html,<script>alert(1)</script>").ok).toBe(false);
    expect(resolveSiteUrl("file:///etc/passwd").ok).toBe(false);
  });
});
