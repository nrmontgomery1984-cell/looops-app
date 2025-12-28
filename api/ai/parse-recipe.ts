// Vercel Serverless Function - Parse Recipe from URL using Claude API
// Fetches recipe page, extracts content, and uses Claude to parse into structured data

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Approved recipe domains
const APPROVED_DOMAINS = [
  "seriouseats.com",
  "bonappetit.com",
  "chrisyoungcooks.com",
  "bingingwithbabish.com",
];

interface ParsedRecipe {
  title: string;
  author?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "advanced" | "project";
  requiredEquipment: string[];
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    preparation?: string;
    optional: boolean;
    category: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    isActive: boolean;
    technique?: string;
    tip?: string;
  }>;
  tags: string[];
  chefNotes?: string;
  imageUrl?: string;
}

function isApprovedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return APPROVED_DOMAINS.some((domain) =>
      parsedUrl.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return await response.text();
}

function extractImageUrl(html: string): string | undefined {
  // Try to find og:image meta tag
  const ogImageMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogImageMatch) {
    return ogImageMatch[1];
  }

  // Try to find recipe image in structured data
  const ldJsonMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (ldJsonMatch) {
    for (const match of ldJsonMatch) {
      try {
        const jsonContent = match.replace(
          /<script[^>]*>|<\/script>/gi,
          ""
        );
        const data = JSON.parse(jsonContent);
        if (data.image) {
          if (typeof data.image === "string") return data.image;
          if (Array.isArray(data.image)) return data.image[0];
          if (data.image.url) return data.image.url;
        }
      } catch {
        continue;
      }
    }
  }

  return undefined;
}

function cleanHtmlForParsing(html: string): string {
  // Remove script, style, and nav elements
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Remove excess whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  // Limit content length to avoid token limits
  if (cleaned.length > 50000) {
    cleaned = cleaned.substring(0, 50000);
  }

  return cleaned;
}

async function parseWithClaude(
  html: string,
  url: string
): Promise<ParsedRecipe> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are a culinary expert and recipe parser. Your task is to extract structured recipe data from HTML content.

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "title": "Recipe Title",
  "author": "Author Name or null",
  "prepTime": <number in minutes>,
  "cookTime": <number in minutes>,
  "totalTime": <number in minutes>,
  "servings": <number>,
  "difficulty": "easy" | "medium" | "advanced" | "project",
  "requiredEquipment": ["equipment1", "equipment2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": <number>,
      "unit": "unit string (cups, tbsp, lbs, etc.)",
      "preparation": "optional prep instructions like 'diced' or 'minced'",
      "optional": false,
      "category": "protein" | "produce" | "dairy" | "grains" | "spices" | "canned" | "other"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Full step instruction",
      "duration": <optional number in minutes>,
      "isActive": true,
      "technique": "optional technique name like 'searing' or 'braising'",
      "tip": "optional chef tip for this step"
    }
  ],
  "tags": ["tag1", "tag2"],
  "chefNotes": "optional overall notes about the recipe"
}

Guidelines:
- Parse quantities intelligently (e.g., "1/2 cup" = 0.5, "2-3 cloves" = 2.5)
- Determine difficulty based on techniques, time, and complexity
- Categorize ingredients appropriately
- Extract equipment mentioned in ingredients or steps
- Identify techniques like searing, braising, sautéing, etc.
- Generate helpful tags based on cuisine, diet, course, etc.
- If information is missing, make reasonable estimates
- isActive should be true for hands-on steps, false for passive waiting`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Parse this recipe from ${url}:\n\n${cleanHtmlForParsing(html)}`,
      },
    ],
    system: systemPrompt,
  });

  // Extract the text content
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (Claude sometimes adds markdown)
    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    return JSON.parse(jsonText) as ParsedRecipe;
  } catch (e) {
    console.error("Failed to parse Claude response:", textContent.text);
    throw new Error("Failed to parse recipe data from AI response");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  // Validate domain
  if (!isApprovedDomain(url)) {
    return res.status(400).json({
      success: false,
      error: `URL is not from an approved source. Approved domains: ${APPROVED_DOMAINS.join(", ")}`,
    });
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "AI service not configured",
    });
  }

  try {
    // Fetch the page content
    const html = await fetchPageContent(url);

    // Extract image URL before cleaning
    const imageUrl = extractImageUrl(html);

    // Parse with Claude
    const recipe = await parseWithClaude(html, url);

    // Add image URL if found
    if (imageUrl) {
      recipe.imageUrl = imageUrl;
    }

    return res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Recipe parse error:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse recipe",
    });
  }
}
