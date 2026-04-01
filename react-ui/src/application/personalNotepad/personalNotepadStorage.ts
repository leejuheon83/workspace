const KEY_PREFIX = "ehub-sbsmc-personal-notepad:";

export function personalNotepadStorageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

/** 브라우저 localStorage 등 Storage 구현체에 사용자별 메모를 읽습니다. */
export function readPersonalNotepad(userId: string | null, storage: Storage): string {
  if (!userId) return "";
  try {
    return storage.getItem(personalNotepadStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

/** Storage에 사용자별 메모를 저장합니다. userId가 없으면 아무 것도 하지 않습니다. */
export function writePersonalNotepad(
  userId: string | null,
  text: string,
  storage: Storage,
): void {
  if (!userId) return;
  try {
    storage.setItem(personalNotepadStorageKey(userId), text);
  } catch {
    /* quota 등 — UI는 계속 동작 */
  }
}
