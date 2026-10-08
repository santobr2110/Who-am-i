import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config/levels';
import { SCORING, guessPoints, looksLikeEnglishQuestion } from '../config/scoring';
import { getIdentity } from '../content';
import type { GameAction, GameConfig, GameState } from '../types';
import { GameError, OFFLINE_GRACE_MS, RESULT_MS, applyAction, createGame } from './engine';
import { isCorrectGuess } from './guess';
import { toView } from './view';

const HOST = 'host';

function seeded(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

class Table {
  state: GameState;
  now = 1_000_000;
  rng = seeded();

  constructor(playerCount: number, config: Partial<GameConfig> = {}) {
    this.state = createGame('TEST', HOST, { ...DEFAULT_CONFIG, ...config }, this.now);
    for (let i = 1; i <= playerCount; i++) this.sys({ type: 'join', playerId: `p${i}`, name: `Player ${i}` });
  }
  do(actor: string | null, action: GameAction) {
    this.state = applyAction(this.state, actor, action, { now: this.now, rng: this.rng });
    return this;
  }
  sys(action: GameAction) {
    return this.do(null, action);
  }
  host(action: GameAction) {
    return this.do(HOST, action);
  }
  wait(ms: number) {
    this.now += ms;
    return this.sys({ type: 'tick' });
  }
  get active() {
    return this.state.turn!.playerId;
  }
  others() {
    return this.state.players.filter((p) => p.id !== this.active).map((p) => p.id);
  }
  player(id: string) {
    return this.state.players.find((p) => p.id === id)!;
  }
  identityOf(id: string) {
    return getIdentity(this.state.identities[id])!;
  }
  /** Active player asks, everyone else answers yes. */
  askRound(text = 'Am I a person?') {
    const asker = this.active;
    this.do(asker, { type: 'askQuestion', text });
    for (const id of this.others()) this.do(id, { type: 'answer', value: 'yes' });
    return asker;
  }
  guessRight() {
    const id = this.active;
    this.do(id, { type: 'guess', text: this.identityOf(id).name });
    return id;
  }
}

describe.each([2, 3, 4, 8])('a game with %i players', (n) => {
  it('deals a distinct secret identity to everyone and hides your own from you', () => {
    const t = new Table(n).host({ type: 'startGame' });
    expect(t.state.status).toBe('playing');
    expect(new Set(Object.values(t.state.identities)).size).toBe(n);
    for (const p of t.state.players) {
      const view = toView(t.state, { id: p.id, role: 'player' }, t.now);
      expect(view.players.find((v) => v.id === p.id)!.identity).toBeNull();
      expect(view.players.filter((v) => v.id !== p.id).every((v) => v.identity)).toBe(true);
      expect(JSON.stringify(view)).not.toContain(t.identityOf(p.id).id);
    }
    const board = toView(t.state, { id: null, role: 'spectator' }, t.now);
    expect(board.players.every((v) => v.identity === null)).toBe(true);
  });

  it('plays a full round until everyone has guessed', () => {
    const t = new Table(n).host({ type: 'startGame' });
    let safety = 0;
    while (t.state.status === 'playing' && safety++ < 100) {
      t.askRound();
      expect(t.state.turn!.phase).toBe('deciding');
      t.guessRight();
      expect(t.state.turn!.phase).toBe('result');
      t.wait(RESULT_MS.correct);
    }
    expect(t.state.status).toBe('roundEnd');
    expect(t.state.history[0].reason).toBe('allSolved');
    expect(t.state.players.every((p) => p.solved)).toBe(true);
    expect(t.state.players.every((p) => p.score >= SCORING.correctGuess)).toBe(true);
  });
});

describe('turns', () => {
  it('rejects actions from players who are not on turn', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const bystander = t.others()[0];
    expect(() => t.do(bystander, { type: 'askQuestion', text: 'Am I a cat?' })).toThrow(GameError);
    expect(() => t.do(bystander, { type: 'guess', text: 'Cat' })).toThrow(GameError);
    expect(() => t.do(t.active, { type: 'answer', value: 'yes' })).toThrow(GameError);
  });

  it('limits questions per turn, then the player guesses or passes', () => {
    const t = new Table(3, { questionsPerTurn: 2 }).host({ type: 'startGame' });
    const first = t.askRound();
    t.do(first, { type: 'continueAsking' });
    t.askRound('Am I alive?');
    expect(() => t.do(first, { type: 'continueAsking' })).toThrow(/No more questions/);
    t.do(first, { type: 'endTurn' });
    expect(t.active).not.toBe(first);
    expect(t.state.turn!.phase).toBe('asking');
  });

  it('a wrong guess costs nothing and passes the turn', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const id = t.active;
    const before = t.player(id).score;
    t.do(id, { type: 'guess', text: 'Definitely not this' });
    expect(t.state.guesses[0].correct).toBe(false);
    expect(t.player(id).score).toBe(before);
    expect(t.player(id).solved).toBe(false);
    t.wait(RESULT_MS.wrong);
    expect(t.active).not.toBe(id);
  });

  it('skips players who already know who they are', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const solved = t.guessRight();
    t.wait(RESULT_MS.correct);
    for (let i = 0; i < 6; i++) {
      expect(t.active).not.toBe(solved);
      t.do(t.active, { type: 'endTurn' });
    }
  });
});

