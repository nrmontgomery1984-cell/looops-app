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

export default router;
