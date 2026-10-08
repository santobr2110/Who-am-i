import { useState, type FormEvent } from 'react';
import { DEFAULT_CONFIG } from '../../shared/config/levels';
import { brand } from '../brand/assets';
import { Button, Eyebrow, GameTitle, Logo, Mascot } from '../components/ui';
import { useRoom } from '../net/room';

const STEPS = [
  { n: '01', title: 'Get a secret card', text: 'Everyone can see who you are — except you.' },
  { n: '02', title: 'Ask the table', text: 'Yes-or-no questions, out loud, in English.' },
  { n: '03', title: 'Guess who you are', text: 'Think you know? Say it and score.' },
];

export function Home({ notFound }: { notFound?: string | null }) {
  const room = useRoom();
  const [mode, setMode] = useState<'join' | 'host'>('join');
  const [code, setCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const offline = room.conn !== 'open';

  const join = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 4) room.lookup(code.trim());
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    room.create(teacher.trim() || 'Teacher', DEFAULT_CONFIG);
  };

  return (
    <div className="page page--gold home">
      <header className="home__bar">
        <Logo />
      </header>

      <main className="home__main">
        <section className="home__copy">
          <Eyebrow>Four Bridges Games</Eyebrow>
          <h1 className="h1">
            <GameTitle size="xl" />
          </h1>
          <p className="lead">Ask questions. Discover your identity. Speak English.</p>

          <div className="card home__entry">
            <div className="tabs" role="tablist" aria-label="How do you want to play?">
              <button role="tab" aria-selected={mode === 'join'} className="tabs__tab" onClick={() => setMode('join')}>
                Join a game
              </button>
              <button role="tab" aria-selected={mode === 'host'} className="tabs__tab" onClick={() => setMode('host')}>
                I'm the teacher
              </button>
            </div>

            {mode === 'join' ? (
              <form onSubmit={join} className="home__form">
                <label className="field">
                  <span className="field__label">Game code</span>
                  <input
                    className="input input--code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 4))}
                    placeholder="ABCD"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby={notFound ? 'code-error' : undefined}
                    aria-invalid={!!notFound}
                  />
                </label>
                {notFound && (
                  <p className="field__error" id="code-error" role="alert">
                    We couldn't find game {notFound}. Check the code with your teacher.
                  </p>
                )}
                <Button type="submit" size="lg" block icon="send" disabled={code.length !== 4 || offline}>
                  Join
                </Button>
                <p className="hint">Your teacher shares the code or a link in the call.</p>
              </form>
            ) : (
              <form onSubmit={create} className="home__form">
                <label className="field">
                  <span className="field__label">Your name</span>
                  <input
                    className="input"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value.slice(0, 16))}
                    placeholder="Teacher"
                    autoComplete="off"
                  />
                </label>
                <Button type="submit" size="lg" block icon="plus" disabled={offline}>
                  Create a game
                </Button>
                <p className="hint">You'll get a link to send to your students. Settings come next.</p>
              </form>
            )}
          </div>
        </section>

        <figure className="home__art">
          <Mascot src={brand.heroMascots} className="home__art-img" />
        </figure>
      </main>

      <section className="home__steps" aria-label="How to play">
        {STEPS.map((s) => (
          <article key={s.n} className="card card--accent step">
            <span className="step__n">{s.n}</span>
            <h3 className="h3">{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
