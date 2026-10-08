import type { GameConfig, Identity, LanguageLevel } from '../../shared/types';

/**
 * Extension points for future AI features. Nothing here is called by the game yet —
 * the interfaces exist so those features plug in without reshaping the engine.
 */

/** Suggests a better-formed question *after* the turn; never blocks or rewrites during play. */
export interface QuestionCoach {
  suggest(question: string, level: LanguageLevel): Promise<{ suggestion: string } | null>;
}

/** Replaces the regex in shared/config/scoring.ts for the English bonus. */
export interface QuestionEvaluator {
  isEnglishQuestion(question: string): Promise<boolean>;
}

/** Generates a pack on demand (topic, age group, level, teacher preference). */
export interface IdentityGenerator {
  generate(request: { topic: string; level: LanguageLevel; count: number; ageGroup?: string }): Promise<Identity[]>;
}

/** Recommends easier or harder settings from how the last round went. */
export interface DifficultyAdvisor {
  recommend(config: GameConfig, stats: { solvedRate: number; avgQuestions: number }): Partial<GameConfig>;
}

export const noopCoach: QuestionCoach = { suggest: async () => null };
