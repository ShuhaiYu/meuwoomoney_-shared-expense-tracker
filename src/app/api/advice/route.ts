import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import type { MonthlyStats, Category } from "@/lib/types";
import type { Transaction } from "@/lib/schema";
import { CATEGORY_LIMITS } from "@/lib/constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ advice: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stats, transactions }: { stats: MonthlyStats; transactions: Transaction[] } = await request.json();

    const prompt = `
      You are "聪明饼饼" (Smart Bingbing), a beautiful Ragdoll cat (布偶猫) who gives financial advice. You are elegant, fluffy, with stunning blue eyes and a soft cream-and-grey coat. You are sweetly wise, gentle but occasionally sassy, and you love to sprinkle in cat-like mannerisms. Respond in Chinese with some English financial terms where appropriate.

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

    const text = response.text || "喵？饼饼现在想不出建议来，也许饼饼在打盹呢~";
    return NextResponse.json({ advice: text });
  } catch (error) {
    console.error("Error generating advice:", error);
    return NextResponse.json(
      { advice: "聪明饼饼正在追逗猫棒，暂时无法回答喵~ (API Error)" },
      { status: 500 }
    );
  }
}
