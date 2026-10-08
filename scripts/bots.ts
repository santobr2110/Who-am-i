/**
 * Fills a game with simple bot players so one person can try a full table.
 *
 *   npm run bots -- ABCD 7          # 7 bots join game ABCD and play
 *   npm run bots -- ABCD 3 --idle   # join and answer, but never take a turn
 *
 * Bots answer at random and sometimes guess; they see exactly what a real player sees.
 */
import WebSocket from 'ws';
import { SUGGESTED_QUESTIONS } from '../shared/content/questions';
import type { AnswerValue, ClientAction, ClientMessage, GameView, ServerMessage } from '../shared/types';

const NAMES = ['Ana', 'Lucas', 'Bia', 'Pedro', 'Julia', 'Rafa', 'Clara', 'Theo'];
const [code = '', countArg = '3'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const idle = process.argv.includes('--idle');
const url = process.env.WAI_URL ?? 'ws://localhost:5180/ws';

if (!/^[A-Za-z]{4}$/.test(code)) {
  console.error('Usage: npm run bots -- <GAME CODE> [count] [--idle]');
  process.exit(1);
}

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const pause = (min: number, max: number) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

function spawn(name: string) {
  const ws = new WebSocket(url);
  const send = (msg: ClientMessage) => ws.send(JSON.stringify(msg));
  const act = (action: ClientAction) => send({ t: 'action', action });
  let handled = '';

  ws.on('open', () => send({ t: 'join', code, sessionId: `bot-${name}-${Date.now()}`, name }));
  ws.on('message', async (raw) => {
    const msg = JSON.parse(String(raw)) as ServerMessage;
    if (msg.t === 'error') return console.log(`[${name}] ${msg.message}`);
    if (msg.t !== 'state') return;
    const view: GameView = msg.view;
    const me = view.players.find((p) => p.id === view.you.id);
    if (!me) return;
    if (view.status === 'lobby' && !me.ready) return act({ type: 'setReady', ready: true });
    const turn = view.turn;
    if (view.status !== 'playing' || !turn) return;

    // React once per distinct situation, after a human-ish delay.
    const key = `${view.round}:${turn.playerId}:${turn.phase}:${turn.questionId}:${turn.questionsThisTurn}`;
    if (key === handled) return;
    handled = key;
    const question = view.questions.find((q) => q.id === turn.questionId);

    if (turn.phase === 'answering' && turn.playerId !== me.id && question && !question.answers[me.id]) {
      await pause(600, 3500);
      const options: AnswerValue[] = view.config.allowNotSure ? ['yes', 'yes', 'no', 'no', 'unsure'] : ['yes', 'no'];
      return act({ type: 'answer', value: pick(options) });
    }
    if (turn.playerId !== me.id) return;
    if (idle) {
      await pause(800, 1500);
      return turn.phase === 'asking' || turn.phase === 'deciding' ? act({ type: 'endTurn' }) : undefined;
    }
    if (turn.phase === 'asking') {
      await pause(1500, 4000);
      if (me.roundQuestions >= 3 && view.guessOptions && Math.random() < 0.3) {
        return act({ type: 'guess', text: pick(view.guessOptions) });
      }
      return act({ type: 'askQuestion', text: pick(SUGGESTED_QUESTIONS[view.config.level]) });
    }
    if (turn.phase === 'deciding') {
      await pause(1500, 3000);
      const canAsk = turn.questionsThisTurn < view.config.questionsPerTurn;
      return act(canAsk && Math.random() < 0.5 ? { type: 'continueAsking' } : { type: 'endTurn' });
    }
  });
  ws.on('close', () => console.log(`[${name}] disconnected`));
}

const count = Math.min(8, Math.max(1, Number(countArg) || 3));
NAMES.slice(0, count).forEach((name, i) => setTimeout(() => spawn(name), i * 250));
console.log(`${count} bots joining game ${code.toUpperCase()}…`);
