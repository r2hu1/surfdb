import { Boxes } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Boxes className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">SurfDB</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Visual database schema designer. Drag tables, connect relations, and
          export to Drizzle ORM, Prisma, or MongoDB.
        </p>
      </div>
      <Link
        href="/schema"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
      >
        Open Schema Designer
      </Link>
    </div>
  );
}
