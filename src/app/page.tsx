"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PetState, ShopItem } from "./types";
import CyberPet3D from "@/components/CyberPet3D";
import Shop from "@/components/Shop";
import DailyGift from "@/components/DailyGift";
import AdSimulation from "@/components/AdSimulation";
import NeuralSyncGame from "@/components/NeuralSyncGame";

// ─────────────────────────────────────────────────────────────────────────────
// КОНСТАНТЫ
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_STATE: PetState = {
  name: "КИТТИ",
  coins: 250,
  hunger: 80,
  energy: 75,
  cleanliness: 90,
  fun: 70,
  level: 2,
  xp: 120,
  equippedClothes: null,
  equippedSkin: null,
  equippedDecor: null,
  equippedVfx: null,
  equippedDrone: null,
  equippedCore: null,
  equippedAnimation: null,
  equippedHeadwear: null,
  equippedWings: null,
  equippedThruster: null,
  equippedBase: null,
  petColor: "#5c5cba",
  bgAccentColor: "#00f0ff",
  purchasedItems: [],
  lastLoginTimestamp: null,
  consecutiveLogins: 0,
};

const DAILY_REWARDS = [
  { day: 1, coins: 50,  item: null,    itemName: "" },
  { day: 2, coins: 100, item: null,    itemName: "" },
  { day: 3, coins: 150, item: "kibble",itemName: "🍃 Энерго-Сфера" },
  { day: 4, coins: 200, item: null,    itemName: "" },
  { day: 5, coins: 300, item: null,    itemName: "" },
  { day: 6, coins: 400, item: "ramen", itemName: "🍜 Нано-Рамен" },
  { day: 7, coins: 600, item: "visor", itemName: "🔮 Голо-Визор" },
];





