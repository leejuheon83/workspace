import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SupabaseEnvMissingNotice from "./SupabaseEnvMissingNotice";

describe("SupabaseEnvMissingNotice", () => {
  afterEach(() => cleanup());

  it("환경 변수 및 도메인 안내 문구를 보여준다", () => {
    render(<SupabaseEnvMissingNotice />);
    expect(screen.getByRole("heading", { name: /Supabase 환경 변수가 필요합니다/ })).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/)).toBeInTheDocument();
    expect(screen.getByText(/예전 도메인과 주소가 다르면/)).toBeInTheDocument();
  });
});
