import React from 'react';
import {
  Film,
  Users,
  Heart,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  mode: 'duo' | 'party';
  onModeChange: (mode: 'duo' | 'party') => void;
  roomCode: string;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onShareRoom: () => void;
  hasCopied: boolean;
  pwaInstallSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  roomCode,
  watchlistCount,
  onOpenWatchlist,
  onShareRoom,
  hasCopied,
  pwaInstallSlot,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-4 py-2 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-center shadow-md shadow-rose-500/20 overflow-hidden shrink-0">
            <img src="/icon.svg" alt="KinoMatch" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                KinoMatch
              </span>
              <span className="hidden xs:inline-flex text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                AI Duo
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-xl text-[11px] sm:text-xs font-semibold shrink-0">
          <button
            onClick={() => onModeChange('duo')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'duo'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👫</span>
            <span className="hidden xs:inline">На двоих</span>
          </button>
          <button
            onClick={() => onModeChange('party')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'party'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Компания</span>
          </button>
        </div>

        {/* Right actions: PWA Install + Room Code & Watchlist */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {pwaInstallSlot}

          {/* Share room */}
          <button
            onClick={onShareRoom}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] sm:text-xs font-mono text-slate-300 transition-colors cursor-pointer"
            title="Поделиться и синхронизировать комнату"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">#{roomCode}</span>
          </button>

          {/* Watchlist */}
          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 transition-colors cursor-pointer shrink-0"
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
