import { useState } from 'react';
import { Button, IconButton, Pill, Sheet, Toggle } from '../components/ui';
import { activePlayer, formatClock, plural } from '../lib/game';
import { useNow } from '../lib/hooks';
import { useGame } from '../net/room';

interface TeacherPanelProps {
  open: boolean;
  onClose: () => void;
  secretsHidden: boolean;
  onSecretsHidden: (hidden: boolean) => void;
}

/** The teacher's cockpit: opens over the board without interrupting anyone else's screen. */
export function TeacherPanel({ open, onClose, secretsHidden, onSecretsHidden }: TeacherPanelProps) {
  const { view, send, viewAt } = useGame();
  const now = useNow(1000);
  const [confirm, setConfirm] = useState<null | 'restartRound' | 'endRound' | 'endGame'>(null);
  const active = activePlayer(view);
  const paused = view.status === 'paused';
  const elapsed = view.timer.elapsedMs + (view.timer.running ? now - viewAt : 0);
  const online = view.players.filter((p) => p.connected).length;

  const CONFIRM_COPY = {
    restartRound: { title: 'Restart this round?', text: 'Points from this round are taken back and new cards are dealt.', cta: 'Restart round' },
    endRound: { title: 'End this round?', text: 'All cards are revealed and you can start a new round.', cta: 'End round' },
    endGame: { title: 'End the game?', text: 'Everyone goes to the final results.', cta: 'End game' },
  } as const;

  return (
    <Sheet open={open} onClose={onClose} title="Teacher panel" eyebrow={`Game ${view.gameId}`}>
      <dl className="statgrid">
        <div>
          <dt>Round</dt>
          <dd>{view.round}</dd>
        </div>
        <div>
          <dt>Current player</dt>
          <dd>{active?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Questions asked</dt>
          <dd>{view.questions.length}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>
            {online}/{view.players.length}
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {formatClock(elapsed)}
            {view.timer.limitMs != null && <small> / {formatClock(view.timer.limitMs)}</small>}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{paused ? 'Paused' : 'Playing'}</dd>
        </div>
      </dl>

      {confirm ? (
        <div className="confirm" role="alertdialog" aria-label={CONFIRM_COPY[confirm].title}>
          <strong>{CONFIRM_COPY[confirm].title}</strong>
          <p>{CONFIRM_COPY[confirm].text}</p>
          <div className="confirm__actions">
            <Button
              variant="navy"
              onClick={() => {
                send({ type: confirm });
                setConfirm(null);
                onClose();
              }}
            >
              {CONFIRM_COPY[confirm].cta}
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="controls">
          <Button variant={paused ? 'gold' : 'navy'} icon={paused ? 'play' : 'pause'} onClick={() => send({ type: paused ? 'resume' : 'pause' })}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" icon="skip" disabled={paused} onClick={() => send({ type: 'skipTurn' })}>
            Skip turn
          </Button>
          {view.turn?.phase === 'answering' && (
            <Button variant="outline" icon="check" disabled={paused} onClick={() => send({ type: 'closeAnswers' })}>
              Close answers
            </Button>
          )}
          <Button variant="outline" icon="refresh" onClick={() => setConfirm('restartRound')}>
            Restart round
          </Button>
          <Button variant="outline" icon="cards" onClick={() => setConfirm('endRound')}>
            End round
          </Button>
          <Button variant="outline" icon="trophy" onClick={() => setConfirm('endGame')}>
            End game
          </Button>
        </div>
      )}

      <Toggle
        checked={!secretsHidden}
        onChange={(show) => onSecretsHidden(!show)}
        label="Show identities on my screen"
        hint={
          view.you.isPlayer
            ? 'Turn off before you share your screen. Your own card always stays hidden.'
            : 'Keep this off while you share your screen — students would see their own cards.'
        }
      />

      <h3 className="eyebrow sheet__section">Participation</h3>
      <div className="table-wrap">
        <table className="ptable">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col" title="Questions asked">Questions</th>
              <th scope="col" title="Answers given">Answers</th>
              <th scope="col">Score</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {view.players.map((p) => (
              <tr key={p.id} data-offline={!p.connected}>
                <th scope="row">{p.name}</th>
                <td>{p.stats.questions}</td>
                <td>{p.stats.answers}</td>
                <td>{p.score}</td>
                <td>
                  <Pill tone={!p.connected ? 'muted' : p.solved ? 'yes' : p.id === active?.id ? 'gold' : 'lilac'}>
                    {!p.connected ? 'Offline' : p.solved ? 'Solved' : p.id === active?.id ? 'On turn' : 'Playing'}
                  </Pill>
                </td>
                <td>
                  {!p.isHost && <IconButton icon="x" label={`Remove ${p.name}`} onClick={() => send({ type: 'removePlayer', playerId: p.id })} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        {view.players.filter((p) => p.solved).length} of {plural(view.players.length, 'player')} solved their card. The game runs
        by itself — you only need this panel to step in.
      </p>
    </Sheet>
  );
}
