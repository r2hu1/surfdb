import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowUpRight,
  Box2Newicons as Boxes,
  Database,
  Star,
} from "reicon-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SurfDB",
  description:
    "Visual database schema designer. Drag tables, connect relations, and export to Drizzle ORM, Prisma, or MongoDB.",
};

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-foreground/40 p-8">
      <Image
        src="/preview.png"
        height={100}
        width={100}
        className="absolute inset-0 -z-20 size-full object-cover opacity-60"
        unoptimized
        alt=""
      />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-foreground via-foreground/20 to-foreground/50" />

      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="flex max-w-md flex-col items-center gap-5 text-center animate-in fade-in slide-in-from-bottom-3 duration-700">
        <div className="flex size-14 items-center justify-center rounded-2xl border bg-background">
          <Database className="size-6 text-primary" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-background">
            SurfDB
          </h1>
          <p className="text-balance text-[15px] leading-relaxed text-background/80">
            Visual database schema designer. Drag tables, connect relations, and
            export to Drizzle ORM, Prisma, or MongoDB.
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            href="https://github.com/r2hu1/surfdb"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "rounded-full",
            )}
          >
            <Star className="size-4" />
            Github
          </Link>
          <Link
            href="/builder"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
          >
            Open Schema Designer
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <p className="mt-1 text-xs tracking-wide text-background/80">
          Open source · MIT licensed
        </p>
      </div>
    </div>
  );
}
