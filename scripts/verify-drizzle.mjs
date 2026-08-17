import {
  createProject,
  addRelation,
  addTable,
} from "../modules/schema/domain/services/schema.service";
import { createTable } from "../modules/schema/domain/entities/table";
import { createField } from "../modules/schema/domain/entities/field";
import { drizzleAdapter } from "../modules/schema/adapters/drizzle/adapter";

let p = createProject("test", "postgresql");

const users = createTable("users", { x: 0, y: 0 }, "postgresql");
const orders = createTable("orders", { x: 200, y: 0 }, "postgresql");
const products = createTable("products", { x: 400, y: 0 }, "postgresql");

const ordersUserId = { ...createField("user_id", "uuid", "postgresql"), nullable: false };
const ordersProductId = createField("product_id", "uuid", "postgresql");
const ordersShipId = createField("shipping_ref", "string", "postgresql");
const productsSku = { ...createField("sku", "string", "postgresql"), unique: true };

p = addTable(p, users);
p = addTable(p, orders);
p = addTable(p, products);

p = {
  ...p,
  tables: p.tables.map((t) =>
    t.id === orders.id
      ? { ...t, fields: [...t.fields, ordersUserId, ordersProductId, ordersShipId] }
      : t.id === products.id
        ? { ...t, fields: [...t.fields, productsSku] }
        : t,
  ),
};

p = addRelation(p, {
  type: "one_to_many",
  sourceTableId: orders.id,
  sourceFieldId: ordersUserId.id,
  targetTableId: users.id,
  targetFieldId: users.fields[0].id,
  onDelete: "cascade",
});

p = addRelation(p, {
  type: "one_to_many",
  sourceTableId: orders.id,
  sourceFieldId: ordersProductId.id,
  targetTableId: products.id,
  targetFieldId: productsSku.id,
  onDelete: "set_null",
});

p = addRelation(p, {
  type: "one_to_many",
  sourceTableId: orders.id,
  sourceFieldId: ordersShipId.id,
  targetTableId: products.id,
  targetFieldId: productsSku.id,
  onDelete: "no_action",
});

p = addRelation(p, {
  type: "one_to_many",
  sourceTableId: orders.id,
  sourceFieldId: ordersProductId.id,
  targetTableId: products.id,
  targetFieldId: "ghost_field",
  onDelete: "no_action",
});

console.log(drizzleAdapter.export(p));