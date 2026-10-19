import React from 'react';
import { Film, Users, Heart, Share2, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  mode: 'duo' | 'party';
  onModeChange: (mode: 'duo' | 'party') => void;
  roomCode: string;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenRoulette?: () => void;
  onShareRoom: () => void;
  hasCopied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  roomCode,
  watchlistCount,
  onOpenWatchlist,
  onOpenRoulette,
  onShareRoom,
  hasCopied,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/20 overflow-hidden shrink-0">
            <img src="/icon.svg" alt="KinoMatch" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                KinoMatch
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                TMDB Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Кинокомпромисс для двоих и компаний</p>
          </div>
        </div>

        {/* Center: Mode toggle */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onModeChange('duo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'duo'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👫 На двоих</span>
          </button>
          <button
            onClick={() => onModeChange('party')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'party'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Вечеринка (3-5)</span>
          </button>
        </div>

        {/* Right actions: Room code & Watchlist */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShareRoom}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
            title="Скопировать ссылку на комнату"
          >
            {hasCopied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans text-xs hidden sm:inline">Скопировано!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">#{roomCode}</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 transition-colors"
            title="Отложенные фильмы"
          >
            <Heart className="w-4 h-4 fill-rose-500/20" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
