import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { AnswerValue, IdentityImage, IdentityView } from '../../shared/types';
import { AVATARS, brand } from '../brand/assets';
import { ANSWER_LABEL } from '../lib/game';
import { Icon, type IconName } from './Icon';

// ───────────── Button ─────────────

type ButtonVariant = 'primary' | 'gold' | 'light' | 'navy' | 'ghost' | 'outline-light' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ icon, label, className = '', ...rest }: { icon: IconName; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

// ───────────── Brand ─────────────

export function Logo({ tone = 'color', height = 34 }: { tone?: 'color' | 'white'; height?: number }) {
  return (
    <img
      className="logo"
      src={tone === 'white' ? brand.logoWhite : brand.logoColor}
      alt="Four Bridges English School"
      style={{ height }}
    />
  );
}

/** The game's own wordmark: tight Manrope with the question mark set in gold. */
export function GameTitle({ size = 'md' }: { size?: 'sm' | 'md' | 'xl' }) {
  return (
    <span className={`game-title game-title--${size}`}>
      WHO AM I<span className="game-title__q">?</span>
    </span>
  );
}

export function Eyebrow({ children, tone }: { children: ReactNode; tone?: 'gold' | 'navy' }) {
  return <p className={`eyebrow ${tone ? `eyebrow--${tone}` : ''}`}>{children}</p>;
}

export function Pill({ children, tone = 'lilac', icon }: { children: ReactNode; tone?: 'lilac' | 'gold' | 'navy' | 'white' | 'glass' | 'yes' | 'muted'; icon?: IconName }) {
  return (
    <span className={`pill pill--${tone}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

/** Tilted word badge from the kids hero ("PLAY · brincar"). */
export function WordPill({ word, sub, tone = 'white', tilt = -3 }: { word: string; sub?: string; tone?: 'white' | 'navy' | 'purple'; tilt?: number }) {
  return (
    <span className={`word-pill word-pill--${tone}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <strong>{word}</strong>
      {sub && <span>{sub}</span>}
    </span>
  );
}

// ───────────── Avatar ─────────────

export function Avatar({ index, name, size = 56 }: { index: number; name: string; size?: number }) {
  const def = AVATARS[index % AVATARS.length];
  const [failed, setFailed] = useState(false);
  return (
    <span className="avatar" data-tone={def.tone} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {failed ? (
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      ) : (
        <img
          src={def.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            transformOrigin: `${def.focus[0]}% ${def.focus[1]}%`,
            transform: `translate(${50 - def.focus[0]}%, ${50 - def.focus[1]}%) scale(${def.zoom})`,
          }}
        />
      )}
    </span>
  );
}

// ───────────── Identity card ─────────────

export function IdentityArt({ image, size }: { image: IdentityImage; size?: number }) {
  return image.kind === 'url' ? (
    <img className="idart idart--img" src={image.value} alt="" style={size ? { width: size, height: size } : undefined} />
  ) : (
    <span className="idart" aria-hidden="true" style={size ? { fontSize: size } : undefined}>
      {image.value}
    </span>
  );
}

interface IdentityCardProps {
  identity: IdentityView | null;
  /** Shown above the name, e.g. "Maria is". */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'purple' | 'gold' | 'navy';
  /** Text on the face-down side. */
  hiddenHint?: string;
}

/** A secret card. With no identity it renders face-down — the server never sends you your own. */
export function IdentityCard({ identity, label, size = 'md', tone = 'purple', hiddenHint }: IdentityCardProps) {
  if (!identity) {
    return (
      <div className={`idcard idcard--${size} idcard--hidden`}>
        {label && <span className="idcard__label">{label}</span>}
        <span className="idcard__mark" aria-hidden="true">?</span>
        <span className="idcard__name">{hiddenHint ?? 'Secret'}</span>
      </div>
    );
  }
  return (
    <div className={`idcard idcard--${size} idcard--${tone}`}>
      {label && <span className="idcard__label">{label}</span>}
      <span className="idcard__art">
        <IdentityArt image={identity.image} />
      </span>
      <span className="idcard__name">{identity.name}</span>
      {size !== 'sm' && <span className="idcard__desc">{identity.description}</span>}
    </div>
  );
}

// ───────────── Answers ─────────────

const ANSWER_ICON: Record<AnswerValue, IconName> = { yes: 'check', no: 'x', unsure: 'question' };

export function AnswerBadge({ value, compact }: { value: AnswerValue; compact?: boolean }) {
  return (
    <span className="answer-badge" data-value={value}>
      <Icon name={ANSWER_ICON[value]} size={14} />
      {!compact && ANSWER_LABEL[value]}
      {compact && <span className="sr-only">{ANSWER_LABEL[value]}</span>}
    </span>
  );
}

export function AnswerButton({ value, onClick, disabled }: { value: AnswerValue; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="answer-btn" data-value={value} onClick={onClick} disabled={disabled}>
      <span className="answer-btn__icon">
        <Icon name={ANSWER_ICON[value]} size={26} />
      </span>
      {ANSWER_LABEL[value].toUpperCase()}
    </button>
  );
}

// ───────────── Form controls ─────────────

export function Segmented<T extends string | number | null>({ value, options, onChange, label }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true" />
      <span className="toggle__text">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <IconButton icon="minus" label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} />
      <output aria-live="polite">{value}</output>
      <IconButton icon="plus" label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} />
    </div>
  );
}

// ───────────── Overlays ─────────────

/** Slide-over panel (right on desktop, bottom on phones). Closes on Escape or backdrop click. */
export function Sheet({ open, onClose, title, eyebrow, children, side = 'right' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  side?: 'right' | 'center';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`sheet-backdrop sheet-backdrop--${side}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet sheet--${side}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="sheet__head">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="h3">{title}</h2>
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </header>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ['#f3b316', '#b31b85', '#4b126f', '#1fba67', '#ffd34b', '#7b1488'];

/** The one big animation: fires on a correct guess and on the podium. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.07}s`,
            animationDuration: `${1.6 + (i % 5) * 0.25}s`,
            borderRadius: i % 3 === 0 ? '50%' : '3px',
          }}
        />
      ))}
    </div>
  );
}

export function Mascot({ src, className = '' }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className={`mascot ${className}`} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
