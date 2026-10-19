import React from 'react';
import { MatchBreakdownItem } from '../types';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface CompromiseMatchMeterProps {
  overallScore: number;
  matchBreakdown: MatchBreakdownItem[];
  compromiseRationale: string;
  vetoStatus?: {
    isSafe: boolean;
    violatedVeto?: string;
    guaranteeNote: string;
  };
}

export const CompromiseMatchMeter: React.FC<CompromiseMatchMeterProps> = ({
  overallScore,
  matchBreakdown,
  compromiseRationale,
  vetoStatus,
}) => {
  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 88) return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-400' };
    if (score >= 78) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30', gradient: 'from-amber-500 to-orange-400' };
    return { text: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/30', gradient: 'from-blue-500 to-indigo-400' };
  };

  const overallColors = getScoreColor(overallScore);

  return (
    <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-inner flex flex-col gap-3.5">
      {/* Top row: Overall Score gauge & badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
            <span className={`font-heading font-black text-xl tracking-tight ${overallColors.text}`}>
              {overallScore}%
            </span>
            <div
              className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-emerald-500 border-r-teal-500 animate-pulse pointer-events-none opacity-40"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Шкала компромисса
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                {overallScore >= 88 ? 'Идеальный матч' : overallScore >= 78 ? 'Отличный баланс' : 'Хороший компромисс'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
              Подходит обоим без споров
            </p>
          </div>
        </div>

        {/* Veto safe badge */}
        {vetoStatus && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Вето соблюдено (0 табу)</span>
          </div>
        )}
      </div>

      {/* Progress meter bar */}
      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${overallColors.gradient} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(10, overallScore))}%` }}
        />
      </div>

      {/* Breakdown per participant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
        {matchBreakdown.map((item, idx) => {
          const itemColor = getScoreColor(item.score);
          return (
            <div
              key={item.participantId || idx}
              className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/70 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-200 truncate pr-2">
                  {item.participantName}
                </span>
                <span className={`font-mono font-bold ${itemColor.text}`}>
                  {item.score}% матч
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>

      {/* Compromise explanation text */}
      {compromiseRationale && (
        <div className="flex items-start gap-2 bg-gradient-to-r from-rose-950/20 via-slate-900 to-indigo-950/20 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200">Почему именно этот выбор: </span>
            <span className="text-slate-300">{compromiseRationale}</span>
          </div>
        </div>
      )}
    </div>
  );
};
