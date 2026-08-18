import { Download, X } from "reicon-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdapterKey, adapters } from "../../adapters";
import { useExport } from "../../hooks/use-export";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { SyntaxHighlight } from "./syntax-highlight";

export function CodePreview() {
  const open = useUIStore((s) => s.codePreviewOpen);
  const toggleOpen = useUIStore((s) => s.toggleCodePreview);
  const project = useSchemaStore((s) => s.project);
  const [tab, setTab] = useState<AdapterKey>("drizzle");
  const { code, error, download } = useExport(tab);

  if (!open) return null;

  return (
    <div className="flex h-full shrink-0 flex-col bg-background">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as AdapterKey)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <TabsList className="h-7">
            {(Object.keys(adapters) as AdapterKey[]).map((key) => (
              <TabsTrigger key={key} value={key} className="h-6 px-2.5 text-xs">
                {adapters[key].name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1" />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={download}
            aria-label="Download code"
          >
            <Download className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleOpen}
            aria-label="Close preview"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <TabsContent value={tab} className="min-h-0 flex-1">
          {error ? (
            <div className="m-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <SyntaxHighlight
                code={code}
                language={adapters[tab].language}
                filename={`${project.name}.${adapters[tab].extension}`}
              />
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
      <p className="px-3 pb-1.5 text-[10px] text-muted-foreground">
        {project.name} · {project.dialect} · live preview — updates as you edit
      </p>
    </div>
  );
}
