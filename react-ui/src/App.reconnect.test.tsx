import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
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
  description: "#전사",
  category: "회사 고정",
  site_kind: "company" as const,
  favorite: false,
  user_id: null,
  sort_order: 0,
  created_at: "2025-01-01T00:00:00Z",
};

const personalRow = {
  id: "personal-mock-1",
  title: "내 링크",
  domain: "my.example.com",
  description: "#개인",
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
          if (email === "120032@sbsmc.workspace" && password === "120032") {
            const next = { user: { id: "u-admin-1", email } } as Session;
            authListeners.forEach((l) => l("SIGNED_IN", next));
            return { data: { user: next.user, session: next }, error: null };
          }
          if (email === "111111@sbsmc.workspace" && password === "111111") {
            const next = { user: { id: "u-test-1", email } } as Session;
            authListeners.forEach((l) => l("SIGNED_IN", next));
            return { data: { user: next.user, session: next }, error: null };
          }
          return { data: { user: null, session: null }, error: { message: "Invalid" } };
        },
      ),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("App reconnected runtime behaviors", () => {
  beforeEach(() => {
    vi.mocked(workspaceSiteRepository.fetchWorkspaceSiteRows).mockImplementation(async (_c, userId) => {
      return userId ? ([companyRow, personalRow] as any) : ([companyRow] as any);
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("관리자 로그인 후 고정 메뉴 추가 저장 시 insertCompanySite 호출", async () => {
    vi.mocked(workspaceSiteRepository.insertCompanySite).mockResolvedValue();
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase({ user: { id: "u-admin-1", email: "120032@sbsmc.workspace" } } as Session) as any,
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "+ 고정 메뉴 추가" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "+ 고정 메뉴 추가" }));
    fireEvent.change(screen.getByPlaceholderText("제목"), { target: { value: "새 고정" } });
    fireEvent.change(screen.getByPlaceholderText("도메인"), { target: { value: "new.example.com" } });
    fireEvent.change(screen.getByPlaceholderText("설명"), { target: { value: "#태그" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(workspaceSiteRepository.insertCompanySite).toHaveBeenCalled();
    });
  });

  it("일반 로그인 후 새 링크 추가 저장 시 insertPersonalSite 호출", async () => {
    vi.mocked(workspaceSiteRepository.insertPersonalSite).mockResolvedValue();
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase({ user: { id: "u-test-1", email: "111111@sbsmc.workspace" } } as Session) as any,
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "+ 새 링크 추가" })).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "+ 새 링크 추가" }));
    fireEvent.change(screen.getByPlaceholderText("제목"), { target: { value: "새 링크" } });
    fireEvent.change(screen.getByPlaceholderText("도메인"), { target: { value: "my.new.com" } });
    fireEvent.change(screen.getByPlaceholderText("설명"), { target: { value: "#개인" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(workspaceSiteRepository.insertPersonalSite).toHaveBeenCalledWith(
        expect.anything(),
        "u-test-1",
        expect.objectContaining({ title: "새 링크", domain: "my.new.com" }),
      );
    });
  });

  it("관리자가 Company 영역 메뉴 추가 카드를 누르면 고정 메뉴 추가 모달이 열린다", async () => {
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase({ user: { id: "u-admin-1", email: "120032@sbsmc.workspace" } } as Session) as any,
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "고정 메뉴 추가 (카드)" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "고정 메뉴 추가 (카드)" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("고정 메뉴 추가")).toBeInTheDocument();
  });

  it("일반 로그인 후 My Workspace 메뉴 추가 카드를 누르면 개인 링크 추가 모달이 열린다", async () => {
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase({ user: { id: "u-test-1", email: "111111@sbsmc.workspace" } } as Session) as any,
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "개인 링크 추가 (카드)" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "개인 링크 추가 (카드)" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("개인 링크 추가")).toBeInTheDocument();
  });

  it("메모장 열기 버튼 클릭 시 개인 메모장이 토글된다", async () => {
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(
      createMockSupabase({ user: { id: "u-test-1", email: "111111@sbsmc.workspace" } } as Session) as any,
    );
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "+ 메모장 열기" })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "+ 메모장 열기" }));
    expect(screen.getByLabelText("개인 메모 입력")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "메모장 닫기" }));
    await waitFor(() => {
      expect(screen.queryByLabelText("개인 메모 입력")).toBeNull();
    });
  });
});

