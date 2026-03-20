import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type Props = {
  id: string;
  /** false면 드래그 비활성(정렬 불가·편집 중 등) */
  sortEnabled: boolean;
  className: string;
  children: (dragHandle: ReactNode) => ReactNode;
};

export function SortableItem({ id, sortEnabled, className, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : undefined,
    zIndex: isDragging ? 20 : undefined,
  } as const;

  const dragHandle =
    sortEnabled ? (
      <button
        type="button"
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#9aa0a6] transition hover:border-[#dadce0] hover:bg-[#f8f9fa] touch-none cursor-grab active:cursor-grabbing"
        aria-label="순서 변경"
        {...listeners}
        {...attributes}
      >
        <span className="select-none text-base leading-none tracking-tighter">⋮⋮</span>
      </button>
    ) : null;

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(dragHandle)}
    </div>
  );
}
