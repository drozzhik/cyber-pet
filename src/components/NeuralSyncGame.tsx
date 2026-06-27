"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────────────────────────────────────
type Lane = 0 | 1 | 2;

interface Note {
  id: number;
  lane: Lane;
  y: number;      // 0..100 (100 = зона удара внизу)
  speed: number;  // % в секунду
  hit: boolean;
  missed: boolean;
}

export interface GameResult {
  score: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  coinsEarned: number;
  funEarned: number;
}

interface Props {
  onClose: (result: GameResult | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// КОНСТАНТЫ
// ─────────────────────────────────────────────────────────────────────────────
const LANE_HEX   = ["#76E4F7", "#B794F4", "#F6AD55"] as const;
const LANE_LABEL = ["CYAN", "HOLO", "GOLD"] as const;
const LANE_KEY   = ["A", "S", "D"] as const;

const HIT_ZONE_Y  = 78;   // % — зона идеального попадания
const PERFECT_WIN = 8;    // ±% → PERFECT
const GOOD_WIN    = 18;   // ±% → GOOD
const TOTAL_TIME  = 30;   // секунды
const BASE_SPEED  = 26;   // % / сек

// ─────────────────────────────────────────────────────────────────────────────
// Генерация трека — список шаблонов нот (только lane + speed)
// ─────────────────────────────────────────────────────────────────────────────
function buildTrack() {
  const out: { id: number; lane: Lane; speed: number; spawnAt: number }[] = [];
  let t   = 0.9;
  let uid = 0;

  while (t < TOTAL_TIME - 1.5) {
    const lane = Math.floor(Math.random() * 3) as Lane;
    out.push({ id: uid++, lane, speed: BASE_SPEED + Math.random() * 10, spawnAt: t });

    if (Math.random() < 0.28) {
      const other = ((lane + 1 + Math.floor(Math.random() * 2)) % 3) as Lane;
      out.push({ id: uid++, lane: other, speed: BASE_SPEED + Math.random() * 10, spawnAt: t + 0.05 });
    }

    t += 0.55 + Math.random() * 0.55;
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Arc SVG Background
// ─────────────────────────────────────────────────────────────────────────────
function GameBg({ pulse }: { pulse: number }) {
  const a = 0.10 + pulse * 0.25;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(183,148,244,${a * 0.4}) 1px, transparent 1px), linear-gradient(90deg, rgba(183,148,244,${a * 0.4}) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 50% 85%, rgba(183,148,244,${a * 0.55}) 0%, transparent 55%)`,
      }} />
      {/* вертикальные полосы по дорожкам */}
      {[16, 50, 84].map((left, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px" style={{
          left: `${left}%`,
          background: `linear-gradient(to bottom, transparent 0%, ${LANE_HEX[i]}${Math.round((0.04 + pulse * 0.10) * 255).toString(16).padStart(2, "0")} 50%, transparent 100%)`,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback Label
// ─────────────────────────────────────────────────────────────────────────────
function FbLabel({ type, color }: { type: "PERFECT" | "GOOD" | "MISS"; color: string }) {
  const text = type === "PERFECT" ? "✦ PERFECT" : type === "GOOD" ? "● GOOD" : "✗ MISS";
  const c    = type === "PERFECT" ? "#F6AD55" : type === "GOOD" ? color : "#FC8181";
  return (
    <div className="absolute top-[62%] left-1/2 -translate-x-1/2 text-[11px] font-black tracking-wider pointer-events-none z-30 animate-bounce"
      style={{ color: c, textShadow: `0 0 12px ${c}` }}>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ГЛАВНЫЙ КОМПОНЕНТ
// ─────────────────────────────────────────────────────────────────────────────
export default function NeuralSyncGame({ onClose }: Props) {
  type Phase = "intro" | "playing" | "result";
  const [phase, setPhase] = useState<Phase>("intro");

  // ── Рендер-состояние (обновляется из rAF) ─────────────────────────────────
  const [renderNotes,  setRenderNotes]  = useState<Note[]>([]);
  const [renderTime,   setRenderTime]   = useState(TOTAL_TIME);
  const [renderScore,  setRenderScore]  = useState(0);
  const [renderCombo,  setRenderCombo]  = useState(0);
  const [renderPulse,  setRenderPulse]  = useState(0);
  const [laneFlash,    setLaneFlash]    = useState<boolean[]>([false, false, false]);
  const [feedback,     setFeedback]     = useState<{ lane: Lane; type: "PERFECT" | "GOOD" | "MISS" } | null>(null);
  const [result,       setResult]       = useState<GameResult | null>(null);

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adWatched, setAdWatched]       = useState(false);

  // ── Игровые данные целиком в ref (не вызывают ре-рендер) ──────────────────
  const notesRef     = useRef<Note[]>([]);
  const scoreRef     = useRef(0);
  const comboRef     = useRef(0);
  const maxComboRef  = useRef(0);
  const perfectRef   = useRef(0);
  const goodRef      = useRef(0);
  const missRef      = useRef(0);
  const timeLeftRef  = useRef(TOTAL_TIME);
  const pulseRef     = useRef(0);
  const lastTsRef    = useRef(0);
  const elapsedRef   = useRef(0);
  const trackRef     = useRef<ReturnType<typeof buildTrack>>([]);
  const trackIdxRef  = useRef(0);
  const rafRef       = useRef(0);
  const phaseRef     = useRef<Phase>("intro");

  // ─────────────────────────────────────────────────────────────────────────
  const resetRefs = () => {
    notesRef.current    = [];
    scoreRef.current    = 0;
    comboRef.current    = 0;
    maxComboRef.current = 0;
    perfectRef.current  = 0;
    goodRef.current     = 0;
    missRef.current     = 0;
    timeLeftRef.current = TOTAL_TIME;
    pulseRef.current    = 0;
    lastTsRef.current   = 0;
    elapsedRef.current  = 0;
    trackIdxRef.current = 0;
    trackRef.current    = buildTrack();
    setAdWatched(false);
  };

  const handleWatchAd = () => {
    const Adsgram = (window as any).Adsgram;
    const onSuccess = () => {
      setAdWatched(true);
      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          coinsEarned: prev.coinsEarned * 8
        };
      });
    };

    if (Adsgram) {
      const AdController = Adsgram.init({ blockId: "36421" });
      AdController.show().then(() => {
        onSuccess();
      }).catch((err: any) => {
        if (err?.error) {
          setIsWatchingAd(true);
          setTimeout(() => {
            setIsWatchingAd(false);
            onSuccess();
          }, 3000);
        } else {
          console.warn("Adsgram skipped:", err);
        }
      });
    } else {
      setIsWatchingAd(true);
      setTimeout(() => {
        setIsWatchingAd(false);
        onSuccess();
      }, 3000);
    }
  };

  const startGame = useCallback(() => {
    resetRefs();
    setRenderNotes([]);
    setRenderTime(TOTAL_TIME);
    setRenderScore(0);
    setRenderCombo(0);
    setRenderPulse(0);
    setFeedback(null);
    setResult(null);
    phaseRef.current = "playing";
    setPhase("playing");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Завершение ─────────────────────────────────────────────────────────────
  const finishGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    phaseRef.current = "result";

    // Урезаем базовую монетарную награду: в 10 раз меньше!
    const baseCoins = Math.round(scoreRef.current / 75 + maxComboRef.current);
    const coinsEarned = Math.max(5, baseCoins);
    const funEarned   = Math.min(100, perfectRef.current * 3 + goodRef.current);
    const r: GameResult = {
      score:       scoreRef.current,
      maxCombo:    maxComboRef.current,
      perfect:     perfectRef.current,
      good:        goodRef.current,
      miss:        missRef.current,
      coinsEarned,
      funEarned,
    };
    setResult(r);
    setPhase("result");
  }, []);

  // ── rAF игровой цикл ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = (ts: number) => {
      if (phaseRef.current !== "playing") return;

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05); // cap 50ms
      lastTsRef.current = ts;
      elapsedRef.current += dt;

      // Таймер
      timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
      if (timeLeftRef.current <= 0) { finishGame(); return; }

      // Спавним ноты по времени
      const track = trackRef.current;
      while (
        trackIdxRef.current < track.length &&
        track[trackIdxRef.current].spawnAt <= elapsedRef.current
      ) {
        const t = track[trackIdxRef.current];
        notesRef.current.push({ id: t.id, lane: t.lane, speed: t.speed, y: -10, hit: false, missed: false });
        trackIdxRef.current++;
      }

      // Двигаем ноты
      let newMisses = 0;
      notesRef.current = notesRef.current
        .map(n => {
          if (n.hit) return n;
          const ny = n.y + n.speed * dt;
          if (!n.missed && ny > HIT_ZONE_Y + GOOD_WIN + 5) {
            newMisses++;
            return { ...n, y: ny, missed: true };
          }
          return { ...n, y: ny };
        })
        .filter(n => n.y < 115);

      if (newMisses > 0) {
        missRef.current += newMisses;
        comboRef.current = 0;
      }

      // Затухание пульса
      pulseRef.current = Math.max(0, pulseRef.current - dt * 4);

      // Обновляем рендер ~60fps
      setRenderNotes([...notesRef.current]);
      setRenderTime(timeLeftRef.current);
      setRenderScore(scoreRef.current);
      setRenderCombo(comboRef.current);
      setRenderPulse(pulseRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, finishGame]);

  // ── Обработка нажатия ──────────────────────────────────────────────────────
  const hitLane = useCallback((lane: Lane) => {
    if (phaseRef.current !== "playing") return;

    // Вспышка кнопки
    setLaneFlash(prev => {
      const n = [...prev]; n[lane] = true; return n;
    });
    setTimeout(() => setLaneFlash(prev => { const n = [...prev]; n[lane] = false; return n; }), 110);

    // Ищем ближайшую ноту в зоне
    const cands = notesRef.current.filter(n => n.lane === lane && !n.hit && !n.missed);
    if (cands.length === 0) return;

    const best = cands.reduce((a, b) =>
      Math.abs(a.y - HIT_ZONE_Y) < Math.abs(b.y - HIT_ZONE_Y) ? a : b
    );

    const dist = Math.abs(best.y - HIT_ZONE_Y);

    let type: "PERFECT" | "GOOD" | null = null;
    if      (dist <= PERFECT_WIN) type = "PERFECT";
    else if (dist <= GOOD_WIN)    type = "GOOD";

    if (!type) return; // мимо зоны — не считаем

    // Помечаем ноту как ударенную
    notesRef.current = notesRef.current.map(n => n.id === best.id ? { ...n, hit: true } : n);

    // Обновляем статистику
    const pts = type === "PERFECT" ? 100 : 50;
    comboRef.current++;
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
    const mult = comboRef.current >= 20 ? 4 : comboRef.current >= 10 ? 3 : comboRef.current >= 5 ? 2 : 1;
    scoreRef.current += pts * mult;
    if (type === "PERFECT") perfectRef.current++; else goodRef.current++;

    pulseRef.current = 1;
    setFeedback({ lane, type });
    setTimeout(() => setFeedback(null), 550);

    // Тактильная отдача
    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  }, []);

  // ── Клавиатура ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toLowerCase() === "a") hitLane(0);
      if (e.key.toLowerCase() === "s") hitLane(1);
      if (e.key.toLowerCase() === "d") hitLane(2);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hitLane]);

  // ── Вспомогательные ───────────────────────────────────────────────────────
  const mult     = renderCombo >= 20 ? 4 : renderCombo >= 10 ? 3 : renderCombo >= 5 ? 2 : 1;
  const timePct  = (renderTime / TOTAL_TIME) * 100;
  const timeColor= timePct > 50 ? "#76E4F7" : timePct > 25 ? "#F6AD55" : "#FC8181";

  // ══════════════════════════════════════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
        <GameBg pulse={0.25} />
        <div className="relative z-10 w-full max-w-xs px-6 text-center space-y-7">
          <div className="text-5xl">🎵</div>
          <div>
            <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2" style={{ color: "#B794F4", textShadow: "0 0 20px rgba(183,148,244,0.6)" }}>
              Neural Sync
            </h2>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Нажимай по дорожке когда нота<br />достигает светящейся зоны внизу
            </p>
          </div>

          {/* Дорожки-превью */}
          <div className="flex justify-center gap-4">
            {LANE_HEX.map((hex, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm"
                  style={{ background: `${hex}18`, border: `2px solid ${hex}60`, color: hex, boxShadow: `0 0 14px ${hex}30` }}>
                  {LANE_KEY[i]}
                </div>
                <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: hex }}>{LANE_LABEL[i]}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={startGame}
              className="w-full py-4 font-black text-sm rounded-2xl tracking-widest uppercase transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #B794F4, #76E4F7)", color: "#050308", boxShadow: "0 0 24px rgba(183,148,244,0.45)" }}>
              ▶ Начать
            </button>
            <button onClick={() => onClose(null)}
              className="w-full py-2.5 text-[11px] font-semibold rounded-2xl transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // РЕЗУЛЬТАТ
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
    const total    = result.perfect + result.good + result.miss;
    const accuracy = total > 0 ? Math.round(((result.perfect + result.good * 0.5) / total) * 100) : 0;
    const rank     = accuracy >= 95 ? "S" : accuracy >= 80 ? "A" : accuracy >= 65 ? "B" : accuracy >= 50 ? "C" : "D";
    const rankColor= rank === "S" ? "#F6AD55" : rank === "A" ? "#76E4F7" : rank === "B" ? "#68D391" : rank === "C" ? "#B794F4" : "#FC8181";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
        <GameBg pulse={0.15} />
        <div className="relative z-10 w-full max-w-xs px-5 text-center space-y-5">

          {/* Ранг */}
          <div className="text-8xl font-black leading-none" style={{ color: rankColor, textShadow: `0 0 30px ${rankColor}80` }}>
            {rank}
          </div>

          <div>
            <h3 className="text-sm font-black tracking-widest uppercase text-white/80">Синхронизация завершена</h3>
            <p className="text-[10px] text-white/35 mt-1">Точность: {accuracy}%</p>
          </div>

          {/* Статистика */}
          <div className="rounded-2xl p-4 space-y-2.5 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40">Счёт</span>
              <span className="font-bold text-white">{result.score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40">Макс. комбо</span>
              <span className="font-bold" style={{ color: "#B794F4" }}>×{result.maxCombo}</span>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex justify-between text-[10px]">
              <span style={{ color: "#F6AD55" }}>✦ PERFECT: {result.perfect}</span>
              <span style={{ color: "#76E4F7" }}>● GOOD: {result.good}</span>
              <span style={{ color: "#FC8181" }}>✗ MISS: {result.miss}</span>
            </div>
          </div>

          {/* Награда */}
          <div className="flex gap-3 justify-center">
            {[
              { icon: "🪙", label: "Монеты", val: `+${result.coinsEarned}`, color: "#F6AD55" },
              { icon: "💜", label: "Радость", val: `+${result.funEarned}%`, color: "#B794F4" },
            ].map(r => (
              <div key={r.label} className="flex-1 rounded-2xl p-3 text-center" style={{ background: `${r.color}10`, border: `1px solid ${r.color}30` }}>
                <div className="text-xl">{r.icon}</div>
                <div className="text-[8px] text-white/35 mt-1">{r.label}</div>
                <div className="font-black text-sm mt-0.5" style={{ color: r.color }}>{r.val}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {!adWatched ? (
              <button onClick={handleWatchAd}
                className="w-full py-3 font-bold text-xs rounded-2xl tracking-widest uppercase transition-all active:scale-95 text-white"
                style={{ background: "linear-gradient(135deg, #FC8181 0%, #B794F4 100%)", boxShadow: "0 0 16px rgba(252,129,129,0.3)" }}>
                📺 Умножить награду 8x (🪙 +{result.coinsEarned * 8})
              </button>
            ) : (
              <div className="text-[9px] text-green-400 font-bold tracking-widest uppercase py-1 select-none animate-pulse">
                ✓ Награда умножена в 8 раз!
              </div>
            )}

            <button onClick={() => onClose(result)}
              className="w-full py-3 font-black text-xs rounded-2xl tracking-widest uppercase transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #B794F4, #76E4F7)", color: "#050308" }}>
              Забрать награду
            </button>
            <button onClick={startGame}
              className="w-full py-2 text-[10px] font-bold rounded-2xl tracking-widest uppercase transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              ↻ Играть снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Симуляция просмотра рекламы
  if (isWatchingAd) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl scanlines">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <h3 className="font-orbitron text-xs font-black text-cyber-purple glow-purple uppercase tracking-widest">
            Подключение к рекламному ядру...
          </h3>
          <p className="text-[9px] text-white/40 font-mono tracking-wider animate-pulse">
            СКАЧИВАНИЕ ПРОМО-БЛОКОВ ДАННЫХ [3s]
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ИГРА
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden" style={{ background: "#050308" }}>
      <GameBg pulse={renderPulse} />

      {/* ── HUD верхний ───────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div>
          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Score</div>
          <div className="text-xl font-black text-white tabular-nums">{renderScore.toLocaleString()}</div>
        </div>

        {/* Таймер-прогресс */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-2xl font-black tabular-nums leading-none"
            style={{ color: timeColor, textShadow: `0 0 14px ${timeColor}80` }}>
            {Math.ceil(renderTime)}
          </div>
          <div className="w-28 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${timePct}%`, background: timeColor, boxShadow: `0 0 6px ${timeColor}` }} />
          </div>
        </div>

        {/* Комбо */}
        <div className="text-right">
          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Combo</div>
          <div className="text-xl font-black tabular-nums transition-all"
            style={{
              color: renderCombo >= 20 ? "#F6AD55" : renderCombo >= 10 ? "#B794F4" : renderCombo >= 5 ? "#FC8181" : "rgba(255,255,255,0.5)",
              textShadow: renderCombo >= 5 ? "0 0 12px currentColor" : "none",
              transform: renderCombo > 0 ? "scale(1.1)" : "scale(1)",
            }}>
            {renderCombo > 0 ? `×${renderCombo}` : "—"}
          </div>
        </div>
      </div>

      {/* Множитель */}
      {mult > 1 && (
        <div className="relative z-20 text-center -mt-1 shrink-0">
          <span className="text-[9px] font-black tracking-widest px-3 py-0.5 rounded-full border"
            style={{
              color:        mult === 4 ? "#F6AD55" : mult === 3 ? "#B794F4" : "#FC8181",
              borderColor:  mult === 4 ? "#F6AD55" : mult === 3 ? "#B794F4" : "#FC8181",
              textShadow: "0 0 8px currentColor",
            }}>
            МНОЖИТЕЛЬ ×{mult}
          </span>
        </div>
      )}

      {/* ── Три дорожки ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex gap-2 px-4 pt-2 min-h-0">
        {([0, 1, 2] as Lane[]).map(lane => {
          const hex      = LANE_HEX[lane];
          const pressed  = laneFlash[lane];
          const lnNotes  = renderNotes.filter(n => n.lane === lane);

          return (
            <div key={lane} className="flex-1 flex flex-col min-h-0">
              {/* Поле дорожки */}
              <div
                className="flex-1 relative rounded-t-2xl overflow-hidden transition-all duration-75"
                style={{
                  background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${hex}06 100%)`,
                  border: `1px solid ${hex}${pressed ? "55" : "18"}`,
                  boxShadow: pressed ? `inset 0 0 20px ${hex}20` : "none",
                }}
              >
                {/* Осевая полоса */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 opacity-15"
                  style={{ background: hex }} />

                {/* Ноты */}
                {lnNotes.map(note => {
                  if (note.hit) return null;
                  return (
                    <div key={note.id} className="absolute left-1/2 -translate-x-1/2 rounded-xl transition-opacity"
                      style={{
                        top:    `${note.y}%`,
                        transform: "translate(-50%, -50%)",
                        width:  "68%",
                        height: "28px",
                        background: note.missed
                          ? "rgba(252,129,129,0.15)"
                          : `linear-gradient(135deg, ${hex}cc, ${hex}55)`,
                        border:  `1.5px solid ${note.missed ? "rgba(252,129,129,0.4)" : hex}`,
                        boxShadow: note.missed ? "none" : `0 0 12px ${hex}50`,
                        opacity: note.missed ? 0.25 : 1,
                      }} />
                  );
                })}

                {/* Зона попадания */}
                <div className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: `${HIT_ZONE_Y}%`, transform: "translateY(-50%)" }}>
                  <div className="w-full h-px" style={{
                    background: `linear-gradient(to right, transparent, ${hex}90, transparent)`,
                    boxShadow: `0 0 8px ${hex}60`,
                  }} />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
                    style={{ width: "32px", height: "32px", background: hex }} />
                </div>

                {/* Feedback */}
                {feedback && feedback.lane === lane && (
                  <FbLabel type={feedback.type} color={hex} />
                )}
              </div>

              {/* Кнопка дорожки */}
              <button
                onPointerDown={() => hitLane(lane)}
                className="shrink-0 h-14 rounded-b-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-75 active:scale-95 touch-none"
                style={{
                  background: pressed ? `${hex}28` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${pressed ? hex : hex + "25"}`,
                  boxShadow: pressed ? `0 0 20px ${hex}50` : "none",
                }}
              >
                <span className="font-black text-sm leading-none" style={{ color: pressed ? hex : "rgba(255,255,255,0.25)" }}>
                  {LANE_KEY[lane]}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: pressed ? hex + "cc" : "rgba(255,255,255,0.12)" }}>
                  {LANE_LABEL[lane]}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Выход */}
      <button onClick={() => onClose(null)}
        className="relative z-20 text-center py-3 shrink-0 text-[9px] font-semibold tracking-widest transition-all"
        style={{ color: "rgba(255,255,255,0.2)" }}>
        ESC — выйти без награды
      </button>
    </div>
  );
}
