"use client";

import React, { useState, useEffect } from "react";

interface DailyGiftProps {
  lastGiftSentTime: number | null;
  onSendGift: () => void;
}

export default function DailyGift({ lastGiftSentTime, onSendGift }: DailyGiftProps) {
  const [friendUsername, setFriendUsername] = useState("");
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

  useEffect(() => {
    if (!lastGiftSentTime) {
      setTimeLeftMs(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - lastGiftSentTime;
      const remaining = COOLDOWN_MS - elapsed;
      if (remaining <= 0) {
        setTimeLeftMs(0);
      } else {
        setTimeLeftMs(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastGiftSentTime]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const username = friendUsername.trim();
    if (!username) {
      setErrorMsg("Укажите логин получателя");
      return;
    }

    const cleanUsername = username.startsWith("@") ? username : `@${username}`;
    if (cleanUsername.length < 4) {
      setErrorMsg("Неверный логин Telegram (минимум 3 символа)");
      return;
    }

    onSendGift();
    setSuccessMsg(`Нейро-подарок отправлен другу ${cleanUsername}!`);
    setFriendUsername("");
  };

  const formatTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const isOnCooldown = timeLeftMs > 0;

  return (
    <div className="w-full max-w-sm mx-auto p-5 glass-panel border-glow-cyan flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-cyber-purple text-white font-mono text-[9px] font-extrabold px-2 py-0.5 tracking-widest rounded-bl-lg uppercase">
        Social
      </div>

      <h2 className="text-base font-orbitron font-extrabold text-cyber-cyan tracking-wider uppercase mb-3 pb-2 border-b border-cyber-cyan/15 glow-cyan">
        🎁 Социальный Подарок
      </h2>

      {isOnCooldown ? (
        <div className="flex flex-col items-center justify-center py-3 space-y-2">
          <div className="text-3xl animate-bounce">⏳</div>
          <p className="text-[10px] font-mono text-center text-gray-400">
            Канал обмена данными перегружен. Следующая отправка доступна через:
          </p>
          <div className="px-5 py-2 bg-cyber-bg/95 border border-cyber-cyan/35 rounded-xl">
            <span className="text-xl font-orbitron font-black text-cyber-cyan tracking-widest glow-cyan font-mono animate-pulse">
              {formatTime(timeLeftMs)}
            </span>
          </div>
          <p className="text-[8px] font-mono text-cyber-cyan/40 uppercase tracking-widest mt-1">
            [ Синхронизация: 24h Кулдаун ]
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          <p className="text-[10px] font-mono text-gray-300 leading-normal">
            Вы можете бесплатно отправить подарок другу один раз в 24 часа. Это порадует его питомца!
          </p>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-cyber-cyan/50 text-xs">
              @
            </span>
            <input
              type="text"
              placeholder="username_друга"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value.replace(/\s+/g, ""))}
              className="w-full pl-8 pr-4 py-2 bg-cyber-bg/75 border border-cyber-cyan/25 rounded-xl font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan/55 transition-all duration-300"
            />
          </div>

          {errorMsg && (
            <p className="text-[9px] font-mono text-cyber-magenta bg-cyber-magenta/5 border border-cyber-magenta/20 p-2 rounded">
              ⚠️ {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:from-cyber-cyan/90 hover:to-cyber-purple/90 text-cyber-bg font-orbitron font-extrabold text-xs rounded-xl border border-cyber-cyan/40 transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_15px_rgba(0,240,255,0.35)] active:scale-[0.98] uppercase tracking-wider"
          >
            Отправить нейро-подарок
          </button>
        </form>
      )}

      {successMsg && (
        <div className="mt-3 p-2 bg-cyber-purple/10 border border-cyber-purple/35 rounded text-[9px] font-mono text-center text-cyber-purple animate-pulse">
          ✨ {successMsg}
        </div>
      )}
    </div>
  );
}
