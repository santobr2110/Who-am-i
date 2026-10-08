import { useState } from 'react';
import { AVATAR_COUNT } from '../../shared/engine/engine';
import type { PlayerView } from '../../shared/types';
import { AVATARS, brand } from '../brand/assets';
import { Avatar, Button, Eyebrow, GameTitle, IconButton, Logo, Mascot, Pill } from '../components/ui';
import { me, plural } from '../lib/game';
import { useGame } from '../net/room';
import { Settings, SettingsSummary } from './Settings';

function statusOf(p: PlayerView): { label: string; tone: 'yes' | 'muted' | 'gold' } {
  if (!p.connected) return { label: 'Offline', tone: 'muted' };
  if (p.isHost) return { label: 'Teacher', tone: 'gold' };
  return p.ready ? { label: 'Ready', tone: 'yes' } : { label: 'Waiting', tone: 'muted' };
}

export function Lobby() {
  const { view, send, leave, hostKey } = useGame();
  const [copied, setCopied] = useState(false);
  const mine = me(view);
  const { isHost } = view.you;
  const online = view.players.filter((p) => p.connected);
  const students = online.filter((p) => !p.isHost);
  const readyCount = students.filter((p) => p.ready).length;
  const invite = `${location.origin}/?room=${view.gameId}`;
  // One student and a teacher who isn't seated: that's a one-to-one class.
  const oneToOne = isHost && !view.config.hostPlays && students.length === 1;
  const canStart = online.length >= 2 || oneToOne;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', invite);
    }
  };
  const start = () => {
    if (oneToOne) send({ type: 'updateConfig', config: { hostPlays: true } });
    send({ type: 'startGame' });
  };

  const emptySeats = Math.max(0, Math.min(view.config.maxPlayers, 8) - view.players.length);

  return (
    <div className="page page--gold lobby">
      <header className="home__bar">
        <Logo />
        <Button variant="ghost" size="sm" icon="logout" onClick={leave}>
          Leave
        </Button>
      </header>

      <main className="lobby__main">
        <section className="lobby__left">
          <Eyebrow>Game lobby</Eyebrow>
          <h1 className="h1 lobby__title">
            <GameTitle size="xl" />
          </h1>
          <p className="lead">Ask questions. Discover your identity. Speak English.</p>

          <div className="card invite">
            <div className="invite__code">
              <span className="eyebrow">Game code</span>
              <strong aria-label={`Game code ${view.gameId.split('').join(' ')}`}>{view.gameId}</strong>
            </div>
            <div className="invite__link">
              <span className="eyebrow">{isHost ? 'Send this link to your students' : 'Invite link'}</span>
              <div className="invite__row">
                <code>{invite.replace(/^https?:\/\//, '')}</code>
                <Button variant="navy" size="sm" icon={copied ? 'check' : 'copy'} onClick={copy}>
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>
          </div>

          <div className="card players">
            <header className="players__head">
              <h2 className="h3">Players</h2>
              <Pill icon="users">
                {view.players.length}/{view.config.maxPlayers}
              </Pill>
            </header>
            <ul className="players__list">
              {view.players.map((p) => {
                const status = statusOf(p);
                return (
                  <li key={p.id} className="player-row" data-offline={!p.connected}>
                    <Avatar index={p.avatar} name={p.name} size={42} />
                    <span className="player-row__name">
                      {p.name}
                      {p.id === view.you.id && <small> (you)</small>}
                    </span>
                    <Pill tone={status.tone} icon={status.tone === 'yes' ? 'check' : undefined}>
                      {status.label}
                    </Pill>
                    {isHost && !p.isHost && (
                      <IconButton icon="x" label={`Remove ${p.name}`} onClick={() => send({ type: 'removePlayer', playerId: p.id })} />
                    )}
                  </li>
                );
              })}
              {Array.from({ length: emptySeats }, (_, i) => (
                <li key={i} className="player-row player-row--empty">
                  <span className="avatar avatar--empty" style={{ width: 42, height: 42 }} aria-hidden="true" />
                  <span className="player-row__name">Open seat</span>
                </li>
              ))}
            </ul>
            {view.players.length === 0 && (
              <p className="hint">Nobody here yet. Share the link above — students join from their own device.</p>
            )}
          </div>
        </section>

        <section className="lobby__right">
          {isHost ? (
            <div className="card lobby__panel">
              <header className="players__head">
                <h2 className="h3">Game setup</h2>
                <Pill tone="gold">Teacher</Pill>
              </header>
              <Settings config={view.config} onChange={(config) => send({ type: 'updateConfig', config })} />
              <div className="lobby__start">
                <Button variant="gold" size="lg" block icon="play" disabled={!canStart} onClick={start}>
                  {oneToOne ? `Play with ${students[0].name}` : 'Start game'}
                </Button>
                <p className="hint" role="status">
                  {!canStart
                    ? 'Waiting for players — you need at least two at the table.'
                    : oneToOne
                      ? "One-to-one class: you'll take the second seat."
                      : `${readyCount}/${students.length} ${students.length === 1 ? 'student is' : 'students are'} ready. You can start any time.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="card lobby__panel">
              {mine ? (
                <>
                  <h2 className="h3">Pick your monster</h2>
                  <div className="avatar-picker" role="radiogroup" aria-label="Your avatar">
                    {Array.from({ length: AVATAR_COUNT }, (_, i) => {
                      const takenBy = view.players.find((p) => p.avatar === i && p.id !== mine.id);
                      return (
                        <button
                          key={i}
                          type="button"
                          role="radio"
                          aria-checked={mine.avatar === i}
                          aria-label={`${AVATARS[i].label}${takenBy ? ` (taken by ${takenBy.name})` : ''}`}
                          disabled={!!takenBy}
                          className="avatar-picker__item"
                          onClick={() => send({ type: 'setProfile', avatar: i })}
                        >
                          <Avatar index={i} name={mine.name} size={60} />
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant={mine.ready ? 'outline' : 'gold'}
                    size="lg"
                    block
                    icon={mine.ready ? 'check' : undefined}
                    aria-pressed={mine.ready}
                    onClick={() => send({ type: 'setReady', ready: !mine.ready })}
                  >
                    {mine.ready ? "I'm ready!" : "I'm ready"}
                  </Button>
                  <p className="hint" role="status">
                    {mine.ready ? 'Waiting for your teacher to start the game…' : 'Tap when you can hear and see everyone in the call.'}
                  </p>
                </>
              ) : (
                <p className="lead">You're watching this game.</p>
              )}
              <hr className="rule" />
              <Eyebrow>This game</Eyebrow>
              <SettingsSummary config={view.config} />
              <p className="hint">{plural(view.config.questionsPerTurn, 'question')} per turn.</p>
            </div>
          )}
          <Mascot src={brand.mascots.bluePeek} className="lobby__mascot" />
        </section>
      </main>
      {isHost && hostKey && (
        <p className="lobby__foot hint">Bookmark this page — its address is your teacher key if you close the tab.</p>
      )}
    </div>
  );
}
