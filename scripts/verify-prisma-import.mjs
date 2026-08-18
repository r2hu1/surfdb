import { importPrismaSchema } from "../modules/schema/adapters/prisma/import.ts";
import { prismaAdapter } from "../modules/schema/adapters/prisma/adapter.ts";

const schema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
  GUEST
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(255)
  role      Role     @default(USER)
  bio       String?  @db.Text
  posts     Post[]
  profile   Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String @db.Text
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int    @unique
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      String[]

  @@index([title], name: "idx_post_title")
  @@unique([title, authorId], name: "uq_post_author_title")
}
`;

const project = importPrismaSchema(schema);
let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
  if (!ok) failures++;
};

check("dialect postgresql", project.dialect === "postgresql", project.dialect);
check("3 models", project.tables.length === 3, String(project.tables.length));

const user = project.tables.find((t) => t.name === "User");
const profile = project.tables.find((t) => t.name === "Profile");
const post = project.tables.find((t) => t.name === "Post");

check("User.id PK + autoIncrement", Boolean(user?.fields.find((f) => f.name === "id" && f.primaryKey && f.autoIncrement)));
check("User.email unique + length 255", Boolean(user?.fields.find((f) => f.name === "email" && f.unique && f.length === 255)));
check("User.role enum values", user?.fields.find((f) => f.name === "role")?.enumValues?.join(",") === "ADMIN,USER,GUEST");
check("User.bio text nullable", Boolean(user?.fields.find((f) => f.name === "bio" && f.type === "text" && f.nullable)));

check("Profile.userId unique FK", Boolean(profile?.fields.find((f) => f.name === "userId" && f.unique)));
check("Post.authorId integer", Boolean(post?.fields.find((f) => f.name === "authorId" && f.type === "integer")));
check("Post.tags isArray", Boolean(post?.fields.find((f) => f.name === "tags" && f.isArray)));
check("Post.createdAt default now", post?.fields.find((f) => f.name === "createdAt")?.defaultValue === "now");
check("Post indexes", post?.indexes.length === 2, String(post?.indexes.length));
check("Post unique index", Boolean(post?.indexes.find((i) => i.unique)));

const rels = project.relations;
check("2 relations", rels.length === 2, String(rels.length));
const profileRel = rels.find((r) => r.sourceFieldId === profile?.fields.find((f) => f.name === "userId")?.id);
check("Profile→User one_to_one + cascade", profileRel?.type === "one_to_one" && profileRel?.onDelete === "cascade");
const postRel = rels.find((r) => r.sourceFieldId === post?.fields.find((f) => f.name === "authorId")?.id);
check("Post→User one_to_many", postRel?.type === "one_to_many");

const exported = prismaAdapter.export(project);
check("roundtrip export has @relation", exported.includes("@relation"));
check("roundtrip export has enum UserRole", exported.includes("enum UserRole"));
check("roundtrip export has role UserRole", exported.includes("role UserRole"));

process.exit(failures === 0 ? 0 : 1);