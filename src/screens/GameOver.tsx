import type { PlayerView } from '../../shared/types';
import { Icon } from '../components/Icon';
import { Avatar, Button, Confetti, Eyebrow, GameTitle, Pill, WordPill } from '../components/ui';
import { plural, ranked } from '../lib/game';
import { useGame } from '../net/room';

const PRACTICED = ['Speaking', 'Listening', 'Vocabulary', 'Question formation', 'Conversation'];
const MEDALS = ['🏆', '🥈', '🥉'];

function best(players: PlayerView[], score: (p: PlayerView) => number): PlayerView | null {
  const top = [...players].sort((a, b) => score(b) - score(a))[0];
  return top && score(top) > 0 ? top : null;
}

export function GameOver() {
  const { view, send, leave } = useGame();
  const order = ranked(view.players);
  const podium = order.slice(0, 3);
  const rest = order.slice(3);
  const totalQuestions = view.players.reduce((n, p) => n + p.stats.questions, 0);

  const awards = [
    { title: 'Most curious', player: best(view.players, (p) => p.stats.questions), detail: (p: PlayerView) => plural(p.stats.questions, 'question') },
    { title: 'Best listener', player: best(view.players, (p) => p.stats.answers), detail: (p: PlayerView) => plural(p.stats.answers, 'answer') },
    { title: 'Top detective', player: best(view.players, (p) => p.stats.correct), detail: (p: PlayerView) => `${plural(p.stats.correct, 'identity')} found`.replace('identitys', 'identities') },
  ].filter((a) => a.player);

  return (
    <div className="page page--stage results gameover">
      <Confetti pieces={48} />
      <header className="results__head">
        <GameTitle size="sm" />
        <Pill tone="glass">Game {view.gameId}</Pill>
      </header>

      <main className="results__main">
        <Eyebrow tone="gold">{view.endReason === 'timeUp' ? "Time's up!" : 'Game over'}</Eyebrow>
        <h1 className="h1">{podium[0] ? `${podium[0].name} wins!` : 'Game over'}</h1>
        <p className="lead">
          {plural(view.history.length, 'round')} · {plural(totalQuestions, 'question')} asked in English
        </p>

        <ol className="podium" data-count={podium.length}>
          {podium.map((p, i) => (
            <li key={p.id} className="podium__spot" data-place={i + 1}>
              <span className="podium__medal" aria-hidden="true">{MEDALS[i]}</span>
              <Avatar index={p.avatar} name={p.name} size={i === 0 ? 96 : 72} />
              <strong className="podium__name">
                <span className="sr-only">{['Winner', 'Second place', 'Third place'][i]}: </span>
                {p.name}
              </strong>
              <span className="podium__score">{p.score} points</span>
              <span className="podium__step" aria-hidden="true">{i + 1}</span>
            </li>
          ))}
        </ol>

        {rest.length > 0 && (
          <ol className="standings__list standings__list--dark" start={4}>
            {rest.map((p, i) => (
              <li key={p.id}>
                <span className="standings__rank">{i + 4}</span>
                <Avatar index={p.avatar} name={p.name} size={36} />
                <span className="standings__name">{p.name}</span>
                <strong>{p.score}</strong>
              </li>
            ))}
          </ol>
        )}

        {awards.length > 0 && (
          <ul className="awards">
            {awards.map((a) => (
              <li key={a.title} className="award">
                <Icon name="star" size={18} />
                <span className="eyebrow">{a.title}</span>
                <strong>{a.player!.name}</strong>
                <small>{a.detail(a.player!)}</small>
              </li>
            ))}
          </ul>
        )}

        <section className="practiced">
          <h2 className="h3">What did you practice?</h2>
          <div className="practiced__pills">
            {PRACTICED.map((word, i) => (
              <WordPill key={word} word={word.toUpperCase()} tone={i % 3 === 1 ? 'navy' : 'white'} tilt={[-3, 2, -2, 3, -1][i]} />
            ))}
          </div>
        </section>

        {view.history.length > 0 && (
          <details className="history">
            <summary>Round by round</summary>
            {view.history.map((round) => (
              <div key={round.round} className="history__round">
                <span className="eyebrow eyebrow--gold">Round {round.round}</span>
                <ul>
                  {round.results.map((r) => (
                    <li key={r.playerId}>
                      {r.name} was <strong>{r.identityName}</strong>
                      {r.solved ? ` — guessed after ${plural(r.questions, 'question')}` : ' — not guessed'}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        )}

        <div className="results__actions">
          {view.you.isHost ? (
            <Button variant="gold" size="lg" icon="refresh" onClick={() => send({ type: 'playAgain' })}>
              Play again
            </Button>
          ) : (
            <p className="results__wait" role="status">
              Want another game? Your teacher can start one with the same players.
            </p>
          )}
          <Button variant="outline-light" icon="logout" onClick={leave}>
            Leave
          </Button>
        </div>
      </main>
    </div>
  );
}
