import React, { useState, useEffect } from 'react';
import { MovieRecommendation } from '../types';
import { X, Dices, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: MovieRecommendation[];
  onSelectWinner: (movie: MovieRecommendation) => void;
}

export const RouletteModal: React.FC<RouletteModalProps> = ({
  isOpen,
  onClose,
  movies,
  onSelectWinner,
}) => {
  if (!isOpen) return null;

  const candidates = movies.slice(0, 8);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [winner, setWinner] = useState<MovieRecommendation | null>(null);

  const spin = () => {
    if (candidates.length < 2 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    let speed = 60;
    let current = selectedIndex;
    let spinsCount = 0;
    const totalSpins = 28 + Math.floor(Math.random() * 8);

    const step = () => {
      current = (current + 1) % candidates.length;
      setSelectedIndex(current);
      spinsCount++;

      if (spinsCount < totalSpins) {
        if (spinsCount > totalSpins - 10) {
          speed += 35; // deceleration
        }
        setTimeout(step, speed);
      } else {
        setIsSpinning(false);
        setWinner(candidates[current]);
      }
    };

    setTimeout(step, speed);
  };

  useEffect(() => {
    if (isOpen) {
      setWinner(null);
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-100">
                Кинорулетка компромисса 🎰
              </h3>
              <p className="text-xs text-slate-400">
                Доверьте финальный выбор случаю из ваших лучших совпадений!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roulette Display Wheel / Carousel */}
        <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
          {/* Pointer indicator */}
          <div className="absolute -top-3 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-amber-400 filter drop-shadow(0 2px 4px rgba(251,191,36,0.6))" />

          {/* Active Movie Item */}
          {candidates[selectedIndex] && (
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all">
              <img
                src={candidates[selectedIndex].posterUrl}
                alt={candidates[selectedIndex].title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.tried) {
                    target.dataset.tried = 'true';
                    fetch(`/api/movies/poster?title=${encodeURIComponent(candidates[selectedIndex].title)}`)
                      .then((r) => r.json())
                      .then((d) => { if (d.posterUrl) target.src = d.posterUrl; })
                      .catch(() => {});
                  }
                }}
                className={`w-28 sm:w-32 aspect-[2/3] object-cover rounded-xl shadow-xl transition-all duration-200 bg-slate-900 ${
                  isSpinning
                    ? 'scale-95 blur-[0.6px] border border-amber-500'
                    : 'scale-100 border-2 border-amber-400 shadow-amber-500/30'
                }`}
              />
              <div className="space-y-1.5 max-w-xs">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {candidates[selectedIndex].overallMatchScore}% компромисс
                </span>
                <h4 className="font-heading font-black text-lg text-slate-100 leading-tight">
                  {candidates[selectedIndex].title}
                </h4>
                <p className="text-xs text-slate-400">
                  {candidates[selectedIndex].year} • {candidates[selectedIndex].genres.slice(0, 2).join(', ')}
                </p>
                <p className="text-xs text-slate-300 line-clamp-2 leading-snug">
                  {candidates[selectedIndex].description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Small candidate film strips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-center">
          {candidates.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => {
                if (!isSpinning) {
                  setSelectedIndex(idx);
                  setWinner(c);
                }
              }}
              className={`w-12 h-16 rounded-lg overflow-hidden shrink-0 border cursor-pointer transition-all ${
                selectedIndex === idx
                  ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={c.posterUrl} alt={c.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {winner ? (
            <div className="space-y-2">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">
                    Победитель рулетки: «{winner.title}»!
                  </span>
                </div>
                <button
                  onClick={() => {
                    onSelectWinner(winner);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                >
                  Смотрим! 🎉
                </button>
              </div>

              <button
                onClick={spin}
                disabled={isSpinning}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold"
              >
                Крутить ещё раз 🎲
              </button>
            </div>
          ) : (
            <button
              onClick={spin}
              disabled={isSpinning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-heading font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Колесо судьбы крутится...' : 'Крутить кинорулетку! 🎰'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
