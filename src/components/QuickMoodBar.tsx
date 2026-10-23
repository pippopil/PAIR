import React, { useState } from 'react';
import { SessionFilterOptions } from '../types';
import {
  Sparkles,
  Search,
  RotateCcw,
  Clock,
  Tv,
  Film,
  Dices,
  Flame,
  Check,
} from 'lucide-react';

interface QuickMoodBarProps {
  filters: SessionFilterOptions;
  onUpdateFilters: (filters: SessionFilterOptions) => void;
  onSearch: () => void;
  isLoading: boolean;
  onOpenRoulette: () => void;
  onOpenBlitz: () => void;
}

export const QuickMoodBar: React.FC<QuickMoodBarProps> = ({
  filters,
  onUpdateFilters,
  onSearch,
  isLoading,
  onOpenRoulette,
  onOpenBlitz,
}) => {
  const [isGeneratingMood, setIsGeneratingMood] = useState(false);
  const [highlightMood, setHighlightMood] = useState(false);

  const handleGenerateMood = async () => {
    setIsGeneratingMood(true);
    try {
      const res = await fetch('/api/generate-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentMood: filters.moodPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.prompt) {
          onUpdateFilters({ ...filters, moodPrompt: data.prompt });
          setHighlightMood(true);
          setTimeout(() => setHighlightMood(false), 2000);
        }
      }
    } catch (e) {
      console.warn('Mood generate error:', e);
    } finally {
      setIsGeneratingMood(false);
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
      {/* Search Input Row with AI Suggest button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.moodPrompt}
            onChange={(e) => onUpdateFilters({ ...filters, moodPrompt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            placeholder="Какое кино хочется сегодня? (напр. 'Захватывающий детектив с юмором')"
            className={`w-full bg-slate-950 border rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
              highlightMood
                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                : 'border-slate-800 focus:border-rose-500'
            }`}
          />
          {filters.moodPrompt && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ ...filters, moodPrompt: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggest Mood AI button */}
        <button
          type="button"
          onClick={handleGenerateMood}
          disabled={isGeneratingMood}
          className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:via-rose-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-md"
          title="Сгенерировать атмосферное пожелание"
        >
          <Sparkles className={`w-4 h-4 text-amber-400 ${isGeneratingMood ? 'animate-spin' : ''}`} />
          <span className="whitespace-nowrap">
            {isGeneratingMood ? 'Придумываем...' : 'Предложить настроение ✨'}
          </span>
        </button>

        {/* Big Search button */}
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Ищем...' : 'Подобрать'}</span>
        </button>
      </div>

      {/* Quick Filters Strip: Format & Duration & Games */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80 text-xs">
        {/* Quick Format filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: 'Все' },
            { id: 'movie', label: 'Фильмы' },
            { id: 'series', label: 'Сериалы' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onUpdateFilters({ ...filters, targetType: f.id as any });
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filters.targetType === f.id
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Quick Duration filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 hidden sm:flex">
          {[
            { id: 'any', label: 'Любая длина' },
            { id: 'under90', label: 'До 90м' },
            { id: 'under120', label: 'До 2ч' },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onUpdateFilters({ ...filters, durationLimit: d.id as any })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filters.durationLimit === d.id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Fast Decision Helpers: Roulette & Blitz */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto pt-1 sm:pt-0">
          <button
            type="button"
            onClick={onOpenRoulette}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Случайный выбор из лучших"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Рулетка 🎰</span>
          </button>

          <button
            type="button"
            onClick={onOpenBlitz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Блиц-голосование на двоих"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Блиц 🔥</span>
          </button>
        </div>
      </div>
    </div>
  );
};
