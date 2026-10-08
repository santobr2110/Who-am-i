import { LEVEL_RULES } from '../config/levels';
import { PACKS, getIdentity } from '../content';
import type { GameState, GameView, IdentityView, Player, Viewer } from '../types';
import { elapsedMs } from './engine';

/**
 * Secrecy lives here, on the server: a browser is never sent its own unsolved identity,
 * so nothing in devtools can spoil the game.
 */
function canSeeIdentity(s: GameState, viewer: Viewer, player: Player): boolean {
  if (s.status === 'roundEnd' || s.status === 'gameOver' || player.solved) return true;
  if (viewer.role === 'spectator' || viewer.id == null) return false;
  return viewer.id !== player.id;
}

function identityView(s: GameState, playerId: string): IdentityView | null {
  const identity = getIdentity(s.identities[playerId]);
  if (!identity) return null;
  const { id, name, image, description, category } = identity;
  return { id, name, image, description, category };
}

export function toView(s: GameState, viewer: Viewer, now: number): GameView {
  const me = s.players.find((p) => p.id === viewer.id) ?? null;
  const rules = LEVEL_RULES[s.config.level];
  const myIdentity = me ? getIdentity(s.identities[me.id]) : undefined;
  const revealed = me ? (s.revealedClues[me.id] ?? 0) : 0;
  const inRound = s.status === 'playing' || s.status === 'paused';

  return {
    gameId: s.gameId,
    status: s.status,
    config: s.config,
    round: s.round,
    serverNow: now,
    hostConnected: s.hostConnected,
    you: {
      id: viewer.id,
      role: viewer.role,
      isHost: viewer.role === 'host',
      isPlayer: !!me,
    },
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      ready: p.ready,
      connected: p.connected,
      isHost: p.id === s.hostId,
      score: p.score,
      roundPoints: p.roundPoints,
      roundQuestions: p.roundQuestions,
      solved: p.solved,
      stats: p.stats,
      identity: s.round > 0 && canSeeIdentity(s, viewer, p) ? identityView(s, p.id) : null,
    })),
    order: s.order,
    turn: s.turn,
    questions: s.questions.filter((q) => q.round === s.round),
    guesses: s.guesses.filter((g) => g.round === s.round),
    myClues: myIdentity && inRound ? myIdentity.clues.slice(0, revealed) : [],
    cluesRemaining:
      myIdentity && inRound && !me?.solved
        ? Math.max(0, Math.min(rules.clues, myIdentity.clues.length) - revealed)
        : 0,
    // The whole pool of the selected packs, so the list itself gives nothing away.
    guessOptions: rules.guessOptions
      ? PACKS.filter((p) => s.config.packIds.includes(p.id))
          .flatMap((p) => p.identities.map((i) => i.name))
          .sort((a, b) => a.localeCompare(b))
      : null,
    timer: {
      limitMs: s.timer.limitMs,
      elapsedMs: elapsedMs(s, now),
      running: s.timer.runningSince != null,
    },
    history: s.history,
    endReason: s.endReason,
  };
}
