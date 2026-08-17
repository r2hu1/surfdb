import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const ecommerceTemplate: Template = {
  key: "ecommerce",
  name: "E-commerce",
  description: "Products, categories, orders, and carts",
  build: (): SchemaProject => {
    const categories = createTable("categories", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const products = createTable("products", { x: 360, y: 0 }, "postgresql", {
      includeId: false,
    });
    const product_images = createTable(
      "product_images",
      { x: 720, y: 0 },
      "postgresql",
      { includeId: false },
    );
    const customers = createTable("customers", { x: 0, y: 340 }, "postgresql", {
      includeId: false,
    });
    const addresses = createTable(
      "addresses",
      { x: 360, y: 340 },
      "postgresql",
      { includeId: false },
    );
    const orders = createTable("orders", { x: 720, y: 340 }, "postgresql", {
      includeId: false,
    });
    const order_items = createTable(
      "order_items",
      { x: 1080, y: 340 },
      "postgresql",
      { includeId: false },
    );
    const carts = createTable("carts", { x: 0, y: 680 }, "postgresql", {
      includeId: false,
    });
    const cart_items = createTable(
      "cart_items",
      { x: 360, y: 680 },
      "postgresql",
      { includeId: false },
    );

    idField(categories);
    field(categories, "name", "string", { nullable: false, unique: true });
    field(categories, "slug", "string", { nullable: false, unique: true });
    field(categories, "description", "text");
    field(categories, "parent_id", "uuid");

    idField(products);
    field(products, "category_id", "uuid", { nullable: false });
    field(products, "name", "string", { nullable: false });
    field(products, "slug", "string", { nullable: false, unique: true });
    field(products, "description", "text");
    field(products, "price", "decimal", { nullable: false, precision: 10 });
    field(products, "compare_at_price", "decimal", { precision: 10 });
    field(products, "sku", "string", { unique: true });
    field(products, "stock", "integer", { nullable: false, defaultValue: "0" });
    field(products, "status", "enum", {
      enumValues: ["draft", "active", "archived"],
      defaultValue: "draft",
      nullable: false,
    });
    field(products, "tags", "string", { isArray: true });
    field(products, "published_at", "timestamp");

    idField(product_images);
    field(product_images, "product_id", "uuid", { nullable: false });
    field(product_images, "url", "string", { nullable: false });
    field(product_images, "alt", "string");
    field(product_images, "sort_order", "integer", { defaultValue: "0" });

    idField(customers);
    field(customers, "email", "string", { nullable: false, unique: true });
    field(customers, "first_name", "string", { nullable: false });
    field(customers, "last_name", "string", { nullable: false });
    field(customers, "phone", "string");
    field(customers, "birth_date", "date");

    idField(addresses);
    field(addresses, "customer_id", "uuid", { nullable: false });
    field(addresses, "type", "enum", {
      enumValues: ["shipping", "billing"],
      nullable: false,
    });
    field(addresses, "line1", "string", { nullable: false });
    field(addresses, "line2", "string");
    field(addresses, "city", "string", { nullable: false });
    field(addresses, "state", "string");
    field(addresses, "postal_code", "string");
    field(addresses, "country", "string", { nullable: false });

    idField(orders);
    field(orders, "customer_id", "uuid", { nullable: false });
    field(orders, "status", "enum", {
      enumValues: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      defaultValue: "pending",
      nullable: false,
    });
    field(orders, "total", "decimal", { nullable: false, precision: 10 });
    field(orders, "currency", "string", {
      nullable: false,
      defaultValue: "'USD'",
    });
    field(orders, "shipping_address_id", "uuid");
    field(orders, "billing_address_id", "uuid");
    field(orders, "placed_at", "timestamp", { nullable: false });
    field(orders, "shipped_at", "timestamp");

    idField(order_items);
    field(order_items, "order_id", "uuid", { nullable: false });
    field(order_items, "product_id", "uuid", { nullable: false });
    field(order_items, "quantity", "integer", { nullable: false });
    field(order_items, "unit_price", "decimal", {
      nullable: false,
      precision: 10,
    });

    idField(carts);
    field(carts, "customer_id", "uuid", { nullable: false, unique: true });
    field(carts, "expires_at", "timestamp");

    idField(cart_items);
    field(cart_items, "cart_id", "uuid", { nullable: false });
    field(cart_items, "product_id", "uuid", { nullable: false });
    field(cart_items, "quantity", "integer", { nullable: false });

    const project = buildTemplateProject(
      "E-commerce",
      [
        categories,
        products,
        product_images,
        customers,
        addresses,
        orders,
        order_items,
        carts,
        cart_items,
      ],
      {
        categories: { x: 0, y: 0 },
        products: { x: 360, y: 0 },
        product_images: { x: 720, y: 0 },
        customers: { x: 0, y: 340 },
        addresses: { x: 360, y: 340 },
        orders: { x: 720, y: 340 },
        order_items: { x: 1080, y: 340 },
        carts: { x: 0, y: 680 },
        cart_items: { x: 360, y: 680 },
      },
    );

    relation(
      project,
      "one_to_many",
      "categories",
      "id",
      "categories",
      "parent_id",
    );
    relation(
      project,
      "one_to_many",
      "categories",
      "id",
      "products",
      "category_id",
    );
    relation(
      project,
      "one_to_many",
      "products",
      "id",
      "product_images",
      "product_id",
    );
    relation(
      project,
      "one_to_many",
      "customers",
      "id",
      "addresses",
      "customer_id",
    );
    relation(
      project,
      "one_to_many",
      "customers",
      "id",
      "orders",
      "customer_id",
    );
    relation(project, "one_to_many", "orders", "id", "order_items", "order_id");
    relation(
      project,
      "one_to_many",
      "products",
      "id",
      "order_items",
      "product_id",
    );
    relation(project, "one_to_many", "customers", "id", "carts", "customer_id");
    relation(project, "one_to_many", "carts", "id", "cart_items", "cart_id");
    relation(
      project,
      "one_to_many",
      "products",
      "id",
      "cart_items",
      "product_id",
    );

    return project;
  },
};
