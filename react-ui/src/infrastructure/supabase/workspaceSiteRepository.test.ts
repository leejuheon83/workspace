import { describe, expect, it, vi } from "vitest";
import {
  applyCompanySitesSortOrder,
  deleteCompanySite,
  updateCompanySite,
  updatePersonalSite,
} from "./workspaceSiteRepository";

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

function mockChainPersonalUpdate(result: { data: unknown[] | null; error: unknown }) {
  const select = vi.fn(() => Promise.resolve(result));
  const eqUser = vi.fn(() => ({ select }));
  const eqKind = vi.fn(() => ({ eq: eqUser }));
  const eqId = vi.fn(() => ({ eq: eqKind }));
  const update = vi.fn(() => ({ eq: eqId }));
  const from = vi.fn(() => ({ update }));
  return { client: { from } as never };
}

function mockChainCompanySortUpdate() {
  const select = vi.fn(() => Promise.resolve({ data: [{ id: "x" }], error: null }));
  const eqKind = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqKind }));
  const update = vi.fn(() => ({ eq: eqId }));
  const from = vi.fn(() => ({ update }));
  return { client: { from } as never, update };
}

describe("workspaceSiteRepository applyCompanySitesSortOrder", () => {
  it("각 id에 대해 sort_order를 인덱스로 갱신한다", async () => {
    const { client, update } = mockChainCompanySortUpdate();
    await applyCompanySitesSortOrder(client, ["a", "b"]);
    expect(update).toHaveBeenCalledTimes(2);
    const orders = update.mock.calls.map((c) => (c[0] as { sort_order: number }).sort_order).sort((x, y) => x - y);
    expect(orders).toEqual([0, 1]);
  });
});

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

  it("updatePersonalSite: 본인 링크가 아니면 오류를 던진다", async () => {
    const { client } = mockChainPersonalUpdate({ data: [], error: null });
    await expect(
      updatePersonalSite(client, "user-1", "00000000-0000-0000-0000-000000000010", {
        title: "개인",
        domain: "example.com",
        description: "",
        category: "개인",
      }),
    ).rejects.toThrow("개인 링크를 수정할 수 없습니다");
  });
});
