// AI Route - Claude API integration for generating directional documents
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();

// Initialize Anthropic client
const getAnthropicClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
};

// Generate directional document from user data
router.post("/generate-directions", async (req, res) => {
  try {
    const { directionalDocument, userPrototype } = req.body;

    if (!directionalDocument) {
      return res.status(400).json({ error: "Directional document data required" });
    }

    const client = getAnthropicClient();

    // Build the prompt with all user data
    const prompt = buildDirectionalPrompt(directionalDocument, userPrototype);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Parse the structured response
    const generatedDocument = parseGeneratedDocument(responseText);

    res.json({
      success: true,
      generatedDocument,
      rawResponse: responseText,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate directional document",
    });
  }
});

// Build the comprehensive prompt for Claude
function buildDirectionalPrompt(directionalDocument, userPrototype) {
  const { core, loops } = directionalDocument;

  // Format identity statements
  const identitySection = core.identityStatements.length > 0
    ? `Selected Identity Statements: ${core.identityStatements.join(", ")}`
    : "No identity statements selected";

  // Format value sliders
  const valueSection = Object.entries(core.valueSliders)
    .map(([dimension, value]) => {
      const [left, right] = dimension.split("_");
      const leanDirection = value < 5 ? left : value > 5 ? right : "balanced";
      const intensity = Math.abs(value - 5);
      return `  - ${formatDimension(dimension)}: ${value}/10 (${intensity > 2 ? "strongly" : "slightly"} ${leanDirection})`;
    })
    .join("\n");

  // Format loop priority ranking
  const prioritySection = core.tradeoffPriorities.loopPriorityRanking.length > 0
    ? core.tradeoffPriorities.loopPriorityRanking
        .map((loop, i) => `  ${i + 1}. ${loop}`)
        .join("\n")
    : "No priority ranking set";

  // Format tradeoff resolutions
  const tradeoffSection = core.tradeoffPriorities.conflictResolutions
    .map((r) => `  - Scenario ${r.scenarioId}: Chose ${r.chosenLoop}`)
    .join("\n") || "No tradeoffs resolved";

  // Format resource philosophy
  const resourceSection = `
  Energy Management: ${core.resourcePhilosophy.energyManagement}
  Financial Approach: ${core.resourcePhilosophy.financialApproach}
  Time Allocation:
${Object.entries(core.resourcePhilosophy.timeAllocation)
    .map(([loop, pct]) => `    - ${loop}: ${pct}%`)
    .join("\n")}`;

  // Format loop-specific directions
  const loopSections = Object.entries(loops)
    .map(([loopId, loopData]) => {
      return `
### ${loopId} Loop
- Current Season: ${loopData.currentSeason}
- Current Allocation: ${loopData.currentAllocation}% (Desired: ${loopData.desiredAllocation}%)
- Current Satisfaction: ${loopData.currentSatisfaction}/100
- Thriving Vision: ${loopData.thrivingDescription.join(", ") || "Not specified"}
- Non-Negotiables: ${loopData.nonNegotiables.join(", ") || "Not specified"}
- Minimum Standards: ${loopData.minimumStandards.join(", ") || "Not specified"}
- Feeds: ${loopData.feedsLoops.join(", ") || "None specified"}
- Draws From: ${loopData.drawsFromLoops.join(", ") || "None specified"}`;
    })
    .join("\n");

  // Format archetype info if available
  let archetypeSection = "";
  if (userPrototype?.archetypeBlend) {
    const blend = userPrototype.archetypeBlend;
    archetypeSection = `
## Personality Profile (from intake assessment)
- Archetype Blend: ${blend.name}
- Primary: ${blend.primary} (${blend.scores[blend.primary]}%)
- Secondary: ${blend.secondary} (${blend.scores[blend.secondary]}%)
${blend.tertiary ? `- Tertiary: ${blend.tertiary} (${blend.scores[blend.tertiary]}%)` : ""}

### Key Traits:
${userPrototype.traits ? Object.entries(userPrototype.traits)
    .filter(([_, v]) => v < 35 || v > 65) // Only notable traits
    .map(([trait, value]) => {
      const [left, right] = trait.split("_");
      return `  - ${formatDimension(trait)}: ${value < 50 ? left : right} (${value}/100)`;
    })
    .join("\n") : "No traits recorded"}

### Core Values:
${userPrototype.values?.selectedIds?.join(", ") || "Not selected"}

### Voice Preferences:
${userPrototype.voiceProfile ? `
  - Tone: ${userPrototype.voiceProfile.tone}
  - Motivation Style: ${userPrototype.voiceProfile.motivationStyle}
  - Detail Level: ${userPrototype.voiceProfile.detailLevel}
` : "Not configured"}
`;
  }

  return `You are a personal life coach and strategist helping someone create their personal directional document - a synthesis of their values, priorities, and life direction that will guide their decisions.

Based on the following comprehensive profile data, generate a personalized directional document that synthesizes all their inputs into actionable guidance.

${archetypeSection}

## Core Directions

### Identity (Who They Want To Be)
${identitySection}

### Value Orientations (1-10 scale, 5 is balanced)
${valueSection}

### Loop Priority Ranking (Highest to Lowest)
${prioritySection}

### Tradeoff Decisions Made
${tradeoffSection}

### Resource Philosophy
${resourceSection}

## Loop-Specific Directions
${loopSections}

---

Please generate a comprehensive directional document with the following sections. Use the person's voice preferences and archetype to adjust the tone. Be specific and reference their actual choices.

Respond in this exact JSON format:
{
  "summary": "A 2-3 paragraph executive summary of who this person is and what they're optimizing for. Reference their archetype, top values, and key priorities. Make it feel personal and insightful.",
  "missionStatement": "A 1-2 sentence personal mission statement synthesized from their identity statements, values, and priorities.",
  "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "loopDirectives": {
    "Health": "Specific guidance for this loop based on their selections...",
    "Wealth": "...",
    "Family": "...",
    "Work": "...",
    "Fun": "...",
    "Maintenance": "...",
    "Meaning": "..."
  },
  "decisionFramework": [
    "When facing X type of tradeoff, you've indicated preference for Y...",
    "..."
  ],
  "guardrails": [
    "Based on your non-negotiables, never sacrifice X for Y...",
    "..."
  ],
  "potentialConflicts": [
    "Your high priority on X may conflict with your stated value of Y...",
    "..."
  ],
  "weeklyRhythm": "Suggested weekly rhythm based on their time allocations and energy management style...",
  "recommendations": [
    "Specific actionable recommendation 1...",
    "..."
  ]
}

Be insightful, not generic. Reference their specific choices. If they lean heavily in one direction, acknowledge that. If there are tensions in their choices, surface them constructively.`;
}

