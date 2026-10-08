import type { AnswerValue, GameView, PlayerView, Question } from '../../shared/types';

export const ANSWER_LABEL: Record<AnswerValue, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };
export const ANSWER_ORDER: AnswerValue[] = ['yes', 'no', 'unsure'];

export const playerById = (view: GameView, id: string | null | undefined) =>
  view.players.find((p) => p.id === id) ?? null;
export const me = (view: GameView) => playerById(view, view.you.id);
export const activePlayer = (view: GameView) => playerById(view, view.turn?.playerId);
export const currentQuestion = (view: GameView) =>
  view.questions.find((q) => q.id === view.turn?.questionId) ?? null;
export const currentGuess = (view: GameView) => view.guesses.find((g) => g.id === view.turn?.guessId) ?? null;

export function tally(question: Question): Record<AnswerValue, string[]> {
  const out: Record<AnswerValue, string[]> = { yes: [], no: [], unsure: [] };
  for (const [playerId, value] of Object.entries(question.answers)) out[value].push(playerId);
  return out;
}

export const answerers = (view: GameView) =>
  view.players.filter((p) => p.id !== view.turn?.playerId && p.connected);

export const ranked = (players: PlayerView[]) => [...players].sort((a, b) => b.score - a.score);

export const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Seats in table order, rotated so the viewer sits first (rendered at the bottom of the ring). */
export function seatsFor(view: GameView): PlayerView[] {
  const order = view.order.length ? view.order : view.players.map((p) => p.id);
  const seated = order.map((id) => playerById(view, id)).filter((p): p is PlayerView => !!p);
  const mine = seated.findIndex((p) => p.id === view.you.id);
  return mine > 0 ? [...seated.slice(mine), ...seated.slice(0, mine)] : seated;
}
