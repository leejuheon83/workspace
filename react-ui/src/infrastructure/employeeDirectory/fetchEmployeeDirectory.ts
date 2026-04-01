import { parseEmployeeDirectoryJson } from "../../application/auth/employeeDisplayName";

/**
 * `public/employee-directory.json` 로드 (엑셀에서 생성한 사번→이름 맵).
 * 실패 시 빈 객체.
 */
export async function fetchEmployeeDirectory(): Promise<Record<string, string>> {
  try {
    const base = import.meta.env.BASE_URL;
    const prefix = base.endsWith("/") ? base : `${base}/`;
    const res = await fetch(`${prefix}employee-directory.json`);
    if (!res.ok) return {};
    const json: unknown = await res.json();
    return parseEmployeeDirectoryJson(json);
  } catch {
    return {};
  }
}
