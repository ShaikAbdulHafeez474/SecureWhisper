import OpenAI from "openai";
import { config } from "../config";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: './server/.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive list of inappropriate content patterns
const inappropriatePatterns = {
  profanity: [
    'fuck', 'shit', 'ass', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 'cock', 'whore',
    'slut', 'damn', 'piss', 'cock', 'tits', 'titties', 'boobs', 'vagina', 'penis',
    // Common variations and leetspeak
    'f[u\*@]ck', 'sh[i\*@]t', 'b[i\*@]tch', 'a[s\$][$s]', 'p[u\*@]ssy',
    // Numerical substitutions
    'f4ck', 'sh1t', 'b1tch', '4ss', 'p0rn',
  ],
  hate_speech: [
    // Racial slurs and discriminatory terms
    'nigger', 'nigga', 'chink', 'spic', 'kike', 'faggot', 'fag', 'dyke',
    'retard', 'tard', 'negro', 'wetback', 'beaner', 'gook',
  ],
  threats: [
    'kill', 'murder', 'death', 'die', 'suicide', 'rape', 'bomb',
    'shoot', 'attack', 'terrorist', 'terror',
  ]
};

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

function checkPattern(text: string, pattern: string): boolean {
  // Create a regex that:
  // 1. Matches word boundaries
  // 2. Is case insensitive
  // 3. Handles common letter substitutions
  const regex = new RegExp(`\\b${pattern}\\b`, 'i');
  return regex.test(text);
}

function localModeration(text: string): ModerationResult {
  const lowerText = text.toLowerCase();
  const flaggedCategories: string[] = [];
  const flaggedPatterns: string[] = [];

  // Check each category of inappropriate content
  for (const [category, patterns] of Object.entries(inappropriatePatterns)) {
    for (const pattern of patterns) {
      if (checkPattern(lowerText, pattern)) {
        flaggedCategories.push(category);
        flaggedPatterns.push(pattern);
        break; // Break after finding first match in category
      }
    }
  }

  return {
    flagged: flaggedCategories.length > 0,
    categories: [...Array.from(new Set(flaggedCategories))]
    , // Remove duplicates
    reason: flaggedCategories.length > 0
      ? `Content contains inappropriate language (${flaggedCategories.join(', ')})`
      : undefined
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