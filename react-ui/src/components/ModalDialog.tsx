import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalDialogProps = {
  open: boolean;
  onClose: () => void;
  /** `aria-labelledby` — 자식 안에 동일 id를 가진 제목 요소가 있어야 합니다. */
  titleId: string;
  children: ReactNode;
};

/**
 * 화면 중앙 오버레이 다이얼로그. Esc·배경 클릭·닫기 버튼으로 닫습니다.
 */
export default function ModalDialog({ open, onClose, titleId, children }: ModalDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[min(90vh,calc(100dvh-2rem))] w-full max-w-[min(100%,420px)] overflow-y-auto rounded-[20px] border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-black/[0.06] hover:text-[#202124] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ws-accent,#5fb3a2)]/35"
          aria-label="닫기"
          onClick={onClose}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            ×
          </span>
        </button>
        <div className="p-4 pt-11 sm:p-5 sm:pt-12">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
