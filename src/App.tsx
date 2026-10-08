import { brand } from './brand/assets';
import { Button, GameTitle, Logo, Mascot } from './components/ui';
import { GameScreen } from './game/GameScreen';
import { useStored } from './lib/hooks';
import { useRoom } from './net/room';
import { GameOver } from './screens/GameOver';
import { Home } from './screens/Home';
import { Join } from './screens/Join';
import { Lobby } from './screens/Lobby';
import { RoundEnd } from './screens/RoundEnd';
import { Styleguide } from './screens/Styleguide';
import { useGameSounds } from './services/useGameSounds';

function Notice({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="page page--gold notice">
      <header className="home__bar">
        <Logo />
      </header>
      <main className="notice__main">
        <div className="card notice__card">
          <Mascot src={brand.groupPortrait} className="join__art" />
          <GameTitle />
          <h1 className="h2">{title}</h1>
          <p className="lead">{text}</p>
          {action}
        </div>
      </main>
    </div>
  );
}

function Screen() {
  const room = useRoom();
  const [muted, setMuted] = useStored('wai.muted', false);
  useGameSounds(room.view, muted);
  const { view } = room;

  if (!view) {
    if (room.closed === 'replaced') {
      return (
        <Notice
          title="You're playing in another tab"
          text="This game is open somewhere else on this device. Keep playing there, or take it back here."
          action={
            <Button size="lg" onClick={() => location.reload()}>
              Play here instead
            </Button>
          }
        />
      );
    }
    if (room.pendingCode && room.roomInfo) return <Join info={room.roomInfo} />;
    if (room.pendingCode && room.roomInfo === undefined) {
      return <Notice title="Finding your game…" text={room.conn === 'open' ? 'One moment.' : 'Connecting…'} />;
    }
    return <Home notFound={room.roomInfo === null ? room.pendingCode : null} />;
  }

  // Removed by the teacher: the seat is gone but the socket is still attached.
  if (view.you.role === 'player' && !view.you.isPlayer) {
    return (
      <Notice
        title="You left the table"
        text="Your teacher removed your seat. You can join again with the same link."
        action={
          <Button size="lg" onClick={room.leave}>
            Back to start
          </Button>
        }
      />
    );
  }

  switch (view.status) {
    case 'lobby':
      return <Lobby />;
    case 'roundEnd':
      return <RoundEnd />;
    case 'gameOver':
      return <GameOver />;
    default:
      return <GameScreen muted={muted} onMuted={setMuted} />;
  }
}

export function App() {
  const room = useRoom();
  if (new URLSearchParams(location.search).has('styleguide')) return <Styleguide />;
  return (
    <>
      <Screen />
      {room.conn === 'reconnecting' && (
        <div className="toast toast--sticky" role="status">
          Connection lost — reconnecting…
        </div>
      )}
      {room.error && room.conn === 'open' && (
        <div className="toast" role="alert" onClick={room.dismissError}>
          {room.error}
        </div>
      )}
    </>
  );
}
