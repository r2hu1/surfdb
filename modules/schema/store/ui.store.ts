import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FieldType } from "../config/field-types";

export type SidebarTab = "tables" | "palette" | "reference";

export type SelectionTarget = "table" | "field" | "relation";

export interface ConnectSource {
  tableId: string;
  fieldId: string;
}

interface UIStore {
  selectedTableId: string | null;
  selectedFieldId: string | null;
  selectedRelationId: string | null;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  codePreviewOpen: boolean;
  exportDialogOpen: boolean;
  importDialogOpen: boolean;
  draggingFieldType: FieldType | null;
  connectFrom: ConnectSource | null;
  select: (target: SelectionTarget, id: string | null) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  openSettings: () => void;
  toggleCodePreview: () => void;
  setCodePreviewOpen: (open: boolean) => void;
  openExportDialog: (open: boolean) => void;
  openImportDialog: (open: boolean) => void;
  setDraggingFieldType: (type: FieldType | null) => void;
  setConnectFrom: (source: ConnectSource | null) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      selectedTableId: null,
      selectedFieldId: null,
      selectedRelationId: null,
      sidebarTab: "palette",
      sidebarOpen: true,
      propertiesPanelOpen: false,
      codePreviewOpen: false,
      exportDialogOpen: false,
      importDialogOpen: false,
      draggingFieldType: null,
      connectFrom: null,

      select: (target, id) =>
        set(() => {
          switch (target) {
            case "table":
              return {
                selectedTableId: id,
                selectedFieldId: null,
                selectedRelationId: null,
                connectFrom: null,
                propertiesPanelOpen: id !== null,
              };
            case "field":
              return {
                selectedFieldId: id,
                propertiesPanelOpen: id !== null,
              };
            case "relation":
              return {
                selectedRelationId: id,
                selectedTableId: null,
                selectedFieldId: null,
                connectFrom: null,
                propertiesPanelOpen: id !== null,
              };
          }
        }),

      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      togglePropertiesPanel: () =>
        set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),

      setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),

      openSettings: () =>
        set({
          selectedTableId: null,
          selectedFieldId: null,
          selectedRelationId: null,
          connectFrom: null,
          propertiesPanelOpen: true,
        }),

      toggleCodePreview: () =>
        set((state) => ({ codePreviewOpen: !state.codePreviewOpen })),

      setCodePreviewOpen: (open) => set({ codePreviewOpen: open }),

      openExportDialog: (open) => set({ exportDialogOpen: open }),

      openImportDialog: (open) => set({ importDialogOpen: open }),

      setDraggingFieldType: (type) => set({ draggingFieldType: type }),

      setConnectFrom: (source) => set({ connectFrom: source }),
    }),
    { name: "schema-ui-store" },
  ),
);
