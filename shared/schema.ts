import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enums
export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'archived',
  'deleted',
]);

export const taskStatusEnum = pgEnum('task_status', [
  'queued',
  'planning',
  'executing',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);

export const stepTypeEnum = pgEnum('step_type', [
  'plan',
  'code',
  'terminal',
  'browser',
  'file_write',
  'file_read',
  'search',
  'deploy',
  'think',
  'ask_user',
]);

export const stepStatusEnum = pgEnum('step_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system',
  'tool',
]);

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'building',
  'live',
  'failed',
]);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  provider: text('provider').default('github'),
  providerId: text('provider_id'),
  plan: text('plan').default('free'),
  tokensUsedToday: integer('tokens_used_today').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  framework: text('framework'),
  status: projectStatusEnum('status').default('active'),
  containerId: text('container_id'),
  deployUrl: text('deploy_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').references(() => users.id),
  prompt: text('prompt').notNull(),
  status: taskStatusEnum('status').default('queued').notNull(),
  plan: jsonb('plan').$type<TaskPlanJSON>(),
  result: text('result'),
  tokensUsed: integer('tokens_used').default(0),
  durationMs: integer('duration_ms'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .references(() => tasks.id, { onDelete: 'cascade' })
    .notNull(),
  stepIndex: integer('step_index').notNull(),
  type: stepTypeEnum('type').notNull(),
  status: stepStatusEnum('status').default('pending').notNull(),
  title: text('title').notNull(),
  input: jsonb('input').$type<Record<string, unknown>>(),
  output: jsonb('output').$type<Record<string, unknown>>(),
  reasoning: text('reasoning'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .references(() => tasks.id, { onDelete: 'cascade' })
    .notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content'),
  toolName: text('tool_name'),
  toolInput: jsonb('tool_input').$type<Record<string, unknown>>(),
  toolOutput: jsonb('tool_output').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  path: text('path').notNull(),
  content: text('content'),
  language: text('language'),
  isDirectory: boolean('is_directory').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deployments = pgTable('deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  url: text('url'),
  status: deploymentStatusEnum('status').default('building').notNull(),
  commitHash: text('commit_hash'),
  buildLogs: text('build_logs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(tasks),
  files: many(files),
  deployments: many(deployments),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  steps: many(steps),
  messages: many(messages),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  task: one(tasks, { fields: [steps.taskId], references: [tasks.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  task: one(tasks, { fields: [messages.taskId], references: [tasks.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, { fields: [files.projectId], references: [projects.id] }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, { fields: [deployments.projectId], references: [projects.id] }),
}));

// Types
interface TaskPlanJSON {
  goal: string;
  steps: { title: string; type: string; description: string }[];
  estimatedTime?: string;
}

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;
export type Step = InferSelectModel<typeof steps>;
export type NewStep = InferInsertModel<typeof steps>;
export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;
export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;
export type Deployment = InferSelectModel<typeof deployments>;
export type NewDeployment = InferInsertModel<typeof deployments>;
