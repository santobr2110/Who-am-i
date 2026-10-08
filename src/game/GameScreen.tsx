import { useEffect, useState } from 'react';
import { brand } from '../brand/assets';
import { Button, GameTitle, IconButton, Pill } from '../components/ui';
import { formatClock, me, seatsFor } from '../lib/game';
import { useNow } from '../lib/hooks';
import { useGame } from '../net/room';
import { Seat } from './Seat';
import { CardsSheet, DealOverlay, NotesSheet } from './Sheets';
import { Stage } from './Stage';
import { TeacherPanel } from './TeacherPanel';

/**
 * Seat positions for a big table: two gentle arcs, left and right of the stage, so the stage keeps
 * the full height. Order runs clockwise from the viewer at bottom-left, matching the turn order.
 */
function ringPosition(index: number, count: number): React.CSSProperties {
  const left = Math.ceil(count / 2);
  const onLeft = index < left;
  const side = onLeft ? left : count - left;
  const slot = onLeft ? index : index - left;
  const step = side > 1 ? Math.min(30, 72 / (side - 1)) : 0;
  // Positive angles sit lower. The left arc is walked bottom-to-top, the right one top-to-bottom.
  const degrees = (onLeft ? (side - 1) / 2 - slot : slot - (side - 1) / 2) * step;
  const angle = (degrees * Math.PI) / 180;
  return {
    left: `${50 + (onLeft ? -1 : 1) * 43 * Math.cos(angle)}%`,
    top: `${50 + 63 * Math.sin(angle)}%`,
  };
}

interface GameScreenProps {
  muted: boolean;
  onMuted: (muted: boolean) => void;
}

export function GameScreen({ muted, onMuted }: GameScreenProps) {
  const { view, viewAt, send, leave } = useGame();
  const now = useNow(500);
  const mine = me(view);
  const { isHost, isPlayer } = view.you;

  // A teacher's board starts with secrets hidden: it is the screen most likely to be shared.
  const [secretsHidden, setSecretsHidden] = useState(isHost && !isPlayer);
  const [panel, setPanel] = useState<null | 'teacher' | 'notes' | 'cards'>(null);
  // Remembered per tab so a reload mid-round doesn't replay the deal.
  const dealKey = `wai.dealt.${view.gameId}`;
  const [dealtRound, setDealtRoundState] = useState(() => Number(sessionStorage.getItem(dealKey) ?? 0));
  const setDealtRound = (round: number) => {
    sessionStorage.setItem(dealKey, String(round));
    setDealtRoundState(round);
  };
  useEffect(() => setPanel((p) => (p === 'teacher' ? p : null)), [view.round]);

  const seats = seatsFor(view);
  const count = seats.length;
  const layout = count <= 2 ? 'duel' : count <= 4 ? 'compact' : 'ring';
  const paused = view.status === 'paused';

  const elapsed = view.timer.elapsedMs + (view.timer.running ? now - viewAt : 0);
  const remaining = view.timer.limitMs != null ? view.timer.limitMs - elapsed : null;
  const lowTime = remaining != null && remaining < 60_000;

  return (
    <div className="game" data-layout={layout}>
      <header className="topbar">
        <div className="topbar__brand">
          <img src={brand.symbolWhite} alt="Four Bridges" className="topbar__symbol" />
          <GameTitle size="sm" />
        </div>
        <div className="topbar__status">
          <Pill tone="glass">Round {view.round}</Pill>
          <Pill tone={lowTime ? 'gold' : 'glass'} icon="clock">
            <span className="sr-only">{remaining != null ? 'Time left' : 'Time played'} </span>
            {formatClock(remaining ?? elapsed)}
          </Pill>
          <Pill tone="glass">{view.gameId}</Pill>
        </div>
        <div className="topbar__tools">
          {isPlayer && (
            <IconButton
              icon={secretsHidden ? 'eyeOff' : 'eye'}
              label={secretsHidden ? 'Show secret cards' : 'Hide secret cards (for screen sharing)'}
              aria-pressed={secretsHidden}
              onClick={() => setSecretsHidden(!secretsHidden)}
            />
          )}
          <IconButton icon={muted ? 'volumeOff' : 'volume'} label={muted ? 'Turn sound on' : 'Turn sound off'} onClick={() => onMuted(!muted)} />
          {isHost ? (
            <Button variant="gold" size="sm" icon="sliders" aria-label="Teacher panel" onClick={() => setPanel('teacher')}>
              Teacher
            </Button>
          ) : (
            <IconButton icon="logout" label="Leave game" onClick={() => window.confirm('Leave this game?') && leave()} />
          )}
        </div>
      </header>

      <main className={`table table--${layout}`} data-count={count}>
        {seats.map((p, i) => (
          <Seat
            key={p.id}
            view={view}
            player={p}
            secretsHidden={secretsHidden}
            big={layout === 'duel'}
            style={layout === 'ring' ? ringPosition(i, count) : undefined}
          />
        ))}
        <Stage secretsHidden={secretsHidden} onOpenNotes={() => setPanel('notes')} />
      </main>

      {isPlayer && (
        <nav className="dock" aria-label="Your tools">
          <Button variant="outline-light" size="sm" icon="notes" onClick={() => setPanel('notes')}>
            My notes{mine && mine.roundQuestions > 0 ? ` (${mine.roundQuestions})` : ''}
          </Button>
          <Button variant="outline-light" size="sm" icon="cards" className="dock__cards" onClick={() => setPanel('cards')}>
            Secret cards
          </Button>
        </nav>
      )}

      {paused && (
        <div className="paused" role="status">
          <div className="paused__card">
            <p className="eyebrow">Game paused</p>
            <h2 className="h2">Back in a moment</h2>
            <p>{isHost ? 'Students see this screen until you resume.' : 'Your teacher paused the game.'}</p>
            {isHost && (
              <Button variant="gold" size="lg" icon="play" onClick={() => send({ type: 'resume' })}>
                Resume
              </Button>
            )}
          </div>
        </div>
      )}

      {dealtRound !== view.round && !paused && <DealOverlay view={view} onDone={() => setDealtRound(view.round)} />}

      <NotesSheet view={view} open={panel === 'notes'} onClose={() => setPanel(null)} />
      <CardsSheet view={view} open={panel === 'cards'} onClose={() => setPanel(null)} secretsHidden={secretsHidden} />
      {isHost && (
        <TeacherPanel
          open={panel === 'teacher'}
          onClose={() => setPanel(null)}
          secretsHidden={secretsHidden}
          onSecretsHidden={setSecretsHidden}
        />
      )}
    </div>
  );
}
