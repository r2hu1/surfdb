import { useCallback, useMemo } from "react";
import { type AdapterKey, adapters } from "../adapters";
import { useSchemaStore } from "../store/schema.store";

export function useExport(adapterKey: AdapterKey) {
  const project = useSchemaStore((s) => s.project);

  const result = useMemo(() => {
    const adapter = adapters[adapterKey];
    try {
      return { code: adapter.export(project), error: null as string | null };
    } catch (error) {
      return {
        code: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [project, adapterKey]);

  const download = useCallback(() => {
    const adapter = adapters[adapterKey];
    const blob = new Blob([result.code], { type: adapter.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.${adapter.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [adapterKey, project.name, result.code]);

  const copy = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(result.code);
      return true;
    } catch {
      return false;
    }
  }, [result.code]);

  return { code: result.code, error: result.error, download, copy };
}
