export interface PetState {
  name: string;
  coins: number;
  hunger: number;       // 0-100 (100 - сыт, 0 - голоден)
  energy: number;       // 0-100 (100 - заряжен, 0 - разряжен)
  cleanliness: number;  // 0-100 (100 - чистый, 0 - десинхронизирован)
  fun: number;          // 0-100 (100 - весело, 0 - скучно)
  level: number;
  xp: number;           // Текущий опыт для перехода на следующий уровень
  equippedClothes: string | null; // ID надетого визора или куртки
  equippedSkin: string | null;    // ID текущего скина (cyan, magenta, gold)
  equippedDecor: string | null;   // ID текущего фона (digital_rain, cityscape, chrome_grid)
  equippedVfx: string | null;       // ID текущей ауры
  equippedDrone: string | null;     // ID спутника
  equippedCore: string | null;      // ID ядра
  equippedAnimation: string | null; // ID стиля анимации
  equippedHeadwear: string | null;  // ID головного убора
  equippedWings: string | null;     // ID крыльев
  equippedThruster: string | null;  // ID двигателей
  equippedBase: string | null;      // ID платформы
  petColor: string;               // Бесплатный кастомный цвет (hex)
  bgAccentColor: string;          // Бесплатный цвет фона/окружения (hex)
  purchasedItems: string[];       // Список ID всех купленных предметов (одежда, скины, декор)
  lastLoginTimestamp: number | null; // UNIX timestamp последнего захода для Daily Bonus
  consecutiveLogins: number;      // Количество дней входа подряд (1-7)
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'food' | 'clothes' | 'decor' | 'vfx' | 'drone' | 'core' | 'animation' | 'headwear' | 'wings' | 'thruster' | 'base';
  cost: number;
  effect: {
    hunger?: number;
    energy?: number;
    cleanliness?: number;
    fun?: number;
  };
  description: string;
  icon: string;
}

export interface GiftState {
  lastGiftSentTime: number | null;
  cooldownHours: number;
}
