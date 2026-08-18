import type { SchemaProject } from "../domain";
import { createTable } from "../domain/entities/table";
import {
  buildTemplateProject,
  field,
  idField,
  relation,
  type Template,
} from "./template-base";

export const socialTemplate: Template = {
  key: "social",
  name: "Social / Messaging",
  description: "Posts, comments, follows, conversations, and messages",
  build: (): SchemaProject => {
    const users = createTable("users", { x: 0, y: 0 }, "postgresql", {
      includeId: false,
    });
    const posts = createTable("posts", { x: 360, y: 0 }, "postgresql", {
      includeId: false,
    });
    const comments = createTable("comments", { x: 720, y: 0 }, "postgresql", {
      includeId: false,
    });
    const likes = createTable("likes", { x: 360, y: 300 }, "postgresql", {
      includeId: false,
    });
    const follows = createTable("follows", { x: 0, y: 300 }, "postgresql", {
      includeId: false,
    });
    const conversations = createTable(
      "conversations",
      { x: 0, y: 600 },
      "postgresql",
      { includeId: false },
    );
    const messages = createTable("messages", { x: 360, y: 600 }, "postgresql", {
      includeId: false,
    });

    idField(users);
    field(users, "username", "string", { nullable: false, unique: true });
    field(users, "email", "string", { nullable: false, unique: true });
    field(users, "display_name", "string", { nullable: false });
    field(users, "bio", "text");
    field(users, "avatar_url", "string");
    field(users, "status", "enum", {
      enumValues: ["active", "suspended", "deactivated"],
      defaultValue: "active",
      nullable: false,
    });

    idField(posts);
    field(posts, "author_id", "uuid", { nullable: false });
    field(posts, "content", "text", { nullable: false });
    field(posts, "media_url", "string");
    field(posts, "reply_to_id", "uuid");
    field(posts, "created_at", "timestamp", { nullable: false });

    idField(comments);
    field(comments, "post_id", "uuid", { nullable: false });
    field(comments, "author_id", "uuid", { nullable: false });
    field(comments, "content", "text", { nullable: false });
    field(comments, "parent_id", "uuid");
    field(comments, "created_at", "timestamp", { nullable: false });

    idField(likes);
    field(likes, "user_id", "uuid", { nullable: false });
    field(likes, "post_id", "uuid");
    field(likes, "comment_id", "uuid");
    field(likes, "created_at", "timestamp", { nullable: false });

    idField(follows);
    field(follows, "follower_id", "uuid", { nullable: false });
    field(follows, "following_id", "uuid", { nullable: false });
    field(follows, "created_at", "timestamp", { nullable: false });

    idField(conversations);
    field(conversations, "title", "string");
    field(conversations, "created_at", "timestamp", { nullable: false });
    field(conversations, "updated_at", "timestamp", { nullable: false });

    idField(messages);
    field(messages, "conversation_id", "uuid", { nullable: false });
    field(messages, "sender_id", "uuid", { nullable: false });
    field(messages, "content", "text", { nullable: false });
    field(messages, "read_at", "timestamp");
    field(messages, "created_at", "timestamp", { nullable: false });

    const project = buildTemplateProject(
      "Social Messaging",
      [users, posts, comments, likes, follows, conversations, messages],
      {
        users: { x: 0, y: 0 },
        posts: { x: 360, y: 0 },
        comments: { x: 720, y: 0 },
        likes: { x: 360, y: 300 },
        follows: { x: 0, y: 300 },
        conversations: { x: 0, y: 600 },
        messages: { x: 360, y: 600 },
      },
    );

    relation(project, "one_to_many", "users", "id", "posts", "author_id");
    relation(project, "one_to_many", "posts", "id", "comments", "post_id");
    relation(project, "one_to_many", "users", "id", "comments", "author_id");
    relation(project, "one_to_many", "users", "id", "likes", "user_id");
    relation(project, "one_to_many", "posts", "id", "likes", "post_id");
    relation(project, "one_to_many", "comments", "id", "likes", "comment_id", {
      onDelete: "cascade",
    });
    relation(
      project,
      "one_to_many",
      "conversations",
      "id",
      "messages",
      "conversation_id",
    );
    relation(project, "one_to_many", "users", "id", "messages", "sender_id");

    return project;
  },
};
