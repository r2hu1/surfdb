import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const crmTemplate: Template = {
  key: "crm",
  name: "CRM / Inventory",
  description: "Companies, contacts, deals, products, and activities",
  build: (): SchemaProject => {
    const companies = createTable("companies", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const contacts = createTable("contacts", { x: 360, y: 0 }, "postgresql", {
      includeId: false,
    });
    const deals = createTable("deals", { x: 0, y: 300 }, "postgresql", {
      includeId: false,
    });
    const deal_products = createTable(
      "deal_products",
      { x: 360, y: 300 },
      "postgresql",
      { includeId: false },
    );
    const products = createTable("products", { x: 720, y: 300 }, "postgresql", {
      includeId: false,
    });
    const activities = createTable(
      "activities",
      { x: 0, y: 600 },
      "postgresql",
      { includeId: false },
    );

    idField(companies);
    field(companies, "name", "string", { nullable: false });
    field(companies, "domain", "string", { unique: true });
    field(companies, "industry", "string");
    field(companies, "size", "enum", {
      enumValues: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
    });
    field(companies, "revenue", "decimal", { precision: 12 });
    field(companies, "address", "text");

    idField(contacts);
    field(contacts, "company_id", "uuid");
    field(contacts, "first_name", "string", { nullable: false });
    field(contacts, "last_name", "string", { nullable: false });
    field(contacts, "email", "string", { unique: true });
    field(contacts, "phone", "string");
    field(contacts, "title", "string");
    field(contacts, "status", "enum", {
      enumValues: ["lead", "prospect", "active", "churned"],
      defaultValue: "lead",
      nullable: false,
    });

    idField(deals);
    field(deals, "company_id", "uuid", { nullable: false });
    field(deals, "contact_id", "uuid");
    field(deals, "title", "string", { nullable: false });
    field(deals, "value", "decimal", { nullable: false, precision: 12 });
    field(deals, "currency", "string", {
      nullable: false,
      defaultValue: "'USD'",
    });
    field(deals, "stage", "enum", {
      enumValues: [
        "discovery",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      defaultValue: "discovery",
      nullable: false,
    });
    field(deals, "expected_close", "date");
    field(deals, "closed_at", "timestamp");

    idField(deal_products);
    field(deal_products, "deal_id", "uuid", { nullable: false });
    field(deal_products, "product_id", "uuid", { nullable: false });
    field(deal_products, "quantity", "integer", { nullable: false });
    field(deal_products, "unit_price", "decimal", {
      nullable: false,
      precision: 10,
    });

    idField(products);
    field(products, "name", "string", { nullable: false });
    field(products, "sku", "string", { unique: true });
    field(products, "description", "text");
    field(products, "price", "decimal", { nullable: false, precision: 10 });
    field(products, "cost", "decimal", { precision: 10 });
    field(products, "stock", "integer", { defaultValue: "0" });
    field(products, "status", "enum", {
      enumValues: ["active", "discontinued"],
      defaultValue: "active",
      nullable: false,
    });

    idField(activities);
    field(activities, "contact_id", "uuid", { nullable: false });
    field(activities, "deal_id", "uuid");
    field(activities, "type", "enum", {
      enumValues: ["call", "email", "meeting", "note"],
      nullable: false,
    });
    field(activities, "subject", "string", { nullable: false });
    field(activities, "body", "text");
    field(activities, "due_at", "timestamp");
    field(activities, "completed_at", "timestamp");

    const project = buildTemplateProject(
      "CRM Inventory",
      [companies, contacts, deals, deal_products, products, activities],
      {
        companies: { x: 0, y: 0 },
        contacts: { x: 360, y: 0 },
        deals: { x: 0, y: 300 },
        deal_products: { x: 360, y: 300 },
        products: { x: 720, y: 300 },
        activities: { x: 0, y: 600 },
      },
    );

    relation(
      project,
      "one_to_many",
      "companies",
      "id",
      "contacts",
      "company_id",
    );
    relation(project, "one_to_many", "companies", "id", "deals", "company_id");
    relation(project, "one_to_many", "contacts", "id", "deals", "contact_id", {
      onDelete: "set_null",
    });
    relation(project, "one_to_many", "deals", "id", "deal_products", "deal_id");
    relation(
      project,
      "one_to_many",
      "products",
      "id",
      "deal_products",
      "product_id",
    );
    relation(
      project,
      "one_to_many",
      "contacts",
      "id",
      "activities",
      "contact_id",
    );
    relation(project, "one_to_many", "deals", "id", "activities", "deal_id", {
      onDelete: "set_null",
    });

    return project;
  },
};