// Helper to format dimension names
function formatDimension(dimension) {
  return dimension
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" vs ");
}

// Parse the Claude response into structured format
function parseGeneratedDocument(responseText) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || "",
        missionStatement: parsed.missionStatement || "",
        keyThemes: parsed.keyThemes || [],
        loopDirectives: parsed.loopDirectives || {},
        decisionFramework: parsed.decisionFramework || [],
        guardrails: parsed.guardrails || [],
        potentialConflicts: parsed.potentialConflicts || [],
        weeklyRhythm: parsed.weeklyRhythm || "",
        recommendations: parsed.recommendations || [],
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
  }

  // Fallback: return the raw text as summary
  return {
    summary: responseText,
    missionStatement: "",
    keyThemes: [],
    loopDirectives: {},
    decisionFramework: [],
    guardrails: [],
    potentialConflicts: [],
    weeklyRhythm: "",
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };
}

// Loop-specific AI chat endpoint
router.post("/loop-chat", async (req, res) => {
  try {
    const { loopId, message, context, userPrototype, directionalDocument } = req.body;

    if (!loopId || !message) {
      return res.status(400).json({ error: "Loop ID and message required" });
    }

    const client = getAnthropicClient();

    // Build loop-specific system prompt
    const systemPrompt = buildLoopChatPrompt(loopId, context, userPrototype, directionalDocument);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({
      success: true,
      response: responseText,
      loopId,
    });
  } catch (error) {
    console.error("Loop chat error:", error);
    res.status(500).json({
      error: error.message || "Failed to get AI response",
    });
  }
});

