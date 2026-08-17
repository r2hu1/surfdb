import { authTemplate } from "./auth";
import { blogTemplate } from "./blog";
import { ecommerceTemplate } from "./ecommerce";
import type { Template } from "./template-base";

export type { Template } from "./template-base";

export const templates: Template[] = [
  authTemplate,
  ecommerceTemplate,
  blogTemplate,
];

export function getTemplate(key: string): Template | undefined {
  return templates.find((t) => t.key === key);
}
