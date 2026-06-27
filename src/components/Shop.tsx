"use client";

import React, { useState } from "react";
import { ShopItem } from "../app/types";

// Список предметов в магазине по трем категориям
const SHOP_ITEMS: ShopItem[] = [
  // 1. Питание (Food)
  {
    id: "kibble",
    name: "Энерго-Сферы",
    type: "food",
    cost: 15,
    effect: { hunger: 20 },
    description: "Питательные капсулы с чистым углеродным концентратом.",
    icon: "🍲",
  },
  {
    id: "ramen",
    name: "Нано-Рамен",
    type: "food",
    cost: 40,
    effect: { hunger: 45, energy: 15 },
    description: "Горячая лапша с нано-усилителями вкуса и мгновенным зарядом батареи.",
    icon: "🍜",
  },
  {
    id: "fuel",
    name: "Квантовое Топливо",
    type: "food",
    cost: 80,
    effect: { hunger: 70, energy: 40, cleanliness: 10 },
    description: "Концентрированная плазма для экстремальной подзарядки и очистки ядер.",
    icon: "🧪",
  },

  // 2. Гардероб и Скины (Clothes)
  {
    id: "visor",
    name: "Неоновый Визор",
    type: "clothes",
    cost: 150,
    effect: { fun: 25 },
    description: "Стильные тактические очки с HUD-интерфейсом и защитой от ЭМИ.",
    icon: "🕶️",
  },
  {
    id: "jacket",
    name: "Хром-Куртка",
    type: "clothes",
    cost: 300,
    effect: { fun: 50 },
    description: "Тяжелый воротник со светодиодными вставками и терморегуляцией.",
    icon: "🧥",
  },
  {
    id: "magenta",
    name: "Скин Маджента",
    type: "clothes",
    cost: 500,
    effect: { fun: 30 },
    description: "Перекрашивает корпус вашего дрона в яркий глитч-розовый неон.",
    icon: "🎨",
  },
  {
    id: "gold",
    name: "Скин Золотой Хакер",
    type: "clothes",
    cost: 1000,
    effect: { fun: 80 },
    description: "Премиальное золотое напыление с бегущими строками кода.",
    icon: "👑",
  },

  // 3. Декор (Decor)
  {
    id: "digital_rain",
    name: "Цифровой Дождь",
    type: "decor",
    cost: 200,
    effect: { fun: 20 },
    description: "Голографический фон с падающими неоново-зелеными кодовыми символами.",
    icon: "🟢",
  },
  {
    id: "cityscape",
    name: "Неоновый Токио",
    type: "decor",
    cost: 450,
    effect: { fun: 45 },
    description: "Голографическая проекция силуэтов небоскребов футуристичного города.",
    icon: "🏙️",
  },
  {
    id: "chrome_grid",
    name: "Золотая Сетка",
    type: "decor",
    cost: 600,
    effect: { fun: 60 },
    description: "Переключает сетку левитационного пола в премиальный золотой режим.",
    icon: "✨",
  },

  // 4. VFX (Ауры)
  {
    id: "vfx_glitch",
    name: "Glitch Swarm",
    type: "vfx",
    cost: 400,
    effect: { fun: 30 },
    description: "Битые пиксели и цифровой шум вокруг дрона.",
    icon: "🎇",
  },
  {
    id: "vfx_halo",
    name: "Plasma Halo",
    type: "vfx",
    cost: 750,
    effect: { fun: 50 },
    description: "Светящееся плазменное кольцо над питомцем.",
    icon: "⭕",
  },

  // 5. Дроны (Спутники)
  {
    id: "drone_navi",
    name: "Navi-Orb",
    type: "drone",
    cost: 600,
    effect: { fun: 40 },
    description: "Светящаяся сфера-компаньон. Дает пассивный бонус к доходу.",
    icon: "🔵",
  },
  {
    id: "drone_shield",
    name: "Defense Bit",
    type: "drone",
    cost: 1200,
    effect: { fun: 60 },
    description: "Геометрический щит, левитирующий вокруг дрона.",
    icon: "🛡️",
  },

  // 6. Ядра (Cores)
  {
    id: "core_ruby",
    name: "Пульсирующий Рубин",
    type: "core",
    cost: 800,
    effect: { fun: 45 },
    description: "Светящееся красное сердце внутри корпуса дрона.",
    icon: "❤️",
  },
  {
    id: "core_tesseract",
    name: "Квантовый Тессеракт",
    type: "core",
    cost: 1500,
    effect: { fun: 80 },
    description: "Гиперкуб невообразимой вычислительной мощности.",
    icon: "🧊",
  },

  // 7. Анимации (Стиль полета)
  {
    id: "anim_zen",
    name: "Zen Hover",
    type: "animation",
    cost: 300,
    effect: { fun: 20 },
    description: "Плавное и медитативное парение.",
    icon: "🧘",
  },
  {
    id: "anim_glitch",
    name: "Glitch Jitter",
    type: "animation",
    cost: 500,
    effect: { fun: 40 },
    description: "Нервные рывки и телепортации.",
    icon: "⚡",
  },
  
  // 8. Головные уборы (Headwear)
  {
    id: "halo",
    name: "Кибер-Нимб",
    type: "headwear",
    cost: 350,
    effect: { fun: 40 },
    description: "Светящееся плазменное кольцо прямо над головой.",
    icon: "⭕",
  },
  {
    id: "ears",
    name: "Неоновые Ушки",
    type: "headwear",
    cost: 450,
    effect: { fun: 50 },
    description: "Голографические кошачьи ушки на макушке.",
    icon: "🐱",
  },

  // 9. Крылья (Wings)
  {
    id: "wings_neon",
    name: "Энерго-Крылья",
    type: "wings",
    cost: 700,
    effect: { fun: 60 },
    description: "Прозрачные плазменные крылья за спиной дрона.",
    icon: "🦋",
  },
  {
    id: "wings_mech",
    name: "Механические закрылки",
    type: "wings",
    cost: 900,
    effect: { fun: 70 },
    description: "Остроугольные металлические пластины на спине.",
    icon: "✈️",
  },

  // 10. Двигатели (Thrusters)
  {
    id: "thruster_ion",
    name: "Ионный выхлоп",
    type: "thruster",
    cost: 500,
    effect: { energy: 20 },
    description: "Синее пульсирующее пламя из нижней части дрона.",
    icon: "🚀",
  },
  {
    id: "thruster_plasma",
    name: "Плазменный след",
    type: "thruster",
    cost: 850,
    effect: { energy: 40 },
    description: "Фиолетовые кольца выхлопа под днищем.",
    icon: "☄️",
  },

  // 11. Платформы (Base)
  {
    id: "base_charge",
    name: "Зарядная станция",
    type: "base",
    cost: 400,
    effect: { cleanliness: 30 },
    description: "Круглая платформа со светящейся окантовкой.",
    icon: "🔋",
  },
  {
    id: "base_holo",
    name: "Голо-пьедестал",
    type: "base",
    cost: 650,
    effect: { cleanliness: 50 },
    description: "Шестиугольная сетчатая подставка.",
    icon: "🛸",
  }
];

