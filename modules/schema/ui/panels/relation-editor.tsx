import { Routing as GitFork, Trash2 } from "reicon-react";
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
import type { ReferentialAction, Relation, RelationType } from "../../domain";
import { RELATION_TYPES } from "../../domain/value-objects/relation-type";
import { useSchemaStore } from "../../store/schema.store";
import { getFieldPath } from "../../store/selectors";
import { useUIStore } from "../../store/ui.store";

const ACTIONS: { id: ReferentialAction; label: string }[] = [
  { id: "no_action", label: "No action" },
  { id: "cascade", label: "Cascade" },
  { id: "restrict", label: "Restrict" },
  { id: "set_null", label: "Set null" },
];

interface RelationEditorProps {
  relation: Relation;
}

export function RelationEditor({ relation }: RelationEditorProps) {
  const project = useSchemaStore((s) => s.project);
  const updateRelation = useSchemaStore((s) => s.updateRelation);
  const deleteRelation = useSchemaStore((s) => s.deleteRelation);
  const select = useUIStore((s) => s.select);

  const source = getFieldPath(
    project,
    relation.sourceTableId,
    relation.sourceFieldId,
  );
  const target = getFieldPath(
    project,
    relation.targetTableId,
    relation.targetFieldId,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <GitFork className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-heading text-sm font-medium">
            {source} → {target}
          </span>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            deleteRelation(relation.id);
            select("relation", null);
          }}
          aria-label="Delete relation"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select
          value={relation.type}
          onValueChange={(v) =>
            updateRelation(relation.id, { type: v as RelationType })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RELATION_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="relation-name">Name (optional)</Label>
        <Input
          id="relation-name"
          value={relation.name ?? ""}
          placeholder="relation name"
          onChange={(e) =>
            updateRelation(relation.id, { name: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>On delete</Label>
        <Select
          value={relation.onDelete ?? "no_action"}
          onValueChange={(v) =>
            updateRelation(relation.id, { onDelete: v as ReferentialAction })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>On update</Label>
        <Select
          value={relation.onUpdate ?? "no_action"}
          onValueChange={(v) =>
            updateRelation(relation.id, { onUpdate: v as ReferentialAction })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
