import { describe, expect, it } from "vitest";
import { isTeamLeaderWorkspaceSite } from "./isTeamLeaderSite";

describe("isTeamLeaderWorkspaceSite", () => {
  it("제목에 팀장용이 있으면 true", () => {
    expect(isTeamLeaderWorkspaceSite("팀장용 (코칭)", "")).toBe(true);
  });

  it("설명에 only팀장이 있으면 true", () => {
    expect(
      isTeamLeaderWorkspaceSite("리뷰 시스템", "#팀원리뷰 #로그인(only팀장)"),
    ).toBe(true);
  });

  it("해당 없으면 false", () => {
    expect(isTeamLeaderWorkspaceSite("공지사항", "전사 공지")).toBe(false);
  });
});
