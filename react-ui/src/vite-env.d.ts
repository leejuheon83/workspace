/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 사번만 입력 시 접미사 (예: sbsmc.workspace → 12345@sbsmc.workspace) */
  readonly VITE_LOGIN_EMAIL_DOMAIN?: string;
  /** 관리자 사번 목록 (콤마 구분). 비우면 120032 만 관리자 */
  readonly VITE_ADMIN_EMPLOYEE_IDS?: string;
  /**
   * (선택) 비밀번호를 모를 때 즉시 사번 초기화 — EHUB_PASSWORD_RESET_SECRET 과 동일. 없으면 현재 비밀번호가 사번일 때만 초기화 가능.
   */
  readonly VITE_EHUB_PASSWORD_RESET_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
