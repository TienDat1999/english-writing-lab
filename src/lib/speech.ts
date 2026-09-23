// Client-side natural speech player with OpenAI TTS and browser fallback

let currentAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, string>();

function stopCurrentSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function fallbackBrowserSpeech(text: string, rate = 0.95, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.lang = "en-GB";
    utterance.rate = rate;
    const preferredVoice =
      voices.find((v) => v.lang === "en-GB") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

export async function playNaturalSpeech(
  text: string,
  options?: {
    voice?: "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer";
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
  },
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  stopCurrentSpeech();

  const voice = options?.voice ?? "nova";
  const speed = options?.speed ?? 1.0;
  const cacheKey = `${voice}:${cleanText}`;

  // 1. Try playing from client in-memory cache first (instant playback)
  const cachedUrl = audioCache.get(cacheKey);
  if (cachedUrl) {
    try {
      const audio = new Audio(cachedUrl);
      currentAudio = audio;
      audio.onplay = () => options?.onStart?.();
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        options?.onEnd?.();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        fallbackBrowserSpeech(cleanText, 0.95, options?.onEnd);
      };
      await audio.play();
      return;
    } catch {
      // Fall through to fetch or browser speech
    }
  }

  // 2. Fetch natural AI voice from OpenAI TTS API
  try {
    options?.onStart?.();
    const response = await fetch("/api/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, voice, speed }),
    });

    if (!response.ok) {
      throw new Error(`TTS API returned ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    audioCache.set(cacheKey, objectUrl);

    const audio = new Audio(objectUrl);
    currentAudio = audio;
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      options?.onEnd?.();
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      options?.onEnd?.();
    };
    await audio.play();
  } catch {
    // 3. Graceful fallback to browser speech synthesis
    fallbackBrowserSpeech(cleanText, 0.95, options?.onEnd);
  }
}
