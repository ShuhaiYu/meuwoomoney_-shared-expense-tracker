import { pgTable, text, real, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const payerEnum = pgEnum("payer_type", ["Shared", "Felix", "Sophie", "SharedAll", "Lydia"]);
export const categoryEnum = pgEnum("category_type", [
  "Food", "Rent", "Utilities", "Cats", "Shopping", "Entertainment", "Transport", "Other"
]);

export const transactions = pgTable("transactions", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  amount: real("amount").notNull(),
  category: categoryEnum("category").notNull(),
  payer: payerEnum("payer").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
