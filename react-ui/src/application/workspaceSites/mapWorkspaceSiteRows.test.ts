import { describe, expect, it } from "vitest";
import type { WorkspaceSiteRow } from "../../domain/workspaceSite";
import { mapWorkspaceSiteRows } from "./mapWorkspaceSiteRows";

describe("mapWorkspaceSiteRows", () => {
  it("행을 회사/개인 배열로 분리한다", () => {
    const rows: WorkspaceSiteRow[] = [
      {
        id: "1",
        title: "전자결재",
        domain: "a.co.kr",
        description: "d1",
        category: "회사 고정",
        site_kind: "company",
        favorite: false,
        user_id: null,
        sort_order: 0,
        created_at: "",
      },
      {
        id: "2",
        title: "내 링크",
        domain: "b.app",
        description: "d2",
        category: "개인",
        site_kind: "personal",
        favorite: true,
        user_id: "u1",
        sort_order: 1,
        created_at: "",
      },
    ];

    expect(mapWorkspaceSiteRows(rows)).toEqual({
      company: [
        {
          id: "1",
          title: "전자결재",
          domain: "a.co.kr",
          description: "d1",
          category: "회사 고정",
        },
      ],
      personal: [
        {
          id: "2",
          title: "내 링크",
          domain: "b.app",
          description: "d2",
          category: "개인",
          favorite: true,
        },
      ],
    });
  });
});
