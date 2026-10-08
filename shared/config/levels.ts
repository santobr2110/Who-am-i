import type { Difficulty, GameConfig, GameModeId, LanguageLevel } from '../types';

export interface LevelRules {
  label: string;
  blurb: string;
  /** How many suggested questions are offered. Higher levels get fewer prompts, not more UI. */
  suggestions: number;
  /** Sentence starters that drop into the input ("Am I…"). */
  starters: string[];
  /** Clues a player may reveal about their own identity per round. */
  clues: number;
  /** Offer the pack's names as guess suggestions instead of free typing only. */
  guessOptions: boolean;
}

export const LEVEL_RULES: Record<LanguageLevel, LevelRules> = {
  A1: {
    label: 'A1 · Beginner',
    blurb: 'Lots of support: ready-made questions, three clues, a list of names to guess from.',
    suggestions: 8,
    starters: ['Am I…', 'Do I…', 'Can I…'],
    clues: 3,
    guessOptions: true,
  },
  A2: {
    label: 'A2 · Elementary',
    blurb: 'Ready-made questions, two clues, a list of names to guess from.',
    suggestions: 6,
    starters: ['Am I…', 'Do I…', 'Can I…', 'Was I…'],
    clues: 2,
    guessOptions: true,
  },
  B1: {
    label: 'B1 · Intermediate',
    blurb: 'A few question ideas, one clue, free guessing.',
    suggestions: 5,
    starters: ['Am I…', 'Do I…', 'Have I…', 'Would I…'],
    clues: 1,
    guessOptions: false,
  },
  B2: {
    label: 'B2 · Upper-intermediate',
    blurb: 'Only a couple of prompts. No clues.',
    suggestions: 3,
    starters: [],
    clues: 0,
    guessOptions: false,
  },
  C1: {
    label: 'C1 · Advanced',
    blurb: 'Almost no prompts — full freedom to ask anything.',
    suggestions: 2,
    starters: [],
    clues: 0,
    guessOptions: false,
  },
};

export const DIFFICULTY_MAX: Record<Difficulty, 1 | 2 | 3> = { easy: 1, normal: 2, hard: 3 };

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy — things everyone knows',
  normal: 'Normal',
  hard: 'Hard — trickier identities',
};

export const TIMER_OPTIONS: (number | null)[] = [null, 10, 15, 20];

export interface GameMode {
  id: GameModeId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

/**
 * Mode registry. Only Classic exists today; Speed, Team, Tournament, Elimination, etc. are added
 * by registering here and branching on `config.mode` in the engine's turn rules.
 */
export const MODES: Record<GameModeId, GameMode> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Ask questions, hear the answers, guess who you are.',
    minPlayers: 2,
    maxPlayers: 8,
  },
};

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'classic',
  level: 'A2',
  difficulty: 'easy',
  packIds: ['people', 'animals', 'professions'],
  maxPlayers: 8,
  timerMinutes: 15,
  allowNotSure: true,
  questionsPerTurn: 2,
  answerSeconds: 45,
  englishBonus: true,
  hostPlays: false,
};
