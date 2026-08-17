# Schema Builder — Production Architecture

## 1. Module Topology

```
src/
├── app/                              # Next.js app router (thin shell only)
│   ├── layout.tsx
│   └── schema/
│       └── page.tsx                  # Mounts <SchemaModule />
│
├── modules/
│   └── schema/                       # Feature module — self-contained
│       ├── index.ts                  # Public barrel (re-exports only)
│       │
│       ├── domain/                   # Pure business logic, zero UI deps
│       │   ├── entities/
│       │   │   ├── table.ts          # Table entity (id, name, fields, position)
│       │   │   ├── field.ts          # Field entity (type, constraints, defaults)
│       │   │   ├── relation.ts       # Relation entity (type, source, target)
│       │   │   └── index.ts          # barrel
│       │   ├── value-objects/
│       │   │   ├── field-type.ts     # FieldType enum + mapping logic
│       │   │   ├── constraint.ts     # Constraint types (PK, UQ, NN, FK, AI)
│       │   │   ├── relation-type.ts  # 1:1, 1:N, N:M
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   ├── schema.service.ts # Pure functions: addTable, addField, addRelation, validate
│       │   │   ├── layout.service.ts # Auto-layout (dagre wrapper)
│       │   │   └── index.ts
│       │   └── types.ts             # Shared domain types/interfaces
│       │
│       ├── store/                    # Zustand store — thin, delegates to domain
│       │   ├── schema.store.ts       # Main store (tables, relations, selection)
│       │   ├── ui.store.ts           # UI state (sidebar open, panel tab, zoom)
│       │   ├── history.plugin.ts     # Undo/redo middleware
│       │   ├── persistence.plugin.ts # localStorage serialization
│       │   └── selectors.ts          # Derived state selectors
│       │
│       ├── adapters/                 # External format converters
│       │   ├── drizzle/
│       │   │   ├── adapter.ts        # Schema → Drizzle code string
│       │   │   ├── inverse.ts        # Drizzle code → Schema (import)
│       │   │   └── types.ts          # Drizzle-specific type maps
│       │   ├── prisma/
│       │   │   ├── adapter.ts
│       │   │   ├── inverse.ts
│       │   │   └── types.ts
│       │   ├── mongodb/
│       │   │   ├── adapter.ts
│       │   │   ├── inverse.ts
│       │   │   └── types.ts
│       │   ├── json/
│       │   │   └── adapter.ts        # Schema ↔ JSON (save/load)
│       │   └── index.ts              # Export registry
│       │
│       ├── templates/                # Pre-built schemas
│       │   ├── auth.ts
│       │   ├── ecommerce.ts
│       │   ├── blog.ts
│       │   └── index.ts
│       │
│       ├── ui/                       # Presentation layer (all React)
│       │   ├── canvas/
│       │   │   ├── schema-canvas.tsx     # React Flow wrapper
│       │   │   ├── table-node.tsx        # Custom node
│       │   │   ├── field-row.tsx         # Row inside table node
│       │   │   ├── relation-edge.tsx     # Custom edge
│       │   │   ├── connection-line.tsx   # Drag-to-connect line
│       │   │   ├── canvas-controls.tsx   # Zoom, fit, minimap
│       │   │   ├── node-types.ts         # Registry object
│       │   │   └── edge-types.ts         # Registry object
│       │   │
│       │   ├── panels/
│       │   │   ├── properties-panel.tsx  # Right panel shell (Tabs)
│       │   │   ├── field-editor.tsx      # Field property form
│       │   │   ├── table-editor.tsx      # Table property form
│       │   │   ├── relation-editor.tsx   # Relation property form
│       │   │   └── schema-settings.tsx   # Global schema settings
│       │   │
│       │   ├── sidebar/
│       │   │   ├── sidebar.tsx           # Left sidebar shell
│       │   │   ├── field-palette.tsx     # Draggable field type list
│       │   │   ├── type-reference.tsx    # Quick type cheat sheet
│       │   │   └── table-list.tsx        # List of all tables
│       │   │
│       │   ├── toolbar/
│       │   │   ├── schema-toolbar.tsx    # Top bar
│       │   │   ├── export-dialog.tsx     # Export modal
│       │   │   └── import-dialog.tsx     # Import modal
│       │   │
│       │   ├── preview/
│       │   │   ├── code-preview.tsx      # Collapsible code panel
│       │   │   ├── syntax-highlight.tsx  # Highlight.js wrapper
│       │   │   └── copy-button.tsx       # Copy to clipboard
│       │   │
│       │   ├── shared/
│       │   │   ├── drag-overlay.tsx      # Global drag preview
│       │   │   ├── empty-state.tsx       # No tables yet
│       │   │   └── keyboard-hints.tsx    # Shortcut display
│       │   │
│       │   └── schema-builder.tsx        # Root composition component
│       │
│       ├── hooks/                    # React hooks (UI ↔ store bridge)
│       │   ├── use-schema.ts         # Table/field/relation CRUD
│       │   ├── use-selection.ts      # Selected item state
│       │   ├── use-export.ts         # Export trigger + format selection
│       │   ├── use-import.ts         # Import trigger + parsing
│       │   ├── use-drag-palette.ts   # Palette drag source logic
│       │   ├── use-keyboard.ts       # Keyboard shortcuts
│       │   └── use-canvas-sync.ts    # React Flow ↔ store sync
│       │
│       └── config/                   # Constants, feature flags
│           ├── field-types.ts        # Supported field types per DB
│           ├── db-dialects.ts        # PostgreSQL, MySQL, SQLite, MongoDB
│           ├── shortcuts.ts          # Keyboard shortcut map
│           └── defaults.ts           # Default table/field values
│
├── shared/                           # Cross-module (if more modules later)
│   ├── lib/
│   │   └── utils.ts                  # cn(), format helpers
│   └── components/
│       └── ui/                       # Existing shadcn components (unchanged)
│
└── lib/                              # Keep for Next.js compatibility
    └── utils.ts                      # cn() export
```

