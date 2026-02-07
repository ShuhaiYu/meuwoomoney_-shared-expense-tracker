import { pgTable, text, numeric, timestamp, varchar, pgEnum, index } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const payerEnum = pgEnum("payer_type", ["Shared", "Felix", "Sophie", "SharedAll", "Lydia"]);
export const categoryEnum = pgEnum("category_type", [
  "Food", "Rent", "Utilities", "Cats", "Shopping", "Entertainment", "Transport", "Other"
]);

export const transactions = pgTable("transactions", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: categoryEnum("category").notNull(),
  payer: payerEnum("payer").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_transactions_date").on(table.date),
  index("idx_transactions_payer").on(table.payer),
  index("idx_transactions_category").on(table.category),
]);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
