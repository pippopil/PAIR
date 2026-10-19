import React from 'react';
import { AchievementBadge } from '../types';
import { Trophy, X, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: AchievementBadge[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Кино-достижения пары 🏆</span>
              </h3>
              <p className="text-xs text-slate-400">
                Открывайте бейджи за совместные просмотры, компромиссы и оценки!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Прогресс кино-пары:</span>
            <span className="text-amber-400 font-mono">
              {unlockedCount} из {achievements.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[52vh]">
          {achievements.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                badge.unlocked
                  ? 'bg-slate-950/80 border-amber-500/30 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-60'
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
    </div>
  );
};
