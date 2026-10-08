import type { SVGProps } from 'react';

/** Thin single-weight line icons, matching the icon style on the Four Bridges site. */
const PATHS = {
  check: 'M4.5 12.5l5 5 10-11',
  x: 'M6 6l12 12M18 6L6 18',
  question: 'M9 9a3 3 0 115.2 2c-.9.9-2.2 1.5-2.2 3.2M12 18h.01',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10.5 10.5 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.1M6.5 6.6A17.300 17.300 0 002 12s3.600 7 10 7a9.700 9.700 0 004.300-1M9.900 9.900a3 3 0 004.200 4.200',
  copy: 'M9 9h10a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V10a1 1 0 011-1zM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1',
  users: 'M16 20v-1.5a4 4 0 00-4-4H6a4 4 0 00-4 4V20M9 10.500a3.500 3.500 0 100-7 3.500 3.500 0 000 7zM22 20v-1.500a4 4 0 00-3-3.850M16 3.650a3.500 3.500 0 010 6.700',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4.500v15l12-7.500-12-7.500z',
  skip: 'M5 5l9 7-9 7V5zM19 5v14',
  volume: 'M4 9.500v5h3.500L12 19V5L7.500 9.500H4zM16 9a4 4 0 010 6M18.500 6.500a7.500 7.500 0 010 11',
  volumeOff: 'M4 9.500v5h3.500L12 19V5L7.500 9.500H4zM16.500 9.500l5 5M21.500 9.500l-5 5',
  sliders: 'M4 6h10M18 6h2M4 12h3M11 12h9M4 18h12M20 18h0M16 4v4M9 10v4M18 16v4',
  trophy: 'M8 4h8v5a4 4 0 01-8 0V4zM8 6H4.500v1.500A3.500 3.500 0 008 11M16 6h3.500v1.500A3.500 3.500 0 0116 11M12 13v4M8.500 20h7M10 17h4',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.500 10.900c.600.500 1 1.200 1 2V16h5v-.100c0-.800.400-1.500 1-2A6 6 0 0012 3z',
  send: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  refresh: 'M20 11a8 8 0 00-14.900-3M4 4v4h4M4 13a8 8 0 0014.900 3M20 20v-4h-4',
  logout: 'M9 20H5a1 1 0 01-1-1V5a1 1 0 011-1h4M16 16l4-4-4-4M20 12H9',
  mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5.500 11.500a6.500 6.500 0 0013 0M12 18v3',
  notes: 'M8 6h12M8 12h12M8 18h12M4 6h.010M4 12h.010M4 18h.010',
  cards: 'M8 4h10a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2zM3 8v9',
  wifiOff: 'M3 3l18 18M8.500 16.500a5 5 0 017 0M5 12.900a10 10 0 013.300-2.200M12 20h.010M16.800 10.900a10 10 0 012.200 2M2 8.800a15 15 0 013.400-2.300M10.700 5.100A15 15 0 0122 8.800',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.010',
  shuffle: 'M4 6h3.500c2 0 3.200.900 4.300 2.700l1.400 2.600c1.100 1.800 2.300 2.700 4.300 2.700H20M17 15l3-1-1.500 3M4 18h3.500c1.500 0 2.600-.500 3.500-1.600M14.500 8c.800-1.300 1.800-2 3-2H20M17 3l3 3-3 3',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  star: 'M12 3.500l2.600 5.400 5.900.800-4.300 4.100 1 5.900L12 17l-5.200 2.700 1-5.900-4.300-4.100 5.900-.800L12 3.500z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
