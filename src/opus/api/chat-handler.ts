// Opus AI Assistant Layer - Chat API Handler
// Handles communication with Claude API for Opus conversations

import { LoopId } from "../../types/core";
import { UserPrototype } from "../../types/identity";
import { LoopState } from "../../types/loops";
import { Task } from "../../types/tasks";
import { Routine, RoutineCompletion } from "../../types/routines";
import { Goal } from "../../types/goals";
import { System, HabitCompletion } from "../../types/systems";
import { DayType } from "../../types/dayTypes";

import {
  OpusDomainId,
  OpusRequest,
  OpusResponse,
  OpusConversation,
  OpusMessage,
  OpusContextSnapshot,
  OpusUserSettings,
  DEFAULT_OPUS_SETTINGS,
} from "../types/opus-types";

import {
  buildContextSnapshot,
  prepareOpusRequest,
  processOpusResponse,
  createConversation,
  addMessageToConversation,
  getConversationHistoryForAPI,
  getOpusGreeting,
  ContextSources,
} from "../engine/opus-engine";

// ============================================================================
// API CONFIGURATION
// ============================================================================

export type OpusAPIConfig = {
  /** Anthropic API key */
  apiKey: string;

  /** Model to use */
  model: string;

  /** Max tokens for response */
  maxTokens: number;

  /** Temperature (0-1) */
  temperature: number;

  /** API endpoint (for proxying through backend) */
  endpoint?: string;
};

const DEFAULT_API_CONFIG: Omit<OpusAPIConfig, "apiKey"> = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 1024,
  temperature: 0.7,
};

// ============================================================================
// CHAT HANDLER CLASS
// ============================================================================

/**
 * OpusChatHandler manages Opus conversations and API communication
 */
export class OpusChatHandler {
  private config: OpusAPIConfig;
  private settings: OpusUserSettings;
  private activeConversation: OpusConversation | null = null;
  private prototype: UserPrototype | null = null;
  private contextSources: ContextSources = {};

