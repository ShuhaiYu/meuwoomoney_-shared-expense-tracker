import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import type { MonthlyStats, Category } from "@/lib/types";
import type { Transaction } from "@/lib/schema";
import { CATEGORY_LIMITS } from "@/lib/constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Secure-neon-auth.session_token");
  if (!sessionToken?.value) {
    return NextResponse.json({ advice: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stats, transactions }: { stats: MonthlyStats; transactions: Transaction[] } = await request.json();

    const prompt = `
      You are a wise, cute, and slightly sassy financial advisor cat named "Professor Paws".

      Here is the monthly spending report for Felix and Sophie:

      - Total Household Income: $${stats.totalIncome}
      - Total Spent: $${stats.totalSpent}
      - Net Savings: $${stats.netSavings} (Positive is saved, Negative is overspent)

      Category Limits vs Actual:
      ${Object.entries(stats.categoryBreakdown).map(([cat, amount]) => {
        const limit = CATEGORY_LIMITS[cat as Category] || 0;
        return `- ${cat}: $${amount} / $${limit} limit`;
      }).join("\n")}

      Roommate Settlement with Lydia:
      - Lydia owes the couple: $${stats.lydiaOwes?.toFixed(2) || "0.00"} (her 1/3 share of couple-paid 3-way expenses)
      - Couple owes Lydia: $${stats.coupleOwesLydia?.toFixed(2) || "0.00"} (their 2/3 share of Lydia-paid expenses)
      - Net balance: $${stats.lydiaNetBalance?.toFixed(2) || "0.00"} (${(stats.lydiaNetBalance ?? 0) >= 0 ? "Lydia pays couple" : "Couple pays Lydia"})

      Please provide a 3-paragraph summary for the "Suggestions" page of their monthly PDF report.
      1. Analyze the budget. Explicitly mention any categories that went OVER their limit and scold them gently with a cat pun.
      2. Comment on their total savings.
      3. Give one specific, actionable tip for next month. If there is a roommate settlement balance, remind them to settle up.

      Format the output as Markdown. Keep it cute but helpful.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "Meow? I couldn't generate advice right now. Maybe I'm napping.";
    return NextResponse.json({ advice: text });
  } catch (error) {
    console.error("Error generating advice:", error);
    return NextResponse.json(
      { advice: "The financial cat is currently chasing a laser pointer and cannot answer. (API Error)" },
      { status: 500 }
    );
  }
}
