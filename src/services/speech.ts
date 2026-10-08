/**
 * "Listen" support. Uses the browser's built-in voice today; a hosted TTS or
 * pronunciation service can implement the same interface later.
 */
export interface SpeechService {
  readonly available: boolean;
  speak(text: string): void;
}

class BrowserSpeech implements SpeechService {
  readonly available = typeof window !== 'undefined' && 'speechSynthesis' in window;

  speak(text: string) {
    if (!this.available) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}

export const speech: SpeechService = new BrowserSpeech();
