export interface SaveData {
  coins: number;
  gems: number;
  playerLevel: number;
  heroId: string;
  weaponsOwned: string[];
  weaponEquipped: string;
  permUpgrades: Record<string, number>;
  soundOn: boolean;
}

const SAVE_KEY = 'pixel-gunner-save-v1';
const DEFAULT_HERO = 'gunner';
const DEFAULT_WEAPON = 'pistol';

function defaultSave(): SaveData {
  return {
    coins: 0,
    gems: 0,
    playerLevel: 1,
    heroId: DEFAULT_HERO,
    weaponsOwned: [DEFAULT_WEAPON],
    weaponEquipped: DEFAULT_WEAPON,
    permUpgrades: {},
    soundOn: true,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const base = defaultSave();
      return {
        coins: typeof parsed.coins === 'number' ? parsed.coins : base.coins,
        gems: typeof parsed.gems === 'number' ? parsed.gems : base.gems,
        playerLevel:
          typeof parsed.playerLevel === 'number' ? parsed.playerLevel : base.playerLevel,
        heroId: typeof parsed.heroId === 'string' ? parsed.heroId : base.heroId,
        weaponsOwned: isStringArray(parsed.weaponsOwned) && parsed.weaponsOwned.length > 0
          ? parsed.weaponsOwned
          : base.weaponsOwned,
        weaponEquipped:
          typeof parsed.weaponEquipped === 'string'
            ? parsed.weaponEquipped
            : base.weaponEquipped,
        permUpgrades:
          parsed.permUpgrades && typeof parsed.permUpgrades === 'object'
            ? parsed.permUpgrades
            : base.permUpgrades,
        soundOn: typeof parsed.soundOn === 'boolean' ? parsed.soundOn : base.soundOn,
      };
    } catch {
      return defaultSave();
    }
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // storage unavailable (private mode / full): game still works, just not persisted
    }
  }

  get coins(): number {
    return this.data.coins;
  }

  get gems(): number {
    return this.data.gems;
  }

  get playerLevel(): number {
    return this.data.playerLevel;
  }

  get heroId(): string {
    return this.data.heroId;
  }

  get weaponsOwned(): readonly string[] {
    return this.data.weaponsOwned;
  }

  get weaponEquipped(): string {
    return this.data.weaponEquipped;
  }

  get permUpgrades(): Readonly<Record<string, number>> {
    return this.data.permUpgrades;
  }

  addCoins(amount: number): void {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
  }

  addGems(amount: number): void {
    this.data.gems = Math.max(0, this.data.gems + amount);
    this.save();
  }

  setHero(id: string): void {
    this.data.heroId = id;
    this.save();
  }

  ownsWeapon(id: string): boolean {
    return this.data.weaponsOwned.includes(id);
  }

  unlockWeapon(id: string): boolean {
    if (this.ownsWeapon(id)) return false;
    this.data.weaponsOwned.push(id);
    this.save();
    return true;
  }

  equipWeapon(id: string): boolean {
    if (!this.ownsWeapon(id)) return false;
    this.data.weaponEquipped = id;
    this.save();
    return true;
  }

  permLevel(id: string): number {
    return this.data.permUpgrades[id] ?? 0;
  }

  setPermLevel(id: string, level: number): void {
    this.data.permUpgrades[id] = level;
    this.save();
  }

  get soundOn(): boolean {
    return this.data.soundOn;
  }

  setSoundOn(on: boolean): void {
    this.data.soundOn = on;
    this.save();
  }

  reset(): void {
    this.data = defaultSave();
    this.save();
  }
}

export const saveManager = new SaveManager();
