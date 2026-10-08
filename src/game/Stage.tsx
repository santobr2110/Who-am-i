import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { LEVEL_RULES } from '../../shared/config/levels';
import { SUGGESTED_QUESTIONS } from '../../shared/content/questions';
import { QUESTION_MAX } from '../../shared/engine/engine';
import type { AnswerValue, GameView, PlayerView } from '../../shared/types';
import { brand } from '../brand/assets';
import { Icon } from '../components/Icon';
import { AnswerBadge, AnswerButton, Avatar, Button, Confetti, IconButton, IdentityCard, Mascot } from '../components/ui';
import {
  ANSWER_LABEL,
  ANSWER_ORDER,
  activePlayer,
  answerers,
  currentGuess,
  currentQuestion,
  formatClock,
  me,
  playerById,
  plural,
  possessive,
  tally,
} from '../lib/game';
import { useNow } from '../lib/hooks';
import { useGame } from '../net/room';
import { speech } from '../services/speech';

interface StageProps {
  secretsHidden: boolean;
  onOpenNotes: () => void;
}

/** The centre of the table. Shows exactly one thing: what is happening right now, and what you can do. */
export function Stage({ secretsHidden, onOpenNotes }: StageProps) {
  const { view } = useGame();
  const turn = view.turn;
  const active = activePlayer(view);
  const mine = me(view);
  const isMine = !!mine && mine.id === turn?.playerId;
  const [guessing, setGuessing] = useState(false);

  // Leaving the guess form whenever the table moves on keeps a stale form from lingering.
  useEffect(() => setGuessing(false), [turn?.playerId, turn?.phase, turn?.questionId]);

  if (!turn || !active) return null;

  let body: ReactNode;
  if (turn.phase === 'result') body = <ResultPanel view={view} active={active} isMine={isMine} />;
  else if (isMine && guessing) body = <GuessPanel view={view} onBack={() => setGuessing(false)} />;
  else if (turn.phase === 'asking') {
    body = isMine ? (
      <AskPanel view={view} onGuess={() => setGuessing(true)} onOpenNotes={onOpenNotes} />
    ) : (
      <WaitingPanel view={view} active={active} secretsHidden={secretsHidden} />
    );
  } else if (turn.phase === 'answering') {
    body = <QuestionPanel view={view} active={active} isMine={isMine} secretsHidden={secretsHidden} />;
  } else {
    body = <TallyPanel view={view} active={active} isMine={isMine} onGuess={() => setGuessing(true)} />;
  }

  return (
    <section className="stage" data-mine={isMine} aria-live="polite">
      <div className="turn-banner" data-mine={isMine} key={turn.playerId}>
        <Icon name="target" size={16} />
        {isMine ? 'Your turn' : `${possessive(active.name)} turn`}
      </div>
      <div className="stage__body" key={`${turn.playerId}-${turn.phase}-${turn.questionId}-${guessing}`}>
        {body}
      </div>
    </section>
  );
}

// ───────────── Asking ─────────────

