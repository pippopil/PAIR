import React from 'react';
import { MovieRecommendation } from '../types';
import { X, Trash2, CheckCircle2, Film, ExternalLink, Share2 } from 'lucide-react';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: MovieRecommendation[];
  confirmedChoice: MovieRecommendation | null;
  onRemoveFromWatchlist: (id: string) => void;
  onSelectAsChoice: (movie: MovieRecommendation) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  confirmedChoice,
  onRemoveFromWatchlist,
  onSelectAsChoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-5 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h3 className="font-heading font-extrabold text-lg text-slate-100">
              Ваш кино-список ({watchlist.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed choice banner if any */}
        {confirmedChoice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
              🎉 Выбор вечера:
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-100">
                  {confirmedChoice.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {confirmedChoice.year} • Матч {confirmedChoice.overallMatchScore}%
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                Смотрим!
              </span>
            </div>
          </div>
        )}

        {/* Watchlist content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Film className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">В списке пока пусто.</p>
              <p className="text-[11px]">
                Нажимайте иконку закладки 📌 на карточках фильмов, чтобы сохранить их на потом.
              </p>
            </div>
          ) : (
            watchlist.map((movie) => (
              <div
                key={movie.id}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded-xl shrink-0 bg-slate-900 border border-slate-800"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.tried) {
                        target.dataset.tried = 'true';
                        fetch(`/api/movies/poster?title=${encodeURIComponent(movie.title)}`)
                          .then((r) => r.json())
                          .then((d) => { if (d.posterUrl) target.src = d.posterUrl; })
                          .catch(() => {});
                      }
                    }}
                  />
                  <div className="min-w-0">
                    <h5 className="font-heading font-bold text-xs text-slate-100 truncate">
                      {movie.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate">
                      {movie.year} • {movie.genres.slice(0, 2).join(', ')}
                    </p>
                    <span className="text-[10px] font-bold text-amber-400">
                      ★ {movie.ratingKp} • {movie.overallMatchScore}% компромисс
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectAsChoice(movie)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white text-[11px] font-bold transition-all"
                  >
                    Смотрим
                  </button>
                  <button
                    onClick={() => onRemoveFromWatchlist(movie.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Удалить из списка"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