describe('answers', () => {
  it('closes the question by itself when the answer window ends', () => {
    const t = new Table(4, { answerSeconds: 30 }).host({ type: 'startGame' });
    t.do(t.active, { type: 'askQuestion', text: 'Am I famous?' });
    t.do(t.others()[0], { type: 'answer', value: 'no' });
    expect(t.state.turn!.phase).toBe('answering');
    t.wait(30_000);
    expect(t.state.turn!.phase).toBe('deciding');
    expect(Object.keys(t.state.questions[0].answers)).toHaveLength(1);
  });

  it('respects the "Not sure" setting and one answer per player', () => {
    const t = new Table(3, { allowNotSure: false }).host({ type: 'startGame' });
    t.do(t.active, { type: 'askQuestion', text: 'Am I famous?' });
    const [a] = t.others();
    expect(() => t.do(a, { type: 'answer', value: 'unsure' })).toThrow(/turned off/);
    t.do(a, { type: 'answer', value: 'yes' });
    expect(() => t.do(a, { type: 'answer', value: 'no' })).toThrow(/already/);
  });

  it('does not wait for a player who dropped out of the call', () => {
    const t = new Table(3).host({ type: 'startGame' });
    t.do(t.active, { type: 'askQuestion', text: 'Am I famous?' });
    const [a, b] = t.others();
    t.do(a, { type: 'answer', value: 'yes' });
    t.sys({ type: 'connection', playerId: b, connected: false });
    expect(t.state.turn!.phase).toBe('deciding');
  });
});

describe('remote play resilience', () => {
  it('passes the turn when the active player stays offline', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const gone = t.active;
    t.sys({ type: 'connection', playerId: gone, connected: false });
    t.wait(OFFLINE_GRACE_MS - 1000);
    expect(t.active).toBe(gone);
    t.wait(1000);
    expect(t.active).not.toBe(gone);
  });

  it('keeps the turn if the active player reconnects in time', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const id = t.active;
    t.sys({ type: 'connection', playerId: id, connected: false });
    t.wait(5000);
    t.sys({ type: 'connection', playerId: id, connected: true });
    t.wait(OFFLINE_GRACE_MS);
    expect(t.active).toBe(id);
  });

  it('lets a player join mid-round with a card and a turn', () => {
    const t = new Table(2).host({ type: 'startGame' });
    t.sys({ type: 'join', playerId: 'late', name: 'Latecomer' });
    expect(t.state.identities.late).toBeTruthy();
    expect(t.state.order).toContain('late');
    expect(new Set(Object.values(t.state.identities)).size).toBe(3);
  });

  it('survives the active player leaving', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const leaver = t.active;
    t.sys({ type: 'leave', playerId: leaver });
    expect(t.state.players).toHaveLength(2);
    expect(t.state.status).toBe('playing');
    expect(t.active).not.toBe(leaver);
  });

  it('refuses a ninth player and duplicate names get a suffix', () => {
    const t = new Table(8);
    expect(() => t.sys({ type: 'join', playerId: 'p9', name: 'Nine' })).toThrow(/full/);
    const d = new Table(1).sys({ type: 'join', playerId: 'x', name: 'player 1' });
    expect(d.player('x').name).toBe('player 1 2');
  });
});

