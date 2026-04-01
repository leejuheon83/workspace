import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PersonalNotepadPanel from "./PersonalNotepadPanel";

describe("PersonalNotepadPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("저장된 메모를 textarea에 표시한다", () => {
    localStorage.setItem("ehub-sbsmc-personal-notepad:u-1", "저장됨");
    render(<PersonalNotepadPanel userId="u-1" />);
    expect(screen.getByRole("textbox", { name: "개인 메모 입력" })).toHaveValue("저장됨");
  });

  it("입력 후 디바운스로 localStorage에 반영된다", () => {
    render(<PersonalNotepadPanel userId="u-1" />);
    const ta = screen.getByRole("textbox", { name: "개인 메모 입력" });
    fireEvent.change(ta, { target: { value: "새 메모" } });
    expect(localStorage.getItem("ehub-sbsmc-personal-notepad:u-1")).toBeNull();
    vi.advanceTimersByTime(450);
    expect(localStorage.getItem("ehub-sbsmc-personal-notepad:u-1")).toBe("새 메모");
  });

  it("비로그인 시 비활성화된다", () => {
    render(<PersonalNotepadPanel userId={null} />);
    const ta = screen.getByRole("textbox", { name: "개인 메모 입력" });
    expect(ta).toBeDisabled();
  });
});
