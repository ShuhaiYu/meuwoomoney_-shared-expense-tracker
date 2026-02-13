import { pgTable, text, numeric, timestamp, varchar, pgEnum, index, boolean, unique } from "drizzle-orm/pg-core";
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
  lydiaShare: numeric("lydia_share", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_transactions_date").on(table.date),
  index("idx_transactions_payer").on(table.payer),
  index("idx_transactions_category").on(table.category),
]);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const payerNameEnum = pgEnum("payer_name", ["Felix", "Sophie"]);

export const monthlyPayments = pgTable("monthly_payments", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  payer: payerNameEnum("payer").notNull(),
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
  confirmedBy: text("confirmed_by").notNull(),
}, (table) => [
  unique("uq_monthly_payments").on(table.yearMonth, table.payer),
]);

export type MonthlyPayment = typeof monthlyPayments.$inferSelect;

export const depositorEnum = pgEnum("depositor_type", ["Felix", "Sophie", "Lydia"]);

export const deposits = pgTable("deposits", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  depositor: depositorEnum("depositor").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
}, (table) => [
  index("idx_deposits_year_month").on(table.yearMonth),
  index("idx_deposits_depositor").on(table.depositor),
]);

export type Deposit = typeof deposits.$inferSelect;

export const settlementPeriodEnum = pgEnum("settlement_period", ["first-half", "second-half"]);

export const lydiaSettlements = pgTable("lydia_settlements", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  period: settlementPeriodEnum("period").notNull(),
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
  confirmedBy: text("confirmed_by").notNull(),
}, (table) => [
  unique("uq_lydia_settlements").on(table.yearMonth, table.period),
]);

export type LydiaSettlement = typeof lydiaSettlements.$inferSelect;

// better-auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
