import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Files table to store uploaded files metadata
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  /** Original filename as uploaded */
  filename: varchar("filename", { length: 512 }).notNull(),
  /** File path on the server (relative to storage directory) */
  filepath: varchar("filepath", { length: 1024 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull().default(0),
  /** MIME type of the file */
  mimeType: varchar("mimeType", { length: 128 }).notNull().default("application/octet-stream"),
  /** Whether the file is secured (only accessible via Roblox/Executor User-Agent) */
  isSecured: int("isSecured").notNull().default(0), // 0 = false, 1 = true
  /** User who uploaded the file */
  userId: int("userId").notNull(),
  /** When the file was uploaded */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** When the file was last updated */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;