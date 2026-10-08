import { useState } from 'react';
import type { IdentityView } from '../../shared/types';
import { AVATARS, brand } from '../brand/assets';
import { Icon } from '../components/Icon';
import {
  AnswerBadge,
  AnswerButton,
  Avatar,
  Button,
  Eyebrow,
  GameTitle,
  IdentityCard,
  Logo,
  Mascot,
  Pill,
  Segmented,
  Toggle,
  WordPill,
} from '../components/ui';

const SWATCHES = ['purple', 'purple2', 'magenta', 'navy', 'gold', 'lilac', 'soft', 'border', 'yes', 'no', 'purple-deep', 'gold-light'];
const SAMPLE: IdentityView = { id: 'x', name: 'Taylor Swift', image: { kind: 'emoji', value: '🎤' }, description: 'American singer and songwriter', category: 'people' };

/** Living reference for the design system — open /?styleguide. */
export function Styleguide() {
  const [level, setLevel] = useState('A2');
  const [on, setOn] = useState(true);
  return (
    <div className="page styleguide">
      <header className="home__bar">
        <Logo />
        <Pill tone="navy">Design system</Pill>
      </header>
      <main className="styleguide__main">
        <Eyebrow>Four Bridges Games</Eyebrow>
        <h1 className="h1">
          <GameTitle size="xl" />
        </h1>
        <p className="lead">Every piece of the game, built from the Four Bridges visual identity.</p>

        <h2 className="h2">Colour</h2>
        <div className="swatches">
          {SWATCHES.map((name) => (
            <div key={name} className="swatch">
              <span style={{ background: `var(--${name})` }} />
              <code>--{name}</code>
            </div>
          ))}
        </div>

        <h2 className="h2">Type</h2>
        <p className="h1">Heading one</p>
        <p className="h2">Heading two</p>
        <p className="h3">Heading three</p>
        <p className="lead">Lead paragraph for the sentence that supports a title.</p>
        <p>Body text in Manrope, 16px on a 1.6 line-height.</p>
        <Eyebrow>Eyebrow label</Eyebrow>

        <h2 className="h2">Buttons</h2>
        <div className="chips">
          <Button>Primary</Button>
          <Button variant="gold" icon="play">Gold</Button>
          <Button variant="navy">Navy</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost" icon="skip">Ghost</Button>
          <Button size="lg" variant="gold">Large</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>

        <h2 className="h2">Answers</h2>
        <div className="answers">
          <AnswerButton value="yes" onClick={() => {}} />
          <AnswerButton value="no" onClick={() => {}} />
          <AnswerButton value="unsure" onClick={() => {}} />
        </div>
        <div className="chips">
          <AnswerBadge value="yes" />
          <AnswerBadge value="no" />
          <AnswerBadge value="unsure" />
        </div>

        <h2 className="h2">Pills and controls</h2>
        <div className="chips">
          <Pill>Lilac</Pill>
          <Pill tone="gold">Gold</Pill>
          <Pill tone="navy">Navy</Pill>
          <Pill tone="yes" icon="check">Ready</Pill>
          <Pill tone="muted">Waiting</Pill>
          <WordPill word="PLAY" sub="brincar" />
          <WordPill word="CREATE" tone="navy" tilt={2} />
          <WordPill word="LEARN" tone="purple" tilt={-2} />
        </div>
        <Segmented label="Level" value={level} onChange={setLevel} options={['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => ({ value: l, label: l }))} />
        <Toggle checked={on} onChange={setOn} label='Allow "Not sure"' hint="A third answer for when nobody really knows." />
        <input className="input" placeholder="Type your question…" />

        <h2 className="h2">Players</h2>
        <div className="chips">
          {AVATARS.map((a, i) => (
            <Avatar key={i} index={i} name={a.label} size={72} />
          ))}
        </div>

        <h2 className="h2">Identity cards</h2>
        <div className="chips chips--top">
          <IdentityCard identity={SAMPLE} label="Maria is" />
          <IdentityCard identity={SAMPLE} tone="gold" size="lg" label="You are" />
          <IdentityCard identity={SAMPLE} tone="navy" size="sm" />
          <IdentityCard identity={null} label="You are" hiddenHint="Who am I?" />
        </div>

        <h2 className="h2">Cards</h2>
        <div className="home__steps">
          <article className="card card--accent step">
            <span className="step__n">01</span>
            <h3 className="h3">Card with accent</h3>
            <p>White, hairline border, 22px radius, gold top bar.</p>
          </article>
          <article className="card step">
            <h3 className="h3">Plain card</h3>
            <p>For panels and lists.</p>
          </article>
        </div>

        <h2 className="h2">Icons</h2>
        <div className="chips">
          {(['check', 'x', 'question', 'eye', 'eyeOff', 'copy', 'users', 'clock', 'pause', 'play', 'skip', 'volume', 'sliders', 'trophy', 'bulb', 'send', 'mic', 'notes', 'cards', 'target', 'shuffle', 'star'] as const).map((n) => (
            <span key={n} className="pill pill--lilac" title={n}>
              <Icon name={n} /> {n}
            </span>
          ))}
        </div>

        <h2 className="h2">Mascots</h2>
        <div className="chips chips--top">
          {Object.values(brand.mascots).map((src) => (
            <Mascot key={src} src={src} className="styleguide__mascot" />
          ))}
        </div>
      </main>
    </div>
  );
}
