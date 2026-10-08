/**
 * Sound effects behind one small interface, so the synthesized blips below can be swapped
 * for recorded audio files without touching any component.
 */
export type SoundName = 'turn' | 'yourTurn' | 'question' | 'answer' | 'correct' | 'wrong' | 'roundEnd' | 'timeUp';

export interface SoundService {
  play(name: SoundName): void;
  setMuted(muted: boolean): void;
}

type Note = [frequency: number, startSec: number, lengthSec: number];

const SCORES: Record<SoundName, Note[]> = {
  turn: [[523, 0, 0.12]],
  yourTurn: [[523, 0, 0.1], [784, 0.11, 0.18]],
  question: [[440, 0, 0.08], [587, 0.08, 0.12]],
  answer: [[660, 0, 0.06]],
  correct: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.28]],
  wrong: [[330, 0, 0.14], [294, 0.14, 0.2]],
  roundEnd: [[392, 0, 0.12], [523, 0.13, 0.12], [659, 0.26, 0.24]],
  timeUp: [[659, 0, 0.14], [523, 0.16, 0.14], [392, 0.32, 0.3]],
};

class SynthSound implements SoundService {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  play(name: SoundName) {
    if (this.muted) return;
    try {
      this.ctx ??= new AudioContext();
      const ctx = this.ctx;
      // Browsers keep audio suspended until the first click; before that we simply stay silent.
      if (ctx.state === 'suspended') void ctx.resume();
      for (const [frequency, start, length] of SCORES[name]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + start;
        osc.type = 'triangle';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + length + 0.02);
      }
    } catch {
      // Audio is a nicety; never let it break the game.
    }
  }
}

export const sound: SoundService = new SynthSound();