// Build loop-specific chat prompt
function buildLoopChatPrompt(loopId, context, userPrototype, directionalDocument) {
  const loopDescriptions = {
    Health: "physical and mental wellbeing, fitness, sleep, nutrition, stress management, and medical care",
    Wealth: "finances, budgeting, investing, career income, financial security, and money management",
    Family: "relationships with family members, partner, children, close friends, and maintaining strong social bonds",
    Work: "career, professional development, job satisfaction, skills, productivity, and work-life balance",
    Fun: "hobbies, recreation, entertainment, social activities, creativity, and play",
    Maintenance: "home care, chores, errands, organization, administrative tasks, and keeping life running smoothly",
    Meaning: "purpose, spirituality, personal growth, contribution, values alignment, and life significance",
  };

  const loopFocus = loopDescriptions[loopId] || "general life management";

  // Get user's directional document info for this loop if available
  let loopDirective = "";
  let loopDetails = "";
  if (directionalDocument?.generatedDocument?.loopDirectives?.[loopId]) {
    loopDirective = `\n\nTheir personal directive for ${loopId}: "${directionalDocument.generatedDocument.loopDirectives[loopId]}"`;
  }
  if (directionalDocument?.loops?.[loopId]) {
    const loopData = directionalDocument.loops[loopId];
    loopDetails = `
Their ${loopId} loop status:
- Current Season: ${loopData.currentSeason}
- Current Satisfaction: ${loopData.currentSatisfaction}/100
- Non-Negotiables: ${loopData.nonNegotiables?.join(", ") || "Not specified"}`;
  }

  // Get archetype info if available
  let archetypeContext = "";
  if (userPrototype?.archetypeBlend) {
    const blend = userPrototype.archetypeBlend;
    archetypeContext = `\n\nUser archetype: ${blend.name} (${blend.primary} primary, ${blend.secondary} secondary)`;
    if (userPrototype.voiceProfile) {
      archetypeContext += `\nPreferred communication: ${userPrototype.voiceProfile.tone} tone, ${userPrototype.voiceProfile.motivationStyle} motivation style`;
    }
  }

  // Add context-specific info (tasks, goals, recent data)
  let contextInfo = "";
  if (context) {
    if (context.tasks?.length > 0) {
      contextInfo += `\n\nCurrent ${loopId} tasks:\n${context.tasks.map(t => `- ${t.title}${t.completed ? ' (done)' : ''}`).join('\n')}`;
    }
    if (context.goals?.length > 0) {
      contextInfo += `\n\nCurrent ${loopId} goals:\n${context.goals.map(g => `- ${g.title}`).join('\n')}`;
    }
    if (context.recentData) {
      contextInfo += `\n\nRecent data: ${JSON.stringify(context.recentData)}`;
    }
  }

  return `You are a friendly, insightful AI assistant specialized in ${loopFocus} - the "${loopId}" loop of life management.

Your role is to help this user with their ${loopId} loop - offering suggestions, answering questions, providing accountability, and helping them make progress.${archetypeContext}${loopDirective}${loopDetails}${contextInfo}

Guidelines:
- Be conversational and supportive, not preachy
- Give specific, actionable advice when asked
- Reference their personal context when relevant
- Keep responses concise (2-4 paragraphs max unless they ask for more)
- If they seem stressed, acknowledge it before diving into solutions
- Suggest small wins and incremental progress
- Be honest if something seems unrealistic

You can help with:
- Brainstorming and planning
- Breaking down big goals into tasks
- Troubleshooting challenges
- Celebrating wins
- Providing perspective
- Suggesting resources or approaches`;
}

