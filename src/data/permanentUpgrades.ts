export type PermUpgradeId = 'damage' | 'maxHp' | 'moveSpeed' | 'xpGain';

export interface PermUpgradeDef {
  id: PermUpgradeId;
  name: string;
  desc: string;
  maxLevel: number;
  costBase: number;
  costGrowth: number;
}

export const PERM_UPGRADES: readonly PermUpgradeDef[] = [
  {
    id: 'damage',
    name: 'DAMAGE',
    desc: '+4% BASE DAMAGE / LV',
    maxLevel: 10,
    costBase: 50,
    costGrowth: 1.5,
  },
  {
    id: 'maxHp',
    name: 'MAX HP',
    desc: '+10 MAX HP / LV',
    maxLevel: 10,
    costBase: 40,
    costGrowth: 1.45,
  },
  {
    id: 'moveSpeed',
    name: 'SPEED',
    desc: '+3% MOVE SPEED / LV',
    maxLevel: 5,
    costBase: 60,
    costGrowth: 1.7,
  },
  {
    id: 'xpGain',
    name: 'XP GAIN',
    desc: '+5% XP / LV',
    maxLevel: 5,
    costBase: 70,
    costGrowth: 1.8,
  },
];

export function permUpgradeById(id: string): PermUpgradeDef {
  const def = PERM_UPGRADES.find((x) => x.id === id);
  if (!def) return PERM_UPGRADES[0];
  return def;
}

export function permCost(def: PermUpgradeDef, level: number): number {
  return Math.round(def.costBase * Math.pow(def.costGrowth, level));
}
