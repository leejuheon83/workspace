import { useCallback, useEffect, useRef, useState } from "react";
import {
  readPersonalNotepad,
  writePersonalNotepad,
} from "../application/personalNotepad/personalNotepadStorage";

const MAX_LEN = 8000;
const SAVE_DEBOUNCE_MS = 400;

export type PersonalNotepadPanelProps = {
  userId: string | null;
};

/**
 * 오른쪽 사이드용 개인 메모장. 로그인 사용자별로 localStorage에만 저장됩니다.
 */
export default function PersonalNotepadPanel({ userId }: PersonalNotepadPanelProps) {
  const [text, setText] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId) {
      setText("");
      return;
    }
    setText(readPersonalNotepad(userId, window.localStorage));
  }, [userId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const flushSave = useCallback(
    (value: string) => {
      if (!userId || typeof window === "undefined") return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      writePersonalNotepad(userId, value, window.localStorage);
    },
    [userId],
  );

  const scheduleSave = useCallback(
    (value: string) => {
      if (!userId || typeof window === "undefined") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        writePersonalNotepad(userId, value, window.localStorage);
        saveTimerRef.current = null;
      }, SAVE_DEBOUNCE_MS);
    },
    [userId],
  );

  const onChange = (v: string) => {
    const clipped = v.length > MAX_LEN ? v.slice(0, MAX_LEN) : v;
    setText(clipped);
    scheduleSave(clipped);
  };

  return (
    <section
      className="rounded-[24px] border border-[#DDE7F3] bg-white/90 p-5 shadow-[0_12px_40px_rgba(31,41,55,0.06)] backdrop-blur"
      aria-labelledby="personal-notepad-heading"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="personal-notepad-heading"
          className="text-sm font-semibold tracking-tight text-slate-800"
        >
          개인 메모장
        </h2>
        <span className="text-[11px] font-medium text-slate-400">
          {userId ? `이 기기에만 저장` : "로그인 필요"}
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        회의 메모·할 일을 임시로 적어 두세요. 브라우저에만 저장되며 서버로 전송되지 않습니다.
      </p>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => flushSave(text)}
        disabled={!userId}
        rows={14}
        maxLength={MAX_LEN}
        placeholder={
          userId
            ? "메모를 입력하세요…"
            : "로그인 후 메모를 작성할 수 있습니다."
        }
        aria-label="개인 메모 입력"
        className="min-h-[220px] w-full resize-y rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-[#5D8FD8] focus:outline-none focus:ring-2 focus:ring-[#5D8FD8]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
      {userId ? (
        <div className="mt-2 flex justify-end text-[11px] text-slate-400">
          {text.length} / {MAX_LEN}
        </div>
      ) : null}
    </section>
  );
}
