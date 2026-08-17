import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getFieldTypesForDialect } from "../../config/field-types";
import type { Field } from "../../domain";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";

interface FieldEditorProps {
  tableId: string;
  field: Field;
}

export function FieldEditor({ tableId, field }: FieldEditorProps) {
  const dialect = useSchemaStore((s) => s.project.dialect);
  const updateField = useSchemaStore((s) => s.updateField);
  const deleteField = useSchemaStore((s) => s.deleteField);
  const select = useUIStore((s) => s.select);
  const types = getFieldTypesForDialect(dialect);

  const patch = (p: Partial<Field>) => updateField(tableId, field.id, p);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {field.primaryKey && <KeyRound className="size-3.5 text-primary" />}
            <span className="truncate font-heading text-sm font-medium">
              {field.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {field.isArray ? `${field.type}[]` : field.type}
          </span>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            deleteField(tableId, field.id);
            select("field", null);
          }}
          aria-label="Delete field"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-name">Name</Label>
        <Input
          id="field-name"
          value={field.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select
          value={field.type}
          onValueChange={(v) => patch({ type: v as Field["type"] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.type} value={t.type}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(field.type === "string" || field.type === "text") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-length">Length</Label>
          <Input
            id="field-length"
            type="number"
            min={1}
            value={field.length ?? ""}
            placeholder="Auto"
            onChange={(e) =>
              patch({
                length: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      )}

      {field.type === "decimal" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-precision">Precision</Label>
          <Input
            id="field-precision"
            type="number"
            min={1}
            value={field.precision ?? ""}
            placeholder="10"
            onChange={(e) =>
              patch({
                precision: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      )}

      {field.type === "enum" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-enum">Enum values (comma separated)</Label>
          <Input
            id="field-enum"
            value={field.enumValues?.join(", ") ?? ""}
            placeholder="active, pending, done"
            onChange={(e) =>
              patch({
                enumValues: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-default">Default value</Label>
        <Input
          id="field-default"
          value={field.defaultValue ?? ""}
          placeholder="e.g. now(), 0, 'active'"
          onChange={(e) => patch({ defaultValue: e.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-comment">Comment</Label>
        <Input
          id="field-comment"
          value={field.comment ?? ""}
          onChange={(e) => patch({ comment: e.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <ToggleRow
          label="Primary key"
          checked={field.primaryKey}
          onChecked={(v) => patch({ primaryKey: v })}
        />
        <ToggleRow
          label="Unique"
          checked={field.unique}
          onChecked={(v) => patch({ unique: v })}
        />
        <ToggleRow
          label="Not null"
          checked={!field.nullable}
          onChecked={(v) => patch({ nullable: !v })}
        />
        <ToggleRow
          label="Auto-increment"
          checked={field.autoIncrement}
          onChecked={(v) => patch({ autoIncrement: v })}
          disabled={field.type !== "integer" && field.type !== "bigint"}
        />
        {dialect === "postgresql" && (
          <ToggleRow
            label="Array"
            checked={field.isArray}
            onChecked={(v) => patch({ isArray: v })}
          />
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChecked,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChecked: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        disabled && "opacity-50",
      )}
    >
      <Label className="text-sm font-normal">{label}</Label>
      <Switch
        checked={checked}
        onCheckedChange={onChecked}
        disabled={disabled}
      />
    </div>
  );
}
