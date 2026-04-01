import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SbsmcWorkspaceRedesign from "./SbsmcWorkspaceRedesign";
import { getSupabaseBrowserClient } from "./infrastructure/supabase";
import * as workspaceSiteRepository from "./infrastructure/supabase/workspaceSiteRepository";

vi.mock("./infrastructure/supabase", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./infrastructure/supabase/workspaceSiteRepository", () => ({
  fetchWorkspaceSiteRows: vi.fn(),
  insertCompanySite: vi.fn(),
  updateCompanySite: vi.fn(),
  deleteCompanySite: vi.fn(),
  insertPersonalSite: vi.fn(),
  updatePersonalSite: vi.fn(),
  deletePersonalSite: vi.fn(),
}));

const companyRow = {
  id: "company-mock-1",
  title: "전자결재",
  domain: "approval.sbsmc.co.kr",
  description: "전사 공통 결재 및 문서 승인 시스템",
  category: "회사 고정",
  site_kind: "company" as const,
  favorite: false,
  user_id: null,
  sort_order: 0,
  created_at: "2025-01-01T00:00:00Z",
};

function createMockSupabase(initialSession: Session | null) {
  const authListeners: Array<(event: string, session: Session | null) => void> = [];

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: initialSession } }),
      onAuthStateChange: vi.fn(
        (cb: (event: string, session: Session | null) => void) => {
          authListeners.push(cb);
          queueMicrotask(() => cb("INITIAL_SESSION", initialSession));
          return {
            data: {
              subscription: {
                unsubscribe: vi.fn(() => {
                  const i = authListeners.indexOf(cb);
                  if (i >= 0) authListeners.splice(i, 1);
                }),
              },
            },
          };
        },
      ),
      signInWithPassword: vi.fn(
        async ({ email, password }: { email: string; password: string }) => {
          if (email === "user@test.com" && password === "user-password") {
            const next = { user: { id: "u-test-1", email: "user@test.com" } } as Session;
            authListeners.forEach((l) => l("SIGNED_IN", next));
            return { data: { user: next.user, session: next }, error: null };
          }
          if (email === "120032@sbsmc.workspace" && password === "120032") {
            const next = { user: { id: "u-admin-1", email: "120032@sbsmc.workspace" } } as Session;
            authListeners.forEach((l) => l("SIGNED_IN", next));
            return { data: { user: next.user, session: next }, error: null };
          }
          return {
            data: { user: null, session: null },
            error: { message: "Invalid login credentials" },
          };
        },
      ),
      signOut: vi.fn().mockImplementation(async () => {
        authListeners.forEach((l) => l("SIGNED_OUT", null));
        return { error: null };
      }),
    },
  };
}

function fillLogin(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("ID"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
}

describe("SbsmcWorkspaceRedesign fixed menu admin CRUD", () => {
  beforeEach(() => {
    const supabase = createMockSupabase(null);
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(supabase as any);

    vi.mocked(workspaceSiteRepository.fetchWorkspaceSiteRows).mockResolvedValue([companyRow] as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("일반 사용자는 고정 메뉴 추가/수정/삭제 버튼이 없다", async () => {
    vi.mocked(workspaceSiteRepository.insertCompanySite).mockResolvedValue();
    vi.mocked(workspaceSiteRepository.updateCompanySite).mockResolvedValue();
    vi.mocked(workspaceSiteRepository.deleteCompanySite).mockResolvedValue();

    render(<SbsmcWorkspaceRedesign />);

    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "+ 고정 메뉴 추가" })).toBeNull();
    });

    expect(screen.queryByLabelText("고정 메뉴 수정")).toBeNull();
    expect(screen.queryByLabelText("고정 메뉴 삭제")).toBeNull();
    expect(screen.getByText("LOCK")).toBeInTheDocument();
  });

  it("관리자(120032)는 고정 메뉴 추가/수정/삭제가 동작한다", async () => {
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    const insertSpy = vi.mocked(workspaceSiteRepository.insertCompanySite).mockResolvedValue();
    const updateSpy = vi.mocked(workspaceSiteRepository.updateCompanySite).mockResolvedValue();
    const deleteSpy = vi.mocked(workspaceSiteRepository.deleteCompanySite).mockResolvedValue();

    render(<SbsmcWorkspaceRedesign />);

    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("120032@sbsmc.workspace", "120032");

    const addButton = await waitFor(() => screen.getByRole("button", { name: "+ 고정 메뉴 추가" }));
    fireEvent.click(addButton);

    // add
    fireEvent.change(screen.getByPlaceholderText("제목"), {
      target: { value: "새 고정 메뉴" },
    });
    fireEvent.change(screen.getByPlaceholderText("도메인 (예: approval.company.co.kr)"), {
      target: { value: "new.approval.sbsmc.co.kr" },
    });
    fireEvent.change(screen.getByPlaceholderText("설명"), {
      target: { value: "설명" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(insertSpy).toHaveBeenCalled();
    });

    // edit
    const editBtn = await waitFor(() => screen.getByLabelText("고정 메뉴 수정"));
    fireEvent.click(editBtn);

    fireEvent.change(screen.getByPlaceholderText("제목"), {
      target: { value: "수정된 고정 메뉴" },
    });
    fireEvent.change(screen.getByPlaceholderText("도메인"), {
      target: { value: "edited.approval.sbsmc.co.kr" },
    });
    fireEvent.change(screen.getByPlaceholderText("설명"), {
      target: { value: "수정 설명" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });

    // delete
    const deleteBtn = await waitFor(() => screen.getByLabelText("고정 메뉴 삭제"));
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});