  constructor(apiKey: string, settings?: Partial<OpusUserSettings>) {
    this.config = {
      ...DEFAULT_API_CONFIG,
      apiKey,
    };
    this.settings = { ...DEFAULT_OPUS_SETTINGS, ...settings };
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Update API configuration
   */
  setAPIConfig(config: Partial<OpusAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update user settings
   */
  setSettings(settings: Partial<OpusUserSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Set the user prototype for personalization
   */
  setPrototype(prototype: UserPrototype): void {
    this.prototype = prototype;
  }

  /**
   * Update context sources
   */
  setContextSources(sources: ContextSources): void {
    this.contextSources = sources;
  }

  /**
   * Get current active conversation
   */
  getActiveConversation(): OpusConversation | null {
    return this.activeConversation;
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Start a new conversation with an Opus domain
   */
  startConversation(
    userId: string,
    domain: OpusDomainId,
    includeGreeting: boolean = true
  ): OpusConversation {
    if (!this.prototype) {
      throw new Error("User prototype must be set before starting conversation");
    }

    const context = buildContextSnapshot(
      this.prototype,
      this.contextSources,
      this.settings.contextDepth
    );

    const conversation = createConversation(userId, domain, context);

    // Add greeting message if requested
    if (includeGreeting) {
      const greeting = getOpusGreeting(domain, this.prototype, "there");
      this.activeConversation = addMessageToConversation(
        conversation,
        "assistant",
        greeting,
        domain
      );
    } else {
      this.activeConversation = conversation;
    }

    return this.activeConversation;
  }

  /**
   * Resume an existing conversation
   */
  resumeConversation(conversation: OpusConversation): void {
    this.activeConversation = conversation;
  }

  /**
   * End current conversation
   */
  endConversation(): OpusConversation | null {
    const conversation = this.activeConversation;
    if (conversation) {
      conversation.status = "archived";
    }
    this.activeConversation = null;
    return conversation;
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Send a message and get a response
   */
  async sendMessage(
    message: string,
    domain: OpusDomainId | "auto" = "auto"
  ): Promise<OpusResponse> {
    if (!this.prototype) {
      throw new Error("User prototype must be set before sending messages");
    }

    if (!this.settings.enabled) {
      throw new Error("Opus is disabled in settings");
    }

    // Build fresh context
    const context = buildContextSnapshot(
      this.prototype,
      this.contextSources,
      this.settings.contextDepth
    );

    // Get conversation history
    const conversationHistory = this.activeConversation
      ? this.activeConversation.messages.slice(-this.settings.maxHistoryMessages)
      : [];

    // Build request
    const request: OpusRequest = {
      message,
      domain,
      userPrototype: this.prototype,
      context,
      conversationHistory,
      voiceModifierOverride: this.settings.domainOverrides[domain === "auto" ? "Life" : domain],
    };

    // Prepare for API call
    const prepared = prepareOpusRequest(request);

    // Record start time
    const startTime = Date.now();

    // Make API call
    const rawResponse = await this.callClaudeAPI(prepared.messages);

    // Calculate response time
    const responseTimeMs = Date.now() - startTime;

    // Process response
    const response = processOpusResponse(
      rawResponse.content,
      prepared.domain,
      this.prototype,
      prepared.voiceModifier,
      prepared.intent,
      context,
      {
        tokensUsed: rawResponse.tokensUsed,
        responseTimeMs,
        modelUsed: this.config.model,
      }
    );

    // Update conversation
    if (this.activeConversation) {
      this.activeConversation = addMessageToConversation(
        this.activeConversation,
        "user",
        message
      );
      this.activeConversation = addMessageToConversation(
        this.activeConversation,
        "assistant",
        response.message,
        prepared.domain
      );

      // Update message metadata
      const lastMessage = this.activeConversation.messages[
        this.activeConversation.messages.length - 1
      ];
      lastMessage.metadata = {
        tokensUsed: rawResponse.tokensUsed,
        responseTimeMs,
        voiceApplied: true,
        archetypeUsed: this.prototype.archetypeBlend.primary,
      };
    }

    return response;
  }

  /**
   * Send a quick action prompt
   */
  async sendQuickAction(
    actionId: string,
    prompt: string,
    domain: OpusDomainId
  ): Promise<OpusResponse> {
    // Start fresh conversation for quick action
    if (this.activeConversation?.primaryDomain !== domain) {
      this.startConversation(
        this.activeConversation?.userId || "user",
        domain,
        false
      );
    }

    return this.sendMessage(prompt, domain);
  }

  // ============================================================================
  // API COMMUNICATION
  // ============================================================================

  /**
   * Call Claude API
   */
  private async callClaudeAPI(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  ): Promise<{ content: string; tokensUsed: number }> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === "system");
    const conversationMessages = messages.filter(m => m.role !== "system");

    const endpoint = this.config.endpoint || "https://api.anthropic.com/v1/messages";

    const requestBody = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemMessage?.content || "",
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Extract content from response
      const content = data.content?.[0]?.text || "";
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      return { content, tokensUsed };
    } catch (error) {
      console.error("Opus API call failed:", error);
      throw error;
    }
  }

  // ============================================================================
  // STREAMING SUPPORT
  // ============================================================================

  /**
   * Send a message with streaming response
   */
  async *sendMessageStreaming(
    message: string,
    domain: OpusDomainId | "auto" = "auto"
  ): AsyncGenerator<{ chunk: string; done: boolean; response?: OpusResponse }> {
    if (!this.prototype) {
      throw new Error("User prototype must be set before sending messages");
    }

    if (!this.settings.enabled) {
      throw new Error("Opus is disabled in settings");
    }

    // Build context and request
    const context = buildContextSnapshot(
      this.prototype,
      this.contextSources,
      this.settings.contextDepth
    );

    const conversationHistory = this.activeConversation
      ? this.activeConversation.messages.slice(-this.settings.maxHistoryMessages)
      : [];

    const request: OpusRequest = {
      message,
      domain,
      userPrototype: this.prototype,
      context,
      conversationHistory,
    };

    const prepared = prepareOpusRequest(request);
    const startTime = Date.now();

    // Stream from API
    const chunks: string[] = [];

    for await (const chunk of this.streamClaudeAPI(prepared.messages)) {
      chunks.push(chunk);
      yield { chunk, done: false };
    }

    // Build final response
    const fullContent = chunks.join("");
    const responseTimeMs = Date.now() - startTime;

    const response = processOpusResponse(
      fullContent,
      prepared.domain,
      this.prototype,
      prepared.voiceModifier,
      prepared.intent,
      context,
      {
        tokensUsed: 0, // Not available in streaming
        responseTimeMs,
        modelUsed: this.config.model,
      }
    );

    // Update conversation
    if (this.activeConversation) {
      this.activeConversation = addMessageToConversation(
        this.activeConversation,
        "user",
        message
      );
      this.activeConversation = addMessageToConversation(
        this.activeConversation,
        "assistant",
        response.message,
        prepared.domain
      );
    }

    yield { chunk: "", done: true, response };
  }

  /**
   * Stream from Claude API
   */
  private async *streamClaudeAPI(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  ): AsyncGenerator<string> {
    const systemMessage = messages.find(m => m.role === "system");
    const conversationMessages = messages.filter(m => m.role !== "system");

    const endpoint = this.config.endpoint || "https://api.anthropic.com/v1/messages";

    const requestBody = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemMessage?.content || "",
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.text) {
                yield event.delta.text;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Opus streaming API call failed:", error);
      throw error;
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an Opus chat handler with context from app state
 */
export function createOpusChatHandler(
  apiKey: string,
  prototype: UserPrototype,
  contextSources: ContextSources,
  settings?: Partial<OpusUserSettings>
): OpusChatHandler {
  const handler = new OpusChatHandler(apiKey, settings);
  handler.setPrototype(prototype);
  handler.setContextSources(contextSources);
  return handler;
}

// ============================================================================
// SERVERLESS API HANDLER (for Vercel/Next.js API routes)
// ============================================================================

export type OpusAPIRequest = {
  message: string;
  domain: OpusDomainId | "auto";
  prototype: UserPrototype;
  context: OpusContextSnapshot;
  conversationHistory?: OpusMessage[];
  settings?: Partial<OpusUserSettings>;
};

export type OpusAPIResponse = {
  success: boolean;
  response?: OpusResponse;
  error?: string;
};

/**
 * Handle an Opus API request (for serverless functions)
 */
export async function handleOpusAPIRequest(
  req: OpusAPIRequest,
  apiKey: string
): Promise<OpusAPIResponse> {
  try {
    const settings = { ...DEFAULT_OPUS_SETTINGS, ...req.settings };

    if (!settings.enabled) {
      return { success: false, error: "Opus is disabled" };
    }

    // Build request
    const request: OpusRequest = {
      message: req.message,
      domain: req.domain,
      userPrototype: req.prototype,
      context: req.context,
      conversationHistory: req.conversationHistory,
    };

    // Prepare for API
    const prepared = prepareOpusRequest(request);

    // Call Claude API
    const startTime = Date.now();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.7,
        system: prepared.messages.find(m => m.role === "system")?.content || "",
        messages: prepared.messages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    const responseTimeMs = Date.now() - startTime;

    // Process response
    const opusResponse = processOpusResponse(
      content,
      prepared.domain,
      req.prototype,
      prepared.voiceModifier,
      prepared.intent,
      req.context,
      {
        tokensUsed,
        responseTimeMs,
        modelUsed: "claude-sonnet-4-20250514",
      }
    );

    return { success: true, response: opusResponse };
  } catch (error) {
    console.error("Opus API handler error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
