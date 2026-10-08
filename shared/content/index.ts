import type { Identity, IdentityPack } from '../types';
import people from './packs/people';
import professions from './packs/professions';
import animals from './packs/animals';
import places from './packs/places';
import objects from './packs/objects';
import characters from './packs/characters';

/** To add a pack: create a file in ./packs and list it here. Nothing else changes. */
export const PACKS: IdentityPack[] = [people, professions, animals, places, objects, characters];

const BY_ID = new Map<string, Identity>(
  PACKS.flatMap((p) => p.identities).map((i) => [i.id, i]),
);

export function getIdentity(id: string): Identity | undefined {
  return BY_ID.get(id);
}

export function getPack(id: string): IdentityPack | undefined {
  return PACKS.find((p) => p.id === id);
}
