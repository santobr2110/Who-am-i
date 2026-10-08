import type { GameView } from '../../shared/types';
import { Icon } from '../components/Icon';
import { AnswerBadge, Avatar, Button, IdentityCard, Sheet } from '../components/ui';
import { ANSWER_ORDER, me, tally } from '../lib/game';

/** Everything the player has learned about themselves this round. */
export function NotesSheet({ view, open, onClose }: { view: GameView; open: boolean; onClose: () => void }) {
  const mine = me(view);
  const questions = view.questions.filter((q) => q.askerId === mine?.id && q.closed);
  const wrong = view.guesses.filter((g) => g.playerId === mine?.id && !g.correct);

  return (
    <Sheet open={open} onClose={onClose} title="What I know" eyebrow="My notes">
      {questions.length === 0 && view.myClues.length === 0 && wrong.length === 0 && (
        <p className="empty">Nothing yet. Ask your first question to start collecting clues.</p>
      )}
      <ul className="notes">
        {questions.map((q) => {
          const votes = tally(q);
          return (
            <li key={q.id}>
              <span className="notes__q">“{q.text}”</span>
              <span className="notes__a">
                {ANSWER_ORDER.filter((v) => votes[v].length).map((v) => (
                  <span key={v} className="notes__vote">
                    <AnswerBadge value={v} /> × {votes[v].length}
                  </span>
                ))}
                {Object.keys(q.answers).length === 0 && <em>No answers</em>}
              </span>
            </li>
          );
        })}
      </ul>
      {view.myClues.length > 0 && (
        <>
          <h3 className="eyebrow sheet__section">Clues</h3>
          <ul className="clues clues--left">
            {view.myClues.map((c) => (
              <li key={c}>
                <Icon name="bulb" size={16} /> {c}
              </li>
            ))}
          </ul>
        </>
      )}
      {wrong.length > 0 && (
        <>
          <h3 className="eyebrow sheet__section">I am not…</h3>
          <div className="chips">
            {wrong.map((g) => (
              <span key={g.id} className="chip chip--static">
                {g.text}
              </span>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Other players' cards, for small screens where the seats are too compact to show them. */
export function CardsSheet({ view, open, onClose, secretsHidden }: { view: GameView; open: boolean; onClose: () => void; secretsHidden: boolean }) {
  return (
    <Sheet open={open} onClose={onClose} title="Secret cards" eyebrow="Don't say these out loud">
      <div className="cardgrid">
        {view.players.map((p) => {
          const isMe = p.id === view.you.id;
          return (
            <div key={p.id} className="cardgrid__item">
              <span className="cardgrid__who">
                <Avatar index={p.avatar} name={p.name} size={28} /> {isMe ? 'You' : p.name}
              </span>
              <IdentityCard
                identity={p.solved || !secretsHidden ? p.identity : null}
                size="sm"
                hiddenHint={isMe ? 'Who am I?' : 'Hidden'}
              />
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Shown once when a round starts: the "cards are dealt" moment and the one rule that matters. */
export function DealOverlay({ view, onDone }: { view: GameView; onDone: () => void }) {
  const mine = me(view);
  return (
    <div className="deal" role="dialog" aria-modal="true" aria-label={`Round ${view.round}`}>
      <div className="deal__inner">
        <p className="eyebrow eyebrow--gold">Round {view.round}</p>
        <h2 className="h1">{mine ? 'Your secret identity' : 'The cards are dealt'}</h2>
        <div className="deal__cards">
          <IdentityCard identity={null} size="lg" label={mine ? 'You are' : undefined} hiddenHint="Who am I?" />
        </div>
        <p className="lead">
          {mine
            ? 'Everyone can see your card — except you. You can see theirs.'
            : 'Each player has a card that only the others can see.'}
        </p>
        <p className="deal__warn">
          <Icon name="eyeOff" size={18} /> Don't say or show anyone's identity!
        </p>
        <Button variant="gold" size="lg" icon="eye" onClick={onDone} autoFocus>
          {mine ? 'Reveal the other cards' : "Let's play"}
        </Button>
      </div>
    </div>
  );
}
