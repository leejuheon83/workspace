/**
 * Reorder a list by moving `activeId` to the index of `overId` (arrayMove semantics).
 */
export function reorderSiteIds(ids: readonly string[], activeId: string, overId: string): string[] {
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return [...ids];
  }
  const next = [...ids];
  const [removed] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, removed);
  return next;
}
