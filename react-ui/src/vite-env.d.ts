/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 사번만 입력 시 접미사 (예: sbsmc.workspace → 12345@sbsmc.workspace) */
  readonly VITE_LOGIN_EMAIL_DOMAIN?: string;
  /** 관리자 사번 목록 (콤마 구분). 비우면 120032 만 관리자 */
  readonly VITE_ADMIN_EMPLOYEE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
