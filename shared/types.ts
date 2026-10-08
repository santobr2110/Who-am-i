/** Domain model shared by the server (authoritative) and the client (views only). */

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type LanguageLevel = (typeof LEVELS)[number];

export type Difficulty = 'easy' | 'normal' | 'hard';
export type AnswerValue = 'yes' | 'no' | 'unsure';
export type GameStatus = 'lobby' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';
export type TurnPhase = 'asking' | 'answering' | 'deciding' | 'result';
export type GameModeId = 'classic';
export type EndReason = 'allSolved' | 'timeUp' | 'host' | 'noPlayers';

// ───────────────────────── Content ─────────────────────────

export interface IdentityImage {
  kind: 'emoji' | 'url';
  value: string;
}

export interface Identity {
  id: string;
  name: string;
  /** Id of the pack this identity belongs to. */
  category: string;
  image: IdentityImage;
  description: string;
  /** 1 = everyone knows it, 3 = needs some culture or abstraction. */
  difficulty: 1 | 2 | 3;
  tags: string[];
  /** Extra spellings accepted as a correct guess (the name itself always counts). */
  acceptableAnswers: string[];
  /** Hints in the second person, easiest last. */
  clues: string[];
  /** Lowest level at which this identity is appropriate. */
  languageLevel: LanguageLevel;
}

export interface IdentityPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Optional packs are off by default (e.g. fictional characters). */
  optional?: boolean;
  identities: Identity[];
}

// ───────────────────────── Configuration ─────────────────────────

export interface GameConfig {
  mode: GameModeId;
  level: LanguageLevel;
  difficulty: Difficulty;
  packIds: string[];
  maxPlayers: number;
  /** Whole-game timer in minutes, or null for no limit. */
  timerMinutes: number | null;
  allowNotSure: boolean;
  /** How many questions the active player may ask before the turn passes. */
  questionsPerTurn: number;
  /** Seconds the table has to answer before the question closes by itself. */
  answerSeconds: number;
  englishBonus: boolean;
  /** The teacher also sits at the table (needed for 1-to-1 classes). */
  hostPlays: boolean;
}

// ───────────────────────── State (server only) ─────────────────────────

export interface PlayerStats {
  questions: number;
  answers: number;
  guesses: number;
  correct: number;
  clues: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: number;
  ready: boolean;
  connected: boolean;
  score: number;
  /** Points earned in the current round (reverted on restart). */
  roundPoints: number;
  /** Questions asked in the current round — drives the efficiency bonus. */
  roundQuestions: number;
  solved: boolean;
  stats: PlayerStats;
}

export interface Question {
  id: string;
  round: number;
  askerId: string;
  text: string;
  answers: Record<string, AnswerValue>;
  closed: boolean;
  askedAt: number;
}

export interface Guess {
  id: string;
  round: number;
  playerId: string;
  text: string;
  correct: boolean;
  points: number;
  at: number;
}

export interface Turn {
  playerId: string;
  phase: TurnPhase;
  questionsThisTurn: number;
  questionId: string | null;
  guessId: string | null;
  /** When the current phase resolves by itself (answering, result). */
  deadline: number | null;
  /** Set while the active player is offline; the turn passes when it expires. */
  graceDeadline: number | null;
}

export interface GameTimer {
  limitMs: number | null;
  elapsedMs: number;
  runningSince: number | null;
}

export interface RoundResult {
  playerId: string;
  name: string;
  avatar: number;
  identityName: string;
  identityImage: IdentityImage;
  solved: boolean;
  questions: number;
  points: number;
}

export interface RoundSummary {
  round: number;
  reason: EndReason;
  results: RoundResult[];
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  config: GameConfig;
  hostId: string;
  hostConnected: boolean;
  players: Player[];
  round: number;
  /** Turn order for the current round (player ids). */
  order: string[];
  turn: Turn | null;
  /** playerId → identityId for the current round. */
  identities: Record<string, string>;
  /** playerId → number of clues revealed this round. */
  revealedClues: Record<string, number>;
  questions: Question[];
  guesses: Guess[];
  usedIdentityIds: string[];
  timer: GameTimer;
  pausedAt: number | null;
  history: RoundSummary[];
  endReason: EndReason | null;
  createdAt: number;
  seq: number;
}

