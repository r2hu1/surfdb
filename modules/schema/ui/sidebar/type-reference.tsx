import { getFieldTypesForDialect } from "../../config/field-types";
import { useSchemaStore } from "../../store/schema.store";

export function TypeReference() {
  const dialect = useSchemaStore((s) => s.project.dialect);
  const types = getFieldTypesForDialect(dialect);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">
        Available types for {dialect} and their export mapping.
      </p>
      <div className="flex flex-col gap-1">
        {types.map((type) => (
          <div
            key={type.type}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-xs"
          >
            <span className="font-medium">{type.label}</span>
            <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
              <span className="rounded-md bg-secondary px-1.5 py-px font-mono">
                {type.drizzle}
              </span>
              <span className="rounded-md bg-secondary px-1.5 py-px font-mono">
                {type.prisma}
              </span>
              {dialect === "mongodb" && (
                <span className="rounded-md bg-secondary px-1.5 py-px font-mono">
                  {type.mongodb}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