interface ShopProps {
  coins: number;
  purchasedItems: string[];
  equippedClothes: string | null;
  equippedSkin: string | null;
  equippedDecor: string | null;
  equippedVfx: string | null;
  equippedDrone: string | null;
  equippedCore: string | null;
  equippedAnimation: string | null;
  equippedHeadwear: string | null;
  equippedWings: string | null;
  equippedThruster: string | null;
  equippedBase: string | null;
  onPurchaseFood: (item: ShopItem) => void;
  onPurchaseClothes: (itemId: string, cost: number) => void;
  onPurchaseDecor: (itemId: string, cost: number) => void;
  onPurchaseVfx: (itemId: string, cost: number) => void;
  onPurchaseDrone: (itemId: string, cost: number) => void;
  onPurchaseCore: (itemId: string, cost: number) => void;
  onPurchaseAnimation: (itemId: string, cost: number) => void;
  onPurchaseHeadwear: (itemId: string, cost: number) => void;
  onPurchaseWings: (itemId: string, cost: number) => void;
  onPurchaseThruster: (itemId: string, cost: number) => void;
  onPurchaseBase: (itemId: string, cost: number) => void;
  onEquipClothes: (itemId: string | null) => void;
  onEquipSkin: (itemId: string | null) => void;
  onEquipDecor: (itemId: string | null) => void;
  onEquipVfx: (itemId: string | null) => void;
  onEquipDrone: (itemId: string | null) => void;
  onEquipCore: (itemId: string | null) => void;
  onEquipAnimation: (itemId: string | null) => void;
  onEquipHeadwear: (itemId: string | null) => void;
  onEquipWings: (itemId: string | null) => void;
  onEquipThruster: (itemId: string | null) => void;
  onEquipBase: (itemId: string | null) => void;
}

