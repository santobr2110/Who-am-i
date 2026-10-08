# WHO AM I? — Design System

Source of truth: **fourbridges.com.br** (home + `/cursos/criancas/`), read from the live CSS (`style.css v1.32`) and rendered pages. Nothing here is invented; where the game needed something the site doesn't have (YES/NO colours), it is derived from an existing site value and noted as such.

Tokens live in [src/styles/tokens.css](src/styles/tokens.css). Brand asset URLs live in [src/brand/assets.ts](src/brand/assets.ts). A live styleguide is available at `/?styleguide`.

## 1. What the site looks like

| Aspect | Observation on the site | How the game uses it |
|---|---|---|
| Typeface | Manrope only, 400–800 | Manrope only |
| Headings | 700, very tight tracking (≈ −0.045em), line-height ≈ 1 | Same, for titles and the question bubble |
| Eyebrow | 11px, 800, uppercase, 0.17em tracking, purple or gold | Phase labels: `YOUR TURN`, `ROUND 2` |
| Body | 16px/1.6, `#181529`; secondary `#6d6675` | Same |
| Buttons | Pill (999px), 13px/800, min-height 47px, purple→magenta gradient, lifts 2px on hover | `.btn` and variants; game size bumps to 48–56px targets |
| Cards | White, 1px `#e9e0ec` border, radius 22px, faint white→lilac gradient, gold top bar accent, numbered circle badge | Seats, panels, setup options |
| Colour tiles | Solid gold / purple / navy blocks with one large translucent circle in the top-right corner | Identity cards, pack tiles, podium |
| Kids details | Gold page background, white pill word-badges (`PLAY`, `SPEAK`) tilted ±3°, furry mascots peeking from edges | Lobby hero, floating word pills, mascot avatars |
| Sections | Purple gradient hero/CTA bands, navy footer, soft lilac alternates | Game table is the purple gradient "stage"; lobby is gold |
| Shadows | Long, soft, purple-tinted, heavily negative spread | `--shadow`, `--shadow-btn`, `--shadow-pill` |
| Focus | Double ring: 4px white + 8px magenta at 65% | Same; gold variant on dark surfaces |
| Icons | Thin single-weight line icons | Inline 1.8px stroke SVGs in [src/components/Icon.tsx](src/components/Icon.tsx) |

## 2. Colour

| Token | Value | Role |
|---|---|---|
| `--purple` | `#4b126f` | Primary brand, text on light, buttons |
| `--purple2` | `#7b1488` | Gradient mid-stop |
| `--magenta` | `#b31b85` | Gradient end, focus ring |
| `--navy` | `#10162d` | Dark tiles, text on gold |
| `--gold` | `#f3b316` | Highlight: active turn, primary game CTA, kids background |
| `--lilac` | `#f3ebf7` | Chips, soft fills |
| `--soft` | `#faf7fb` | Page alternates |
| `--text` / `--muted` | `#181529` / `#6d6675` | Body / secondary text |
| `--border` | `#e9e0ec` | Hairlines |
| `--purple-deep` | `#24083a` | Deepest surface (from the site's dark sections) |

Game semantics — never colour alone; each answer always carries an icon and a word:

| Answer | Colour | Icon | Origin |
|---|---|---|---|
| YES | `--yes` `#1fba67` | check | The site's WhatsApp green |
| NO | `--no` `#d8334a` | cross | Magenta pushed toward red for separation from brand buttons |
| NOT SURE | `--gold` | question mark | Brand gold |

Gradients are limited to the three the site already uses: `--grad-primary` (buttons), `--grad-stage` (purple hero), `--grad-cta` (final CTA band), plus `--grad-gold` (kids art card).

**Rule:** gold is reserved for "this needs your attention now" — whose turn it is, the main action, a win. If everything is gold, nothing is.

## 3. Type scale

| Token | Size | Use |
|---|---|---|
| `--fs-h1` | clamp 38→74px, 800, −0.045em | Game title, celebration |
| `--fs-h2` | clamp 26→39px, 700 | Screen titles, the question |
| `--fs-h3` | 21px, 700 | Card titles |
| `--fs-lead` | 18px | Supporting sentence |
| `--fs-body` | 16px | Default; never below 13px anywhere |
| `--fs-eyebrow` | 11px, 800, uppercase, 0.17em | Labels |

## 4. Shape, elevation, spacing

- Radius: `--radius` 22px for cards, `--radius-lg` 30px for hero/art cards, pills for every button, chip and input.
- Shadows are soft and purple-tinted. Active seat uses `--shadow-glow` (gold ring + glow).
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 66px. Sections on the site breathe at 66px; game panels use 24–32px.
- Minimum touch target 48px (`--tap`).

## 5. Components

| Component | Class | Notes |
|---|---|---|
| Button | `.btn` + `--primary` `--gold` `--light` `--navy` `--ghost` `--outline-light`, sizes `--lg` `--sm` | Pill, 800 weight, lifts on hover |
| Answer button | `.answer-btn[data-value]` | Large, icon + word, tinted fill |
| Card | `.card`, `.card--accent` | White, bordered, optional gold top bar |
| Tile | `.tile--gold` `--purple` `--navy` | Solid block with corner circle |
| Pill / word badge | `.pill`, `.word-pill` | Word badges tilt ±3° like the kids hero |
| Eyebrow | `.eyebrow` | Purple on light, gold on dark |
| Avatar | `.avatar[data-tone]` | Mascot on a brand tone; initials fallback if the image fails |
| Identity card | `.idcard` | Tile with art, name, description; `.idcard--hidden` shows a "?" back |
| Seat | `.seat` | Player at the table; states: active, solved, offline, answered |
| Input | `.input` | Pill-shaped, 56px tall in the question bar |
| Sheet / modal | `.sheet` | Slide-over for teacher panel, notes, secret cards |

## 6. Mascots

The four furry monsters from the kids page are the players. Eight avatars = four mascots × two background tones, so every seat at an 8-player table is distinguishable. Full-body mascots appear only at "moment" screens (lobby, waiting, celebration) — one at a time, peeking from an edge, as on the site.

## 7. Motion

Motion only marks a state change: turn change, question submitted, answer received, correct guess, round completed. Durations 0.2–0.45s on `--ease`. Confetti is the single "big" animation and fires only on a correct guess and on the podium. Everything collapses to instant under `prefers-reduced-motion`.

## 8. Remote-first rules

Players are mostly in different places, each on their own device, usually next to a video call.

- Layout must hold at half-screen widths (≈ 640px) because the call window takes the other half.
- A seat always shows connection state; a dropped player never blocks the table.
- Secret cards can be hidden with one tap before sharing a screen. The teacher's board starts with secrets hidden.
- Every state says whose move it is, in words — nobody can lean over and ask.