---

## 2. Dependency Rules

```
app/page.tsx
    ↓ imports
modules/schema/index.ts              # Public barrel only
    ↓ imports
modules/schema/ui/schema-builder.tsx  # Root UI
    ↓ imports
modules/schema/hooks/*.ts            # Hooks
    ↓ imports
modules/schema/store/*.ts            # Zustand stores
    ↓ imports
modules/schema/domain/**             # Pure logic, no React
    ↓ imports
modules/schema/config/*.ts           # Constants
```

**Hard rules:**
- `domain/` imports nothing from `ui/`, `hooks/`, or `store/`
- `store/` imports only from `domain/` and `config/`
- `ui/` imports from `hooks/`, `store/`, and `shared/components/ui/`
- `hooks/` imports from `store/` and `domain/`
- `adapters/` imports only from `domain/types`
- No circular deps. Enforce with `biome.json` or `eslint-plugin-import`

---

## 3. Domain Layer — Entities & Types

### `domain/types.ts`
```ts
export type DatabaseDialect = "postgresql" | "mysql" | "sqlite" | "mongodb"

export interface SchemaProject {
  id: string
  name: string
  dialect: DatabaseDialect
  tables: Table[]
  relations: Relation[]
  createdAt: number
  updatedAt: number
}

export interface Table {
  id: string
  name: string
  schema?: string              // PostgreSQL schema
  comment?: string
  position: { x: number; y: number }
  fields: Field[]
  indexes: Index[]
}

export interface Field {
  id: string
  name: string
  type: FieldType
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  isArray: boolean
  comment?: string
  enumValues?: string[]        // For enum types
}

export interface Relation {
  id: string
  name?: string
  type: RelationType          // "1:1" | "1:N" | "N:M"
  sourceTableId: string
  sourceFieldId: string
  targetTableId: string
  targetFieldId: string
  onDelete?: "cascade" | "restrict" | "set null" | "no action"
  onUpdate?: "cascade" | "restrict" | "set null" | "no action"
}

export interface Index {
  id: string
  name: string
  fields: string[]             // field IDs
  unique: boolean
  type?: "btree" | "hash" | "gin" | "gist"
}

export type FieldType =
  | "string" | "text" | "varchar"
  | "integer" | "bigint" | "smallint"
  | "float" | "double" | "decimal"
  | "boolean"
  | "date" | "datetime" | "timestamp" | "time"
  | "json" | "jsonb"
  | "uuid"
  | "binary" | "blob"
  | "enum"
  | "reference"               // Virtual — resolved at export time
```

