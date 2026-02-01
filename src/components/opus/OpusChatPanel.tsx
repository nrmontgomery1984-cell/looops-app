// Opus Chat Panel - Chat with the 7 Opuses (AI assistants for each life domain)
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { OpusDomainId } from "../../opus/types/opus-types";
import { useSpeech } from "../../hooks/useSpeech";
import { auth } from "../../services/firebase";
import "./OpusChatPanel.css";

// Domain configuration
const OPUS_DOMAINS: Record<OpusDomainId, { name: string; color: string; icon: string }> = {
  Life: { name: "Life Opus", color: "#8B5CF6", icon: "✦" },
  Health: { name: "Health Opus", color: "#10B981", icon: "♥" },
  Wealth: { name: "Wealth Opus", color: "#F59E0B", icon: "$" },
  Family: { name: "Family Opus", color: "#EC4899", icon: "♦" },
  Work: { name: "Work Opus", color: "#3B82F6", icon: "◆" },
  Fun: { name: "Fun Opus", color: "#F97316", icon: "★" },
  Maintenance: { name: "Maintenance Opus", color: "#6B7280", icon: "⚙" },
  Meaning: { name: "Meaning Opus", color: "#A855F7", icon: "∞" },
};

const DOMAIN_SUGGESTIONS: Record<OpusDomainId, string[]> = {
  Life: [
    "What should I focus on today?",
    "Help me prioritize my week",
    "Am I spreading myself too thin?",
  ],
  Health: [
    "How can I improve my sleep?",
    "Quick workout ideas",
    "Help me stay consistent",
  ],
  Wealth: [
    "Budget tips for this month",
    "How to save more",
    "Review my spending habits",
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  domain: OpusDomainId;
}

interface OpusChatPanelProps {
  initialDomain?: OpusDomainId;
  onClose?: () => void;
  embedded?: boolean;
}

export function OpusChatPanel({
  initialDomain = "Life",
  onClose,
  embedded = false,
}: OpusChatPanelProps) {
  const { state } = useApp();
  const [activeDomain, setActiveDomain] = useState<OpusDomainId>(initialDomain);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSpokenMessageRef = useRef<string | null>(null);

  const domainConfig = OPUS_DOMAINS[activeDomain];

  // Speech recognition and text-to-speech
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    recognitionSupported,
    recognitionError,
    isSpeaking,
    isPaused,
    speak,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    ttsSupported,
    ttsEnabled,
    setTtsEnabled,
    voiceRate,
    setVoiceRate,
  } = useSpeech();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-dismiss errors after 4 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Update input when speech recognition captures text
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Speak assistant responses when streaming completes
  useEffect(() => {
    if (!ttsEnabled || !ttsSupported || isStreaming) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.role === "assistant" &&
      lastMessage.content &&
      lastMessage.id !== lastSpokenMessageRef.current
    ) {
      lastSpokenMessageRef.current = lastMessage.id;
      speak(lastMessage.content);
    }
  }, [messages, isStreaming, ttsEnabled, ttsSupported, speak]);

  // Handle voice input toggle
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInput("");
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Send message with streaming
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
        domain: activeDomain,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setIsStreaming(true);
      setError(null);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      // Create placeholder for streaming response
      const assistantMessageId = `msg_${Date.now()}_assistant`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        domain: activeDomain,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Use streaming endpoint
        abortControllerRef.current = new AbortController();

        // Use Firebase auth UID - this matches where data is stored
        const userId = auth?.currentUser?.uid || state.user.profile?.id || "anonymous";

        const response = await fetch("/api/opus/chat-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            domain: activeDomain,
            message: messageText,
            conversationId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response stream available");
        }

        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              let data;
              try {
                data = JSON.parse(line.slice(6));
              } catch (parseErr) {
                // Skip invalid JSON
                continue;
              }

              if (data.type === "token") {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              } else if (data.type === "done") {
                if (data.conversationId) {
                  setConversationId(data.conversationId);
                }
              } else if (data.type === "error") {
                // Throw error outside of try-catch so it's not swallowed
                throw new Error(data.content || "API error");
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Request was cancelled
          return;
        }
        console.error("Opus chat error:", err);
        setError(err instanceof Error ? err.message : "Failed to get response");

        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeDomain, conversationId, state.user.profile?.id, isLoading]
  );

  // Auto-send when voice input stops and there's captured text
  const wasListeningRef = useRef(false);
  useEffect(() => {
    if (isListening) {
      wasListeningRef.current = true;
    } else if (wasListeningRef.current) {
      wasListeningRef.current = false;
      if (transcript.trim()) {
        sendMessage(transcript.trim());
        resetTranscript();
      }
    }
  }, [isListening, transcript, sendMessage, resetTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const switchDomain = (domain: OpusDomainId) => {
    if (domain !== activeDomain) {
      setActiveDomain(domain);
      // Keep conversation but note the domain switch
    }
  };

  const clearChat = () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setConversationId(null);
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div
      className={`opus-chat-panel ${embedded ? "opus-chat-panel--embedded" : ""}`}
      style={{ "--opus-color": domainConfig.color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="opus-chat-panel__header">
        <div className="opus-chat-panel__title">
          <span
            className="opus-chat-panel__icon"
            style={{ backgroundColor: domainConfig.color }}
          >
            {domainConfig.icon}
          </span>
          <span>{domainConfig.name}</span>
        </div>
        <div className="opus-chat-panel__actions">
          {ttsSupported && (
            <div className="opus-chat-panel__tts-controls">
              <button
                className={`opus-chat-panel__action-btn opus-chat-panel__tts-btn ${
                  ttsEnabled ? "opus-chat-panel__tts-btn--active" : ""
                }`}
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                title={ttsEnabled ? "Disable voice output" : "Enable voice output"}
              >
                {isSpeaking ? "🔊" : ttsEnabled ? "🔈" : "🔇"}
              </button>
              {isSpeaking && (
                <button
                  className="opus-chat-panel__action-btn"
                  onClick={isPaused ? resumeSpeaking : pauseSpeaking}
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? "▶" : "⏸"}
                </button>
              )}
              {ttsEnabled && (
                <select
                  className="opus-chat-panel__speed-select"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(Number(e.target.value))}
                  title="Reading speed"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <button
              className="opus-chat-panel__action-btn"
              onClick={clearChat}
              title="Clear chat"
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              className="opus-chat-panel__close-btn"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Domain Selector */}
      <div className="opus-chat-panel__domains">
        {(Object.keys(OPUS_DOMAINS) as OpusDomainId[]).map((domain) => (
          <button
            key={domain}
            className={`opus-domain-btn ${
              domain === activeDomain ? "opus-domain-btn--active" : ""
            }`}
            onClick={() => switchDomain(domain)}
            style={{
              "--domain-color": OPUS_DOMAINS[domain].color,
            } as React.CSSProperties}
            title={OPUS_DOMAINS[domain].name}
          >
            <span className="opus-domain-btn__icon">
              {OPUS_DOMAINS[domain].icon}
            </span>
            <span className="opus-domain-btn__label">{domain}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="opus-chat-panel__messages">
        {messages.length === 0 ? (
          <div className="opus-chat-panel__empty">
            <div className="opus-chat-panel__welcome">
              <span
                className="opus-chat-panel__welcome-icon"
                style={{ color: domainConfig.color }}
              >
                {domainConfig.icon}
              </span>
              <h3>Welcome to {domainConfig.name}</h3>
              <p>I'm here to help you with your {activeDomain.toLowerCase()} goals.</p>
            </div>
            <div className="opus-chat-panel__suggestions">
              {DOMAIN_SUGGESTIONS[activeDomain]?.map((suggestion, i) => (
                <button
                  key={i}
                  className="opus-chat-panel__suggestion"
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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`opus-message opus-message--${msg.role}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="opus-message__avatar"
                    style={{ backgroundColor: OPUS_DOMAINS[msg.domain].color }}
                  >
                    {OPUS_DOMAINS[msg.domain].icon}
                  </div>
                )}
                <div className="opus-message__content">
                  {msg.content || (
                    <div className="opus-message__typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {(error || recognitionError) && (
        <div className="opus-chat-panel__error">
          <span>{error || `Voice input error: ${recognitionError}`}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Live transcript debug */}
      {isListening && (
        <div className="opus-chat-panel__live-transcript" style={{
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}>
          <div style={{ color: '#4caf50', marginBottom: 2 }}>
            🟢 Listening... {transcript ? `(${transcript.length} chars captured)` : '(waiting for speech)'}
          </div>
          {transcript && (
            <div style={{ color: '#fff', opacity: 0.9 }}>Final: "{transcript}"</div>
          )}
          {interimTranscript && (
            <div style={{ color: '#ffeb3b', opacity: 0.7 }}>Interim: "{interimTranscript}"</div>
          )}
          {!transcript && !interimTranscript && (
            <div style={{ color: '#ff9800', opacity: 0.7 }}>No speech detected yet — try speaking into your mic</div>
          )}
        </div>
      )}

      {/* Input */}
      <form className="opus-chat-panel__input-form" onSubmit={handleSubmit}>
        {isStreaming && (
          <button
            type="button"
            className="opus-chat-panel__stop-btn"
            onClick={stopStreaming}
          >
            Stop
          </button>
        )}
        {recognitionSupported && (
          <button
            type="button"
            className={`opus-chat-panel__mic-btn ${
              isListening ? "opus-chat-panel__mic-btn--active" : ""
            }`}
            onClick={toggleVoiceInput}
            disabled={isLoading}
            title={isListening ? "Stop listening" : "Start voice input"}
            style={isListening ? { backgroundColor: domainConfig.color } : undefined}
          >
            {isListening ? (
              <span className="opus-chat-panel__mic-waves">🎤</span>
            ) : (
              "🎤"
            )}
          </button>
        )}
        <textarea
          ref={inputRef}
          className="opus-chat-panel__input"
          value={isListening && interimTranscript ? input + interimTranscript : input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : `Ask ${domainConfig.name}...`}
          readOnly={isListening}
          disabled={isLoading}
          rows={1}
        />
        <button
          type="submit"
          className="opus-chat-panel__send-btn"
          disabled={!input.trim() || isLoading}
          style={{ backgroundColor: domainConfig.color }}
        >
          {isLoading ? (
            <span className="opus-chat-panel__send-loading"></span>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

export default OpusChatPanel;
