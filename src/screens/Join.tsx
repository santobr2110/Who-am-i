import { useState, type FormEvent } from 'react';
import type { RoomInfo } from '../../shared/types';
import { brand } from '../brand/assets';
import { Button, Eyebrow, GameTitle, Logo, Mascot, Pill } from '../components/ui';
import { plural } from '../lib/game';
import { useRoom } from '../net/room';

export function Join({ info }: { info: RoomInfo }) {
  const room = useRoom();
  const [name, setName] = useState(() => localStorage.getItem('wai.name') ?? '');
  const full = info.players >= info.maxPlayers && !info.reclaimable.length;
  const inProgress = info.status !== 'lobby';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    localStorage.setItem('wai.name', clean);
    room.join(info.code, clean);
  };

  return (
    <div className="page page--gold join">
      <header className="home__bar">
        <Logo />
      </header>
      <main className="join__main">
        <div className="card join__card">
          <Mascot src={brand.groupPortrait} className="join__art" />
          <Eyebrow>You're invited</Eyebrow>
          <h1 className="h2">
            <GameTitle />
          </h1>
          <div className="join__meta">
            <Pill tone="navy">Game {info.code}</Pill>
            <Pill icon="users">
              {info.players}/{info.maxPlayers} players
            </Pill>
            {inProgress && <Pill tone="gold">Already playing — jump in!</Pill>}
          </div>

          {full ? (
            <p className="lead">This game is full. Ask your teacher to make room.</p>
          ) : (
            <form onSubmit={submit} className="home__form">
              <label className="field">
                <span className="field__label">What's your name?</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  placeholder="Type your name"
                  autoFocus
                  autoComplete="given-name"
                />
              </label>
              <Button type="submit" size="lg" block icon="send" disabled={!name.trim() || room.conn !== 'open'}>
                Join the game
              </Button>
              {info.reclaimable.length > 0 && (
                <p className="hint">
                  Lost your connection? Type the same name to get your seat back (
                  {plural(info.reclaimable.length, 'seat')} waiting: {info.reclaimable.join(', ')}).
                </p>
              )}
            </form>
          )}
          <button className="link" onClick={room.leave}>
            Use a different code
          </button>
        </div>
      </main>
    </div>
  );
}
