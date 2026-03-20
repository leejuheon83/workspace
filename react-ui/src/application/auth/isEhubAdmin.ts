import type { User } from "@supabase/supabase-js";

const DEFAULT_ADMIN_EMPLOYEE_IDS = ["120032"];

/** 콤마 구분. 비우면 기본 관리자 사번 120032 만 사용. */
export function parseAdminEmployeeIdsFromEnv(
  envValue: string | undefined,
): string[] {
  const raw = envValue?.trim();
  if (!raw) return [...DEFAULT_ADMIN_EMPLOYEE_IDS];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function adminIdSet(): Set<string> {
  return new Set(parseAdminEmployeeIdsFromEnv(import.meta.env.VITE_ADMIN_EMPLOYEE_IDS));
}

function emailLocalPart(email: string | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[0]?.trim() ?? null;
}

/**
 * 관리자: (1) 사번이 관리자 목록에 포함 (이메일 @ 앞 또는 user_metadata.employee_id)
 * (2) 또는 app/user metadata ehub_admin 플래그
 */
export function isEhubAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const app = user.app_metadata as Record<string, unknown> | undefined;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (truthyFlag(app?.ehub_admin) || truthyFlag(meta?.ehub_admin)) return true;

  const admins = adminIdSet();
  const local = emailLocalPart(user.email);
  if (local && admins.has(local)) return true;

  const emp = meta?.employee_id;
  if (typeof emp === "string" && admins.has(emp)) return true;
  if (typeof emp === "number" && admins.has(String(emp))) return true;

  return false;
}

function truthyFlag(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}