// ───────────────────────── Actions ─────────────────────────

export type GameAction =
  // lifecycle (issued by the server on behalf of a connection)
  | { type: 'join'; playerId: string; name: string }
  | { type: 'leave'; playerId: string }
  | { type: 'connection'; playerId: string; connected: boolean }
  | { type: 'hostConnection'; connected: boolean }
  | { type: 'tick' }
  // player
  | { type: 'setReady'; ready: boolean }
  | { type: 'setProfile'; name?: string; avatar?: number }
  | { type: 'askQuestion'; text: string }
  | { type: 'answer'; value: AnswerValue }
  | { type: 'continueAsking' }
  | { type: 'endTurn' }
  | { type: 'guess'; text: string }
  | { type: 'requestClue' }
  // host
  | { type: 'updateConfig'; config: Partial<GameConfig> }
  | { type: 'startGame' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'closeAnswers' }
  | { type: 'skipTurn' }
  | { type: 'endRound' }
  | { type: 'nextRound' }
  | { type: 'restartRound' }
  | { type: 'endGame' }
  | { type: 'playAgain' }
  | { type: 'removePlayer'; playerId: string };

/** Actions a browser is allowed to send. Lifecycle actions are server-issued only. */
export type ClientAction = Exclude<
  GameAction,
  { type: 'join' | 'leave' | 'connection' | 'hostConnection' | 'tick' }
>;

// ───────────────────────── Views (what a browser receives) ─────────────────────────

export type ViewerRole = 'host' | 'player' | 'spectator';

export interface Viewer {
  id: string | null;
  role: ViewerRole;
}

export interface IdentityView {
  id: string;
  name: string;
  image: IdentityImage;
  description: string;
  category: string;
}

export interface PlayerView {
  id: string;
  name: string;
  avatar: number;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
  score: number;
  roundPoints: number;
  roundQuestions: number;
  solved: boolean;
  stats: PlayerStats;
  /** null whenever this viewer must not know it (always null for your own unsolved card). */
  identity: IdentityView | null;
}

export interface GameView {
  gameId: string;
  status: GameStatus;
  config: GameConfig;
  round: number;
  serverNow: number;
  hostConnected: boolean;
  you: { id: string | null; isHost: boolean; isPlayer: boolean; role: ViewerRole };
  players: PlayerView[];
  order: string[];
  turn: Turn | null;
  /** Current round only. */
  questions: Question[];
  guesses: Guess[];
  myClues: string[];
  cluesRemaining: number;
  /** Names offered as guess suggestions at lower levels; null = free typing only. */
  guessOptions: string[] | null;
  timer: { limitMs: number | null; elapsedMs: number; running: boolean };
  history: RoundSummary[];
  endReason: EndReason | null;
}

// ───────────────────────── Wire protocol ─────────────────────────

export interface RoomInfo {
  code: string;
  status: GameStatus;
  players: number;
  maxPlayers: number;
  /** Names of offline players a newcomer may reclaim. */
  reclaimable: string[];
}

export type ClientMessage =
  | { t: 'create'; sessionId: string; hostName: string; config: GameConfig }
  | { t: 'resume'; code: string; sessionId: string; hostKey?: string }
  | { t: 'join'; code: string; sessionId: string; name: string }
  | { t: 'watch'; code: string }
  | { t: 'action'; action: ClientAction }
  | { t: 'leave' };

export type ServerMessage =
  | { t: 'joined'; code: string; role: ViewerRole; hostKey?: string }
  | { t: 'state'; view: GameView }
  | { t: 'room'; info: RoomInfo | null }
  | { t: 'error'; code: string; message: string }
  | { t: 'closed'; reason: string };