export default function Shop({
  coins,
  purchasedItems,
  equippedClothes,
  equippedSkin,
  equippedDecor,
  equippedVfx,
  equippedDrone,
  equippedCore,
  equippedAnimation,
  equippedHeadwear,
  equippedWings,
  equippedThruster,
  equippedBase,
  onPurchaseFood,
  onPurchaseClothes,
  onPurchaseDecor,
  onPurchaseVfx,
  onPurchaseDrone,
  onPurchaseCore,
  onPurchaseAnimation,
  onPurchaseHeadwear,
  onPurchaseWings,
  onPurchaseThruster,
  onPurchaseBase,
  onEquipClothes,
  onEquipSkin,
  onEquipDecor,
  onEquipVfx,
  onEquipDrone,
  onEquipCore,
  onEquipAnimation,
  onEquipHeadwear,
  onEquipWings,
  onEquipThruster,
  onEquipBase,
}: ShopProps) {
  const [activeTab, setActiveTab] = useState<'food' | 'visual' | 'env' | 'tuning' | 'headwear' | 'wings' | 'thruster' | 'base'>('food');

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'food') return item.type === 'food';
    if (activeTab === 'visual') return item.type === 'clothes';
    if (activeTab === 'env') return item.type === 'decor' || item.type === 'drone';
    if (activeTab === 'tuning') return item.type === 'vfx' || item.type === 'core' || item.type === 'animation';
    if (activeTab === 'headwear') return item.type === 'headwear';
    if (activeTab === 'wings') return item.type === 'wings';
    if (activeTab === 'thruster') return item.type === 'thruster';
    if (activeTab === 'base') return item.type === 'base';
    return false;
  });

  // Определение цвета категории
  const categoryColorClass = 
    activeTab === 'food' 
      ? 'border-cyber-cyan text-cyber-cyan glow-cyan' 
      : activeTab === 'visual' 
      ? 'border-cyber-magenta text-cyber-magenta glow-magenta' 
      : activeTab === 'env'
      ? 'border-cyber-purple text-cyber-purple glow-purple'
      : 'border-amber-400 text-amber-400 glow-amber';

  return (
    <div className="w-full">
      {/* Выбор вкладок */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('food')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'food'
              ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan glow-cyan shadow-[0_0_8px_rgba(0,240,255,0.15)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-cyan/30 hover:text-cyber-cyan/70'
          }`}
        >
          🍲 ЕДА
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'visual'
              ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta glow-magenta shadow-[0_0_8px_rgba(255,0,127,0.15)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-magenta/30 hover:text-cyber-magenta/70'
          }`}
        >
          🧥 ГАРДЕРОБ
        </button>
        <button
          onClick={() => setActiveTab('env')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'env'
              ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple glow-purple shadow-[0_0_8px_rgba(188,19,254,0.15)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-purple/30 hover:text-cyber-purple/70'
          }`}
        >
          🖼️ ОКРУЖЕНИЕ
        </button>
        <button
          onClick={() => setActiveTab('tuning')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'tuning'
              ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
              : 'border-gray-800 text-gray-400 hover:border-amber-400/30 hover:text-amber-400/70'
          }`}
        >
          ⚡ ТЮНИНГ
        </button>
        <button
          onClick={() => setActiveTab('headwear')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'headwear'
              ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta shadow-[0_0_8px_rgba(255,0,127,0.2)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-magenta/30 hover:text-cyber-magenta/70'
          }`}
        >
          🧢 УБОРЫ
        </button>
        <button
          onClick={() => setActiveTab('wings')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'wings'
              ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta shadow-[0_0_8px_rgba(255,0,127,0.2)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-magenta/30 hover:text-cyber-magenta/70'
          }`}
        >
          🦋 КРЫЛЬЯ
        </button>
        <button
          onClick={() => setActiveTab('thruster')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'thruster'
              ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
              : 'border-gray-800 text-gray-400 hover:border-amber-400/30 hover:text-amber-400/70'
          }`}
        >
          🚀 СОПЛА
        </button>
        <button
          onClick={() => setActiveTab('base')}
          className={`shrink-0 px-4 py-1.5 font-orbitron text-[10px] font-bold rounded-lg border transition-all duration-300 ${
            activeTab === 'base'
              ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple shadow-[0_0_8px_rgba(188,19,254,0.2)]'
              : 'border-gray-800 text-gray-400 hover:border-cyber-purple/30 hover:text-cyber-purple/70'
          }`}
        >
          🛸 БАЗА
        </button>
      </div>

      {/* Список предметов */}
      <div className="flex flex-col gap-3 pb-4">
        {filteredItems.map((item) => {
          const isPurchased = purchasedItems.includes(item.id);
          const canAfford = coins >= item.cost;

          // Флаги экипировки в зависимости от типа
          let isEquipped = false;
          if (item.type === 'clothes') {
            if (item.id === 'magenta' || item.id === 'gold') isEquipped = equippedSkin === item.id;
            else isEquipped = equippedClothes === item.id;
          } else if (item.type === 'decor') {
            isEquipped = equippedDecor === item.id;
          } else if (item.type === 'vfx') {
            isEquipped = equippedVfx === item.id;
          } else if (item.type === 'drone') {
            isEquipped = equippedDrone === item.id;
          } else if (item.type === 'core') {
            isEquipped = equippedCore === item.id;
          } else if (item.type === 'animation') {
            isEquipped = equippedAnimation === item.id;
          }

          // Границы предметов
          const itemBorderColor = 
            activeTab === 'food' 
              ? 'border-cyber-cyan/15 hover:border-cyber-cyan/35' 
              : activeTab === 'visual' 
              ? 'border-cyber-magenta/15 hover:border-cyber-magenta/35' 
              : activeTab === 'env'
              ? 'border-cyber-purple/15 hover:border-cyber-purple/35'
              : 'border-amber-400/15 hover:border-amber-400/35';

          // Обработка кнопки надеть/снять
          const handleEquipClick = () => {
            if (item.type === 'clothes') {
              if (item.id === 'magenta' || item.id === 'gold') onEquipSkin(isEquipped ? null : item.id);
              else onEquipClothes(isEquipped ? null : item.id);
            } else if (item.type === 'decor') {
              onEquipDecor(isEquipped ? null : item.id);
            } else if (item.type === 'vfx') {
              onEquipVfx(isEquipped ? null : item.id);
            } else if (item.type === 'drone') {
              onEquipDrone(isEquipped ? null : item.id);
            } else if (item.type === 'core') {
              onEquipCore(isEquipped ? null : item.id);
            } else if (item.type === 'animation') {
              onEquipAnimation(isEquipped ? null : item.id);
            }
          };

          // Покупка предмета
          const handlePurchaseClick = () => {
            if (item.type === 'clothes') onPurchaseClothes(item.id, item.cost);
            else if (item.type === 'decor') onPurchaseDecor(item.id, item.cost);
            else if (item.type === 'vfx') onPurchaseVfx(item.id, item.cost);
            else if (item.type === 'drone') onPurchaseDrone(item.id, item.cost);
            else if (item.type === 'core') onPurchaseCore(item.id, item.cost);
            else if (item.type === 'animation') onPurchaseAnimation(item.id, item.cost);
            else if (item.type === 'headwear') onPurchaseHeadwear(item.id, item.cost);
            else if (item.type === 'wings') onPurchaseWings(item.id, item.cost);
            else if (item.type === 'thruster') onPurchaseThruster(item.id, item.cost);
            else if (item.type === 'base') onPurchaseBase(item.id, item.cost);
          };

          return (
            <div
              key={item.id}
              className={`p-3 bg-cyber-bg/60 rounded-xl border transition-all duration-300 flex gap-3 items-center ${itemBorderColor}`}
            >
              {/* Иконка */}
              <div
                className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl bg-cyber-bg border ${
                  activeTab === 'food' ? 'border-cyber-cyan/25' : (activeTab === 'visual' || activeTab === 'headwear' || activeTab === 'wings') ? 'border-cyber-magenta/25' : (activeTab === 'env' || activeTab === 'base') ? 'border-cyber-purple/25' : 'border-amber-400/25'
                }`}
              >
                {item.icon}
              </div>

              {/* Описание */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-[11px] font-extrabold text-white truncate uppercase tracking-wide">
                    {item.name}
                  </h4>
                  <span className="text-[9px] font-orbitron font-extrabold text-cyber-cyan/95">
                    🪙 {item.cost}
                  </span>
                </div>
                <p className="text-[8px] text-gray-400 font-mono leading-tight mb-1">
                  {item.description}
                </p>
                
                {/* Эффекты */}
                <div className="flex gap-1 text-[7px] font-mono">
                  {item.effect.hunger && (
                    <span className="text-cyber-cyan bg-cyber-cyan/5 border border-cyber-cyan/20 px-1 rounded">
                      Сытость +{item.effect.hunger}
                    </span>
                  )}
                  {item.effect.energy && (
                    <span className="text-cyber-purple bg-cyber-purple/5 border border-cyber-purple/20 px-1 rounded">
                      Заряд +{item.effect.energy}
                    </span>
                  )}
                  {item.effect.cleanliness && (
                    <span className="text-green-400 bg-green-500/5 border border-green-500/20 px-1 rounded">
                      Чистка +{item.effect.cleanliness}
                    </span>
                  )}
                  {item.effect.fun && (
                    <span className="text-cyber-magenta bg-cyber-magenta/5 border border-cyber-magenta/20 px-1 rounded">
                      Развлечение +{item.effect.fun}
                    </span>
                  )}
                </div>
              </div>

              {/* Кнопка действия */}
              <div className="flex flex-col justify-center">
                {item.type === 'food' ? (
                  <button
                    disabled={!canAfford}
                    onClick={() => onPurchaseFood(item)}
                    className={`px-2.5 py-1.5 rounded-lg font-orbitron text-[8px] font-extrabold border uppercase tracking-wider transition-all duration-300 ${
                      canAfford
                        ? 'bg-cyber-cyan border-cyber-cyan text-cyber-bg hover:shadow-[0_0_8px_rgba(0,240,255,0.4)] active:scale-95'
                        : 'border-gray-800 bg-transparent text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Съесть
                  </button>
                ) : (
                  <>
                    {!isPurchased ? (
                      <button
                        disabled={!canAfford}
                        onClick={handlePurchaseClick}
                        className={`px-2.5 py-1.5 rounded-lg font-orbitron text-[8px] font-extrabold border uppercase tracking-wider transition-all duration-300 ${
                          canAfford
                            ? (activeTab === 'visual' || activeTab === 'headwear' || activeTab === 'wings')
                              ? 'bg-cyber-magenta border-cyber-magenta text-white hover:shadow-[0_0_8px_rgba(255,0,127,0.4)] active:scale-95'
                              : (activeTab === 'env' || activeTab === 'base')
                              ? 'bg-cyber-purple border-cyber-purple text-white hover:shadow-[0_0_8px_rgba(188,19,254,0.4)] active:scale-95'
                              : 'bg-amber-400 border-amber-400 text-white hover:shadow-[0_0_8px_rgba(251,191,36,0.4)] active:scale-95'
                            : 'border-gray-800 bg-transparent text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        Купить
                      </button>
                    ) : (
                      <button
                        onClick={handleEquipClick}
                        className={`px-2.5 py-1.5 rounded-lg font-orbitron text-[8px] font-extrabold border uppercase tracking-wider transition-all duration-300 ${
                          isEquipped
                            ? (activeTab === 'visual' || activeTab === 'headwear' || activeTab === 'wings')
                              ? 'bg-cyber-magenta/25 border-cyber-magenta text-cyber-magenta shadow-[inset_0_0_4px_rgba(255,0,127,0.2)] hover:bg-cyber-magenta/5'
                              : (activeTab === 'env' || activeTab === 'base')
                              ? 'bg-cyber-purple/25 border-cyber-purple text-cyber-purple shadow-[inset_0_0_4px_rgba(188,19,254,0.2)] hover:bg-cyber-purple/5'
                              : 'bg-amber-400/25 border-amber-400 text-amber-400 shadow-[inset_0_0_4px_rgba(251,191,36,0.2)] hover:bg-amber-400/5'
                            : (activeTab === 'visual' || activeTab === 'headwear' || activeTab === 'wings')
                            ? 'bg-cyber-magenta border-cyber-magenta text-white hover:shadow-[0_0_8px_rgba(255,0,127,0.4)]'
                            : (activeTab === 'env' || activeTab === 'base')
                            ? 'bg-cyber-purple border-cyber-purple text-white hover:shadow-[0_0_8px_rgba(188,19,254,0.4)]'
                            : 'bg-amber-400 border-amber-400 text-white hover:shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                        }`}
                      >
                        {isEquipped ? 'Снять' : 'Надеть'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
