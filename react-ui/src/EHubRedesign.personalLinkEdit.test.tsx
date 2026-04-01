import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EHubRedesign from "./EHubRedesign";
import { getSupabaseBrowserClient } from "./infrastructure/supabase";
import * as workspaceSiteRepository from "./infrastructure/supabase/workspaceSiteRepository";

vi.mock("./infrastructure/supabase", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

vi.mock("./infrastructure/supabase/workspaceSiteRepository", () => ({
  fetchWorkspaceSiteRows: vi.fn(),
  insertPersonalSite: vi.fn(),
  insertCompanySite: vi.fn(),
  updateCompanySite: vi.fn(),
  deleteCompanySite: vi.fn(),
  applyCompanySitesSortOrder: vi.fn(),
  applyPersonalSitesSortOrder: vi.fn(),
  updatePersonalFavorite: vi.fn(),
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
  description: "#업무",
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
      onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
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
      }),
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
  fireEvent.change(screen.getByPlaceholderText("사번"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
}

describe("EHubRedesign My Workspace personal edit/delete", () => {
  beforeEach(() => {
    const supabase = createMockSupabase(null);
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(supabase as any);
    vi.mocked(workspaceSiteRepository.fetchWorkspaceSiteRows).mockImplementation(
      async (_client, userId) => {
        if (!userId) return [companyRow] as any;
        return [companyRow, personalRow] as any;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("로그인 후 My Workspace 카드에 내 링크 수정·삭제가 있다", async () => {
    render(<EHubRedesign />);
    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    await waitFor(() => {
      expect(screen.getByLabelText("내 링크 수정")).toBeInTheDocument();
      expect(screen.getByLabelText("내 링크 삭제")).toBeInTheDocument();
    });
  });

  it("내 링크 수정 저장 시 updatePersonalSite 호출", async () => {
    vi.mocked(workspaceSiteRepository.updatePersonalSite).mockResolvedValue();

    render(<EHubRedesign />);
    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    const editBtn = await screen.findByLabelText("내 링크 수정");
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText("개인 링크 수정")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("내 즐겨찾기"), {
      target: { value: "수정된 제목" },
    });

    const form = screen.getByText("개인 링크 수정").closest("form");
    expect(form).toBeTruthy();
    fireEvent.click(within(form as HTMLFormElement).getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(workspaceSiteRepository.updatePersonalSite).toHaveBeenCalledWith(
        expect.anything(),
        "u-test-1",
        "personal-mock-1",
        expect.objectContaining({
          title: "수정된 제목",
          domain: "my.example.com",
          description: "#업무",
          category: "개인",
        }),
      );
    });
  });
});
