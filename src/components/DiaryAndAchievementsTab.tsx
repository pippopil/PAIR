import React, { useState } from 'react';
import { DiaryEntry, UserParticipant, AchievementBadge, MovieRecommendation } from '../types';
import {
  BookOpen,
  Trophy,
  Star,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Film,
  MessageSquare,
  Lock,
  Heart,
} from 'lucide-react';

interface DiaryAndAchievementsTabProps {
  diaryEntries: DiaryEntry[];
  achievements: AchievementBadge[];
  participants: UserParticipant[];
  onAddDiaryEntry: (entry: DiaryEntry) => void;
  onDeleteDiaryEntry: (id: string) => void;
  onOpenNewEntryModal: () => void;
}

export const DiaryAndAchievementsTab: React.FC<DiaryAndAchievementsTabProps> = ({
  diaryEntries,
  achievements,
  participants,
  onAddDiaryEntry,
  onDeleteDiaryEntry,
  onOpenNewEntryModal,
}) => {
  const [subTab, setSubTab] = useState<'diary' | 'badges'>('diary');

  const totalWatched = diaryEntries.length;
  const avgOverall =
    totalWatched > 0
      ? (
          diaryEntries.reduce((acc, curr) => acc + curr.averageRating, 0) / totalWatched
        ).toFixed(1)
      : '0.0';

  // Pair concordance (how close their ratings are)
  let pairConcordance = 95;
  if (totalWatched > 0 && participants.length >= 2) {
    const diffs: number[] = [];
    diaryEntries.forEach((e) => {
      const p1 = participants[0]?.id;
      const p2 = participants[1]?.id;
      if (e.ratings[p1] && e.ratings[p2]) {
        diffs.push(Math.abs(e.ratings[p1].rating - e.ratings[p2].rating));
      }
    });
    if (diffs.length > 0) {
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      pairConcordance = Math.max(60, Math.round(100 - avgDiff * 15));
    }
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="space-y-6">
      {/* Sub-tabs: Diary vs Badges */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('diary')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'diary'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Кинодневник ({totalWatched})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('badges')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'badges'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Достижения ({unlockedCount}/{achievements.length})</span>
          </button>
        </div>

        {subTab === 'diary' && (
          <button
            type="button"
            onClick={onOpenNewEntryModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить фильм</span>
          </button>
        )}
      </div>

      {subTab === 'diary' ? (
        <div className="space-y-5">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block">
                Сходство вкусов
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-heading">
                {pairConcordance}%
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block">
                Средняя оценка
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-heading">
                ★ {avgOverall}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block">
                Просмотрено вместе
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-heading">
                {totalWatched}
              </span>
            </div>
          </div>

          {/* List of Watched Movies */}
          <div className="space-y-3">
            {diaryEntries.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
                <Film className="w-10 h-10 text-slate-700 mx-auto" />
                <h4 className="font-heading font-bold text-slate-300 text-base">
                  Кинодневник пока пуст
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  После просмотра фильма отметьте его прямо на карточке «В дневник», чтобы сохранить оценки и впечатления.
                </p>
                <button
                  type="button"
                  onClick={onOpenNewEntryModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  Записать первый фильм
                </button>
              </div>
            ) : (
              diaryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex gap-4 items-start group hover:border-slate-700 transition-all shadow-md"
                >
                  <img
                    src={entry.posterUrl}
                    alt={entry.title}
                    className="w-16 sm:w-20 aspect-[2/3] object-cover rounded-2xl border border-slate-800 shrink-0 bg-slate-950"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-black text-base text-slate-100">
                          {entry.title}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">({entry.year})</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteDiaryEntry(entry.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Both ratings */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.values(entry.ratings).map((r, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                        >
                          <span>{r.avatar}</span>
                          <span>{r.name}:</span>
                          <span className="text-amber-400 font-black">★ {r.rating}</span>
                        </span>
                      ))}
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        Средний: {entry.averageRating}
                      </span>
                    </div>

                    {entry.coupleNotes && (
                      <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60 italic flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{entry.coupleNotes}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>Сеанс: {entry.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Badges Progress Bar */}
          <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Прогресс кино-пары:</span>
              <span className="text-amber-400 font-mono">
                {unlockedCount} из {achievements.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-3xl border flex items-center gap-3.5 transition-all ${
                  badge.unlocked
                    ? 'bg-slate-900/90 border-amber-500/30 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    badge.unlocked
                      ? 'bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {badge.unlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-black text-sm text-slate-100">
                      {badge.title}
                    </h4>
                    {badge.unlocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Открыто ✓
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-semibold">
                        В процессе
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                  {badge.unlockedAt && (
                    <span className="text-[10px] text-amber-400/80 mt-1 block">
                      Получено: {badge.unlockedAt}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
