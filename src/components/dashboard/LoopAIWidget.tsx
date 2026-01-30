// Loop AI Widget - Chat with Claude about a specific life loop
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LoopId, Task, Goal } from "../../types";
import { LOOP_COLORS } from "../../types/core";
import { useApp } from "../../context/AppContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface LoopAIWidgetProps {
  loopId: LoopId;
  tasks?: Task[];
  goals?: Goal[];
  recentData?: Record<string, unknown>;
  compact?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Suggested prompts per loop
const LOOP_SUGGESTIONS: Record<LoopId, string[]> = {
  Health: [
    "How can I improve my sleep?",
    "Quick workout ideas",
    "Help me stay consistent",
  ],
  Wealth: [
    "Budget tips for this month",
    "How to save more",
    "Investment basics",
  ],
  Family: [
    "Quality time ideas",
    "How to communicate better",
    "Planning family activities",
  ],
  Work: [
    "Help me prioritize tasks",
    "Dealing with burnout",
    "Career growth tips",
  ],
  Fun: [
    "New hobby suggestions",
    "Weekend activity ideas",
    "How to make time for fun",
  ],
  Maintenance: [
    "Cleaning schedule help",
    "Organizing tips",
    "Streamline my chores",
  ],
  Meaning: [
    "Finding my purpose",
    "Daily reflection prompts",
    "How to give back",
  ],
};

export function LoopAIWidget({
  loopId,
  tasks,
  goals,
  recentData,
  compact = false,
}: LoopAIWidgetProps) {
  const { state } = useApp();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loopColor = LOOP_COLORS[loopId]?.border || "#6366f1";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const userMessage: Message = {
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/loop-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loopId,
            message: messageText,
            context: {
              tasks: tasks?.slice(0, 10), // Limit context size
              goals: goals?.slice(0, 5),
              recentData,
            },
            userPrototype: state.user.prototype,
            directionalDocument: state.directionalDocument,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.response) {
          const assistantMessage: Message = {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error("Invalid response from AI");
        }
      } catch (err) {
        console.error("Loop AI error:", err);
        setError(err instanceof Error ? err.message : "Failed to get response");
      } finally {
        setIsLoading(false);
      }
    },
    [loopId, tasks, goals, recentData, state.user.prototype, state.directionalDocument, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Compact collapsed view
  if (compact && !isExpanded) {
    return (
      <button
        className="loop-ai-widget loop-ai-widget--collapsed"
        onClick={() => setIsExpanded(true)}
        style={{ borderColor: loopColor }}
      >
        <span className="loop-ai-widget__icon">AI</span>
        <span className="loop-ai-widget__label">Ask Claude about {loopId}</span>
      </button>
    );
  }

  return (
    <div
      className={`loop-ai-widget ${compact ? "loop-ai-widget--compact" : ""}`}
      style={{ "--loop-color": loopColor } as React.CSSProperties}
    >
      <div className="loop-ai-widget__header">
        <div className="loop-ai-widget__title">
          <span
            className="loop-ai-widget__loop-badge"
            style={{ backgroundColor: loopColor }}
          >
            {loopId}
          </span>
          <span>AI Assistant</span>
        </div>
        <div className="loop-ai-widget__actions">
          {messages.length > 0 && (
            <button
              className="loop-ai-widget__clear-btn"
              onClick={clearChat}
              title="Clear chat"
            >
              Clear
            </button>
          )}
          {compact && (
            <button
              className="loop-ai-widget__close-btn"
              onClick={() => setIsExpanded(false)}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="loop-ai-widget__messages">
        {messages.length === 0 ? (
          <div className="loop-ai-widget__empty">
            <p>Ask me anything about your {loopId.toLowerCase()} loop!</p>
            <div className="loop-ai-widget__suggestions">
              {LOOP_SUGGESTIONS[loopId]?.map((suggestion, i) => (
                <button
                  key={i}
                  className="loop-ai-widget__suggestion"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`loop-ai-widget__message loop-ai-widget__message--${msg.role}`}
              >
                <div className="loop-ai-widget__message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="loop-ai-widget__message loop-ai-widget__message--assistant">
                <div className="loop-ai-widget__typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="loop-ai-widget__error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <form className="loop-ai-widget__input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="loop-ai-widget__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${loopId.toLowerCase()}...`}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="loop-ai-widget__send-btn"
          disabled={!input.trim() || isLoading}
          style={{ backgroundColor: loopColor }}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default LoopAIWidget;
