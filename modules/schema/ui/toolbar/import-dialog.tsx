import { Check, FileUp } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type AdapterKey, adapters } from "../../adapters";
import { useImport } from "../../hooks/use-import";
import { useUIStore } from "../../store/ui.store";

export function ImportDialog() {
  const open = useUIStore((s) => s.importDialogOpen);
  const setOpen = useUIStore((s) => s.openImportDialog);
  const [mode, setMode] = useState<"file" | "paste">("paste");
  const [key, setKey] = useState<AdapterKey>("json");
  const [text, setText] = useState("");
  const { importText, importFile, importing, error, clearError } = useImport();

  const handleImport = async () => {
    if (mode === "paste") {
      if (!text.trim()) return;
      if (importText(key, text)) {
        setOpen(false);
        setText("");
      }
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const ok = await importFile(key, file);
    if (ok) {
      setOpen(false);
      setText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) clearError();
      }}
    >
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Import schema</DialogTitle>
          <DialogDescription>
            Load a project JSON backup or paste existing schema code.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Format</Label>
            <Select value={key} onValueChange={(v) => setKey(v as AdapterKey)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(adapters) as AdapterKey[]).map((k) => (
                  <SelectItem
                    key={k}
                    value={k}
                    disabled={!adapters[k].supportsImport}
                  >
                    {adapters[k].name}
                    {!adapters[k].supportsImport ? " (soon)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === "paste" ? "secondary" : "ghost"}
              onClick={() => setMode("paste")}
            >
              Paste code
            </Button>
            <Button
              size="sm"
              variant={mode === "file" ? "secondary" : "ghost"}
              onClick={() => setMode("file")}
            >
              Upload file
            </Button>
          </div>

          {mode === "paste" ? (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                key === "json"
                  ? '{\n  "name": "My Project",\n  "tables": []\n}'
                  : "Paste schema code here…"
              }
              className="h-55 resize-none font-mono text-xs"
            />
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:bg-muted">
              <FileUp className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click to choose a file
              </span>
              <span className="text-xs text-muted-foreground">
                .json, .prisma, .ts files up to 1MB
              </span>
              <input
                type="file"
                accept=".json,.prisma,.ts,.js,text/plain,application/json"
                className="hidden"
                disabled={importing}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={mode === "paste" && !text.trim()}
          >
            <Check className="size-3.5" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
