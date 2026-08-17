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
import { DIALECTS, getDialect } from "../../config/db-dialects";
import { useSchemaStore } from "../../store/schema.store";
import { templates } from "../../templates";

export function SchemaSettings() {
  const project = useSchemaStore((s) => s.project);
  const setDialect = useSchemaStore((s) => s.setDialect);
  const renameProject = useSchemaStore((s) => s.renameProject);
  const loadProject = useSchemaStore((s) => s.loadProject);
  const applyAutoLayout = useSchemaStore((s) => s.applyAutoLayout);
  const dialectMeta = getDialect(project.dialect);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Database</Label>
        <Select
          value={project.dialect}
          onValueChange={(v) => setDialect(v as typeof project.dialect)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIALECTS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {dialectMeta.description}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Layout</Label>
        <Button size="sm" variant="outline" onClick={() => applyAutoLayout()}>
          Auto-arrange tables
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Templates</Label>
        <div className="flex flex-col gap-1.5">
          {templates.map((template) => (
            <button
              key={template.key}
              type="button"
              onClick={() => loadProject(template.build())}
              className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="text-sm font-medium">{template.name}</span>
              <span className="text-xs text-muted-foreground">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