function AskPanel({ view, onGuess, onOpenNotes }: { view: GameView; onGuess: () => void; onOpenNotes: () => void }) {
  const { send } = useGame();
  const rules = LEVEL_RULES[view.config.level];
  const [text, setText] = useState('');
  const [offset, setOffset] = useState(0);
  const turn = view.turn!;
  const mine = me(view)!;

  const suggestions = useMemo(() => {
    const asked = new Set(view.questions.filter((q) => q.askerId === mine.id).map((q) => q.text.toLowerCase()));
    const pool = SUGGESTED_QUESTIONS[view.config.level].filter((q) => !asked.has(q.toLowerCase()));
    return Array.from({ length: Math.min(rules.suggestions, pool.length) }, (_, i) => pool[(offset + i) % pool.length]);
  }, [view.questions, view.config.level, mine.id, offset, rules.suggestions]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 3) send({ type: 'askQuestion', text });
  };
  const useStarter = (starter: string) => {
    setText(starter.replace('…', ' '));
    document.getElementById('question-input')?.focus();
  };
  const left = view.config.questionsPerTurn - turn.questionsThisTurn;

  return (
    <div className="panel panel--ask">
      <h2 className="h2">Ask a question</h2>
      <p className="panel__sub">
        <Icon name="mic" size={16} /> Say it out loud, then send it to the table.
      </p>

      <form className="ask" onSubmit={submit}>
        <label className="sr-only" htmlFor="question-input">
          Your question
        </label>
        <input
          id="question-input"
          className="input input--xl"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, QUESTION_MAX))}
          placeholder="Type your question…"
          autoComplete="off"
          autoFocus
          enterKeyHint="send"
        />
        <Button type="submit" variant="gold" size="lg" icon="send" disabled={text.trim().length < 3}>
          Ask
        </Button>
      </form>

      {rules.starters.length > 0 && (
        <div className="chips chips--center" aria-label="Sentence starters">
          {rules.starters.map((s) => (
            <button key={s} type="button" className="chip chip--starter" onClick={() => useStarter(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions">
          <div className="suggestions__head">
            <span className="eyebrow">Suggested questions</span>
            <IconButton icon="shuffle" label="Show other suggestions" onClick={() => setOffset((o) => o + rules.suggestions)} />
          </div>
          <div className="chips">
            {suggestions.map((q) => (
              <button key={q} type="button" className="chip" onClick={() => setText(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {view.myClues.length > 0 && (
        <ul className="clues">
          {view.myClues.map((c) => (
            <li key={c}>
              <Icon name="bulb" size={16} /> {c}
            </li>
          ))}
        </ul>
      )}

      <div className="panel__actions">
        <Button variant="primary" icon="star" onClick={onGuess}>
          I know who I am!
        </Button>
        {view.cluesRemaining > 0 && (
          <Button variant="ghost" icon="bulb" onClick={() => send({ type: 'requestClue' })}>
            Clue ({view.cluesRemaining})
          </Button>
        )}
        {mine.roundQuestions > 0 && (
          <Button variant="ghost" icon="notes" onClick={onOpenNotes}>
            My notes
          </Button>
        )}
        <Button variant="ghost" icon="skip" onClick={() => send({ type: 'endTurn' })}>
          Pass
        </Button>
      </div>
      <p className="hint">{left > 1 ? `${left} questions left this turn.` : 'Last question this turn.'}</p>
    </div>
  );
}

function WaitingPanel({ view, active, secretsHidden }: { view: GameView; active: PlayerView; secretsHidden: boolean }) {
  const canSee = !!active.identity && !secretsHidden;
  return (
    <div className="panel panel--waiting">
      <h2 className="h2">Waiting for {active.name}…</h2>
      <p className="panel__sub">
        {view.you.isPlayer ? 'Get ready to answer.' : `${active.name} is thinking of a question.`}
      </p>
      <div className="reveal">
        <IdentityCard
          identity={canSee ? active.identity : null}
          label={`${active.name} is`}
          hiddenHint={active.identity ? 'Hidden on this screen' : 'Secret'}
        />
        {canSee && <p className="reveal__warn">Shh — don't say this name out loud!</p>}
      </div>
    </div>
  );
}

// ───────────── Answering ─────────────

function QuestionBubble({ asker, text, mine }: { asker: PlayerView; text: string; mine: boolean }) {
  return (
    <figure className="bubble">
      <figcaption className="bubble__who">
        <Avatar index={asker.avatar} name={asker.name} size={36} />
        <span className="eyebrow">{mine ? 'You asked' : `${asker.name} asks`}</span>
        {speech.available && <IconButton icon="volume" label="Listen to the question" onClick={() => speech.speak(text)} />}
      </figcaption>
      <blockquote className="bubble__text">“{text}”</blockquote>
    </figure>
  );
}

function QuestionPanel({ view, active, isMine, secretsHidden }: { view: GameView; active: PlayerView; isMine: boolean; secretsHidden: boolean }) {
  const { send, viewAt } = useGame();
  const now = useNow(250);
  const question = currentQuestion(view);
  const mine = me(view);
  if (!question) return null;

  const expected = answerers(view);
  const answered = expected.filter((p) => question.answers[p.id]);
  const myAnswer = mine ? question.answers[mine.id] : undefined;
  const canAnswer = !!mine && !isMine && !myAnswer;
  const serverNow = view.serverNow + (now - viewAt);
  const remaining = view.turn?.deadline != null && view.status === 'playing' ? view.turn.deadline - serverNow : null;
  const options: AnswerValue[] = view.config.allowNotSure ? ANSWER_ORDER : ['yes', 'no'];

  return (
    <div className="panel panel--question">
      <QuestionBubble asker={active} text={question.text} mine={isMine} />

      {canAnswer ? (
        <>
          {active.identity && !secretsHidden && (
            <p className="reminder">
              {active.name} is{' '}
              <strong>
                {active.identity.image.kind === 'emoji' && `${active.identity.image.value} `}
                {active.identity.name}
              </strong>
            </p>
          )}
          <div className="answers" role="group" aria-label="Your answer">
            {options.map((value) => (
              <AnswerButton key={value} value={value} onClick={() => send({ type: 'answer', value })} />
            ))}
          </div>
        </>
      ) : (
        <div className="progress">
          {myAnswer && (
            <p className="progress__mine">
              You said <AnswerBadge value={myAnswer} />
            </p>
          )}
          <div className="progress__avatars">
            {expected.map((p) => (
              <span key={p.id} className="progress__who" data-done={!!question.answers[p.id]} title={p.name}>
                <Avatar index={p.avatar} name={p.name} size={40} />
                {question.answers[p.id] && <Icon name="check" size={12} />}
              </span>
            ))}
          </div>
          <p className="panel__sub" role="status">
            {answered.length}/{expected.length} answered
            {remaining != null && remaining > 0 && ` · closes in ${formatClock(remaining)}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────── Deciding ─────────────

function TallyPanel({ view, active, isMine, onGuess }: { view: GameView; active: PlayerView; isMine: boolean; onGuess: () => void }) {
  const { send } = useGame();
  const question = currentQuestion(view);
  if (!question) return null;
  const votes = tally(question);
  const total = Object.keys(question.answers).length;
  const left = view.config.questionsPerTurn - view.turn!.questionsThisTurn;
  const rows = ANSWER_ORDER.filter((v) => v !== 'unsure' || view.config.allowNotSure || votes.unsure.length);

  return (
    <div className="panel panel--tally">
      <QuestionBubble asker={active} text={question.text} mine={isMine} />

      {total === 0 ? (
        <p className="panel__sub">Nobody answered in time. Ask them out loud!</p>
      ) : (
        <ul className="tally">
          {rows.map((value) => (
            <li key={value} className="tally__row" data-value={value} data-empty={votes[value].length === 0}>
              <AnswerBadge value={value} />
              <span className="tally__bar">
                <span style={{ width: `${(votes[value].length / total) * 100}%` }} />
              </span>
              <span className="tally__count">
                <span className="sr-only">{ANSWER_LABEL[value]}: </span>
                {plural(votes[value].length, 'player')}
              </span>
              <span className="tally__who">
                {votes[value].map((id) => {
                  const p = playerById(view, id);
                  return p ? <Avatar key={id} index={p.avatar} name={p.name} size={26} /> : null;
                })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isMine ? (
        <>
          <div className="panel__actions">
            {left > 0 && (
              <Button variant="gold" size="lg" icon="send" onClick={() => send({ type: 'continueAsking' })}>
                Ask another question
              </Button>
            )}
            <Button variant="primary" size="lg" icon="star" onClick={onGuess}>
              I know who I am!
            </Button>
            <Button variant="ghost" icon="skip" onClick={() => send({ type: 'endTurn' })}>
              {left > 0 ? 'End my turn' : 'Next player'}
            </Button>
          </div>
          {view.cluesRemaining > 0 && (
            <button className="link" onClick={() => send({ type: 'requestClue' })}>
              Stuck? Take a clue ({view.cluesRemaining} left)
            </button>
          )}
          {view.myClues.length > 0 && (
            <ul className="clues">
              {view.myClues.map((c) => (
                <li key={c}>
                  <Icon name="bulb" size={16} /> {c}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="panel__sub" role="status">
          {active.name} is deciding what to do next…
        </p>
      )}
    </div>
  );
}

// ───────────── Guessing ─────────────

function GuessPanel({ view, onBack }: { view: GameView; onBack: () => void }) {
  const { send } = useGame();
  const [text, setText] = useState('');
  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!view.guessOptions || !q) return [];
    return view.guessOptions.filter((name) => name.toLowerCase().includes(q) && name.toLowerCase() !== q).slice(0, 6);
  }, [text, view.guessOptions]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) send({ type: 'guess', text });
  };

  return (
    <div className="panel panel--guess">
      <IdentityCard identity={null} size="sm" hiddenHint="Your card" />
      <h2 className="h2">Who am I?</h2>
      <p className="panel__sub">Say it out loud: “I think I am…”</p>
      <form className="ask" onSubmit={submit}>
        <label className="sr-only" htmlFor="guess-input">
          Your guess
        </label>
        <input
          id="guess-input"
          className="input input--xl"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 60))}
          placeholder={view.guessOptions ? 'Search or type a name…' : 'Type your guess…'}
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" variant="gold" size="lg" icon="star" disabled={!text.trim()}>
          That's me!
        </Button>
      </form>
      {matches.length > 0 && (
        <div className="chips chips--center">
          {matches.map((name) => (
            <button key={name} type="button" className="chip" onClick={() => setText(name)}>
              {name}
            </button>
          ))}
        </div>
      )}
      <Button variant="ghost" icon="back" onClick={onBack}>
        Not yet — keep asking
      </Button>
    </div>
  );
}

function ResultPanel({ view, active, isMine }: { view: GameView; active: PlayerView; isMine: boolean }) {
  const guess = currentGuess(view);
  if (!guess) return null;

  if (guess.correct) {
    return (
      <div className="panel panel--result panel--correct">
        <Confetti />
        <p className="eyebrow">{isMine ? 'Mystery solved' : `${active.name} got it!`}</p>
        <h2 className="h1 pop">{isMine ? 'YOU GOT IT!' : 'CORRECT!'}</h2>
        <IdentityCard identity={active.identity} tone="gold" size="lg" label={isMine ? 'You are' : `${active.name} is`} />
        <p className="points">+{guess.points} points</p>
      </div>
    );
  }
  return (
    <div className="panel panel--result panel--wrong">
      <Mascot src={brand.mascots.bluePeek} className="panel__mascot" />
      <h2 className="h2">Not quite!</h2>
      <p className="panel__sub">
        {isMine ? (
          <>You are not “{guess.text}”. Keep playing — you're getting closer.</>
        ) : (
          <>
            {active.name} guessed “{guess.text}”. Keep playing!
          </>
        )}
      </p>
    </div>
  );
}
