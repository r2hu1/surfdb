import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdapterKey, adapters } from "../../adapters";
import { useExport } from "../../hooks/use-export";
import { useUIStore } from "../../store/ui.store";
import { SyntaxHighlight } from "../preview/syntax-highlight";

export function ExportDialog() {
  const open = useUIStore((s) => s.exportDialogOpen);
  const setOpen = useUIStore((s) => s.openExportDialog);
  const [tab, setTab] = useState<AdapterKey>("drizzle");
  const [copied, setCopied] = useState(false);
  const { code, error, download, copy } = useExport(tab);

  const handleCopy = async () => {
    const ok = await copy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export schema</DialogTitle>
          <DialogDescription>
            Generated code from your visual schema. Copy it or download as a
            file.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as AdapterKey)}>
          <TabsList>
            {(Object.keys(adapters) as AdapterKey[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {adapters[key].name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab} className="mt-2">
            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <ScrollArea className="h-80 rounded-2xl border border-border bg-background">
                <SyntaxHighlight
                  code={code}
                  language={adapters[tab].language}
                />
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={download}>
            <Download className="size-3.5" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