describe('teacher controls', () => {
  it('only the teacher can start, and needs two players', () => {
    const t = new Table(1);
    expect(() => t.do('p1', { type: 'startGame' })).toThrow(/teacher/);
    expect(() => t.host({ type: 'startGame' })).toThrow(/at least 2/);
  });

  it('pausing freezes the clock and the answer window', () => {
    const t = new Table(3, { timerMinutes: 10, answerSeconds: 30 }).host({ type: 'startGame' });
    t.do(t.active, { type: 'askQuestion', text: 'Am I famous?' });
    t.wait(10_000);
    t.host({ type: 'pause' });
    t.wait(60_000);
    expect(t.state.status).toBe('paused');
    expect(toView(t.state, { id: HOST, role: 'host' }, t.now).timer.elapsedMs).toBe(10_000);
    t.host({ type: 'resume' });
    t.wait(19_000);
    expect(t.state.turn!.phase).toBe('answering');
    t.wait(1_000);
    expect(t.state.turn!.phase).toBe('deciding');
  });

  it("ends the game when time is up", () => {
    const t = new Table(3, { timerMinutes: 10 }).host({ type: 'startGame' });
    t.askRound();
    t.wait(10 * 60_000);
    expect(t.state.status).toBe('gameOver');
    expect(t.state.endReason).toBe('timeUp');
    expect(t.state.history).toHaveLength(1);
    const view = toView(t.state, { id: 'p1', role: 'player' }, t.now);
    expect(view.players.every((p) => p.identity)).toBe(true);
  });

  it('restarting a round takes back its points and deals new cards', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const before = { ...t.state.identities };
    t.askRound();
    t.host({ type: 'restartRound' });
    expect(t.state.round).toBe(1);
    expect(t.state.questions).toHaveLength(0);
    expect(t.state.players.every((p) => p.score === 0)).toBe(true);
    expect(Object.values(t.state.identities)).not.toEqual(Object.values(before));
  });

  it('keeps scores across rounds, rotates the opener, and can start over', () => {
    const t = new Table(3).host({ type: 'startGame' });
    t.guessRight();
    const scorer = t.active;
    t.host({ type: 'endRound' });
    expect(t.state.status).toBe('roundEnd');
    t.host({ type: 'nextRound' });
    expect(t.state.round).toBe(2);
    expect(t.player(scorer).score).toBeGreaterThanOrEqual(SCORING.correctGuess);
    expect(t.player(scorer).solved).toBe(false);
    t.host({ type: 'endGame' });
    expect(t.state.status).toBe('gameOver');
    // Round 2 was never played, so it leaves no trace in the history.
    expect(t.state.history).toHaveLength(1);
    t.host({ type: 'playAgain' });
    expect(t.state.status).toBe('lobby');
    expect(t.state.players.every((p) => p.score === 0)).toBe(true);
  });

  it('the teacher can sit at the table for a one-to-one class', () => {
    const t = new Table(1, { hostPlays: true }).sys({ type: 'join', playerId: HOST, name: 'Teacher' });
    t.host({ type: 'startGame' });
    const view = toView(t.state, { id: HOST, role: 'host' }, t.now);
    expect(view.you.isPlayer).toBe(true);
    expect(view.players.find((p) => p.id === HOST)!.identity).toBeNull();
  });
});

describe('levels and clues', () => {
  it('gives beginners clues and a list of names, and advanced players neither', () => {
    const a1 = new Table(2, { level: 'A1' }).host({ type: 'startGame' });
    const id = a1.active;
    a1.do(id, { type: 'requestClue' });
    const view = toView(a1.state, { id, role: 'player' }, a1.now);
    expect(view.myClues).toEqual([a1.identityOf(id).clues[0]]);
    expect(view.cluesRemaining).toBe(2);
    expect(view.guessOptions!.length).toBeGreaterThan(20);

    const c1 = new Table(2, { level: 'C1', difficulty: 'hard' }).host({ type: 'startGame' });
    expect(() => c1.do(c1.active, { type: 'requestClue' })).toThrow(/No clues/);
    expect(toView(c1.state, { id: c1.active, role: 'player' }, c1.now).guessOptions).toBeNull();
  });

  it('only deals identities that fit the level and difficulty', () => {
    const t = new Table(8, { level: 'A1', difficulty: 'easy', packIds: ['people', 'animals', 'objects'] });
    t.host({ type: 'startGame' });
    for (const p of t.state.players) {
      expect(t.identityOf(p.id).languageLevel).toBe('A1');
      expect(t.identityOf(p.id).difficulty).toBe(1);
    }
  });
});

describe('scoring and guesses', () => {
  it('rewards guessing with fewer questions and clues', () => {
    expect(guessPoints(0, 0)).toBe(150);
    expect(guessPoints(4, 0)).toBe(130);
    expect(guessPoints(4, 1)).toBe(120);
    expect(guessPoints(30, 3)).toBe(SCORING.correctGuess);
  });

  it('gives participation points for asking and answering', () => {
    const t = new Table(3).host({ type: 'startGame' });
    const asker = t.askRound('Am I a famous person?');
    expect(t.player(asker).score).toBe(SCORING.askQuestion + SCORING.englishQuestion);
    expect(t.player(t.others()[0]).score).toBe(SCORING.answerQuestion);
  });

  it('recognises a well-formed English question', () => {
    expect(looksLikeEnglishQuestion('Am I a singer?')).toBe(true);
    expect(looksLikeEnglishQuestion('You singer?')).toBe(false);
    expect(looksLikeEnglishQuestion('Eu sou cantor?')).toBe(false);
  });

  it('forgives accents, articles and small typos in a guess', () => {
    const amazon = getIdentity('places/amazon-rainforest')!;
    const beyonce = getIdentity('people/beyonce')!;
    expect(isCorrectGuess(amazon, 'the amazon')).toBe(true);
    expect(isCorrectGuess(amazon, 'Amazon Rainforrest')).toBe(true);
    expect(isCorrectGuess(beyonce, 'beyonce')).toBe(true);
    expect(isCorrectGuess(beyonce, 'Rihanna')).toBe(false);
    expect(isCorrectGuess(getIdentity('animals/cat')!, 'car')).toBe(false);
  });
});
