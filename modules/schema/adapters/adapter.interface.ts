import type { SchemaProject } from "../domain";

export interface SchemaAdapter {
  key: string;
  name: string;
  description: string;
  language: string;
  extension: string;
  mimeType: string;
  supportsImport: boolean;
  export(project: SchemaProject): string;
  import(code: string): SchemaProject;
}
