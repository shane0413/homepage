import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  author: text('author').default('Shane'),
  category: text('category'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  draft: integer('draft', { mode: 'boolean' }).default(true),
  tags: text('tags'),
  views: integer('views').default(0),
  pubDatetime: integer('pubDatetime', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  postId: text('postId').notNull(),
  author: text('author').notNull(),
  email: text('email').notNull(),
  content: text('content').notNull(),
  approved: integer('approved', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});