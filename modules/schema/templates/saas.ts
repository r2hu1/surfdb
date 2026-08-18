import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const saasTemplate: Template = {
  key: "saas",
  name: "SaaS / Project Management",
  description: "Workspaces, projects, tasks, and team collaboration",
  build: (): SchemaProject => {
    const workspaces = createTable("workspaces", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const members = createTable("members", { x: 360, y: 0 }, "postgresql", {
      includeId: false,
    });
    const projects = createTable("projects", { x: 0, y: 300 }, "postgresql", {
      includeId: false,
    });
    const tasks = createTable("tasks", { x: 360, y: 300 }, "postgresql", {
      includeId: false,
    });
    const task_assignees = createTable(
      "task_assignees",
      { x: 720, y: 300 },
      "postgresql",
      { includeId: false },
    );
    const comments = createTable("comments", { x: 360, y: 600 }, "postgresql", {
      includeId: false,
    });

    idField(workspaces);
    field(workspaces, "name", "string", { nullable: false });
    field(workspaces, "slug", "string", { nullable: false, unique: true });
    field(workspaces, "plan", "enum", {
      enumValues: ["free", "starter", "pro", "enterprise"],
      defaultValue: "free",
      nullable: false,
    });

    idField(members);
    field(members, "workspace_id", "uuid", { nullable: false });
    field(members, "user_id", "uuid", { nullable: false });
    field(members, "role", "enum", {
      enumValues: ["owner", "admin", "member", "viewer"],
      defaultValue: "member",
      nullable: false,
    });
    field(members, "joined_at", "timestamp", { nullable: false });

    idField(projects);
    field(projects, "workspace_id", "uuid", { nullable: false });
    field(projects, "name", "string", { nullable: false });
    field(projects, "key", "string", { nullable: false });
    field(projects, "description", "text");
    field(projects, "status", "enum", {
      enumValues: ["active", "archived"],
      defaultValue: "active",
      nullable: false,
    });

    idField(tasks);
    field(tasks, "project_id", "uuid", { nullable: false });
    field(tasks, "title", "string", { nullable: false });
    field(tasks, "description", "text");
    field(tasks, "status", "enum", {
      enumValues: ["todo", "in_progress", "review", "done"],
      defaultValue: "todo",
      nullable: false,
    });
    field(tasks, "priority", "enum", {
      enumValues: ["low", "medium", "high", "urgent"],
      defaultValue: "medium",
      nullable: false,
    });
    field(tasks, "due_date", "date");
    field(tasks, "created_by", "uuid", { nullable: false });

    idField(task_assignees);
    field(task_assignees, "task_id", "uuid", { nullable: false });
    field(task_assignees, "user_id", "uuid", { nullable: false });

    idField(comments);
    field(comments, "task_id", "uuid", { nullable: false });
    field(comments, "user_id", "uuid", { nullable: false });
    field(comments, "content", "text", { nullable: false });
    field(comments, "created_at", "timestamp", { nullable: false });

    const project = buildTemplateProject(
      "SaaS Project Management",
      [workspaces, members, projects, tasks, task_assignees, comments],
      {
        workspaces: { x: 0, y: 0 },
        members: { x: 360, y: 0 },
        projects: { x: 0, y: 300 },
        tasks: { x: 360, y: 300 },
        task_assignees: { x: 720, y: 300 },
        comments: { x: 360, y: 600 },
      },
    );

    relation(
      project,
      "one_to_many",
      "workspaces",
      "id",
      "members",
      "workspace_id",
    );
    relation(
      project,
      "one_to_many",
      "workspaces",
      "id",
      "projects",
      "workspace_id",
    );
    relation(project, "one_to_many", "projects", "id", "tasks", "project_id");
    relation(
      project,
      "one_to_many",
      "tasks",
      "id",
      "task_assignees",
      "task_id",
    );
    relation(project, "one_to_many", "tasks", "id", "comments", "task_id");

    return project;
  },
};
