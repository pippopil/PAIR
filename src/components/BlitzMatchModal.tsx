import React, { useState } from 'react';
import { MovieRecommendation, UserParticipant } from '../types';
import {
  X,
  Heart,
  ThumbsDown,
  Sparkles,
  Trophy,
  ArrowRight,
  RefreshCw,
  Flame,
} from 'lucide-react';

interface BlitzMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: MovieRecommendation[];
  participants: UserParticipant[];
  onSelectFinalWinner: (movie: MovieRecommendation) => void;
}

export const BlitzMatchModal: React.FC<BlitzMatchModalProps> = ({
  isOpen,
  onClose,
  movies,
  participants,
  onSelectFinalWinner,
}) => {
  if (!isOpen) return null;

  // We only run blitz on the first 5 movies
  const blitzCandidates = movies.slice(0, 5);

  // Stage 0: Intro
  // Stage 1: Player 1 voting
  // Stage 2: Handover to Player 2
  // Stage 3: Player 2 voting
  // Stage 4: Results (Match check)
  const [stage, setStage] = useState<'intro' | 'p1' | 'handover' | 'p2' | 'results'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [p1Votes, setP1Votes] = useState<Record<string, boolean>>({});
  const [p2Votes, setP2Votes] = useState<Record<string, boolean>>({});

  const p1 = participants[0] || { name: 'Участник 1', avatar: '👨‍💻' };
  const p2 = participants[1] || { name: 'Участник 2', avatar: '👩‍🎨' };

  const handleVote = (vote: boolean) => {
    const currentMovie = blitzCandidates[currentIndex];
    if (!currentMovie) return;

    if (stage === 'p1') {
      const nextVotes = { ...p1Votes, [currentMovie.id]: vote };
      setP1Votes(nextVotes);
      if (currentIndex + 1 < blitzCandidates.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Go to handover
        setCurrentIndex(0);
        setStage('handover');
      }
    } else if (stage === 'p2') {
      const nextVotes = { ...p2Votes, [currentMovie.id]: vote };
      setP2Votes(nextVotes);
      if (currentIndex + 1 < blitzCandidates.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finished both, calculate match
        setStage('results');
      }
    }
  };

  // Matched movies where both said YES
  const matchedMovies = blitzCandidates.filter(
    (m) => p1Votes[m.id] === true && p2Votes[m.id] === true
  );

  const resetBlitz = () => {
    setStage('intro');
    setCurrentIndex(0);
    setP1Votes({});
    setP2Votes({});
  };

  const currentMovie = blitzCandidates[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-950/50 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* INTRO SCREEN */}
        {stage === 'intro' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Flame className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-heading font-black text-2xl text-slate-100">
                Блиц-раунд на двоих 🔥
              </h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Тайное голосование по 5 лучшим компромиссным фильмам. Сначала голосует {p1.name}, затем передаёт телефон {p2.name}. Если оба нажали «Хочу» — это БИНГО!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xl">{p1.avatar}</span>
                <span className="text-xs font-bold text-slate-200">{p1.name}</span>
              </div>
              <span className="text-rose-500 font-extrabold text-xs">VS</span>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xl">{p2.avatar}</span>
                <span className="text-xs font-bold text-slate-200">{p2.name}</span>
              </div>
            </div>

            <button
              onClick={() => setStage('p1')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Начать раунд с {p1.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VOTING SCREEN (P1 OR P2) */}
        {(stage === 'p1' || stage === 'p2') && currentMovie && (
          <div className="space-y-4">
            {/* Turn badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{stage === 'p1' ? p1.avatar : p2.avatar}</span>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400 block">
                    Голосует
                  </span>
                  <span className="font-bold text-xs text-slate-100">
                    {stage === 'p1' ? p1.name : p2.name}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {currentIndex + 1} из {blitzCandidates.length}
              </span>
            </div>

            {/* Movie card to vote on */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col sm:flex-row gap-4 p-4">
              <img
                src={currentMovie.posterUrl}
                alt={currentMovie.title}
                className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl shrink-0 mx-auto sm:mx-0 shadow bg-slate-900 border border-slate-800"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.tried) {
                    target.dataset.tried = 'true';
                    fetch(`/api/movies/poster?title=${encodeURIComponent(currentMovie.title)}`)
                      .then((r) => r.json())
                      .then((d) => { if (d.posterUrl) target.src = d.posterUrl; })
                      .catch(() => {});
                  }
                }}
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-extrabold text-base text-slate-100">
                      {currentMovie.title}
                    </h4>
                    <span className="text-xs font-bold text-amber-400">
                      ★ {currentMovie.ratingKp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {currentMovie.year} • {currentMovie.genres.join(', ')}
                  </p>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {currentMovie.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Компромисс: {currentMovie.overallMatchScore}%</span>
                  <span>{currentMovie.duration}</span>
                </div>
              </div>
            </div>

            {/* Voting buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleVote(false)}
                className="py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ThumbsDown className="w-5 h-5 text-slate-500" />
                <span>Не хочу</span>
              </button>

              <button
                onClick={() => handleVote(true)}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all active:scale-95"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Хочу смотреть!</span>
              </button>
            </div>
          </div>
        )}

        {/* HANDOVER SCREEN */}
        {stage === 'handover' && (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center">
              <span className="text-3xl">{p2.avatar}</span>
            </div>
            <div>
              <h3 className="font-heading font-black text-xl text-slate-100">
                Передайте телефон {p2.name}! 📱
              </h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                Ответы {p1.name} сохранены в тайне. Теперь очередь второго участника сделать свой выбор.
              </p>
            </div>

            <button
              onClick={() => setStage('p2')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Я {p2.name}, готов голосовать</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {stage === 'results' && (
          <div className="text-center py-4 space-y-5 overflow-y-auto pr-1">
            {matchedMovies.length > 0 ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Trophy className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Бинго! Вкусы совпали
                  </span>
                  <h3 className="font-heading font-black text-2xl text-slate-100 mt-1">
                    У вас {matchedMovies.length} взаимных матча! 🎉
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Оба участника выбрали эти фильмы. Споры окончены!
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  {matchedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded-xl shrink-0"
                        />
                        <div>
                          <h5 className="font-heading font-bold text-sm text-slate-100">
                            {movie.title}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            {movie.year} • {movie.genres.slice(0, 2).join(', ')}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-400">
                            ★ {movie.ratingKp} • Матч {movie.overallMatchScore}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectFinalWinner(movie);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-md"
                      >
                        Смотрим!
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-100">
                  Прямых 100% совпадений в этом раунде нет
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Ничего страшного! Основной алгоритм KinoMatch уже рассчитал фильм с наивысшим баллом компромисса ({blitzCandidates[0]?.title} — {blitzCandidates[0]?.overallMatchScore}%).
                </p>
                {blitzCandidates[0] && (
                  <button
                    onClick={() => {
                      onSelectFinalWinner(blitzCandidates[0]);
                      onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs"
                  >
                    Выбрать компромиссный топ-1: {blitzCandidates[0].title}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={resetBlitz}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Сыграть ещё раунд</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
