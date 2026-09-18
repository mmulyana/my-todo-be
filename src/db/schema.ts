import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Document content (ProseMirror / Tiptap JSON)
// ---------------------------------------------------------------------------

export type ProseMirrorDoc = {
  type: string;
  content?: ProseMirrorDoc[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export const attachmentTypeEnum = pgEnum('AttachmentType', [
  'IMAGE',
  'FILE',
  'LINK',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable('Project', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique(),
  name: text('name').notNull(),
  color: text('color'),
  description: text('description'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  archivedAt: timestamp('archivedAt', { withTimezone: true }),
  parentId: uuid('parentId'),
  userId: uuid('userId'),
});

export const kanbanColumns = pgTable(
  'KanbanColumn',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    position: integer('position').notNull().default(0),
    projectId: uuid('projectId').notNull(),
    userId: uuid('userId').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('kanban_column_project_position_idx').on(
      table.projectId,
      table.position,
    ),
  ],
);

export const lists = pgTable('List', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  projectId: uuid('projectId'),
  userId: uuid('userId'),
});

export const todos = pgTable(
  'Todo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    note: text('note').notNull().default(''),
    completed: boolean('completed').notNull().default(false),
    important: boolean('important').notNull().default(false),
    priority: integer('priority').notNull().default(3),
    position: integer('position').notNull().default(0),
    listPosition: integer('listPosition').notNull().default(0),
    today: text('today'),
    dueDate: text('dueDate'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    parentId: uuid('parentId'),
    listId: uuid('listId'),
    projectId: uuid('projectId'),
    kanbanColumnId: uuid('kanbanColumnId'),
    userId: uuid('userId'),
  },
  (table) => [
    index('todo_parent_id_idx').on(table.parentId),
    index('todo_list_id_idx').on(table.listId),
    index('todo_project_id_idx').on(table.projectId),
    index('todo_user_kanban_column_position_idx').on(
      table.userId,
      table.kanbanColumnId,
      table.position,
    ),
    index('todo_user_project_list_position_idx').on(
      table.userId,
      table.projectId,
      table.listId,
      table.listPosition,
    ),
  ],
);

export const apiTokens = pgTable(
  'ApiToken',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').notNull(),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    tokenHash: text('tokenHash').notNull().unique(),
    scopes: text('scopes').notNull().default('read,write'),
    lastUsedAt: timestamp('lastUsedAt', { withTimezone: true }),
    expiresAt: timestamp('expiresAt', { withTimezone: true }),
    revokedAt: timestamp('revokedAt', { withTimezone: true }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('api_token_user_id_idx').on(table.userId)],
);

export const documents = pgTable(
  'Document',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: jsonb('content').$type<ProseMirrorDoc | null>(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    projectId: uuid('projectId'),
    userId: uuid('userId'),
  },
  (table) => [
    index('document_project_id_idx').on(table.projectId),
    index('document_user_id_idx').on(table.userId),
  ],
);

export const attachments = pgTable('Attachment', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  mimeType: text('mimeType'),
  size: integer('size'),
  type: attachmentTypeEnum('type').notNull().default('FILE'),
  title: text('title'),
  description: text('description'),
  image: text('image'),
  favicon: text('favicon'),
  siteName: text('siteName'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  todoId: uuid('todoId'),
  projectId: uuid('projectId'),
  userId: uuid('userId'),
});

// ---------------------------------------------------------------------------
// Inferred types (useful in services)
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
