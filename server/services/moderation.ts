import OpenAI from "openai";
import { config } from "../config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    // Get flagged categories
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, value]) => value)
      .map(([category]) => category);

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      reason: flaggedCategories.length > 0
        ? `Content flagged for: ${flaggedCategories.join(", ")}`
        : undefined
    };
  } catch (error) {
    console.error("Moderation API error:", error);
    // Fail open - allow content if API fails
    return {
      flagged: false,
      categories: [],
      reason: "Moderation service unavailable"
    };
  }
}
