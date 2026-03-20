import { describe, expect, it } from "vitest";
import { reorderSiteIds } from "./reorderSiteIds";

describe("reorderSiteIds", () => {
  it("active를 over 위치로 옮긴다", () => {
    expect(reorderSiteIds(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
    expect(reorderSiteIds(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
  });

  it("같은 인덱스면 원본 복사", () => {
    expect(reorderSiteIds(["a", "b"], "a", "a")).toEqual(["a", "b"]);
  });

  it("없는 id면 원본 복사", () => {
    expect(reorderSiteIds(["a", "b"], "x", "a")).toEqual(["a", "b"]);
  });
});
