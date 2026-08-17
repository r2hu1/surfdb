import { Handle, Position } from "@xyflow/react";
import { KeyRound, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldTypeConfig } from "../../config/field-types";
import type { Field } from "../../domain";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";

interface FieldRowProps {
  tableId: string;
  field: Field;
}

const anchorClass = "!pointer-events-none !opacity-0 !size-1";

export function FieldRow({ tableId, field }: FieldRowProps) {
  const selectedFieldId = useUIStore((s) => s.selectedFieldId);
  const connectFrom = useUIStore((s) => s.connectFrom);
  const select = useUIStore((s) => s.select);
  const setConnectFrom = useUIStore((s) => s.setConnectFrom);
  const addRelation = useSchemaStore((s) => s.addRelation);
  const typeConfig = getFieldTypeConfig(field.type);
  const isSelected = selectedFieldId === field.id;
  const isConnectSource =
    connectFrom?.tableId === tableId && connectFrom.fieldId === field.id;
  const handleClick = () => {
    if (connectFrom) {
      if (connectFrom.tableId === tableId && connectFrom.fieldId === field.id) {
        setConnectFrom(null);
        return;
      }
      const relationId = addRelation({
        type: connectFrom.tableId === tableId ? "one_to_one" : "one_to_many",
        sourceTableId: connectFrom.tableId,
        sourceFieldId: connectFrom.fieldId,
        targetTableId: tableId,
        targetFieldId: field.id,
        onDelete: "cascade",
      });
      setConnectFrom(null);
      select("relation", relationId);
      return;
    }
    if (isSelected) {
      setConnectFrom({ tableId, fieldId: field.id });
      return;
    }
    select("field", field.id);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: canvas rows are click targets inside a drag context; a real button breaks React Flow layout
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard focus not needed inside the flow canvas; selection is mouse/pointer driven
    <div
      role="button"
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      data-field-id={field.id}
      className={cn(
        "group/field relative grid h-7 cursor-pointer grid-cols-[1fr_auto] items-center gap-1 px-2.5 text-xs transition-colors hover:bg-muted/60",
        isSelected && "bg-muted",
        isConnectSource && "bg-primary/10 ring-1 ring-inset ring-primary/40",
      )}
    >
      <Handle
        id={`${field.id}:source`}
        type="source"
        position={Position.Left}
        isConnectable={false}
        className={anchorClass}
      />
      <Handle
        id={`${field.id}:target`}
        type="target"
        position={Position.Right}
        isConnectable={false}
        className={anchorClass}
      />

      <div className="flex min-w-0 items-center gap-1.5">
        {field.primaryKey && (
          <KeyRound className="size-3 shrink-0 text-primary" />
        )}
        <span
          title={
            isSelected && !isConnectSource
              ? "Click again to create a relation"
              : undefined
          }
          className={cn(
            "truncate font-medium",
            field.primaryKey
              ? "text-foreground"
              : "text-muted-foreground group-hover/field:text-foreground",
          )}
        >
          {field.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="rounded-md bg-secondary px-1.5 py-px text-[10px] font-medium text-secondary-foreground">
          {field.isArray ? `${typeConfig.label}[]` : typeConfig.label}
        </span>
        {isConnectSource && (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary">
            <Link2 className="size-3" />
          </span>
        )}
        {!field.nullable && (
          <span
            className="text-[9px] font-semibold text-muted-foreground"
            title="Not null"
          >
            NN
          </span>
        )}
        {field.unique && (
          <span
            className="text-[9px] font-semibold text-muted-foreground"
            title="Unique"
          >
            UQ
          </span>
        )}
        {field.autoIncrement && (
          <span
            className="text-[9px] font-semibold text-muted-foreground"
            title="Auto-increment"
          >
            AI
          </span>
        )}
      </div>
    </div>
  );
}
