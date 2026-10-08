import { DIFFICULTY_MAX, LEVEL_RULES, MODES } from '../config/levels';
import { SCORING, guessPoints, looksLikeEnglishQuestion } from '../config/scoring';
import { PACKS, getIdentity } from '../content';
import {
  LEVELS,
  type EndReason,
  type GameAction,
  type GameConfig,
  type GameState,
  type GameStatus,
  type Identity,
  type Player,
  type Question,
} from '../types';
import { isCorrectGuess } from './guess';

/**
 * Pure game rules. No I/O, no timers, no UI: `applyAction(state, actor, action, ctx)` returns the
 * next state or throws a GameError. The server owns the clock and calls `tick` periodically.
 */

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface Ctx {
  now: number;
  rng: () => number;
}

export const AVATAR_COUNT = 8;
export const RESULT_MS = { correct: 7000, wrong: 4000 };
export const OFFLINE_GRACE_MS = 20000;
export const NAME_MAX = 16;
export const QUESTION_MAX = 140;

export function createGame(gameId: string, hostId: string, config: GameConfig, now: number): GameState {
  return {
    gameId,
    status: 'lobby',
    config: sanitizeConfig(config, config),
    hostId,
    hostConnected: true,
    players: [],
    round: 0,
    order: [],
    turn: null,
    identities: {},
    revealedClues: {},
    questions: [],
    guesses: [],
    usedIdentityIds: [],
    timer: { limitMs: null, elapsedMs: 0, runningSince: null },
    pausedAt: null,
    history: [],
    endReason: null,
    createdAt: now,
    seq: 0,
  };
}

export function sanitizeConfig(base: GameConfig, patch: Partial<GameConfig>): GameConfig {
  const next = { ...base, ...patch };
  const mode = MODES[next.mode] ?? MODES.classic;
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));
  const packIds = next.packIds.filter((id) => PACKS.some((p) => p.id === id));
  return {
    ...next,
    mode: mode.id,
    level: LEVELS.includes(next.level) ? next.level : base.level,
    difficulty: next.difficulty in DIFFICULTY_MAX ? next.difficulty : base.difficulty,
    packIds: packIds.length ? packIds : [PACKS[0].id],
    maxPlayers: clamp(next.maxPlayers, mode.minPlayers, mode.maxPlayers),
    timerMinutes: next.timerMinutes == null ? null : clamp(next.timerMinutes, 1, 120),
    questionsPerTurn: clamp(next.questionsPerTurn, 1, 5),
    answerSeconds: clamp(next.answerSeconds, 10, 180),
    allowNotSure: !!next.allowNotSure,
    englishBonus: !!next.englishBonus,
    hostPlays: !!next.hostPlays,
  };
}

// ───────────────────────── Selectors ─────────────────────────

export const findPlayer = (s: GameState, id: string | null) => s.players.find((p) => p.id === id);
export const currentQuestion = (s: GameState) =>
  s.questions.find((q) => q.id === s.turn?.questionId) ?? null;

/** Who is expected to answer the open question right now. */
export function eligibleAnswerers(s: GameState): Player[] {
  if (!s.turn) return [];
  return s.players.filter((p) => p.id !== s.turn!.playerId && p.connected);
}

export function elapsedMs(s: GameState, now: number): number {
  return s.timer.elapsedMs + (s.timer.runningSince != null ? now - s.timer.runningSince : 0);
}

export function eligibleIdentities(config: GameConfig): Identity[] {
  const maxLevel = LEVELS.indexOf(config.level);
  const maxDifficulty = DIFFICULTY_MAX[config.difficulty];
  return PACKS.filter((p) => config.packIds.includes(p.id))
    .flatMap((p) => p.identities)
    .filter((i) => LEVELS.indexOf(i.languageLevel) <= maxLevel && i.difficulty <= maxDifficulty);
}

/** True when `tick` would change something — lets the server skip no-op broadcasts. */
export function tickDue(s: GameState, now: number): boolean {
  if (s.status !== 'playing') return false;
  if (s.timer.limitMs != null && elapsedMs(s, now) >= s.timer.limitMs) return true;
  const t = s.turn;
  if (!t) return false;
  return (t.deadline != null && now >= t.deadline) || (t.graceDeadline != null && now >= t.graceDeadline);
}

// ───────────────────────── Reducer ─────────────────────────

