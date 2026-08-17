import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, Boxes, Star } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="flex flex-col gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Boxes className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">SurfDB</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Visual database schema designer. Drag tables, connect relations, and
          export to Drizzle ORM, Prisma, or MongoDB.
        </p>
        <div className="flex gap-2 mt-2">
          <Link
            href="https://github.com/r2hu1/surfdb"
            className={buttonVariants({
              size: "lg",
              variant: "secondary",
              className: "rounded-full",
            })}
          >
            Github <Star />
          </Link>
          <Link
            href="/builder"
            className={buttonVariants({
              size: "lg",
              className: "rounded-full",
            })}
          >
            Open Schema Designer <ArrowUpRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
