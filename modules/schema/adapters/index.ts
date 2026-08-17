import type { SchemaAdapter } from "./adapter.interface";
import { drizzleAdapter } from "./drizzle/adapter";
import { jsonAdapter } from "./json/adapter";
import { mongodbAdapter } from "./mongodb/adapter";
import { prismaAdapter } from "./prisma/adapter";

export const adapters = {
  drizzle: drizzleAdapter,
  prisma: prismaAdapter,
  mongodb: mongodbAdapter,
  json: jsonAdapter,
} as const;

export type AdapterKey = keyof typeof adapters;

export const adapterList: SchemaAdapter[] = Object.values(adapters);

export function getAdapter(key: string): SchemaAdapter {
  const adapter = adapters[key as AdapterKey];
  if (!adapter) {
    throw new Error(`Unknown adapter: ${key}`);
  }
  return adapter;
}