export function applyAction(
  state: GameState,
  actorId: string | null,
  action: GameAction,
  ctx: Ctx,
): GameState {
  if (action.type === 'tick' && !tickDue(state, ctx.now)) return state;
  const s = structuredClone(state);
  const isHost = actorId != null && actorId === s.hostId;
  const me = findPlayer(s, actorId);

  const requireHost = () => {
    if (!isHost) throw new GameError('not_host', 'Only the teacher can do that.');
  };
  const requirePlayer = (): Player => {
    if (!me) throw new GameError('not_player', 'You are not in this game.');
    return me;
  };
  const requireStatus = (...allowed: GameStatus[]) => {
    if (!allowed.includes(s.status)) throw new GameError('bad_status', "That can't be done right now.");
  };
  const requireMyTurn = (...phases: string[]): Player => {
    const p = requirePlayer();
    requireStatus('playing');
    if (!s.turn || s.turn.playerId !== p.id) throw new GameError('not_your_turn', "It's not your turn.");
    if (!phases.includes(s.turn.phase)) throw new GameError('bad_phase', "That can't be done right now.");
    return p;
  };

  switch (action.type) {
    // ── lifecycle ──
    case 'join': {
      if (findPlayer(s, action.playerId)) break;
      if (s.players.length >= s.config.maxPlayers) throw new GameError('room_full', 'This game is full.');
      const player: Player = {
        id: action.playerId,
        name: uniqueName(s, cleanName(action.name)),
        avatar: freeAvatar(s),
        ready: action.playerId === s.hostId,
        connected: true,
        score: 0,
        roundPoints: 0,
        roundQuestions: 0,
        solved: false,
        stats: { questions: 0, answers: 0, guesses: 0, correct: 0, clues: 0 },
      };
      s.players.push(player);
      // Late joiners get a card and a place at the end of the turn order.
      if (s.status === 'playing' || s.status === 'paused') {
        const [identity] = pickIdentities(s, 1, ctx);
        s.identities[player.id] = identity.id;
        s.usedIdentityIds.push(identity.id);
        s.order.push(player.id);
      }
      break;
    }
    case 'leave':
      removePlayer(s, action.playerId, ctx);
      break;
    case 'removePlayer':
      requireHost();
      removePlayer(s, action.playerId, ctx);
      break;
    case 'connection': {
      const p = findPlayer(s, action.playerId);
      if (!p || p.connected === action.connected) break;
      p.connected = action.connected;
      if (!action.connected) p.ready = p.id === s.hostId;
      if (s.turn && (s.status === 'playing' || s.status === 'paused')) {
        if (s.turn.playerId === p.id) {
          s.turn.graceDeadline = action.connected ? null : ctx.now + OFFLINE_GRACE_MS;
        } else if (s.turn.phase === 'answering') {
          maybeCloseQuestion(s, ctx);
        }
      }
      break;
    }
    case 'hostConnection':
      s.hostConnected = action.connected;
      break;
    case 'tick':
      runTick(s, ctx);
      break;

    // ── lobby ──
    case 'setReady':
      requireStatus('lobby');
      requirePlayer().ready = action.ready;
      break;
    case 'setProfile': {
      const p = requirePlayer();
      requireStatus('lobby');
      if (action.name != null) {
        p.name = '';
        p.name = uniqueName(s, cleanName(action.name));
      }
      if (action.avatar != null) {
        const avatar = Math.abs(Math.trunc(action.avatar)) % AVATAR_COUNT;
        if (!s.players.some((o) => o.id !== p.id && o.avatar === avatar)) p.avatar = avatar;
      }
      break;
    }
    case 'updateConfig':
      requireHost();
      requireStatus('lobby');
      s.config = sanitizeConfig(s.config, action.config);
      break;
    case 'startGame': {
      requireHost();
      requireStatus('lobby');
      const min = MODES[s.config.mode].minPlayers;
      if (s.players.filter((p) => p.connected).length < min) {
        throw new GameError('not_enough_players', `You need at least ${min} players to start.`);
      }
      s.timer = {
        limitMs: s.config.timerMinutes ? s.config.timerMinutes * 60000 : null,
        elapsedMs: 0,
        runningSince: null,
      };
      startRound(s, ctx);
      break;
    }

    // ── playing ──
    case 'askQuestion': {
      const p = requireMyTurn('asking');
      const text = action.text.replace(/\s+/g, ' ').trim().slice(0, QUESTION_MAX);
      if (text.length < 3) throw new GameError('empty_question', 'Type your question first.');
      const question: Question = {
        id: `q${++s.seq}`,
        round: s.round,
        askerId: p.id,
        text,
        answers: {},
        closed: false,
        askedAt: ctx.now,
      };
      s.questions.push(question);
      p.stats.questions++;
      p.roundQuestions++;
      const english = s.config.englishBonus && looksLikeEnglishQuestion(text);
      award(p, SCORING.askQuestion + (english ? SCORING.englishQuestion : 0));
      s.turn!.phase = 'answering';
      s.turn!.questionId = question.id;
      s.turn!.questionsThisTurn++;
      s.turn!.deadline = ctx.now + s.config.answerSeconds * 1000;
      maybeCloseQuestion(s, ctx);
      break;
    }
    case 'answer': {
      const p = requirePlayer();
      requireStatus('playing');
      const q = currentQuestion(s);
      if (!s.turn || s.turn.phase !== 'answering' || !q) {
        throw new GameError('no_question', 'There is no open question.');
      }
      if (q.askerId === p.id) throw new GameError('own_question', "You can't answer your own question.");
      if (q.answers[p.id]) throw new GameError('already_answered', 'You already answered.');
      if (!['yes', 'no', 'unsure'].includes(action.value)) throw new GameError('bad_answer', 'Unknown answer.');
      if (action.value === 'unsure' && !s.config.allowNotSure) {
        throw new GameError('unsure_disabled', '"Not sure" is turned off in this game.');
      }
      q.answers[p.id] = action.value;
      p.stats.answers++;
      award(p, SCORING.answerQuestion);
      maybeCloseQuestion(s, ctx);
      break;
    }
    case 'closeAnswers':
      requireHost();
      requireStatus('playing');
      if (s.turn?.phase === 'answering') closeQuestion(s);
      break;
    case 'continueAsking':
      requireMyTurn('deciding');
      if (s.turn!.questionsThisTurn >= s.config.questionsPerTurn) {
        throw new GameError('no_questions_left', 'No more questions this turn — guess or pass.');
      }
      s.turn!.phase = 'asking';
      s.turn!.questionId = null;
      break;
    case 'endTurn':
      requireMyTurn('asking', 'deciding');
      nextTurn(s, ctx);
      break;
    case 'guess': {
      const p = requireMyTurn('asking', 'deciding');
      const text = action.text.replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!text) throw new GameError('empty_guess', 'Type your guess first.');
      const identity = getIdentity(s.identities[p.id]);
      const correct = !!identity && isCorrectGuess(identity, text);
      const points = correct ? guessPoints(p.roundQuestions, s.revealedClues[p.id] ?? 0) : SCORING.wrongGuess;
      const id = `g${++s.seq}`;
      s.guesses.push({ id, round: s.round, playerId: p.id, text, correct, points, at: ctx.now });
      p.stats.guesses++;
      if (correct) {
        p.stats.correct++;
        p.solved = true;
      }
      award(p, points);
      s.turn!.phase = 'result';
      s.turn!.guessId = id;
      s.turn!.deadline = ctx.now + (correct ? RESULT_MS.correct : RESULT_MS.wrong);
      break;
    }
    case 'requestClue': {
      const p = requireMyTurn('asking', 'deciding');
      const identity = getIdentity(s.identities[p.id]);
      const used = s.revealedClues[p.id] ?? 0;
      const allowed = Math.min(LEVEL_RULES[s.config.level].clues, identity?.clues.length ?? 0);
      if (used >= allowed) throw new GameError('no_clues', 'No clues left.');
      s.revealedClues[p.id] = used + 1;
      p.stats.clues++;
      break;
    }

    // ── host controls ──
    case 'pause':
      requireHost();
      requireStatus('playing');
      setStatus(s, 'paused', ctx.now);
      s.pausedAt = ctx.now;
      break;
    case 'resume': {
      requireHost();
      requireStatus('paused');
      const shift = ctx.now - (s.pausedAt ?? ctx.now);
      if (s.turn?.deadline != null) s.turn.deadline += shift;
      if (s.turn?.graceDeadline != null) s.turn.graceDeadline += shift;
      s.pausedAt = null;
      setStatus(s, 'playing', ctx.now);
      break;
    }
    case 'skipTurn':
      requireHost();
      requireStatus('playing');
      nextTurn(s, ctx);
      break;
    case 'endRound':
      requireHost();
      requireStatus('playing', 'paused');
      finishRound(s, 'host', ctx);
      break;
    case 'nextRound':
      requireHost();
      requireStatus('roundEnd');
      startRound(s, ctx);
      break;
    case 'restartRound': {
      requireHost();
      requireStatus('playing', 'paused', 'roundEnd');
      for (const p of s.players) p.score -= p.roundPoints;
      if (s.status === 'roundEnd') s.history.pop();
      s.round--;
      startRound(s, ctx);
      break;
    }
    case 'endGame':
      requireHost();
      requireStatus('playing', 'paused', 'roundEnd');
      if (s.status !== 'roundEnd') {
        // A round nobody played yet isn't worth a line in the history.
        const untouched = !s.questions.some((q) => q.round === s.round) && !s.guesses.some((g) => g.round === s.round);
        finishRound(s, 'host', ctx);
        if (untouched && s.history.length > 1) s.history.pop();
      }
      s.endReason = 'host';
      setStatus(s, 'gameOver', ctx.now);
      break;
    case 'playAgain':
      requireHost();
      requireStatus('gameOver', 'roundEnd');
      Object.assign(s, {
        status: 'lobby',
        round: 0,
        order: [],
        turn: null,
        identities: {},
        revealedClues: {},
        questions: [],
        guesses: [],
        history: [],
        endReason: null,
        pausedAt: null,
        timer: { limitMs: null, elapsedMs: 0, runningSince: null },
      });
      s.players = s.players.filter((p) => p.connected);
      for (const p of s.players) {
        Object.assign(p, { score: 0, roundPoints: 0, roundQuestions: 0, solved: false, ready: p.id === s.hostId });
        p.stats = { questions: 0, answers: 0, guesses: 0, correct: 0, clues: 0 };
      }
      break;
  }
  return s;
}

