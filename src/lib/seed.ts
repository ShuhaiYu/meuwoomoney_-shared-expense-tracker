import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { transactions } from "./schema";
import { melbourneYearMonth } from "./melbourne-time";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const currentMonth = melbourneYearMonth();

const seedData = [
  { id: "seed-1", date: `${currentMonth}-01`, amount: "100.00", category: "Food" as const, payer: "Shared" as const, description: "Dinner at Sushi Place" },
  { id: "seed-2", date: `${currentMonth}-02`, amount: "50.00", category: "Cats" as const, payer: "Felix" as const, description: "Cat Treats" },
  { id: "seed-3", date: `${currentMonth}-05`, amount: "200.00", category: "Shopping" as const, payer: "Sophie" as const, description: "New Curtains" },
  { id: "seed-4", date: `${currentMonth}-10`, amount: "600.00", category: "Shopping" as const, payer: "Shared" as const, description: "New Sofa" },
  { id: "seed-5", date: `${currentMonth}-08`, amount: "1500.00", category: "Rent" as const, payer: "SharedAll" as const, description: "Monthly Rent (3-way)" },
  { id: "seed-6", date: `${currentMonth}-12`, amount: "90.00", category: "Food" as const, payer: "Lydia" as const, description: "Groceries (Lydia paid)" },
];

async function main() {
  console.log("Seeding database...");
  await db.insert(transactions).values(seedData);
  console.log("Seeded 6 transactions successfully!");
}

main().catch(console.error);