// Parse recipe from URL - fetches webpage and uses Claude to extract recipe data
router.post("/parse-recipe", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Fetch the webpage content
    let pageContent;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      pageContent = await response.text();
    } catch (fetchError) {
      return res.status(400).json({
        error: `Failed to fetch URL: ${fetchError.message}`
      });
    }

    // Truncate content if too long (Claude has limits)
    const maxChars = 50000;
    if (pageContent.length > maxChars) {
      pageContent = pageContent.substring(0, maxChars);
    }

    const client = getAnthropicClient();

    const prompt = `You are a recipe parser. Extract the recipe information from this webpage HTML and return it as JSON.

The webpage is from: ${url}

Extract and return this JSON structure (fill in what you can find, use null for missing data):
{
  "title": "Recipe title",
  "author": "Recipe author if found",
  "description": "Brief description of the dish",
  "prepTime": number in minutes,
  "cookTime": number in minutes,
  "totalTime": number in minutes,
  "servings": number,
  "difficulty": "easy" | "medium" | "advanced" | "project",
  "cuisine": "Cuisine type",
  "course": ["breakfast" | "lunch" | "dinner" | "snack" | "dessert"],
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": number or null,
      "unit": "unit of measurement",
      "preparation": "how to prep (diced, minced, etc)",
      "optional": boolean
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Step instruction",
      "duration": minutes or null,
      "tip": "Any tips for this step"
    }
  ],
  "chefNotes": "Any notes or tips from the recipe author",
  "requiredEquipment": ["equipment1", "equipment2"]
}

Difficulty guide:
- easy: Simple techniques, under 30 min active time, beginner-friendly
- medium: Some technique required, 30-60 min, comfortable home cook
- advanced: Complex techniques, precision required, experienced cooks
- project: Multi-day or very complex, for cooking enthusiasts

Here is the webpage HTML content:

${pageContent}

Return ONLY the JSON object, no markdown, no explanation.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Parse the JSON response
    let parsedRecipe;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedRecipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse recipe JSON:", parseError);
      return res.status(500).json({
        error: "Failed to parse recipe data from page",
        rawResponse: responseText.substring(0, 500)
      });
    }

    // Determine source name from URL
    const sourceName = getSourceName(parsedUrl.hostname);

    // Format the recipe for our app
    const recipe = {
      id: `recipe_${Date.now()}`,
      title: parsedRecipe.title || "Untitled Recipe",
      slug: generateSlug(parsedRecipe.title || "untitled"),
      source: {
        type: "website",
        name: sourceName,
        approved: isApprovedSource(parsedUrl.hostname),
      },
      sourceUrl: url,
      author: parsedRecipe.author || null,
      prepTime: parsedRecipe.prepTime || 0,
      cookTime: parsedRecipe.cookTime || 0,
      totalTime: parsedRecipe.totalTime || (parsedRecipe.prepTime || 0) + (parsedRecipe.cookTime || 0),
      servings: parsedRecipe.servings || 4,
      difficulty: parsedRecipe.difficulty || "medium",
      techniqueLevel: mapDifficultyToTechniqueLevel(parsedRecipe.difficulty),
      cuisine: parsedRecipe.cuisine || null,
      course: parsedRecipe.course || ["dinner"],
      tags: parsedRecipe.tags || [],
      ingredients: (parsedRecipe.ingredients || []).map((ing, i) => ({
        id: String(i + 1),
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || "",
        preparation: ing.preparation || null,
        optional: ing.optional || false,
        normalizedName: ing.name?.toLowerCase().replace(/[^a-z0-9]/g, " ").trim(),
        category: categorizeIngredient(ing.name),
      })),
      steps: (parsedRecipe.steps || []).map((step, i) => ({
        stepNumber: step.stepNumber || i + 1,
        instruction: step.instruction,
        duration: step.duration || null,
        tip: step.tip || null,
        isActive: true,
      })),
      chefNotes: parsedRecipe.chefNotes || null,
      requiredEquipment: parsedRecipe.requiredEquipment || [],
      scalable: true,
      rating: null,
      timesMade: 0,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Recipe parse error:", error);
    res.status(500).json({
      error: error.message || "Failed to parse recipe",
    });
  }
});

// Helper functions for recipe parsing
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSourceName(hostname) {
  const sourceMap = {
    "seriouseats.com": "Serious Eats",
    "www.seriouseats.com": "Serious Eats",
    "bonappetit.com": "Bon Appétit",
    "www.bonappetit.com": "Bon Appétit",
    "nytimes.com": "NYT Cooking",
    "cooking.nytimes.com": "NYT Cooking",
    "www.nytimes.com": "NYT Cooking",
    "foodnetwork.com": "Food Network",
    "www.foodnetwork.com": "Food Network",
    "allrecipes.com": "AllRecipes",
    "www.allrecipes.com": "AllRecipes",
    "epicurious.com": "Epicurious",
    "www.epicurious.com": "Epicurious",
    "food52.com": "Food52",
    "www.food52.com": "Food52",
    "thekitchn.com": "The Kitchn",
    "www.thekitchn.com": "The Kitchn",
    "budgetbytes.com": "Budget Bytes",
    "www.budgetbytes.com": "Budget Bytes",
    "smittenkitchen.com": "Smitten Kitchen",
    "www.smittenkitchen.com": "Smitten Kitchen",
    "minimalistbaker.com": "Minimalist Baker",
    "www.minimalistbaker.com": "Minimalist Baker",
  };
  return sourceMap[hostname] || hostname.replace(/^www\./, "").split(".")[0];
}

function isApprovedSource(hostname) {
  const approvedDomains = [
    "seriouseats.com",
    "bonappetit.com",
    "nytimes.com",
    "cooking.nytimes.com",
    "foodnetwork.com",
    "allrecipes.com",
    "epicurious.com",
    "food52.com",
    "thekitchn.com",
    "budgetbytes.com",
    "smittenkitchen.com",
    "minimalistbaker.com",
  ];
  return approvedDomains.some((domain) => hostname.includes(domain));
}

function mapDifficultyToTechniqueLevel(difficulty) {
  const map = {
    easy: "basic",
    medium: "intermediate",
    advanced: "advanced",
    project: "expert",
  };
  return map[difficulty] || "intermediate";
}

function categorizeIngredient(name) {
  if (!name) return "other";
  const lower = name.toLowerCase();

  // Proteins
  if (/beef|chicken|pork|lamb|fish|salmon|shrimp|tofu|turkey|bacon|sausage|steak|ground/.test(lower)) {
    return "protein";
  }
  // Dairy
  if (/milk|cream|cheese|butter|yogurt|egg|sour cream/.test(lower)) {
    return "dairy";
  }
  // Vegetables
  if (/onion|garlic|carrot|celery|pepper|tomato|potato|lettuce|spinach|broccoli|mushroom|zucchini|squash|corn|pea|bean|cabbage|kale|cucumber/.test(lower)) {
    return "vegetable";
  }
  // Fruits
  if (/apple|banana|orange|lemon|lime|berry|grape|mango|peach|pear|avocado/.test(lower)) {
    return "fruit";
  }
  // Grains
  if (/rice|pasta|bread|flour|oat|noodle|quinoa|barley|wheat|tortilla|bun/.test(lower)) {
    return "grain";
  }
  // Spices
  if (/salt|pepper|cumin|paprika|oregano|basil|thyme|rosemary|cinnamon|nutmeg|ginger|turmeric|cayenne|chili|spice|seasoning/.test(lower)) {
    return "spice";
  }
  // Oils & fats
  if (/oil|olive|vegetable oil|coconut|lard|shortening/.test(lower)) {
    return "oil_fat";
  }
  // Condiments
  if (/sauce|ketchup|mustard|mayo|vinegar|soy sauce|worcestershire|hot sauce|dressing/.test(lower)) {
    return "condiment";
  }
  // Liquids
  if (/broth|stock|wine|water|juice/.test(lower)) {
    return "liquid";
  }

  return "other";
}

export default router;