// ─────────────────────────────────────────────────────────────────────────────
// Arc SVG индикатор
// ─────────────────────────────────────────────────────────────────────────────
function ArcIndicator({
  value, color, icon, label, onClick,
}: {
  value: number; color: string; icon: string; label: string; onClick?: () => void;
}) {
  const r = 19;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, value));
  const dash = (filled / 100) * circ;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div className="relative w-12 h-12">
        <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
          <circle cx="24" cy="24" r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle cx="24" cy="24" r={r} fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={circ - dash}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
            style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl leading-none select-none">
          {icon}
        </div>
      </div>
      <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color }}>
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill кнопка в доке
// ─────────────────────────────────────────────────────────────────────────────
function DockBtn({
  icon, label, color, active, disabled, onClick,
}: {
  icon: string; label: string; color: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all"
        style={{
          background: active
            ? `${color}25`
            : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
          boxShadow: active ? `0 0 16px ${color}40` : "none",
        }}
      >
        {icon}
      </div>
      <span
        className="text-[8px] font-semibold tracking-wider uppercase"
        style={{ color: active ? color : "rgba(255,255,255,0.35)" }}
      >
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Шторка (bottom sheet)
// ─────────────────────────────────────────────────────────────────────────────
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      {/* Затемнение */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bottom-sheet rounded-t-3xl px-5 pt-4 pb-8 z-10 max-h-[75vh] overflow-y-auto">
        {/* Ручка */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-sm text-white/90 tracking-wide">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/08 flex items-center justify-center text-white/40 text-xs hover:bg-white/15 transition-all">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type NeuralResult = { score: number; maxCombo: number; perfect: number; good: number; miss: number; coinsEarned: number; funEarned: number };
type Sheet = "shop" | "gift" | "ad" | "hack" | "color_picker" | null;

const FREE_COLORS = [
  { hex: "#5c5cba", name: "Кибер-Синий" },
  { hex: "#ff007f", name: "Неоновый Розовый" },
  { hex: "#ffb700", name: "Золотой Хакер" },
  { hex: "#00f0ff", name: "Энерго-Циан" },
  { hex: "#68D391", name: "Матрица" },
  { hex: "#F6AD55", name: "Оранж-Плазма" },
  { hex: "#B794F4", name: "Аметист" },
  { hex: "#ffffff", name: "Чистый Титан" },
];

const triggerHaptic = (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
  if (typeof window !== "undefined") {
    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ГЛАВНАЯ СТРАНИЦА
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [state, setState]               = useState<PetState>(DEFAULT_STATE);
  const [isLoading, setIsLoading]       = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastGiftSentTime, setLastGiftSentTime] = useState<number | null>(null);

  const [isSleeping, setIsSleeping] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const [activeSheet, setActiveSheet]       = useState<Sheet>(null);
  const [colorPickerTab, setColorPickerTab] = useState<'pet' | 'bg'>('pet');
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showNeuralSync, setShowNeuralSync] = useState(false);
  const [isWatchingRebootAd, setIsWatchingRebootAd] = useState(false);
  const [isUnderAttack, setIsUnderAttack]           = useState(false);

  const isGlitched = state.hunger <= 12 || state.cleanliness <= 12 || state.energy <= 12;

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = (window as any).Telegram?.WebApp;
    const user   = WebApp?.initDataUnsafe?.user;
    if (WebApp) { 
      WebApp.ready(); 
      WebApp.expand(); 
      WebApp.setHeaderColor("#050308"); 
      if (WebApp.disableVerticalSwipes) WebApp.disableVerticalSwipes();
      
      const startParam = WebApp.initDataUnsafe?.start_param;
      if (startParam && startParam.startsWith("attack")) {
        setIsUnderAttack(true);
      }
    }

    const saved     = localStorage.getItem("cyber_pet_state");
    const giftTime  = localStorage.getItem("cyber_pet_gift_time");
    const lastTime  = localStorage.getItem("cyber_pet_last_time");

    let s: PetState = saved ? JSON.parse(saved) : { ...DEFAULT_STATE };
    if (user && !saved) s.name = (user.first_name || user.username || "КИТТИ").toUpperCase();
    if (giftTime) setLastGiftSentTime(Number(giftTime));

    if (lastTime) {
      const h = (Date.now() - Number(lastTime)) / 3_600_000;
      s.hunger      = Math.max(5, s.hunger      - Math.floor(h * 4));
      s.energy      = Math.max(5, s.energy      - Math.floor(h * 5));
      s.cleanliness = Math.max(5, s.cleanliness - Math.floor(h * 3));
      s.fun         = Math.max(5, s.fun         - Math.floor(h * 4));
    }

    const now = Date.now();
    if (!s.lastLoginTimestamp) {
      s.consecutiveLogins = 1; setShowDailyBonus(true);
    } else {
      const dh = (now - s.lastLoginTimestamp) / 3_600_000;
      if (dh >= 20 && dh < 48) { s.consecutiveLogins = (s.consecutiveLogins % 7) + 1; setShowDailyBonus(true); }
      else if (dh >= 48)        { s.consecutiveLogins = 1; setShowDailyBonus(true); }
    }

    setState(s);
    setIsLoading(false);
  }, []);

  // ── Decay ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem("cyber_pet_state",     JSON.stringify(state));
    localStorage.setItem("cyber_pet_last_time", String(Date.now()));
    const id = setInterval(() => {
      if (isSleeping) return;
      setState(p => ({ ...p, hunger: Math.max(5, p.hunger-1), energy: Math.max(5, p.energy-1), cleanliness: Math.max(5, p.cleanliness-1), fun: Math.max(5, p.fun-1) }));
    }, 50_000);
    return () => clearInterval(id);
  }, [state, isLoading, isSleeping]);

  // ── Sleep charge ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSleeping) return;
    const id = setInterval(() => {
      setState(p => {
        if (p.energy >= 100) { setIsSleeping(false); notify("⚡ Питомец заряжен!"); return p; }
        return { ...p, energy: Math.min(100, p.energy + 8) };
      });
    }, 3_000);
    return () => clearInterval(id);
  }, [isSleeping]);

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const gainXp = useCallback((xp: number, s: PetState): PetState => {
    let nx = s.xp + xp, lv = s.level;
    if (nx >= 500) { lv++; nx -= 500; notify(`🎉 Level ${lv}!`); }
    return { ...s, xp: nx, level: lv };
  }, [notify]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLaunchAttack = () => {
    triggerHaptic("heavy");
    setActiveSheet(null);
    if (typeof window !== "undefined") {
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp && WebApp.isVersionAtLeast && WebApp.isVersionAtLeast("6.7") && WebApp.switchInlineQuery) {
        try {
          WebApp.switchInlineQuery("attack_123", ["users", "groups"]);
        } catch (e) {
          notify("В Telegram это откроет меню выбора чата для отправки дрона!");
        }
      } else {
        notify("В Telegram это откроет меню выбора чата для отправки дрона!");
      }
    }
  };

  const handleReaction = useCallback((_type: string) => {
    setState(p => gainXp(3, { 
      ...p, 
      fun: Math.min(100, p.fun + 4),
      coins: Math.round((p.coins + 0.3) * 10) / 10 
    }));
  }, [gainXp]);



  const handleClean = () => {
    if (isCleaning) return;
    if (state.coins < 50) {
      setActiveSheet("ad");
      notify("📺 Дефрагментация запущена за просмотр промо!");
      return;
    }
    setState(p => ({ ...p, coins: p.coins - 50 }));
    setIsCleaning(true);
    let t = 0;
    const id = setInterval(() => {
      setState(p => ({ ...p, cleanliness: Math.min(100, p.cleanliness + 15) }));
      if (++t >= 3) { clearInterval(id); setIsCleaning(false); setState(p => gainXp(15, p)); notify("✨ Очистка завершена! (-50 🪙)"); }
    }, 2_000);
  };

  const handleRebootCoins = () => {
    if (state.coins < 300) { notify("❌ Недостаточно монет!"); return; }
    setState(p => ({
      ...p,
      coins: p.coins - 300,
      hunger: Math.max(p.hunger, 80),
      energy: Math.max(p.energy, 80),
      cleanliness: Math.max(p.cleanliness, 80),
    }));
    notify("⚙️ Перезагрузка системы выполнена! (-300 🪙)");
  };

  const handleRebootAd = () => {
    const Adsgram = (window as any).Adsgram;
    const onSuccess = () => {
      setState(p => ({
        ...p,
        hunger: Math.max(p.hunger, 80),
        energy: Math.max(p.energy, 80),
        cleanliness: Math.max(p.cleanliness, 80),
      }));
      notify("⚙️ Система перезапущена бесплатно!");
    };

    if (Adsgram) {
      const AdController = Adsgram.init({ blockId: "36421" });
      AdController.show().then(() => {
        onSuccess();
      }).catch((err: any) => {
        if (err?.error) {
          setIsWatchingRebootAd(true);
          setTimeout(() => {
            setIsWatchingRebootAd(false);
            onSuccess();
          }, 3000);
        } else {
          console.warn("Adsgram skipped:", err);
        }
      });
    } else {
      setIsWatchingRebootAd(true);
      setTimeout(() => {
        setIsWatchingRebootAd(false);
        onSuccess();
      }, 3000);
    }
  };

  const handleAdCompleted = (reward: number) => {
    setState(p => gainXp(30, { ...p, coins: p.coins + reward, fun: Math.min(100, p.fun + 20) }));
    setActiveSheet(null);
    notify(`🪙 +${reward} монет!`);
  };

  const handleSendGift = () => {
    setLastGiftSentTime(Date.now());
    setState(p => gainXp(20, { ...p, coins: p.coins + 50, fun: Math.min(100, p.fun + 15) }));
    setActiveSheet(null);
    notify("🎁 Подарок отправлен!");
  };

  const claimDailyReward = () => {
    const r = DAILY_REWARDS[state.consecutiveLogins - 1];
    setState(p => {
      const purchased = r.item && !p.purchasedItems.includes(r.item) ? [...p.purchasedItems, r.item] : p.purchasedItems;
      return gainXp(40, { ...p, coins: p.coins + r.coins, purchasedItems: purchased, lastLoginTimestamp: Date.now() });
    });
    setShowDailyBonus(false);
    notify(`🎁 +${DAILY_REWARDS[state.consecutiveLogins - 1]?.coins} 🪙`);
  };

  const handleNeuralSyncClose = (result: NeuralResult | null) => {
    setShowNeuralSync(false);
    if (!result) return;
    setState(p => gainXp(result.score, { ...p, coins: p.coins + result.coinsEarned, fun: Math.min(100, p.fun + result.funEarned) }));
    notify(`🎵 +${result.coinsEarned} 🪙  Combo ×${result.maxCombo}`);
  };



  const handlePurchaseFood = (item: ShopItem) => {
    if (state.coins < item.cost) return;
    setState(p => gainXp(20, { ...p, coins: p.coins - item.cost, hunger: Math.min(100, p.hunger + (item.effect.hunger || 0)), energy: Math.min(100, p.energy + (item.effect.energy || 0)), cleanliness: Math.min(100, p.cleanliness + (item.effect.cleanliness || 0)), fun: Math.min(100, p.fun + (item.effect.fun || 0)) }));
    notify(`🍃 ${item.name}!`);
  };
  const handlePurchaseClothes = (id: string, cost: number) => {
    if (state.coins < cost) return;
    setState(p => gainXp(50, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id], fun: Math.min(100, p.fun + 20) }));
  };
  const handlePurchaseDecor = (id: string, cost: number) => {
    if (state.coins < cost) return;
    setState(p => gainXp(60, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-holo/30 border-t-holo animate-spin" />
          <p className="text-[10px] text-holo/60 tracking-widest font-bold uppercase animate-pulse">Инициализация...</p>
        </div>
      </div>
    );
  }

  const handleCloseApp = () => {
    if (typeof window !== "undefined") (window as any).Telegram?.WebApp?.close();
  };

  const equippedItem = (id: string) => state.purchasedItems.includes(id) && (state.equippedClothes === id || state.equippedSkin === id || state.equippedDecor === id);

  return (
    <main className="relative w-full max-w-md mx-auto h-[100dvh] flex flex-col overflow-hidden ambient-grid select-none">

      {/* ── 3D Питомец как бесшовный фон во весь экран ───────────────── */}
      <div className="fixed inset-0 w-full h-full z-0">
        <CyberPet3D
          state={state}
          isSleeping={isSleeping}
          isCleaning={isCleaning}
          onTap={() => {}}
          onReaction={handleReaction}
          openMiniGame={() => setShowNeuralSync(true)}
        />
      </div>

      {/* Neural Sync полноэкранный */}
      {showNeuralSync && <NeuralSyncGame onClose={handleNeuralSyncClose} />}

      {/* ── Уведомление ──────────────────────────────────────────────── */}
      {notification && (
        <div className="fixed top-18 left-1/2 z-50 notif-pop">
          <div className="glass-panel rounded-full px-5 py-2.5 text-[11px] font-semibold text-white/90 whitespace-nowrap" style={{ transform: "translateX(-50%)" }}>
            {notification}
          </div>
        </div>
      )}

      {/* ── Daily Bonus ───────────────────────────────────────────────── */}
      {showDailyBonus && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={claimDailyReward} />
          <div className="relative bottom-sheet rounded-3xl p-6 w-full max-w-sm text-center space-y-5">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
            <div>
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="text-sm font-bold text-white tracking-wider">Ежедневная награда</h3>
              <p className="text-[10px] text-white/40 mt-1">День {state.consecutiveLogins} из 7</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAILY_REWARDS.map(r => {
                const cur  = state.consecutiveLogins === r.day;
                const past = state.consecutiveLogins  > r.day;
                return (
                  <div key={r.day} className="flex flex-col items-center gap-1 p-1.5 rounded-xl" style={{
                    background: cur  ? "rgba(183,148,244,0.15)" : "rgba(255,255,255,0.03)",
                    border:     cur  ? "1px solid rgba(183,148,244,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    opacity:    past ? 0.4 : 1,
                  }}>
                    <span className="text-xs">{r.item ? "🎁" : "🪙"}</span>
                    <span className="text-[7px] font-bold" style={{ color: cur ? "#B794F4" : "rgba(255,255,255,0.35)" }}>{r.day}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={claimDailyReward}
              className="pill-btn w-full py-3.5 font-bold text-sm text-void"
              style={{ background: "linear-gradient(135deg, #B794F4, #76E4F7)" }}>
              Забрать +{DAILY_REWARDS[state.consecutiveLogins - 1]?.coins} 🪙
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Sheets ─────────────────────────────────────────────── */}





      {activeSheet === "shop" && (
        <BottomSheet title="Черный Рынок" onClose={() => setActiveSheet(null)}>
          <Shop
            coins={state.coins}
            purchasedItems={state.purchasedItems}
            equippedClothes={state.equippedClothes}
            equippedSkin={state.equippedSkin}
            equippedDecor={state.equippedDecor}
            equippedVfx={state.equippedVfx}
            equippedDrone={state.equippedDrone}
            equippedCore={state.equippedCore}
            equippedAnimation={state.equippedAnimation}
            equippedHeadwear={state.equippedHeadwear}
            equippedWings={state.equippedWings}
            equippedThruster={state.equippedThruster}
            equippedBase={state.equippedBase}
            onPurchaseFood={handlePurchaseFood}
            onPurchaseClothes={handlePurchaseClothes}
            onPurchaseDecor={handlePurchaseDecor}
            onPurchaseVfx={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(40, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id], fun: Math.min(100, p.fun + 10) }));
            }}
            onPurchaseDrone={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(50, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id], fun: Math.min(100, p.fun + 20) }));
            }}
            onPurchaseCore={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(60, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id], fun: Math.min(100, p.fun + 30) }));
            }}
            onPurchaseAnimation={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(30, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
            }}
            onPurchaseHeadwear={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(30, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
            }}
            onPurchaseWings={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(40, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
            }}
            onPurchaseThruster={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(30, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
            }}
            onPurchaseBase={(id, cost) => {
              if (state.coins >= cost) setState(p => gainXp(50, { ...p, coins: p.coins - cost, purchasedItems: [...p.purchasedItems, id] }));
            }}
            onEquipClothes={id => setState(p => ({ ...p, equippedClothes: id }))}
            onEquipSkin={id => setState(p => ({ ...p, equippedSkin: id }))}
            onEquipDecor={id => setState(p => ({ ...p, equippedDecor: id }))}
            onEquipVfx={id => setState(p => ({ ...p, equippedVfx: id }))}
            onEquipDrone={id => setState(p => ({ ...p, equippedDrone: id }))}
            onEquipCore={id => setState(p => ({ ...p, equippedCore: id }))}
            onEquipAnimation={id => setState(p => ({ ...p, equippedAnimation: id }))}
            onEquipHeadwear={id => setState(p => ({ ...p, equippedHeadwear: id }))}
            onEquipWings={id => setState(p => ({ ...p, equippedWings: id }))}
            onEquipThruster={id => setState(p => ({ ...p, equippedThruster: id }))}
            onEquipBase={id => setState(p => ({ ...p, equippedBase: id }))}
          />
        </BottomSheet>
      )}

      {activeSheet === "hack" && (
        <BottomSheet title="Кибер-Атака (PvP)" onClose={() => setActiveSheet(null)}>
          <div className="text-center space-y-4 pb-4">
            <div className="text-5xl animate-pulse my-4">📡</div>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              Отправьте своего дрона в чат Telegram. Если цель не сможет отбить атаку в Neural Sync, ваш дрон украдет до 500 🪙!
            </p>
            <button onClick={handleLaunchAttack}
              className="w-full py-4 mt-4 font-orbitron font-black text-sm rounded-2xl tracking-widest uppercase transition-all active:scale-95 text-void"
              style={{ background: "linear-gradient(135deg, #FC8181 0%, #F6AD55 100%)", boxShadow: "0 0 20px rgba(252,129,129,0.4)" }}>
              ЗАПУСТИТЬ ВИРУС
            </button>
          </div>
        </BottomSheet>
      )}

      {activeSheet === "gift" && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSheet(null)} />
          <div className="relative bottom-sheet rounded-t-3xl w-full z-10 px-5 pt-4 pb-8">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <DailyGift lastGiftSentTime={lastGiftSentTime} onSendGift={handleSendGift} />
          </div>
        </div>
      )}

      {activeSheet === "ad" && <AdSimulation onAdCompleted={handleAdCompleted} />}

      {activeSheet === "color_picker" && (
        <BottomSheet title="Окрас (Бесплатно)" onClose={() => setActiveSheet(null)}>
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => setColorPickerTab('pet')} className={`px-4 py-1.5 text-xs font-bold rounded-lg border ${colorPickerTab === 'pet' ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta' : 'border-gray-800 text-gray-400'}`}>Питомец</button>
            <button onClick={() => setColorPickerTab('bg')} className={`px-4 py-1.5 text-xs font-bold rounded-lg border ${colorPickerTab === 'bg' ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple' : 'border-gray-800 text-gray-400'}`}>Окружение</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {FREE_COLORS.map(c => {
              const isActive = colorPickerTab === 'pet' ? state.petColor === c.hex : state.bgAccentColor === c.hex;
              return (
                <button key={c.hex} onClick={() => setState(p => colorPickerTab === 'pet' ? { ...p, petColor: c.hex } : { ...p, bgAccentColor: c.hex })}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all active:scale-95 border"
                  style={{
                    background: `${c.hex}15`,
                    borderColor: isActive ? c.hex : "rgba(255,255,255,0.1)",
                    boxShadow: isActive ? `0 0 10px ${c.hex}40` : "none"
                  }}>
                  <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: c.hex, borderColor: "rgba(255,255,255,0.2)" }} />
                  <span className="text-[7px] font-bold text-white/70 text-center leading-tight h-4">{c.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-[9px] text-white/40 mt-4 font-mono">
            {colorPickerTab === 'pet' ? "Базовая окраска корпуса дрона." : "Цвет голографической сетки и частиц."}
          </p>
        </BottomSheet>
      )}

      {/* ── Интерфейс HUD (Парит поверх 3D) ─────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-between h-[100dvh] pb-6 pt-4 pointer-events-none">

        {/* Монеты + уровень (Top HUD) */}
        <div className="flex justify-between items-center px-5 pointer-events-auto">
          {/* Уровень */}
          <div className="pill-btn px-3 py-1.5 flex items-center gap-1.5"
            style={{ background: "rgba(183,148,244,0.12)", border: "1px solid rgba(183,148,244,0.3)" }}>
            <span className="text-[9px] font-bold text-holo/60 uppercase tracking-wider">LVL</span>
            <span className="text-sm font-black text-holo glow-holo">{state.level}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Монеты */}
            <div className="coin-badge pill-btn px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-black text-amber glow-amber">{state.coins.toLocaleString()}</span>
            </div>

            {/* Кнопка закрытия ОС (✕) */}
            <button
              onClick={handleCloseApp}
              className="w-8 h-8 rounded-xl border border-red-500/25 bg-red-950/15 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs transition-all active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Центральная зона имени и индикаторов */}
        <div className="flex flex-col items-center justify-end flex-1 pb-4 gap-4">
          {/* Имя питомца */}
          <div className="text-center pointer-events-auto mb-auto pt-10">
            <h1 className="text-base font-black tracking-[0.25em] uppercase text-white/80 glow-holo">
              {state.name}
            </h1>
            {isSleeping && (
              <span className="text-[9px] font-bold tracking-widest uppercase animate-pulse text-holo">
                ✦ режим сна ✦
              </span>
            )}
            {isCleaning && (
              <span className="text-[9px] font-bold tracking-widest uppercase animate-pulse text-mint">
                ✦ дефрагментация ✦
              </span>
            )}
          </div>

          {/* Статус-метка внутри пузыря */}
          <div className="pill-btn px-3 py-1 text-[8px] font-bold tracking-widest uppercase select-none pointer-events-auto"
            style={{ background: "rgba(0,0,0,0.5)", color: "rgba(183,148,244,0.7)", border: "1px solid rgba(183,148,244,0.15)", backdropFilter: "blur(8px)" }}>
            {isSleeping ? "Zzz..." : "∿ ОНЛАЙН"}
          </div>

          {/* ── Arc индикаторы ─────────────────────────────────────────── */}
          <div className="flex justify-center gap-5 pointer-events-auto">
            <ArcIndicator value={state.hunger}      color="#68D391" icon="🍃" label="Еда"    onClick={() => setActiveSheet("shop")} />
            <ArcIndicator value={state.energy}      color="#F6AD55" icon="⚡" label="Энергия" onClick={() => setIsSleeping(!isSleeping)} />
            <ArcIndicator value={state.cleanliness} color="#76E4F7" icon="✨" label="Чистота" onClick={handleClean} />
            <ArcIndicator value={state.fun}         color="#B794F4" icon="💜" label="Радость" onClick={() => setShowNeuralSync(true)} />
          </div>
        </div>

        {/* ── Кнопка HACK NETWORK (Над доком) ─────────────────────────── */}
        <div className="absolute bottom-32 left-8 flex pointer-events-auto z-20">
          <button 
            onClick={() => { triggerHaptic("medium"); setActiveSheet("hack"); }}
            className="px-6 py-2.5 rounded-full font-orbitron font-black tracking-widest text-[11px] uppercase transition-all active:scale-95 flex items-center gap-2"
            style={{
              background: "linear-gradient(90deg, rgba(252,129,129,0.15) 0%, rgba(183,148,244,0.15) 100%)",
              border: "1px solid rgba(252,129,129,0.6)",
              color: "#FC8181",
              boxShadow: "0 0 20px rgba(252,129,129,0.3)",
              backdropFilter: "blur(10px)"
            }}
          >
            <span className="animate-pulse">⚠️</span> TARGET NETWORK
          </button>
        </div>

        {/* ── Кнопка Цвет (Над доком справа) ─────────────────────────── */}
        <div className="absolute bottom-32 right-8 flex pointer-events-auto z-20">
          <button 
            onClick={() => { triggerHaptic("medium"); setActiveSheet("color_picker"); }}
            className="w-11 h-11 rounded-full text-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)"
            }}
          >
            🎨
          </button>
        </div>

        {/* ── Плавающий Dock ───────────────────────────────────────────── */}
        <div className="flex justify-center pb-6 px-8 pointer-events-auto">
          <div className="float-dock rounded-3xl px-6 py-3 flex items-end gap-5">

            <DockBtn icon="🛍️" label="Магазин"  color="#B794F4"
              active={activeSheet === "shop"}
              onClick={() => setActiveSheet(activeSheet === "shop" ? null : "shop")} />

            <DockBtn icon="🎁" label="Подарок" color="#F6AD55"
              active={activeSheet === "gift"} disabled={isSleeping || isCleaning}
              onClick={() => setActiveSheet(activeSheet === "gift" ? null : "gift")} />

            {/* Центральная Play-кнопка */}
            <div className="relative -mt-4">
              <button
                disabled={isSleeping || isCleaning}
                onClick={() => { setShowNeuralSync(true); setActiveSheet(null); }}
                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #B794F4 0%, #76E4F7 100%)",
                  boxShadow: "0 0 24px rgba(183,148,244,0.5), 0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-xl">🎵</span>
                <span className="text-[7px] font-black text-void uppercase tracking-widest leading-none">PLAY</span>
              </button>
            </div>

            <DockBtn icon="🧼" label="Мыть"   color="#68D391"
              active={isCleaning} disabled={isSleeping || isCleaning}
              onClick={handleClean} />

            <DockBtn icon="🌙" label="Сон"     color="#FC8181"
              active={isSleeping} disabled={isCleaning}
              onClick={() => { setIsSleeping(!isSleeping); setActiveSheet(null); }} />
          </div>
        </div>
      </div>

      {/* ── Атака Вражеского Дрона ─────────────────────────────── */}
      {isUnderAttack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-md scanlines">
          <div className="w-full max-w-xs glass-panel-magenta rounded-3xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(252,129,129,0.4)] border-salmon/50">
            <div className="text-5xl animate-bounce">⚠️</div>
            <div>
              <h3 className="text-sm font-orbitron font-black text-cyber-magenta glow-magenta uppercase tracking-widest">
                ВТОРЖЕНИЕ В СЕТЬ
              </h3>
              <p className="text-xs text-white/60 mt-3 leading-relaxed font-mono">
                Вражеский дрон пытается украсть ваши монеты! Победите его в Neural Sync, чтобы защитить систему.
              </p>
            </div>
            <button onClick={() => { setIsUnderAttack(false); setShowNeuralSync(true); }}
              className="w-full py-4 font-bold text-sm rounded-2xl tracking-widest uppercase transition-all active:scale-95 text-white"
              style={{ background: "linear-gradient(135deg, #FC8181 0%, #B794F4 100%)", boxShadow: "0 0 25px rgba(252,129,129,0.5)" }}>
              🛡️ ОТБИТЬ АТАКУ
            </button>
          </div>
        </div>
      )}

      {/* ── Системный сбой (Glitch State) ─────────────────────────────── */}
      {isGlitched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md scanlines">
          <div className="w-full max-w-xs glass-panel-magenta rounded-3xl p-6 text-center space-y-4 shadow-[0_0_35px_rgba(252,129,129,0.25)] border-salmon/30">
            <div className="text-4xl animate-bounce">⚠️</div>
            <div>
              <h3 className="text-xs font-orbitron font-black text-cyber-magenta glow-magenta uppercase tracking-widest">
                Сбой Системы OS
              </h3>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                Критические показатели жизнеобеспечения питомца! Требуется экстренная перезагрузка ядра.
              </p>
            </div>
            <div className="space-y-2">
              <button onClick={handleRebootAd}
                className="w-full py-3.5 font-bold text-xs rounded-2xl tracking-widest uppercase transition-all active:scale-95 text-white"
                style={{ background: "linear-gradient(135deg, #FC8181 0%, #B794F4 100%)", boxShadow: "0 0 16px rgba(252,129,129,0.3)" }}>
                📺 Перезапуск за рекламу
              </button>
              <button onClick={handleRebootCoins}
                className="w-full py-2.5 font-mono text-[10px] rounded-2xl border border-white/08 bg-white/03 hover:bg-white/06 text-white/70 active:scale-95 transition-all">
                Сброс за 300 🪙
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Симуляция рекламы перезагрузки ────────────────────────────── */}
      {isWatchingRebootAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl scanlines">
          <div className="text-center space-y-4">
            <div className="text-4xl animate-spin">⚙️</div>
            <h3 className="font-orbitron text-xs font-black text-cyber-purple glow-purple uppercase tracking-widest">
              Сброс системных ядер...
            </h3>
            <p className="text-[9px] text-white/40 font-mono tracking-wider animate-pulse">
              ЗАГРУЗКА РЕЗЕРВНОЙ КОПИИ OS [3s]
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
