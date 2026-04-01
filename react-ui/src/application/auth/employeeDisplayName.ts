/** `public/employee-directory.json` 파싱 결과 검증·정규화 */
export function parseEmployeeDirectoryJson(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    const id = k.trim();
    const name = v.trim();
    if (id && name) out[id] = name;
  }
  return out;
}

export function pickMetadataDisplayName(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  if (!metadata) return undefined;
  for (const key of ["full_name", "display_name", "name"] as const) {
    const v = metadata[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** 디렉터리 조회용 사번: 메타 `employee_id` 우선, 없으면 이메일 로컬파트 */
export function employeeIdForDirectoryLookup(
  emailLocalPart: string,
  metadata: Record<string, unknown> | undefined,
): string {
  const metaId = metadata?.employee_id;
  if (typeof metaId === "string" && metaId.trim()) return metaId.trim();
  return emailLocalPart.trim();
}

/**
 * 헤더 인사용 이름: 엑셀 기반 JSON → Supabase user_metadata 순
 */
export function resolveEmployeeGreetingName(
  directory: Record<string, string>,
  emailLocalPart: string,
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const id = employeeIdForDirectoryLookup(emailLocalPart, metadata);
  if (id && directory[id]) return directory[id];
  return pickMetadataDisplayName(metadata);
}
