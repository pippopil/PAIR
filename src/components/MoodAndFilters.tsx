import React, { useState } from 'react';
import { SessionFilterOptions } from '../types';
import { PLATFORMS_LIST } from '../data/catalog';
import {
  Sparkles,
  SlidersHorizontal,
  Clock,
  Tv,
  Calendar,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
} from 'lucide-react';

interface MoodAndFiltersProps {
  filters: SessionFilterOptions;
  onUpdateFilters: (filters: SessionFilterOptions) => void;
}

const QUICK_MOOD_PROMPTS = [
  'Мы хотим что-то легкое с Ди Каприо, но без драмы ✨',
  'Уютная теплая комедия после тяжелого рабочего дня 🛋️',
  'Захватывающий детектив с неожиданной развязкой до 2 часов 🔍',
  'Динамичный триллер с высоким темпом и юмором ⚡',
  'Красивая визуальная фантастика с глубоким смыслом 🚀',
  'Качественный мини-сериал на один вечер 📺',
];

export const MoodAndFilters: React.FC<MoodAndFiltersProps> = ({
  filters,
  onUpdateFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePlatform = (platformId: string) => {
    const current = filters.selectedPlatforms || [];
    const next = current.includes(platformId)
      ? current.filter((id) => id !== platformId)
      : [...current, platformId];
    onUpdateFilters({ ...filters, selectedPlatforms: next });
  };

  return (
    <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-5 border border-slate-800/80 space-y-4">
      {/* SECTION 1: Natural Language / Mood Query */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-400" />
            <span>Пожелание на сегодняшний вечер</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Умный парсер естественного языка
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={filters.moodPrompt}
            onChange={(e) => onUpdateFilters({ ...filters, moodPrompt: e.target.value })}
            placeholder="Например: 'Мы хотим что-то легкое с Ди Каприо, но без занудства' или 'Остросюжетный детектив до 100 минут'..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {filters.moodPrompt && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ ...filters, moodPrompt: '' })}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Quick prompt inspiration chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar text-xs">
          <span className="text-[11px] text-slate-500 shrink-0">Идеи:</span>
          {QUICK_MOOD_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onUpdateFilters({ ...filters, moodPrompt: prompt })}
              className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-amber-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Quick Filters Bar: Format & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        {/* Format */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
            Формат контента
          </span>
          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'Все' },
              { id: 'movie', label: 'Фильмы' },
              { id: 'series', label: 'Сериалы' },
              { id: 'animation', label: 'Мульты' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onUpdateFilters({ ...filters, targetType: f.id as any })}
                className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                  filters.targetType === f.id
                    ? 'bg-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
            Хронометраж
          </span>
          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'any', label: 'Любой' },
              { id: 'under90', label: '< 90 мин' },
              { id: 'under120', label: '< 2 ч' },
              { id: 'over120', label: '2 ч +' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onUpdateFilters({ ...filters, durationLimit: d.id as any })}
                className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                  filters.durationLimit === d.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            {showAdvanced ? 'Скрыть стриминги и доп. фильтры' : 'Стриминги (где смотреть) и эпоха'}
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-4">
            {/* Streaming platforms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Ваши стриминговые подписки (где есть доступ):
                </span>
                {filters.selectedPlatforms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ ...filters, selectedPlatforms: [] })}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    Сбросить платформы
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS_LIST.map((platform) => {
                  const isChecked = filters.selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span>{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Era filter & Exclude seen */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Эпоха:
                </span>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {[
                    { id: 'any', label: 'Любая' },
                    { id: 'fresh', label: '2020-2025' },
                    { id: '2010s', label: '2010-е' },
                    { id: 'classic', label: 'Классика' },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onUpdateFilters({ ...filters, era: e.id as any })}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        filters.era === e.id
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exclude seen */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={filters.excludeSeen}
                  onChange={(e) => onUpdateFilters({ ...filters, excludeSeen: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4"
                />
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Исключить уже просмотренные</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
