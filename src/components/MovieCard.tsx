import React, { useState } from 'react';
import { MovieRecommendation } from '../types';
import { CompromiseMatchMeter } from './CompromiseMatchMeter';
import {
  Star,
  Clock,
  Tv,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  ShieldBan,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface MovieCardProps {
  movie: MovieRecommendation;
  isBookmarked: boolean;
  isCurrentChoice: boolean;
  onSelectAsChoice: (movie: MovieRecommendation) => void;
  onToggleBookmark: (movie: MovieRecommendation) => void;
  onApplyInstantVeto: (movie: MovieRecommendation) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isBookmarked,
  isCurrentChoice,
  onSelectAsChoice,
  onToggleBookmark,
  onApplyInstantVeto,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    const text = `🍿 Наш идеальный фильм в KinoMatch: «${movie.title}» (${movie.year}) — Совместимость ${movie.overallMatchScore}%! ${movie.description}`;
    navigator.clipboard?.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const getPlatformStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('кинопоиск')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (lower.includes('okko')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    if (lower.includes('иви')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (lower.includes('netflix')) return 'bg-red-600/20 text-red-300 border-red-500/30';
    if (lower.includes('apple')) return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    if (lower.includes('premier')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <article
      className={`relative bg-slate-900/90 rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isCurrentChoice
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner on Current Choice */}
      {isCurrentChoice && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          <span>Выбор вечера подтвержден! Приятного просмотра 🍿</span>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-5">
        {/* Top Header row: Poster + Title + Ratings */}
        <div className="flex gap-4 sm:gap-6">
          {/* Poster */}
          <div className="relative w-28 sm:w-36 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback poster on image load error
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
              }}
            />
            {movie.ageRating && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-slate-200 border border-white/10">
                {movie.ageRating}
              </span>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center">
              <span className="px-2 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-amber-500/20">
                ★ {movie.ratingKp || movie.ratingImdb || 8.0}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-100 leading-tight">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {movie.originalTitle} • {movie.year}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(movie)}
                  className={`p-2 rounded-xl border transition-all ${
                    isBookmarked
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={isBookmarked ? 'В списке' : 'Сохранить в список'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 fill-rose-500" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Meta pills: Duration & Genres */}
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                <span className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{movie.duration}</span>
                </span>

                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-[11px] font-medium text-slate-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Cast & Director */}
              <div className="mt-2.5 text-xs text-slate-400 space-y-0.5 hidden sm:block">
                <p>
                  <span className="text-slate-500">Режиссёр:</span>{' '}
                  <span className="text-slate-300 font-medium">{movie.director}</span>
                </p>
                <p className="truncate">
                  <span className="text-slate-500">В ролях:</span>{' '}
                  <span className="text-slate-300 font-medium">
                    {movie.cast.slice(0, 4).join(', ')}
                  </span>
                </p>
              </div>
            </div>

            {/* Available streaming platforms */}
            <div className="mt-3 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                Где посмотреть прямо сейчас:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(movie.availablePlatforms || []).map((p) => (
                  <span
                    key={p.name}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${getPlatformStyle(
                      p.name
                    )}`}
                  >
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
          {movie.description}
        </p>

        {/* Compromise Meter Section */}
        <CompromiseMatchMeter
          overallScore={movie.overallMatchScore}
          matchBreakdown={movie.matchBreakdown}
          compromiseRationale={movie.compromiseRationale}
          vetoStatus={movie.vetoStatus}
        />

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectAsChoice(movie)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
                isCurrentChoice
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-500/20 active:scale-95'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCurrentChoice ? 'Выбрано для просмотра ✓' : 'Смотрим этот! 🎉'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition-colors"
              title="Поделиться рекомендацией"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{copiedShare ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>

          {/* Quick veto for this title */}
          <button
            type="button"
            onClick={() => onApplyInstantVeto(movie)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors"
            title="Исключить этот фильм и больше не предлагать"
          >
            <ShieldBan className="w-3.5 h-3.5 text-rose-400" />
            <span>Вето на фильм 🚫</span>
          </button>
        </div>
      </div>
    </article>
  );
};