### `domain/value-objects/field-type.ts`
```ts
// Maps FieldType → dialect-specific type string
// Maps dialect-specific type string → FieldType (for import)
// Returns available types per dialect
export function getTypesForDialect(dialect: DatabaseDialect): FieldType[]
export function toDialectType(field: Field, dialect: DatabaseDialect): string
export function fromDialectType(typeStr: string, dialect: DatabaseDialect): FieldType
```

### `domain/services/schema.service.ts`
```ts
// Pure functions — no side effects, no React
export function createTable(name: string, position: { x: number; y: number }): Table
export function createField(name: string, type: FieldType): Field
export function createRelation(params: CreateRelationParams): Relation | JunctionResult
export function validateTableName(name: string, existing: Table[]): ValidationResult
export function validateFieldName(name: string, existing: Field[]): ValidationResult
export function addTable(project: SchemaProject, table: Table): SchemaProject
export function addField(project: SchemaProject, tableId: string, field: Field): SchemaProject
export function deleteTable(project: SchemaProject, tableId: string): SchemaProject
export function deleteField(project: SchemaProject, tableId: string, fieldId: string): SchemaProject
export function reorderFields(project: SchemaProject, tableId: string, fieldIds: string[]): SchemaProject
export function autoLayout(project: SchemaProject): SchemaProject  // dagre wrapper
```

---

## 4. Store Layer — Zustand

### `store/schema.store.ts`
```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import { temporal } from "zundo"            // Undo/redo middleware

interface SchemaStore {
  project: SchemaProject
  // Delegate to domain service functions
  addTable: (table: Table) => void
  addField: (tableId: string, field: Field) => void
  deleteTable: (tableId: string) => void
  deleteField: (tableId: string, fieldId: string) => void
  updateTable: (tableId: string, patch: Partial<Table>) => void
  updateField: (tableId: string, fieldId: string, patch: Partial<Field>) => void
  addRelation: (relation: Relation) => void
  deleteRelation: (relationId: string) => void
  setDialect: (dialect: DatabaseDialect) => void
  loadProject: (project: SchemaProject) => void
}

// Middleware stack: devtools → temporal (undo) → persist (localStorage)
export const useSchemaStore = create<SchemaStore>()(
  devtools(
    temporal(
      persist(/* ... */, { name: "schema-builder" }),
      { limit: 100 }
    )
  )
)
```

### `store/ui.store.ts`
```ts
interface UIStore {
  selectedTableId: string | null
  selectedFieldId: string | null
  selectedRelationId: string | null
  sidebarTab: "tables" | "palette" | "reference"
  propertiesPanelOpen: boolean
  codePreviewOpen: boolean
  exportDialogOpen: boolean
  importDialogOpen: boolean
  connectMode: boolean         // Click-to-connect state
  connectSource: { tableId: string; fieldId: string } | null
  select: (type: "table" | "field" | "relation", id: string | null) => void
  toggleSidebar: () => void
  toggleCodePreview: () => void
  startConnect: (source: { tableId: string; fieldId: string }) => void
  cancelConnect: () => void
}
```

---

## 5. Adapter Layer — Export/Import

