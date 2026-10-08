/**
 * Every number that affects the score lives here. Tune freely — the engine only reads this object.
 * Communication matters more than points, so participation is rewarded and mistakes cost nothing.
 */
export const SCORING = {
  correctGuess: 100,
  /** Bonus for guessing with few questions: max − perQuestion × questions asked, never below 0. */
  efficiencyBonus: { max: 50, perQuestion: 5 },
  askQuestion: 5,
  answerQuestion: 2,
  /** Added to askQuestion when the question looks like a well-formed English question. */
  englishQuestion: 3,
  /** Taken off the efficiency bonus (never the base score) per clue used. */
  cluePenalty: 10,
  wrongGuess: 0,
} as const;

export function guessPoints(questionsAsked: number, cluesUsed: number): number {
  const { max, perQuestion } = SCORING.efficiencyBonus;
  const bonus = Math.max(0, max - perQuestion * questionsAsked - SCORING.cluePenalty * cluesUsed);
  return SCORING.correctGuess + bonus;
}

const QUESTION_OPENERS =
  /^(am|is|are|was|were|do|does|did|have|has|had|can|could|would|will|should|may|might|who|what|where|when|why|which|how)\b/i;

/**
 * Cheap stand-in for a real language check. An AI evaluator can replace this later
 * without touching the engine (see server/services/ai.ts).
 */
export function looksLikeEnglishQuestion(text: string): boolean {
  const t = text.trim();
  return t.endsWith('?') && QUESTION_OPENERS.test(t) && t.split(/\s+/).length >= 3;
}
