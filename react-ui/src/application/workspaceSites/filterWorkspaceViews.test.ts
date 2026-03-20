import { describe, expect, it } from "vitest";
import type { CompanySite, PersonalSite } from "../../domain/workspaceSite";
import { filterWorkspaceViews } from "./filterWorkspaceViews";

const company: CompanySite[] = [
  {
    id: "c1",
    title: "A",
    domain: "a.com",
    description: "",
    category: "회사 고정",
  },
];

const personal: PersonalSite[] = [
  {
    id: "p1",
    title: "B",
    domain: "b.com",
    description: "",
    category: "업무",
    favorite: false,
  },
];

describe("filterWorkspaceViews", () => {
  it("전체는 회사·개인 모두 반환", () => {
    expect(filterWorkspaceViews("전체", company, personal)).toEqual({
      company,
      personal,
    });
  });

  it("회사 고정은 개인 목록을 비운다", () => {
    expect(filterWorkspaceViews("회사 고정", company, personal)).toEqual({
      company,
      personal: [],
    });
  });

  it("개인은 회사 목록을 비운다", () => {
    expect(filterWorkspaceViews("개인", company, personal)).toEqual({
      company: [],
      personal,
    });
  });

  it("카테고리 칩은 해당 카테고리만 양쪽에서 필터", () => {
    expect(filterWorkspaceViews("업무", company, personal)).toEqual({
      company: [],
      personal,
    });
  });
});
