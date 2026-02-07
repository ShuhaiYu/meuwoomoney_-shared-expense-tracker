import type { Category, UserProfile } from "./types";

export const CATEGORIES: Category[] = [
  "Food", "Rent", "Utilities", "Cats", "Shopping", "Entertainment", "Transport", "Other"
];

export const CATEGORY_LIMITS: Record<Category, number> = {
  Food: 800,
  Rent: 2000,
  Utilities: 300,
  Cats: 200,
  Shopping: 500,
  Entertainment: 400,
  Transport: 300,
  Other: 200
};

export const ANNUAL_SAVINGS_GOAL = 10000;

export const FELIX: UserProfile = {
  name: "Felix",
  avatar: "\u{1F466}",
  monthlyContribution: 4000,
  color: "#2A9D8F"
};

export const SOPHIE: UserProfile = {
  name: "Sophie",
  avatar: "\u{1F469}",
  monthlyContribution: 3000,
  color: "#E76F51"
};

export const LYDIA: UserProfile = {
  name: "Lydia",
  avatar: "\u{1F9D1}",
  monthlyContribution: 0,
  color: "#9B59B6"
};
