export type WeaponSpecial = 'none' | 'pierce' | 'knockback';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface WeaponData {
  id: string;
  name: string;
  damage: number;
  attackSpeed: number;
  range: number;
  projectileCount: number;
  projectileSpeed: number;
  criticalChance: number;
  specialEffect: WeaponSpecial;
  pierceCount: number;
  knockback: number;
  rarity: Rarity;
  bulletColor: number;
  spreadAngle: number;
}

export const WEAPONS: readonly WeaponData[] = [
  {
    id: 'pistol',
    name: 'PISTOL',
    damage: 12,
    attackSpeed: 1.6,
    range: 420,
    projectileCount: 1,
    projectileSpeed: 560,
    criticalChance: 0.1,
    specialEffect: 'none',
    pierceCount: 0,
    knockback: 0,
    rarity: 'common',
    bulletColor: 0xffe08a,
    spreadAngle: 6,
  },
  {
    id: 'smg',
    name: 'SMG',
    damage: 6,
    attackSpeed: 4,
    range: 360,
    projectileCount: 1,
    projectileSpeed: 640,
    criticalChance: 0.06,
    specialEffect: 'none',
    pierceCount: 0,
    knockback: 0,
    rarity: 'rare',
    bulletColor: 0xffd23c,
    spreadAngle: 10,
  },
  {
    id: 'shotgun',
    name: 'SHOTGUN',
    damage: 7,
    attackSpeed: 1.1,
    range: 280,
    projectileCount: 5,
    projectileSpeed: 500,
    criticalChance: 0.08,
    specialEffect: 'knockback',
    pierceCount: 0,
    knockback: 320,
    rarity: 'rare',
    bulletColor: 0xffb020,
    spreadAngle: 34,
  },
  {
    id: 'rifle',
    name: 'RIFLE',
    damage: 24,
    attackSpeed: 1.3,
    range: 540,
    projectileCount: 1,
    projectileSpeed: 820,
    criticalChance: 0.12,
    specialEffect: 'pierce',
    pierceCount: 1,
    knockback: 0,
    rarity: 'epic',
    bulletColor: 0xb8f0ff,
    spreadAngle: 4,
  },
  {
    id: 'laser',
    name: 'LASER',
    damage: 9,
    attackSpeed: 2.6,
    range: 500,
    projectileCount: 1,
    projectileSpeed: 940,
    criticalChance: 0.08,
    specialEffect: 'pierce',
    pierceCount: 4,
    knockback: 0,
    rarity: 'legendary',
    bulletColor: 0xff6adf,
    spreadAngle: 1,
  },
];

export function weaponById(id: string): WeaponData {
  const w = WEAPONS.find((x) => x.id === id);
  if (!w) return WEAPONS[0];
  return w;
}

export function rarityLabel(r: Rarity): string {
  switch (r) {
    case 'common':
      return 'COMMON';
    case 'rare':
      return 'RARE';
    case 'epic':
      return 'EPIC';
    case 'legendary':
      return 'LEGENDARY';
  }
}