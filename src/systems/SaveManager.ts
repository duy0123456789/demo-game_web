export interface SaveData {
  coins: number;
  gems: number;
  playerLevel: number;
}

const SAVE_KEY = 'pixel-gunner-save-v1';

function defaultSave(): SaveData {
  return {
    coins: 0,
    gems: 0,
    playerLevel: 1,
  };
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

  addCoins(amount: number): void {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
  }

  addGems(amount: number): void {
    this.data.gems = Math.max(0, this.data.gems + amount);
    this.save();
  }
}

export const saveManager = new SaveManager();