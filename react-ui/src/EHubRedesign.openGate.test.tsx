import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  updatePersonalFavorite: vi.fn(),
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
            const next = {
              user: { id: "u-test-1", email: "user@test.com" },
            } as Session;
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
    _authListeners: authListeners,
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

describe("login gate", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase(null) as ReturnType<typeof getSupabaseBrowserClient>,
    );
    vi.mocked(workspaceSiteRepository.fetchWorkspaceSiteRows).mockImplementation(
      async (_client, userId) => {
        if (!userId) return [companyRow];
        return [companyRow];
      },
    );
  });

  it("로그인 전에는 열기 클릭해도 window.open 호출하지 않는다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const openSpy = vi.fn();
    window.open = openSpy as unknown as typeof window.open;

    render(<EHubRedesign />);

    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    const openButtons = screen.getAllByRole("button", { name: "열기" });
    expect(openButtons.length).toBeGreaterThan(0);
    openButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    const openButton = screen.getByTestId("open-company-mock-1");
    fireEvent.click(openButton);

    expect(openSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("로그인 후에는 열기 클릭 시 window.open 호출한다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const openSpy = vi.fn();
    window.open = openSpy as unknown as typeof window.open;

    render(<EHubRedesign />);

    await waitFor(() => {
      expect(workspaceSiteRepository.fetchWorkspaceSiteRows).toHaveBeenCalled();
    });

    fillLogin("user@test.com", "user-password");

    const openButton = await waitFor(() => {
      const btn = screen.getByTestId("open-company-mock-1");
      expect(btn).not.toBeDisabled();
      return btn;
    });

    fireEvent.click(openButton);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      "https://approval.sbsmc.co.kr",
      "_blank",
      "noopener,noreferrer",
    );

    alertSpy.mockRestore();
  });
});
