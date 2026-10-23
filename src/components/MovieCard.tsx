import React, { useState } from 'react';
import { MovieRecommendation, UserParticipant } from '../types';
import { CompromiseMatchMeter } from './CompromiseMatchMeter';
import { getTriggerReportForMovie } from '../data/triggers';
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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  BookOpen,
} from 'lucide-react';

interface MovieCardProps {
  movie: MovieRecommendation;
  isBookmarked: boolean;
  isCurrentChoice: boolean;
  participants?: UserParticipant[];
  activeParticipantId?: string;
  userRatings?: Record<string, number>;
  onSelectAsChoice: (movie: MovieRecommendation) => void;
  onToggleBookmark: (movie: MovieRecommendation) => void;
  onApplyInstantVeto: (movie: MovieRecommendation) => void;
  onRateMovie?: (movie: MovieRecommendation, participantId: string, rating: number) => void;
  onAddToDiary?: (movie: MovieRecommendation) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isBookmarked,
  isCurrentChoice,
  participants = [],
  activeParticipantId,
  userRatings = {},
  onSelectAsChoice,
  onToggleBookmark,
  onApplyInstantVeto,
  onRateMovie,
  onAddToDiary,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const triggers = movie.triggers || getTriggerReportForMovie(movie);

  const currentViewer =
    participants.find((p) => p.id === activeParticipantId) || participants[0];

  const currentViewerRating = currentViewer ? userRatings[currentViewer.id] || 0 : 0;

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
                const target = e.target as HTMLImageElement;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  fetch(`/api/movies/poster?title=${encodeURIComponent(movie.title)}&originalTitle=${encodeURIComponent(movie.originalTitle || '')}`)
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.posterUrl) target.src = d.posterUrl;
                    })
                    .catch(() => {});
                }
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
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* Type and tags */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                  {movie.type === 'series'
                    ? '📺 Сериал'
                    : movie.type === 'animation'
                    ? '🎨 Мультфильм'
                    : '🎬 Фильм'}
                </span>
                <span className="text-slate-400 text-xs font-mono">{movie.year}</span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{movie.duration}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-heading font-black text-lg sm:text-2xl text-slate-100 leading-tight">
                {movie.title}
              </h3>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-xs text-slate-400 italic mb-2">{movie.originalTitle}</p>
              )}

              {/* Genres */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-[11px] font-semibold text-slate-300 border border-slate-700/60"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Director & Cast */}
              <div className="mt-3 text-xs text-slate-400 space-y-0.5 hidden sm:block">
                <p className="truncate">
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

        {/* 5-STAR RATING SCALE: Direct interactive rating */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Оценка пары:</span>
              </span>
              {currentViewer && (
                <span className="text-[11px] font-semibold text-rose-300 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {currentViewer.avatar} {currentViewer.name}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Поставьте оценку от 1 до 5 звёзд прямо здесь
            </p>
          </div>

          {/* Interactive Star Buttons */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = (hoverRating || currentViewerRating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => {
                    if (currentViewer && onRateMovie) {
                      onRateMovie(movie, currentViewer.id, star);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 transition-all active:scale-90 cursor-pointer"
                  title={`Оценить на ${star} звёзд`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      isFilled
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow(0 0 6px rgba(251,191,36,0.6))'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  />
                </button>
              );
            })}

            {currentViewerRating > 0 && (
              <span className="text-xs font-black text-amber-400 font-mono ml-1.5">
                {currentViewerRating}.0
              </span>
            )}
          </div>
        </div>

        {/* Both Viewers Star Ratings Breakdown if rated */}
        {Object.keys(userRatings).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 text-[11px] font-bold">Оценки зрителей:</span>
            {participants.map((p) => {
              const r = userRatings[p.id];
              if (!r) return null;
              return (
                <span
                  key={p.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 font-semibold text-[11px]"
                >
                  <span>{p.avatar} {p.name}:</span>
                  <span className="text-amber-400 font-black">★ {r}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Compromise Meter Section */}
        <CompromiseMatchMeter
          overallScore={movie.overallMatchScore}
          matchBreakdown={movie.matchBreakdown}
          compromiseRationale={movie.compromiseRationale}
          vetoStatus={movie.vetoStatus}
        />

        {/* TRIGGER & SAFETY DETECTOR EXPANDABLE DRAWER */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
          <button
            type="button"
            onClick={() => setShowTriggers(!showTriggers)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors hover:bg-slate-900/50"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Детектор триггеров и безопасности (DoesTheDogDie)</span>
            </div>
            {showTriggers ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showTriggers && (
            <div className="p-3.5 pt-1 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>🐾 Животные:</span>
                    <span className="text-emerald-400 font-semibold">В безопасности</span>
                  </span>
                  <p className="text-[11px] text-slate-400">{triggers.petsNote}</p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>⚡ Скримеры и стробоскоп:</span>
                    <span
                      className={`font-semibold ${
                        triggers.jumpScaresLevel === 'none'
                          ? 'text-emerald-400'
                          : triggers.jumpScaresLevel === 'low'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {triggers.jumpScaresLevel === 'none'
                        ? 'Отсутствуют'
                        : triggers.jumpScaresLevel === 'low'
                        ? 'Минимальные'
                        : 'Умеренные'}
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-400">{triggers.jumpScaresNote}</p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>💔 Психологический тон:</span>
                  </span>
                  <p className="text-[11px] text-slate-400">{triggers.emotionalTone}</p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>🩸 Уровень жестокости:</span>
                    <span className="text-emerald-400 font-semibold">{triggers.violenceNote}</span>
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {triggers.hasHappyEnding ? '✨ Комфортный финал без безысходности' : 'Драматический финал'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 w-full">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onSelectAsChoice(movie)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg cursor-pointer ${
                isCurrentChoice
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-500/20 active:scale-95'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{isCurrentChoice ? 'Выбрано ✓' : 'Смотрим этот! 🎉'}</span>
            </button>

            {onAddToDiary && (
              <button
                type="button"
                onClick={() => onAddToDiary(movie)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-amber-300 font-semibold transition-colors cursor-pointer"
                title="Добавить в Кинодневник пары"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">В дневник</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition-colors"
              title="Поделиться рекомендацией"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{copiedShare ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>

          {/* Quick veto for this title */}
          <button
            type="button"
            onClick={() => onApplyInstantVeto(movie)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Исключить этот фильм и больше не предлагать"
          >
            <ShieldBan className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="whitespace-nowrap">Вето на фильм 🚫</span>
          </button>
        </div>
      </div>
    </article>
  );
};
