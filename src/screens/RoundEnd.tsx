import { brand } from '../brand/assets';
import { Avatar, Button, Eyebrow, GameTitle, IdentityArt, Mascot, Pill } from '../components/ui';
import { plural, ranked } from '../lib/game';
import { useGame } from '../net/room';

export function RoundEnd() {
  const { view, send } = useGame();
  const summary = view.history[view.history.length - 1];
  const { isHost } = view.you;
  if (!summary) return null;
  const solved = summary.results.filter((r) => r.solved).length;

  return (
    <div className="page page--stage results">
      <header className="results__head">
        <GameTitle size="sm" />
        <Pill tone="glass">Game {view.gameId}</Pill>
      </header>

      <main className="results__main">
        <Eyebrow tone="gold">Round {summary.round} complete</Eyebrow>
        <h1 className="h1">The cards are on the table</h1>
        <p className="lead">
          {solved === summary.results.length
            ? 'Everyone found out who they were!'
            : solved === 0
              ? "Nobody guessed this time. Here's who everyone was."
              : `${plural(solved, 'player')} guessed right. Here's who everyone was.`}
        </p>

        <ul className="reveal-grid">
          {summary.results.map((r, i) => (
            <li key={r.playerId} className="reveal-card" data-solved={r.solved} style={{ animationDelay: `${i * 0.09}s` }}>
              <span className="reveal-card__who">
                <Avatar index={r.avatar} name={r.name} size={34} />
                {r.name}
                {r.playerId === view.you.id && <small>(you)</small>}
              </span>
              <span className="reveal-card__art">
                <IdentityArt image={r.identityImage} />
              </span>
              <strong className="reveal-card__name">{r.identityName}</strong>
              <span className="reveal-card__meta">
                {r.solved ? (
                  <Pill tone="yes" icon="check">
                    {r.questions ? `Guessed in ${plural(r.questions, 'question')}` : 'Guessed without asking!'}
                  </Pill>
                ) : (
                  <Pill tone="muted">Still a mystery</Pill>
                )}
              </span>
              <span className="reveal-card__points">+{r.points} pts</span>
            </li>
          ))}
        </ul>

        <section className="card standings">
          <h2 className="h3">Scores so far</h2>
          <ol className="standings__list">
            {ranked(view.players).map((p, i) => (
              <li key={p.id}>
                <span className="standings__rank">{i + 1}</span>
                <Avatar index={p.avatar} name={p.name} size={36} />
                <span className="standings__name">{p.name}</span>
                <strong>{p.score}</strong>
              </li>
            ))}
          </ol>
        </section>

        {isHost ? (
          <div className="results__actions">
            <Button variant="gold" size="lg" icon="play" onClick={() => send({ type: 'nextRound' })}>
              Next round
            </Button>
            <Button variant="outline-light" size="lg" icon="trophy" onClick={() => send({ type: 'endGame' })}>
              Finish game
            </Button>
            <Button variant="outline-light" icon="refresh" onClick={() => send({ type: 'restartRound' })}>
              Replay this round
            </Button>
          </div>
        ) : (
          <p className="results__wait" role="status">
            Waiting for your teacher to start the next round…
          </p>
        )}
      </main>
      <Mascot src={brand.mascots.orangePeek} className="results__mascot" />
    </div>
  );
}
