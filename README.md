# SurfDB

Visual database schema designer. Drag tables, connect relations, and export to Drizzle ORM, Prisma, or MongoDB.

## Features

- **Visual canvas** — drag-and-drop table editor powered by React Flow
- **Multi-dialect** — PostgreSQL, MySQL, SQLite, MongoDB
- **Export** — Drizzle ORM, Prisma, MongoDB models, JSON
- **Import** — parse existing Drizzle/Prisma/MongoDB schemas back into the visual editor
- **Templates** — auth, e-commerce, blog, SaaS, social, CRM starter schemas
- **Undo/redo** — full history with Zustand + Zundo
- **Auto-layout** — dagre-based graph arrangement
- **Keyboard shortcuts** —快速操作 without mouse
- **LocalStorage persistence** — schemas saved in browser, no backend required

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui (Radix) |
| Canvas | @xyflow/react + @dagrejs/dagre |
| State | Zustand + Zundo + localStorage |
| Linter | Biome |

## Project Structure

```
app/                        # Routes (thin shell)
modules/schema/             # Core module
  domain/                   # Pure business logic (entities, services)
  store/                    # Zustand stores (schema, UI, history)
  adapters/                 # Export/import converters
  config/                   # Field types, dialects, shortcuts
  templates/                # Pre-built schema templates
  hooks/                    # React hooks (UI ↔ store)
  ui/                       # Components (canvas, panels, sidebar, toolbar)
components/ui/              # shadcn components
```

## License

MIT
