import OpenAI from "openai";
import { config } from "../config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Basic list of inappropriate words for fallback
const inappropriateWords = [
  "fuck", "shit", "bastard", "bitch", "ass",
  // Add more words as needed
];

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

function localModeration(text: string): ModerationResult {
  const words = text.toLowerCase().split(/\s+/);
  const foundWords = inappropriateWords.filter(word => 
    words.some(w => w.includes(word))
  );

  return {
    flagged: foundWords.length > 0,
    categories: foundWords.length > 0 ? ['profanity'] : [],
    reason: foundWords.length > 0 ? `Content contains inappropriate language` : undefined
  };
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    // Try OpenAI moderation first
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
    console.error("OpenAI Moderation API error:", error);
    // Fall back to local moderation if OpenAI fails
    console.log("Falling back to local moderation");
    return localModeration(text);
  }
}