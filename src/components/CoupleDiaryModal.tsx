import React, { useState } from 'react';
import { DiaryEntry, UserParticipant, MovieRecommendation } from '../types';
import {
  BookOpen,
  X,
  Star,
  Calendar,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Film,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

interface CoupleDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  participants: UserParticipant[];
  onAddEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  pendingMovieToAdd?: MovieRecommendation | null;
  onClearPendingMovie?: () => void;
}

export const CoupleDiaryModal: React.FC<CoupleDiaryModalProps> = ({
  isOpen,
  onClose,
  entries,
  participants,
  onAddEntry,
  onDeleteEntry,
  pendingMovieToAdd,
  onClearPendingMovie,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newPoster, setNewPoster] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [ratingsState, setRatingsState] = useState<Record<string, number>>({});

  // Auto-populate form if pendingMovieToAdd is provided
  React.useEffect(() => {
    if (pendingMovieToAdd) {
      setNewTitle(pendingMovieToAdd.title);
      setNewYear(pendingMovieToAdd.year);
      setNewPoster(pendingMovieToAdd.posterUrl);
      setShowAddForm(true);
      // Pre-fill ratings from movie card if present
      const initRatings: Record<string, number> = {};
      participants.forEach((p) => {
        initRatings[p.id] = 5;
      });
      setRatingsState(initRatings);
    }
  }, [pendingMovieToAdd, participants]);

  if (!isOpen) return null;

  // Analytics calculation
  const totalWatched = entries.length;
  const avgOverall =
    totalWatched > 0
      ? (
          entries.reduce((acc, curr) => acc + curr.averageRating, 0) / totalWatched
        ).toFixed(1)
      : '0.0';

  // Pair concordance (how close their ratings are)
  let pairConcordance = 95;
  if (totalWatched > 0 && participants.length >= 2) {
    const diffs: number[] = [];
    entries.forEach((e) => {
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

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedRatings: Record<string, { rating: number; name: string; avatar: string }> = {};
    let sum = 0;
    let count = 0;

    participants.forEach((p) => {
      const r = ratingsState[p.id] || 5;
      formattedRatings[p.id] = { rating: r, name: p.name, avatar: p.avatar };
      sum += r;
      count++;
    });

    const averageRating = count > 0 ? Number((sum / count).toFixed(1)) : 5;

    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      movieId: pendingMovieToAdd?.id || `custom-${Date.now()}`,
      title: newTitle.trim(),
      posterUrl:
        newPoster ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      year: newYear,
      genres: pendingMovieToAdd?.genres || ['Кино'],
      date: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      }),
      ratings: formattedRatings,
      averageRating,
      coupleNotes: newNotes.trim() || undefined,
    };

    onAddEntry(newEntry);
    setNewTitle('');
    setNewNotes('');
    setNewPoster('');
    setShowAddForm(false);
    if (onClearPendingMovie) onClearPendingMovie();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Кинодневник для двоих</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                  {totalWatched} просмотрено
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                История ваших совместных вечеров и статистика вкусов пары
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onClearPendingMovie) onClearPendingMovie();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Top Bar */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Сходство оценок
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-heading">
              {pairConcordance}%
            </span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Средний балл пары
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-heading">
              ★ {avgOverall}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Фильмов в архиве
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400 font-heading">
              {totalWatched}
            </span>
          </div>
        </div>

        {/* Add Entry Button / Form Toggle */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Записать просмотренный фильм</span>
          </button>
        ) : (
          <form
            onSubmit={handleSaveEntry}
            className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                Добавить фильм в дневник:
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  if (onClearPendingMovie) onClearPendingMovie();
                }}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Отмена
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название фильма *"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                placeholder="Год"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Rating sliders / buttons for each partner */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block">
                Оценки каждого зрителя (1-5 звёзд):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {participants.map((p) => {
                  const rating = ratingsState[p.id] || 5;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <span>{p.avatar}</span>
                        <span>{p.name}:</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setRatingsState((prev) => ({ ...prev, [p.id]: star }))
                            }
                            className="p-0.5 text-slate-600 hover:text-amber-400 cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                rating >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Ваши совместные впечатления или заметка о вечере..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-heading font-black text-xs shadow-md cursor-pointer"
            >
              Сохранить в дневник ✨
            </button>
          </form>
        )}

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[48vh]">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Film className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-xs">Вы ещё не сохранили ни одного сеанса.</p>
              <p className="text-[11px] text-slate-600">
                Нажмите «В дневник» на карточке любого фильма после просмотра!
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-start group hover:border-slate-700 transition-colors"
              >
                <img
                  src={entry.posterUrl}
                  alt={entry.title}
                  className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-900"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-heading font-bold text-sm text-slate-100">
                        {entry.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({entry.year})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ratings by each partner */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.values(entry.ratings).map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
                      >
                        <span>{r.avatar}</span>
                        <span>{r.name}:</span>
                        <span className="text-amber-400 font-bold">★ {r.rating}</span>
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold">
                      Среднее: {entry.averageRating}
                    </span>
                  </div>

                  {entry.coupleNotes && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/50 italic flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{entry.coupleNotes}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    <span>Сеанс: {entry.date}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
