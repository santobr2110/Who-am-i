import { useEffect, useRef } from 'react';
import type { GameView } from '../../shared/types';
import { currentGuess, currentQuestion } from '../lib/game';
import { sound } from './sound';

/** Turns state changes into sound cues, so no component has to remember to play one. */
export function useGameSounds(view: GameView | null, muted: boolean) {
  const prev = useRef<GameView | null>(null);

  useEffect(() => sound.setMuted(muted), [muted]);

  useEffect(() => {
    const before = prev.current;
    prev.current = view;
    if (!view || !before || before.gameId !== view.gameId) return;

    if (before.status !== view.status) {
      if (view.status === 'gameOver') return sound.play(view.endReason === 'timeUp' ? 'timeUp' : 'roundEnd');
      if (view.status === 'roundEnd') return sound.play('roundEnd');
    }
    const t = view.turn;
    const b = before.turn;
    if (!t) return;
    if (t.phase === 'result' && b?.phase !== 'result') {
      return sound.play(currentGuess(view)?.correct ? 'correct' : 'wrong');
    }
    if (t.playerId !== b?.playerId) return sound.play(t.playerId === view.you.id ? 'yourTurn' : 'turn');
    if (t.phase === 'answering' && b?.phase !== 'answering') return sound.play('question');
    const answers = Object.keys(currentQuestion(view)?.answers ?? {}).length;
    const answersBefore = Object.keys(currentQuestion(before)?.answers ?? {}).length;
    if (t.phase === 'answering' && answers > answersBefore) sound.play('answer');
  }, [view]);
}
