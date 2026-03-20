import { describe, expect, it } from "vitest";
import { siteTitleEmoji } from "./siteTitleEmoji";

describe("siteTitleEmoji", () => {
  it("한글 키워드에 맞는 이모지를 고른다", () => {
    expect(siteTitleEmoji("전자결재", "company")).toBe("📋");
    expect(siteTitleEmoji("공지사항", "company")).toBe("📢");
    expect(siteTitleEmoji("복리후생", "company")).toBe("🎁");
    expect(siteTitleEmoji("문서함", "company")).toBe("📁");
  });

  it("영문 키워드에도 반응한다", () => {
    expect(siteTitleEmoji("Company Mail", "company")).toBe("✉️");
    expect(siteTitleEmoji("GitHub", "personal")).toBe("💻");
  });

  it("빈 제목은 kind별 기본 이모지", () => {
    expect(siteTitleEmoji("", "company")).toBe("🏢");
    expect(siteTitleEmoji("   ", "personal")).toBe("✨");
  });

  it("매칭 없으면 제목 기준으로 안정적인 대체 이모지", () => {
    const a = siteTitleEmoji("내 커스텀 앱", "personal");
    const b = siteTitleEmoji("내 커스텀 앱", "personal");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});
