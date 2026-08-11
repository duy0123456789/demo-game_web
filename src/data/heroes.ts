export interface HeroData {
  id: string;
  name: string;
  desc: string;
  maxHp: number;
  moveSpeed: number;
  damage: number;
  criticalChance: number;
  skinTint: number;
}

export const HEROES: readonly HeroData[] = [
  {
    id: 'gunner',
    name: 'GUNNER',
    desc: 'BALANCED FIGHTER',
    maxHp: 100,
    moveSpeed: 220,
    damage: 10,
    criticalChance: 0.1,
    skinTint: 0xffffff,
  },
  {
    id: 'tank',
    name: 'TANK',
    desc: 'THICK SKIN, SLOW FEET',
    maxHp: 150,
    moveSpeed: 190,
    damage: 9,
    criticalChance: 0.08,
    skinTint: 0x8fe8c8,
  },
  {
    id: 'speedster',
    name: 'SPEEDSTER',
    desc: 'FAST AND FRAGILE',
    maxHp: 75,
    moveSpeed: 265,
    damage: 8,
    criticalChance: 0.18,
    skinTint: 0xffd23c,
  },
];

export function heroById(id: string): HeroData {
  const h = HEROES.find((x) => x.id === id);
  if (!h) return HEROES[0];
  return h;
}
