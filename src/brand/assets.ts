/**
 * Single manifest for every Four Bridges brand asset the game uses.
 * Mascots are served from /public/brand/mascots (full-size originals live in /brand-source).
 * Logos still load from the live site; to self-host them, drop the files in /public/brand
 * and change LOGO_BASE — nothing else references these URLs.
 */
const LOGO_BASE = 'https://fourbridges.com.br/assets/brand';
const MASCOTS = '/brand/mascots';

export const brand = {
  logoColor: `${LOGO_BASE}/logo-horizontal-color.svg`,
  logoWhite: `${LOGO_BASE}/logo-horizontal-white.svg`,
  symbolWhite: `${LOGO_BASE}/logo-symbol-white.svg`,
  /** The four mascots on the gold kids card, with the PLAY / SPEAK / CREATE / LEARN pills. */
  heroMascots: `${MASCOTS}/group-hero.jpg`,
  /** The four mascots on a light background — sits flush on white cards. */
  groupPortrait: `${MASCOTS}/group-portrait.jpg`,
  groupClouds: `${MASCOTS}/group-clouds.jpg`,
  mascots: {
    purplePeek: `${MASCOTS}/purple-peek.png`,
    bluePeek: `${MASCOTS}/blue-peek.png`,
    greenPeek: `${MASCOTS}/green-peek.png`,
    orangePeek: `${MASCOTS}/orange-peek.png`,
  },
} as const;

export type AvatarTone = 'gold' | 'lilac' | 'purple' | 'navy';

/** Where the face sits in a mascot image (percent) and how far to zoom in for a round avatar. */
interface Crop {
  image: string;
  focus: [x: number, y: number];
  zoom: number;
  label: string;
}

const FACES: Record<'purple' | 'blue' | 'green' | 'orange', Crop> = {
  purple: { image: brand.mascots.purplePeek, focus: [50, 60], zoom: 1.3, label: 'Purple monster' },
  blue: { image: brand.mascots.bluePeek, focus: [54, 52], zoom: 1.2, label: 'Blue monster' },
  green: { image: brand.mascots.greenPeek, focus: [46, 41], zoom: 1.45, label: 'Green monster' },
  orange: { image: brand.mascots.orangePeek, focus: [49, 26], zoom: 2.3, label: 'Orange monster' },
};

export interface AvatarDef extends Crop {
  tone: AvatarTone;
}

/** Eight distinct player avatars: the four mascots on two background tones each. */
export const AVATARS: AvatarDef[] = [
  { ...FACES.purple, tone: 'gold' },
  { ...FACES.blue, tone: 'lilac' },
  { ...FACES.green, tone: 'purple' },
  { ...FACES.orange, tone: 'navy' },
  { ...FACES.blue, tone: 'gold' },
  { ...FACES.purple, tone: 'lilac' },
  { ...FACES.orange, tone: 'purple' },
  { ...FACES.green, tone: 'navy' },
];
