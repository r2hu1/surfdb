import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const authTemplate: Template = {
  key: "auth",
  name: "Authentication",
  description: "Users, sessions, and API tokens",
  build: (): SchemaProject => {
    const users = createTable("users", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const sessions = createTable("sessions", { x: 400, y: 0 }, "postgresql", {
      includeId: false,
    });
    const tokens = createTable("tokens", { x: 800, y: 0 }, "postgresql", {
      includeId: false,
    });
    const roles = createTable("roles", { x: 0, y: 300 }, "postgresql", {
      includeId: false,
    });
    const user_roles = createTable(
      "user_roles",
      { x: 400, y: 300 },
      "postgresql",
      { includeId: false },
    );

    idField(users);
    field(users, "email", "string", { nullable: false, unique: true });
    field(users, "password_hash", "string", { nullable: false });
    field(users, "name", "string");
    field(users, "avatar_url", "string");
    field(users, "status", "enum", {
      enumValues: ["active", "suspended", "banned"],
      defaultValue: "active",
      nullable: false,
    });
    field(users, "last_login_at", "timestamp");

    idField(sessions);
    field(sessions, "user_id", "uuid", { nullable: false });
    field(sessions, "token", "string", { unique: true, nullable: false });
    field(sessions, "ip", "string");
    field(sessions, "user_agent", "text");
    field(sessions, "expires_at", "timestamp", { nullable: false });
    field(sessions, "revoked_at", "timestamp");

    idField(tokens);
    field(tokens, "user_id", "uuid", { nullable: false });
    field(tokens, "type", "enum", {
      enumValues: ["refresh", "reset", "verify"],
      nullable: false,
    });
    field(tokens, "value", "string", { unique: true, nullable: false });
    field(tokens, "expires_at", "timestamp", { nullable: false });
    field(tokens, "used_at", "timestamp");

    idField(roles);
    field(roles, "name", "string", { nullable: false, unique: true });
    field(roles, "description", "text");

    idField(user_roles);
    field(user_roles, "user_id", "uuid", { nullable: false });
    field(user_roles, "role_id", "uuid", { nullable: false });

    const project = buildTemplateProject(
      "Auth",
      [users, sessions, tokens, roles, user_roles],
      {
        users: { x: 0, y: 0 },
        sessions: { x: 360, y: 0 },
        tokens: { x: 720, y: 0 },
        roles: { x: 0, y: 320 },
        user_roles: { x: 360, y: 320 },
      },
    );

    relation(project, "one_to_many", "users", "id", "sessions", "user_id");
    relation(project, "one_to_many", "users", "id", "tokens", "user_id");
    relation(project, "one_to_many", "roles", "id", "user_roles", "role_id");
    relation(project, "one_to_many", "users", "id", "user_roles", "user_id");

    return project;
  },
};
