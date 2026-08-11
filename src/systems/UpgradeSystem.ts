import type { Player } from '../entities/Player';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type UpgradeKind =
  | 'damage'
  | 'attackSpeed'
  | 'maxHp'
  | 'moveSpeed'
  | 'criticalChance'
  | 'projectile'
  | 'attackRange'
  | 'xpGain'
  | 'pickupRange'
  | 'bulletSpeed'
  | 'lifesteal'
  | 'criticalDamage';

export interface UpgradeOption {
  id: string;
  kind: UpgradeKind;
  name: string;
  label: string;
  rarity: Rarity;
  value: number;
}

interface UpgradeDef {
  name: string;
  maxStack: number;
}

const DEFS: Record<UpgradeKind, UpgradeDef> = {
  damage: { name: 'DAMAGE', maxStack: 8 },
  attackSpeed: { name: 'FIRE RATE', maxStack: 6 },
  maxHp: { name: 'MAX HP', maxStack: 8 },
  moveSpeed: { name: 'SPEED', maxStack: 5 },
  criticalChance: { name: 'CRIT', maxStack: 5 },
  projectile: { name: 'PROJECTILE', maxStack: 3 },
  attackRange: { name: 'RANGE', maxStack: 5 },
  xpGain: { name: 'XP GAIN', maxStack: 5 },
  pickupRange: { name: 'MAGNET', maxStack: 4 },
  bulletSpeed: { name: 'BULLET SPD', maxStack: 4 },
  lifesteal: { name: 'LIFESTEAL', maxStack: 4 },
  criticalDamage: { name: 'CRIT DMG', maxStack: 5 },
};

export const ALL_UPGRADES = Object.keys(DEFS) as UpgradeKind[];

const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  epic: 4,
  legendary: 7,
};

export function xpRequiredForLevel(level: number): number {
  return 20 + level * 14;
}

export function rollRarity(): Rarity {
  const roll = Math.random();
  if (roll < 0.02) return 'legendary';
  if (roll < 0.1) return 'epic';
  if (roll < 0.3) return 'rare';
  return 'common';
}

export function canStack(kind: UpgradeKind, current: number): boolean {
  return current < DEFS[kind].maxStack;
}

export function buildUpgradeOption(kind: UpgradeKind, rarity: Rarity, stackCount: number): UpgradeOption {
  const mult = RARITY_MULT[rarity];
  const name = DEFS[kind].name;
  let value: number;
  let label: string;

  switch (kind) {
    case 'maxHp':
      value = Math.round(15 * mult);
      label = `+${value} MAX HP`;
      break;
    case 'pickupRange':
      value = Math.round(22 * mult);
      label = `+${value} MAGNET RANGE`;
      break;
    case 'criticalChance':
      value = Math.round(4 * mult);
      label = `+${value}% CRIT CHANCE`;
      break;
    case 'criticalDamage':
      value = Math.round(20 * mult);
      label = `+${value}% CRIT DMG`;
      break;
    case 'lifesteal':
      value = Math.round(3 * mult);
      label = `+${value}% LIFESTEAL`;
      break;
    case 'projectile':
      value = 1;
      label = '+1 PROJECTILE';
      break;
    default: {
      const pct = 5 * mult;
      value = Math.round(pct);
      label = `+${value}% ${name}`;
    }
  }

  const id = `run-${kind}-${stackCount}`;
  return { id, kind, name, label, rarity, value };
}

export function applyUpgrade(player: Player, opt: UpgradeOption): void {
  const s = player.stats;
  switch (opt.kind) {
    case 'damage':
      s.damage *= 1 + opt.value / 100;
      break;
    case 'attackSpeed':
      s.attackSpeed *= 1 + opt.value / 100;
      break;
    case 'maxHp': {
      s.maxHp += opt.value;
      s.hp += opt.value;
      break;
    }
    case 'moveSpeed':
      s.moveSpeed *= 1 + opt.value / 100;
      break;
    case 'criticalChance':
      s.criticalChance = Math.min(0.75, s.criticalChance + opt.value / 100);
      break;
    case 'projectile':
      s.projectileCount += opt.value;
      break;
    case 'attackRange':
      s.attackRange *= 1 + opt.value / 100;
      break;
    case 'xpGain':
      s.xpMultiplier *= 1 + opt.value / 100;
      break;
    case 'pickupRange':
      s.pickupRange += opt.value;
      break;
    case 'bulletSpeed':
      s.projectileSpeed *= 1 + opt.value / 100;
      break;
    case 'lifesteal':
      s.lifesteal = Math.min(0.5, s.lifesteal + opt.value / 100);
      break;
    case 'criticalDamage':
      s.criticalMultiplier *= 1 + opt.value / 100;
      break;
  }
}