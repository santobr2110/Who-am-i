import { useEffect, useState } from 'react';

/** Re-renders on an interval; used for clocks. */
export function useNow(intervalMs = 500): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useStored(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw == null ? initial : raw === '1';
  });
  return [
    value,
    (v) => {
      localStorage.setItem(key, v ? '1' : '0');
      setValue(v);
    },
  ];
}
