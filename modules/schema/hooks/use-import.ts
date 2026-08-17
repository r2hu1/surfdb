import { useState } from "react";
import { type AdapterKey, adapters } from "../adapters";
import { useSchemaStore } from "../store/schema.store";

export function useImport() {
  const loadProject = useSchemaStore((s) => s.loadProject);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const importText = (key: AdapterKey, code: string): boolean => {
    const adapter = adapters[key];
    try {
      const project = adapter.import(code);
      loadProject(project);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  const importFile = async (key: AdapterKey, file: File): Promise<boolean> => {
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const ok = importText(key, text);
      return ok;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setImporting(false);
    }
  };

  return {
    importText,
    importFile,
    importing,
    error,
    clearError: () => setError(null),
  };
}
