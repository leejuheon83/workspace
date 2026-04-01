import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SbsmcWorkspaceRedesign from "./SbsmcWorkspaceRedesign";
import { getSupabaseBrowserClient } from "./infrastructure/supabase";
import * as workspaceSiteRepository from "./infrastructure/supabase/workspaceSiteRepository";

vi.mock("./infrastructure/supabase", () => ({
  getSupabaseBrowserClient: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
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
  description: "전사 공통",
  category: "회사 고정",
  site_kind: "company" as const,
  favorite: false,
  user_id: null,
  sort_order: 0,
  created_at: "2025-01-01T00:00:00Z",
};

const personalRow = {
  id: "personal-mock-1",
  title: "내 즐겨찾기",
  domain: "my.example.com",
  description: "#업무 #링크",
  category: "개인",
  site_kind: "personal" as const,
  favorite: false,
  user_id: "u-test-1",
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

describe("SbsmcWorkspaceRedesign My Workspace personal links", () => {
  beforeEach(() => {
    const supabase = createMockSupabase(null);
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(supabase as any);
    vi.mocked(workspaceSiteRepository.fetchWorkspaceSiteRows).mockResolvedValue([
      companyRow,
      personalRow,
    ] as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("로그인 후 My Workspace 카드에 수정·삭제가 보인다", async () => {
    render(<SbsmcWorkspaceRedesign />);
    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    await waitFor(() => {
      expect(screen.getByLabelText("내 링크 수정")).toBeInTheDocument();
      expect(screen.getByLabelText("내 링크 삭제")).toBeInTheDocument();
    });
  });

  it("새 링크 추가 시 insertPersonalSite 호출", async () => {
    vi.mocked(workspaceSiteRepository.insertPersonalSite).mockResolvedValue();

    render(<SbsmcWorkspaceRedesign />);
    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    fireEvent.click(await screen.findByRole("button", { name: "+ 새 링크 추가" }));

    fireEvent.change(screen.getByPlaceholderText("제목"), {
      target: { value: "새 개인 링크" },
    });
    fireEvent.change(screen.getByPlaceholderText("도메인 (예: app.example.com)"), {
      target: { value: "new.example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("설명 (#태그 가능)"), {
      target: { value: "#태그" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(workspaceSiteRepository.insertPersonalSite).toHaveBeenCalledWith(
        expect.anything(),
        "u-test-1",
        expect.objectContaining({
          title: "새 개인 링크",
          domain: "new.example.com",
          description: "#태그",
          category: "개인",
        }),
      );
    });
  });
});
