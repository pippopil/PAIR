import React from 'react';
import { Film, Sliders, BookOpen, Heart, Sparkles, Trophy } from 'lucide-react';

export type MainTabType = 'feed' | 'tastes' | 'diary';

interface NavigationTabsProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  matchesCount: number;
  vetoCount: number;
  diaryCount: number;
  unlockedBadgesCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
  vetoCount,
  diaryCount,
  unlockedBadgesCount,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800/80 sticky top-[61px] z-20 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between sm:justify-start gap-1 sm:gap-4 overflow-x-auto no-scrollbar py-2">
        {/* Tab 1: Feed */}
        <button
          type="button"
          onClick={() => onTabChange('feed')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Подборка кино</span>
          {matchesCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'feed'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {matchesCount}
            </span>
          )}
        </button>

        {/* Tab 2: Tastes & Veto */}
        <button
          type="button"
          onClick={() => onTabChange('tastes')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tastes'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Вкусы и ВЕТО</span>
          {vetoCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'tastes'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {vetoCount} табу
            </span>
          )}
        </button>

        {/* Tab 3: Diary & Achievements */}
        <button
          type="button"
          onClick={() => onTabChange('diary')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'diary'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Дневник & Награды</span>
          {diaryCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'diary'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {diaryCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