// ───────────────────────── Internals ─────────────────────────

function cleanName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  if (!name) throw new GameError('empty_name', 'Please type your name.');
  return name;
}

function uniqueName(s: GameState, name: string): string {
  const taken = new Set(s.players.map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name.slice(0, NAME_MAX - 2)} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function freeAvatar(s: GameState): number {
  const used = new Set(s.players.map((p) => p.avatar));
  for (let i = 0; i < AVATAR_COUNT; i++) if (!used.has(i)) return i;
  return s.players.length % AVATAR_COUNT;
}

function award(p: Player, points: number) {
  p.score += points;
  p.roundPoints += points;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setStatus(s: GameState, next: GameStatus, now: number) {
  if (s.timer.runningSince != null) {
    s.timer.elapsedMs += now - s.timer.runningSince;
    s.timer.runningSince = null;
  }
  s.status = next;
  if (next === 'playing') s.timer.runningSince = now;
}

/**
 * Picks `count` distinct identities, preferring ones that fit the level/difficulty and have not
 * been used yet, then relaxing those constraints rather than failing a small pack.
 */
function pickIdentities(s: GameState, count: number, ctx: Ctx): Identity[] {
  const inPacks = PACKS.filter((p) => s.config.packIds.includes(p.id)).flatMap((p) => p.identities);
  const used = new Set(s.usedIdentityIds);
  const taken = new Set(Object.values(s.identities));
  const fits = new Set(eligibleIdentities(s.config).map((i) => i.id));
  const tiers = [
    inPacks.filter((i) => fits.has(i.id) && !used.has(i.id)),
    inPacks.filter((i) => !used.has(i.id)),
    inPacks.filter((i) => !taken.has(i.id)),
    inPacks,
  ];
  const picked: Identity[] = [];
  for (const tier of tiers) {
    for (const identity of shuffle(tier, ctx.rng)) {
      if (picked.length >= count) return picked;
      if (!picked.includes(identity)) picked.push(identity);
    }
  }
  return picked;
}

function startRound(s: GameState, ctx: Ctx) {
  s.round++;
  s.questions = s.questions.filter((q) => q.round < s.round);
  s.guesses = s.guesses.filter((g) => g.round < s.round);
  s.identities = {};
  s.revealedClues = {};
  s.endReason = null;
  s.pausedAt = null;
  for (const p of s.players) Object.assign(p, { roundPoints: 0, roundQuestions: 0, solved: false });

  const picks = pickIdentities(s, s.players.length, ctx);
  s.players.forEach((p, i) => {
    const identity = picks[i % picks.length];
    s.identities[p.id] = identity.id;
    s.usedIdentityIds.push(identity.id);
  });

  // Random order in round 1; afterwards the starting seat rotates so everyone gets to open.
  const ids = s.players.map((p) => p.id);
  s.order = s.round === 1 ? shuffle(ids, ctx.rng) : ids.map((_, i) => ids[(i + s.round - 1) % ids.length]);
  s.turn = null;
  setStatus(s, 'playing', ctx.now);
  nextTurn(s, ctx);
}

function nextTurn(s: GameState, ctx: Ctx) {
  const open = s.turn && currentQuestion(s);
  if (open && !open.closed) open.closed = true;

  if (s.players.every((p) => p.solved)) return finishRound(s, 'allSolved', ctx);
  const start = s.turn ? s.order.indexOf(s.turn.playerId) : -1;
  for (let step = 1; step <= s.order.length; step++) {
    const candidate = findPlayer(s, s.order[(start + step + s.order.length) % s.order.length]);
    if (candidate && !candidate.solved && candidate.connected) {
      s.turn = {
        playerId: candidate.id,
        phase: 'asking',
        questionsThisTurn: 0,
        questionId: null,
        guessId: null,
        deadline: null,
        graceDeadline: null,
      };
      return;
    }
  }
  // Everyone still guessing is offline.
  finishRound(s, 'noPlayers', ctx);
}

function maybeCloseQuestion(s: GameState, ctx: Ctx) {
  const q = currentQuestion(s);
  if (!q || q.closed) return;
  if (eligibleAnswerers(s).every((p) => q.answers[p.id])) closeQuestion(s);
  void ctx;
}

function closeQuestion(s: GameState) {
  const q = currentQuestion(s);
  if (!q || !s.turn) return;
  q.closed = true;
  s.turn.phase = 'deciding';
  s.turn.deadline = null;
}

function finishRound(s: GameState, reason: EndReason, ctx: Ctx) {
  for (const q of s.questions) q.closed = true;
  s.history.push({
    round: s.round,
    reason,
    results: s.players.map((p) => {
      const identity = getIdentity(s.identities[p.id]);
      return {
        playerId: p.id,
        name: p.name,
        avatar: p.avatar,
        identityName: identity?.name ?? '?',
        identityImage: identity?.image ?? { kind: 'emoji', value: '❓' },
        solved: p.solved,
        questions: p.roundQuestions,
        points: p.roundPoints,
      };
    }),
  });
  s.turn = null;
  s.endReason = reason;
  setStatus(s, 'roundEnd', ctx.now);
}

function runTick(s: GameState, ctx: Ctx) {
  if (s.timer.limitMs != null && elapsedMs(s, ctx.now) >= s.timer.limitMs) {
    finishRound(s, 'timeUp', ctx);
    s.timer.elapsedMs = s.timer.limitMs;
    setStatus(s, 'gameOver', ctx.now);
    return;
  }
  const t = s.turn;
  if (!t) return;
  if (t.graceDeadline != null && ctx.now >= t.graceDeadline) return nextTurn(s, ctx);
  if (t.deadline == null || ctx.now < t.deadline) return;
  if (t.phase === 'answering') closeQuestion(s);
  else if (t.phase === 'result') nextTurn(s, ctx);
}

function removePlayer(s: GameState, playerId: string, ctx: Ctx) {
  const p = findPlayer(s, playerId);
  if (!p) return;
  const inRound = s.status === 'playing' || s.status === 'paused';
  const wasTurn = inRound && s.turn?.playerId === playerId;
  if (wasTurn) {
    // Hand the turn on while the leaver is still in the order, so "next" is well defined.
    p.connected = false;
    nextTurn(s, ctx);
  }
  s.players = s.players.filter((o) => o.id !== playerId);
  s.order = s.order.filter((id) => id !== playerId);
  delete s.identities[playerId];
  delete s.revealedClues[playerId];
  // Handing the turn on may already have ended the round.
  if (s.status !== 'playing' && s.status !== 'paused') return;
  if (s.players.length === 0 || s.players.every((o) => o.solved)) return finishRound(s, 'noPlayers', ctx);
  if (!wasTurn && s.turn?.phase === 'answering') maybeCloseQuestion(s, ctx);
}
