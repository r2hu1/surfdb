import { authTemplate } from "./auth";
import { blogTemplate } from "./blog";
import { crmTemplate } from "./crm";
import { ecommerceTemplate } from "./ecommerce";
import { saasTemplate } from "./saas";
import { socialTemplate } from "./social";
import type { Template } from "./template-base";

export type { Template } from "./template-base";

export const templates: Template[] = [
  authTemplate,
  ecommerceTemplate,
  blogTemplate,
  saasTemplate,
  socialTemplate,
  crmTemplate,
];

export function getTemplate(key: string): Template | undefined {
  return templates.find((t) => t.key === key);
}
