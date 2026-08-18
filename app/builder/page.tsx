import type { Metadata } from "next";
import { SchemaBuilder } from "@/modules/schema";

export const metadata: Metadata = {
  title: "Schema Designer",
  description:
    "Design your database schema visually. Add tables, define fields, set relations, and export to your preferred ORM.",
};

export default function SchemaPage() {
  return (
    <div className="h-dvh bg-secondary">
      <SchemaBuilder />
    </div>
  );
}
