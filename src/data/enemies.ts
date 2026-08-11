export interface EnemyTypeData {
  id: string;
  name: string;
  maxHp: number;
  damage: number;
  speed: number;
  xpValue: number;
  radius: number;
  color: number;
  spriteScale: number;
  unlockTime: number;
  spawnWeight: number;
}

export const ENEMY_TYPES: readonly EnemyTypeData[] = [
  {
    id: 'basic',
    name: 'BASIC',
    maxHp: 30,
    damage: 8,
    speed: 70,
    xpValue: 1,
    radius: 14,
    color: 0x4ec9ff,
    spriteScale: 1.4,
    unlockTime: 0,
    spawnWeight: 10,
  },
  {
    id: 'fast',
    name: 'FAST',
    maxHp: 18,
    damage: 6,
    speed: 135,
    xpValue: 2,
    radius: 12,
    color: 0xffd23c,
    spriteScale: 1.2,
    unlockTime: 60,
    spawnWeight: 6,
  },
  {
    id: 'tank',
    name: 'TANK',
    maxHp: 90,
    damage: 14,
    speed: 42,
    xpValue: 4,
    radius: 20,
    color: 0xff7c5c,
    spriteScale: 1.9,
    unlockTime: 120,
    spawnWeight: 4,
  },
];

export function getEnemyTypesAtTime(timeSeconds: number): readonly EnemyTypeData[] {
  return ENEMY_TYPES.filter((t) => timeSeconds >= t.unlockTime);
}

export function typeById(id: string): EnemyTypeData | undefined {
  return ENEMY_TYPES.find((t) => t.id === id);
}