Each adapter implements the same interface:

### `adapters/adapter.interface.ts`
```ts
export interface SchemaAdapter {
  name: string
  extension: string
  mimeType: string
  export(project: SchemaProject): string
  import(code: string): SchemaProject
}
```

### Adapter registry
```ts
// adapters/index.ts
import { drizzleAdapter } from "./drizzle/adapter"
import { prismaAdapter } from "./prisma/adapter"
import { mongodbAdapter } from "./mongodb/adapter"
import { jsonAdapter } from "./json/adapter"

export const adapters = {
  drizzle: drizzleAdapter,
  prisma: prismaAdapter,
  mongodb: mongodbAdapter,
  json: jsonAdapter,
} as const

export type AdapterKey = keyof typeof adapters
```

### `adapters/drizzle/adapter.ts` (example)
```ts
// export: SchemaProject → TypeScript string
// Import map: dialect → drizzle-orm package path
// Handles: pgTable, mysqlTable, sqliteTable, etc.
// Handles: varchar, integer, boolean, timestamp, etc.
// Handles: primaryKey(), unique(), references(), etc.
```

---

## 6. UI Layer — Component Contracts

### `ui/schema-builder.tsx` — Root composition
```tsx
// Composes the full layout:
// Toolbar | Sidebar | Canvas | Properties Panel | Code Preview
// Handles keyboard shortcuts via useKeyboard()
// Handles drag overlay via DragOverlay
// Manages responsive layout (Sheet on mobile)
```

### `ui/canvas/schema-canvas.tsx`
```tsx
// React Flow wrapper
// Props: none (reads from store via hooks)
// Registers nodeTypes, edgeTypes
// Syncs nodes/edges ↔ store via useCanvasSync()
// Handles onConnect, onNodesChange, onEdgesChange
// Renders: Background, MiniMap, Controls, DragOverlay
```

### `ui/canvas/table-node.tsx`
```tsx
// ReactFlow custom node
// Props: NodeProps<TableNodeData>
// Renders: Card with header (icon + name), field list, add button
// Ports: Handle components at top/bottom for connections
// Selection: highlighted ring when selected
// Context menu: rename, duplicate, delete
```

### `ui/panels/properties-panel.tsx`
```tsx
// Right panel shell
// Tabs: Field | Table | Relation | Settings
// Shows selected item's editor based on UI store state
// Collapsible when nothing selected
```

### `ui/preview/code-preview.tsx`
```tsx
// Collapsible bottom panel
// Tabs per adapter (Drizzle, Prisma, MongoDB)
// Auto-updates when schema changes
// Copy button + download button
```

---

## 7. Hook Layer — UI ↔ Store Bridge

### `hooks/use-schema.ts`
```ts
// Wraps store actions with convenience
export function useSchema() {
  const { project, addTable, addField, ... } = useSchemaStore()
  return {
    project,
    addTable: (name: string) => addTable(createTable(name, randomPosition())),
    addField: (tableId: string, name: string, type: FieldType) => addField(tableId, createField(name, type)),
    deleteTable: (id: string) => deleteTable(id),
    deleteField: (tableId: string, fieldId: string) => deleteField(tableId, fieldId),
    getTable: (id: string) => project.tables.find(t => t.id === id),
    getField: (tableId: string, fieldId: string) => ...,
  }
}
```

### `hooks/use-canvas-sync.ts`
```ts
// Converts store tables → React Flow nodes
// Converts store relations → React Flow edges
// Handles position changes → store.updateTable({ position })
// Handles connection creation → store.addRelation()
// Debounces position updates for performance
```

### `hooks/use-keyboard.ts`
```ts
// Registers global keyboard shortcuts
// Del → delete selected
// Ctrl+Z → undo
// Ctrl+Shift+Z → redo
// Ctrl+S → export dialog
// Ctrl+E → toggle code preview
// Ctrl+N → add table
// Escape → deselect / cancel connect
```

