import { type SelectionTarget, useUIStore } from "../store/ui.store";

export function useSelection() {
  const { selectedTableId, selectedFieldId, selectedRelationId, select } =
    useUIStore();

  return {
    selectedTableId,
    selectedFieldId,
    selectedRelationId,
    select: (target: SelectionTarget, id: string | null) => select(target, id),
    clearSelection: () => select("table", null),
  };
}
