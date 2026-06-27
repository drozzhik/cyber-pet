"use client";

import React, { useState, useEffect } from "react";

interface AdSimulationProps {
  onAdCompleted: (reward: number) => void;
}

export default function AdSimulation({ onAdCompleted }: AdSimulationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isPlaying && countdown === 0) {
      setIsPlaying(false);
      onAdCompleted(100);
      setCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, countdown, onAdCompleted]);

  const startAd = () => {
    const Adsgram = (window as any).Adsgram;
    if (Adsgram) {
      const AdController = Adsgram.init({ blockId: "36421" });
      AdController.show().then(() => {
        onAdCompleted(100);
      }).catch((err: any) => {
        console.error("Adsgram error or skipped:", err);
      });
    } else {
      // Фолбэк на симуляцию, если блокировщик рекламы заблокировал скрипт
      setIsPlaying(true);
      setCountdown(5);
    }
  };

  return (
    <>
      <button
        onClick={startAd}
        className="w-full py-3 bg-gradient-to-r from-cyber-magenta to-cyber-purple hover:from-cyber-magenta/90 hover:to-cyber-purple/90 text-white font-orbitron font-extrabold text-xs rounded-xl border border-cyber-magenta/50 transition-all duration-300 shadow-[0_0_12px_rgba(255,0,127,0.25)] hover:shadow-[0_0_18px_rgba(255,0,127,0.45)] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <span className="text-sm">📺</span> Смотреть рекламу (+100 🪙)
      </button>

      {isPlaying && (
        <div className="fixed inset-0 bg-cyber-bg/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 scanlines">
          {/* Киберпанк рамки на весь экран */}
          <div className="absolute inset-6 border border-cyber-magenta/15 rounded-3xl pointer-events-none" />
          <div className="absolute inset-8 border border-cyber-cyan/10 rounded-2xl pointer-events-none" />

          {/* Панель симулятора рекламы */}
          <div className="w-full max-w-sm bg-cyber-card/85 p-6 rounded-2xl border-glow-magenta flex flex-col items-center justify-center text-center space-y-5 shadow-[0_0_35px_rgba(255,0,127,0.15)] relative">
            
            <div className="absolute top-2.5 left-4 text-[8px] font-mono text-cyber-magenta/60 uppercase tracking-widest animate-pulse">
              SYS SCAN // AD PROTOCOL 0x5D
            </div>
            
            <div className="text-3xl animate-pulse mt-2">⚡</div>
            
            <h3 className="text-base font-orbitron font-black text-cyber-magenta tracking-widest uppercase glow-magenta">
              СКАНИРОВАНИЕ ИИ-ДАННЫХ
            </h3>
            
            <p className="text-[10px] font-mono text-gray-400 max-w-xs leading-relaxed">
              Загрузка рекламных фреймов от корпорации CyberNet и генерация +100 Core Coins в ваш кошелек...
            </p>

            {/* Бегущий терминал логов */}
            <div className="w-full bg-cyber-bg/95 border border-cyber-magenta/25 rounded p-3 font-mono text-[9px] text-left text-cyber-cyan/70 h-20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-bg pointer-events-none z-10" />
              <div className="animate-[scrollText_5s_linear_infinite] space-y-1 z-0">
                <p>&gt; CONNECTING TO PROTOCOL CLIENT...</p>
                <p>&gt; DOWNLOADING CORE PACK: 100 COINS</p>
                <p>&gt; DECRYPTING HOLOGRAPHIC ENCRYPTIONS...</p>
                <p>&gt; ALLOCATING MEMORY SECTORS...</p>
                <p>&gt; SYNCHRONIZING WITH TELEGRAM CLOUD...</p>
                <p>&gt; SECURITY SHIELD BYPASS: SUCCESS</p>
                <p>&gt; DECRYPTING AD SEGMENT 100%</p>
                <p>&gt; DEPOSIT PROTOCOL ENGAGED</p>
              </div>
            </div>

            {/* Круговой индикатор таймера */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-cyber-bg"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-cyber-magenta transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="213.5"
                  strokeDashoffset={213.5 - (213.5 * (5 - countdown)) / 5}
                />
              </svg>
              <span className="text-2xl font-orbitron font-black text-cyber-magenta glow-magenta">
                {countdown}
              </span>
            </div>

            <div className="text-[9px] font-mono text-cyber-magenta/60 tracking-wider">
              ПОЛУЧЕНИЕ НАГРАДЫ ЧЕРЕЗ {countdown} СЕК.
            </div>
          </div>

          <style jsx>{`
            @keyframes scrollText {
              0% { transform: translateY(0); }
              100% { transform: translateY(-70px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