---

## 8. Config Layer

### `config/field-types.ts`
```ts
export const FIELD_TYPES: Record<DatabaseDialect, FieldTypeConfig[]> = {
  postgresql: [
    { type: "string",    label: "varchar",    drizzle: "varchar",   prisma: "String" },
    { type: "text",      label: "text",       drizzle: "text",      prisma: "String" },
    { type: "integer",   label: "integer",    drizzle: "integer",   prisma: "Int" },
    { type: "bigint",    label: "bigint",     drizzle: "bigint",    prisma: "BigInt" },
    { type: "boolean",   label: "boolean",    drizzle: "boolean",   prisma: "Boolean" },
    { type: "timestamp", label: "timestamp",  drizzle: "timestamp", prisma: "DateTime" },
    { type: "json",      label: "jsonb",      drizzle: "jsonb",     prisma: "Json" },
    { type: "uuid",      label: "uuid",       drizzle: "uuid",      prisma: "String" },
    // ...
  ],
  mysql: [ /* ... */ ],
  sqlite: [ /* ... */ ],
  mongodb: [ /* ... */ ],
}
```

---

## 9. Implementation Order

| Step | Module | Files | Depends On |
|------|--------|-------|------------|
| 1 | Setup | Install deps, create directory structure | — |
| 2 | `config/` | All config files | — |
| 3 | `domain/types` | `types.ts`, `value-objects/*` | — |
| 4 | `domain/services` | `schema.service.ts` | `domain/types` |
| 5 | `store/` | `schema.store.ts`, `ui.store.ts`, selectors | `domain/` |
| 6 | `adapters/json` | Save/load | `domain/types` |
| 7 | `ui/canvas` | `schema-canvas.tsx`, `table-node.tsx`, `field-row.tsx` | `store/`, `hooks/` |
| 8 | `hooks/use-canvas-sync` | Node/edge ↔ store sync | `store/`, `domain/` |
| 9 | `ui/canvas` | `relation-edge.tsx`, `connection-line.tsx` | Step 7 |
| 10 | `domain/services` | `layout.service.ts` (dagre) | `domain/types` |
| 11 | `ui/panels` | All property editors | `store/`, `hooks/` |
| 12 | `ui/sidebar` | Sidebar, palette, table list | `hooks/` |
| 13 | `ui/toolbar` | Toolbar, export dialog | `adapters/`, `hooks/` |
| 14 | `adapters/drizzle` | Drizzle adapter | `domain/types`, `config/` |
| 15 | `adapters/prisma` | Prisma adapter | `domain/types`, `config/` |
| 16 | `adapters/mongodb` | MongoDB adapter | `domain/types`, `config/` |
| 17 | `hooks/use-keyboard` | Keyboard shortcuts | `store/` |
| 18 | `hooks/use-import` | Import logic | `adapters/` |
| 19 | `ui/preview` | Code preview panel | `adapters/` |
| 20 | `templates/` | Pre-built schemas | `domain/types` |
| 21 | `ui/schema-builder` | Root composition | All above |
| 22 | `app/schema/page.tsx` | Route page | `modules/schema/index` |
| 23 | Polish | Animations, responsive, final QA | All |

---

## 10. Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case` | `schema.service.ts`, `table-node.tsx` |
| Components | `PascalCase` | `SchemaCanvas`, `TableNode`, `FieldRow` |
| Hooks | `use-` prefix | `useSchema`, `useSelection`, `useCanvasSync` |
| Store | `use*Store` | `useSchemaStore`, `useUIStore` |
| Types | `PascalCase` | `Table`, `Field`, `Relation`, `FieldType` |
| Functions | `camelCase` | `createTable()`, `validateFieldName()` |
| Constants | `UPPER_SNAKE` | `FIELD_TYPES`, `DEFAULT_TABLE` |
| Barrel exports | `index.ts` | One per directory, re-exports public API only |
