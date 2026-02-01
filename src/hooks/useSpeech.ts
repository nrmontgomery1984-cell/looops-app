// useSpeech - Custom hook for speech recognition and text-to-speech
import { useState, useCallback, useRef, useEffect } from "react";

// Types for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechOptions {
  lang?: string;
  interimResults?: boolean;
  voiceRate?: number;
  voicePitch?: number;
}

export interface UseSpeechReturn {
  // Speech Recognition (Voice Input)
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  recognitionSupported: boolean;
  recognitionError: string | null;

  // Text-to-Speech (Voice Output)
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  ttsSupported: boolean;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  voiceRate: number;
  setVoiceRate: (rate: number) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = "en-US",
    interimResults = true,
    voiceRate: initialVoiceRate = 1,
    voicePitch = 1,
  } = options;

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(initialVoiceRate);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  const recognitionSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Track whether we intentionally want to keep listening
  const wantListening = useRef(false);

  // Initialize Speech Recognition (lazy - created once, not in an effect)
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    if (!recognitionSupported) return null;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    // Disable continuous mode - recognition stops after user finishes speaking
    // This prevents duplicate text issues on mobile
    recognition.continuous = false;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      console.log("[Speech] recognition.onstart fired");
      setIsListening(true);
      setRecognitionError(null);
    };

    recognition.addEventListener("audiostart", () => {
      console.log("[Speech] audiostart - microphone audio is being captured");
    });

    recognition.addEventListener("soundstart", () => {
      console.log("[Speech] soundstart - sound detected");
    });

    recognition.addEventListener("speechstart", () => {
      console.log("[Speech] speechstart - speech detected");
    });

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log("[Speech] onresult fired, results.length:", event.results.length);

      // Get the latest result (non-continuous mode typically has just one)
      const lastResult = event.results[event.results.length - 1];
      const text = lastResult[0].transcript;

      if (lastResult.isFinal) {
        console.log("[Speech] final:", text);
        setTranscript(text);
        setInterimTranscript("");
      } else {
        console.log("[Speech] interim:", text);
        setInterimTranscript(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[Speech] onerror:", event.error, event.message);

      // Handle aborted errors silently (user stopped listening intentionally)
      if (event.error === "aborted") {
        return;
      }

      // Show user-friendly error messages
      if (event.error === "no-speech") {
        setRecognitionError("No speech detected. Tap the mic and try speaking again.");
        wantListening.current = false;
        setIsListening(false);
        return;
      }

      if (event.error === "not-allowed") {
        setRecognitionError("Microphone access denied. Please allow microphone permission.");
      } else if (event.error === "network") {
        setRecognitionError("Network error. Check your internet connection.");
      } else if (event.error === "audio-capture") {
        setRecognitionError("No microphone found. Check your audio settings.");
      } else {
        setRecognitionError(`Voice input error: ${event.error}`);
      }
      wantListening.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("[Speech] onend fired");
      // Don't auto-restart - user taps mic again if they want to continue
      wantListening.current = false;
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [recognitionSupported, interimResults, lang]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        wantListening.current = false;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Load available voices for TTS
  useEffect(() => {
    if (!ttsSupported) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Select a default English voice
      if (!selectedVoice && voices.length > 0) {
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en") && v.localService
        ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsSupported, selectedVoice]);

  // Speech Recognition Controls
  const startListening = useCallback(() => {
    if (isListening) return;

    const recognition = initRecognition();
    if (!recognition) return;

    setTranscript("");
    setInterimTranscript("");
    setRecognitionError(null);
    wantListening.current = true;

    try {
      console.log("[Speech] calling recognition.start()");
      recognition.start();
    } catch (error) {
      console.warn("[Speech] start error:", error);
      wantListening.current = false;
    }
  }, [isListening, initRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wantListening.current = false;
    recognitionRef.current.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Text-to-Speech Controls
  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !ttsEnabled || !text.trim()) return;

      // Stop any current speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      utterance.lang = lang;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [ttsSupported, ttsEnabled, voiceRate, voicePitch, lang, selectedVoice]
  );

  const pauseSpeaking = useCallback(() => {
    if (!ttsSupported || !isSpeaking) return;
    speechSynthesis.pause();
    setIsPaused(true);
  }, [ttsSupported, isSpeaking]);

  const resumeSpeaking = useCallback(() => {
    if (!ttsSupported || !isPaused) return;
    speechSynthesis.resume();
    setIsPaused(false);
  }, [ttsSupported, isPaused]);

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [ttsSupported]);

  return {
    // Speech Recognition
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    recognitionSupported,
    recognitionError,

    // Text-to-Speech
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
    availableVoices,
    selectedVoice,
    setSelectedVoice,
  };
}

export default useSpeech;
