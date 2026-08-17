import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const blogTemplate: Template = {
  key: "blog",
  name: "Blog / CMS",
  description: "Posts, authors, tags, and comments",
  build: (): SchemaProject => {
    const authors = createTable("authors", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const posts = createTable("posts", { x: 360, y: 0 }, "postgresql", {
      includeId: false,
    });
    const tags = createTable("tags", { x: 720, y: 0 }, "postgresql", {
      includeId: false,
    });
    const post_tags = createTable(
      "post_tags",
      { x: 1080, y: 0 },
      "postgresql",
      { includeId: false },
    );
    const comments = createTable("comments", { x: 360, y: 340 }, "postgresql", {
      includeId: false,
    });

    idField(authors);
    field(authors, "name", "string", { nullable: false });
    field(authors, "email", "string", { nullable: false, unique: true });
    field(authors, "bio", "text");
    field(authors, "avatar_url", "string");
    field(authors, "active", "boolean", {
      defaultValue: "true",
      nullable: false,
    });

    idField(posts);
    field(posts, "author_id", "uuid", { nullable: false });
    field(posts, "title", "string", { nullable: false });
    field(posts, "slug", "string", { nullable: false, unique: true });
    field(posts, "content", "text", { nullable: false });
    field(posts, "excerpt", "text");
    field(posts, "cover_image", "string");
    field(posts, "status", "enum", {
      enumValues: ["draft", "published", "archived"],
      defaultValue: "draft",
      nullable: false,
    });
    field(posts, "published_at", "timestamp");
    field(posts, "views", "integer", { defaultValue: "0" });

    idField(tags);
    field(tags, "name", "string", { nullable: false, unique: true });
    field(tags, "slug", "string", { nullable: false, unique: true });

    idField(post_tags);
    field(post_tags, "post_id", "uuid", { nullable: false });
    field(post_tags, "tag_id", "uuid", { nullable: false });

    idField(comments);
    field(comments, "post_id", "uuid", { nullable: false });
    field(comments, "author_name", "string", { nullable: false });
    field(comments, "author_email", "string");
    field(comments, "content", "text", { nullable: false });
    field(comments, "status", "enum", {
      enumValues: ["pending", "approved", "spam"],
      defaultValue: "pending",
      nullable: false,
    });
    field(comments, "created_at", "timestamp", { nullable: false });

    const project = buildTemplateProject(
      "Blog CMS",
      [authors, posts, tags, post_tags, comments],
      {
        authors: { x: 0, y: 0 },
        posts: { x: 360, y: 0 },
        tags: { x: 720, y: 0 },
        post_tags: { x: 1080, y: 0 },
        comments: { x: 360, y: 340 },
      },
    );

    relation(project, "one_to_many", "authors", "id", "posts", "author_id");
    relation(project, "one_to_many", "posts", "id", "post_tags", "post_id");
    relation(project, "one_to_many", "tags", "id", "post_tags", "tag_id");
    relation(project, "one_to_many", "posts", "id", "comments", "post_id");

    return project;
  },
};
