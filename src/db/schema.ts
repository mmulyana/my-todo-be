import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------

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
  description: text('description'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  parentId: uuid('parentId'),
  userId: uuid('userId'),
});

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

export const todos = pgTable('Todo', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  note: text('note').notNull().default(''),
  completed: boolean('completed').notNull().default(false),
  important: boolean('important').notNull().default(false),
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
  userId: uuid('userId'),
});

export const attachments = pgTable('Attachment', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  mimeType: text('mimeType'),
  size: integer('size'),
  type: attachmentTypeEnum('type').notNull().default('FILE'),
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

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

