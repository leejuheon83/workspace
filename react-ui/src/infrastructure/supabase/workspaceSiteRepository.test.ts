import { describe, expect, it, vi } from "vitest";
import { deleteCompanySite, updateCompanySite } from "./workspaceSiteRepository";

function mockChainDelete(result: { data: unknown[] | null; error: unknown }) {
  const select = vi.fn(() => Promise.resolve(result));
  const eqKind = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqKind }));
  const del = vi.fn(() => ({ eq: eqId }));
  const from = vi.fn(() => ({ delete: del }));
  return { client: { from } as never, select, eqKind, eqId, del, from };
}

function mockChainUpdate(result: { data: unknown[] | null; error: unknown }) {
  const select = vi.fn(() => Promise.resolve(result));
  const eqKind = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqKind }));
  const update = vi.fn(() => ({ eq: eqId }));
  const from = vi.fn(() => ({ update }));
  return { client: { from } as never, from };
}

describe("workspaceSiteRepository company admin", () => {
  it("deleteCompanySite: 삭제된 행이 없으면(RLS 등) 오류를 던진다", async () => {
    const { client } = mockChainDelete({ data: [], error: null });
    await expect(deleteCompanySite(client, "00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      "회사 고정 메뉴를 삭제할 수 없습니다",
    );
  });

  it("updateCompanySite: 갱신된 행이 없으면 오류를 던진다", async () => {
    const { client } = mockChainUpdate({ data: [], error: null });
    await expect(
      updateCompanySite(client, "00000000-0000-0000-0000-000000000001", {
        title: "t",
        domain: "d.com",
        description: "",
        category: "회사 고정",
      }),
    ).rejects.toThrow("회사 고정 메뉴를 수정할 수 없습니다");
  });
});
