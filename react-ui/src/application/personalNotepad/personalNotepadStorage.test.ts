import { afterEach, describe, expect, it, vi } from "vitest";
import {
  personalNotepadStorageKey,
  readPersonalNotepad,
  writePersonalNotepad,
} from "./personalNotepadStorage";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  } as Storage;
}

describe("personalNotepadStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("키는 userId 기반으로 고정 프리픽스를 쓴다", () => {
    expect(personalNotepadStorageKey("user-abc")).toBe(
      "ehub-sbsmc-personal-notepad:user-abc",
    );
  });

  it("userId가 없으면 읽기는 빈 문자열", () => {
    const storage = createMemoryStorage();
    expect(readPersonalNotepad(null, storage)).toBe("");
  });

  it("저장 후 같은 userId로 읽을 수 있다", () => {
    const storage = createMemoryStorage();
    writePersonalNotepad("u-1", "메모 내용", storage);
    expect(readPersonalNotepad("u-1", storage)).toBe("메모 내용");
  });

  it("userId가 없으면 쓰기는 무시한다", () => {
    const storage = createMemoryStorage();
    writePersonalNotepad(null, "x", storage);
    expect(storage.getItem(personalNotepadStorageKey("u-1"))).toBeNull();
  });

  it("getItem 예외 시 읽기는 빈 문자열", () => {
    const storage = createMemoryStorage();
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readPersonalNotepad("u-1", storage)).toBe("");
  });

  it("setItem 예외 시 쓰기는 삼킨다", () => {
    const storage = createMemoryStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writePersonalNotepad("u-1", "x", storage)).not.toThrow();
  });
});
