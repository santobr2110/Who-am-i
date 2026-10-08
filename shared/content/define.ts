import type { Identity, IdentityPack, LanguageLevel } from '../types';

type Row = [
  id: string,
  name: string,
  emoji: string,
  level: LanguageLevel,
  difficulty: 1 | 2 | 3,
  description: string,
  clues: [string, string, string],
  tags: string[],
  acceptableAnswers?: string[],
];

/** Compact authoring format for packs: one row per identity. */
export function definePack(
  meta: Omit<IdentityPack, 'identities'>,
  rows: Row[],
): IdentityPack {
  const identities: Identity[] = rows.map(
    ([id, name, emoji, languageLevel, difficulty, description, clues, tags, acceptableAnswers = []]) => ({
      id: `${meta.id}/${id}`,
      name,
      category: meta.id,
      image: { kind: 'emoji', value: emoji },
      description,
      difficulty,
      tags,
      acceptableAnswers,
      clues,
      languageLevel,
    }),
  );
  return { ...meta, identities };
}
