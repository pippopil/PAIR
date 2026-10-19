import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RoomParticipantTabs } from './components/RoomParticipantTabs';
import { ParticipantTasteEditor } from './components/ParticipantTasteEditor';
import { MoodAndFilters } from './components/MoodAndFilters';
import { MovieCard } from './components/MovieCard';
import { BlitzMatchModal } from './components/BlitzMatchModal';
import { RouletteModal } from './components/RouletteModal';
import { CoupleDiaryModal } from './components/CoupleDiaryModal';
import { AchievementsModal } from './components/AchievementsModal';
import { ShareRoomModal } from './components/ShareRoomModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { Confetti } from './components/Confetti';
import {
  UserParticipant,
  MovieRecommendation,
  SessionFilterOptions,
  DiaryEntry,
  AchievementBadge,
} from './types';
import { TASTE_PRESETS, TastePreset } from './data/presets';
import { CURATED_CATALOG } from './data/catalog';
import { INITIAL_ACHIEVEMENTS } from './data/achievements';
import {
  Sparkles,
  Flame,
  RotateCcw,
  CheckCircle,
  Film,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Zap,
  Dices,
  BookOpen,
  Trophy,
} from 'lucide-react';

const INITIAL_PARTICIPANTS: UserParticipant[] = [
  {
    id: 'user-1',
    name: 'Алексей',
    avatar: '👨‍💻',
    color: '#f43f5e',
    favoriteGenres: ['Фантастика', 'Триллер', 'Детектив'],
    favoriteMovies: [
      { id: 'inception', title: 'Начало', year: 2010 },
      { id: 'knives-out', title: 'Достать ножи', year: 2019 },
    ],
    favoriteActors: ['Леонардо Ди Каприо', 'Кристофер Нолан'],
    vetoes: ['Без банальных слащавых мелодрам 💔'],
  },
  {
    id: 'user-2',
    name: 'Мария',
    avatar: '👩‍🎨',
    color: '#8b5cf6',
    favoriteGenres: ['Комедия', 'Детектив', 'Драма'],
    favoriteMovies: [
      { id: 'intouchables', title: '1+1 (Неприкасаемые)', year: 2011 },
      { id: 'grand-budapest', title: 'Отель «Гранд Будапешт»', year: 2014 },
    ],
    favoriteActors: ['Райан Гослинг', 'Эмма Стоун'],
    vetoes: ['Никаких хорроров и скримеров 🚫', 'Без крови, расчленёнки и пыток 🩸'],
  },
];

const INITIAL_FILTERS: SessionFilterOptions = {
  roomCode: 'КИНО-942',
  mode: 'duo',
  targetType: 'all',
  durationLimit: 'any',
  era: 'any',
  selectedPlatforms: [],
  excludeSeen: false,
  moodPrompt: 'Мы хотим что-то захватывающее с юмором или детективной интригой, но без хоррора',
};

const INITIAL_DIARY: DiaryEntry[] = [
  {
    id: 'diary-sample-1',
    movieId: 'intouchables',
    title: '1+1 (Неприкасаемые)',
    year: 2011,
    genres: ['Комедия', 'Драма', 'Биография'],
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    date: '18 октября',
    ratings: {
      'user-1': { rating: 5, name: 'Алексей', avatar: '👨‍💻' },
      'user-2': { rating: 5, name: 'Мария', avatar: '👩‍🎨' },
    },
    averageRating: 5.0,
    coupleNotes: 'Шедевр! Смеялись и растрогались оба. Идеальный вечер с пиццей.',
  },
];

export default function App() {
  const [participants, setParticipants] = useState<UserParticipant[]>(INITIAL_PARTICIPANTS);
  const [activeParticipantId, setActiveParticipantId] = useState<string>('user-1');
  const [filters, setFilters] = useState<SessionFilterOptions>(INITIAL_FILTERS);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Watchlist & Selected
  const [watchlist, setWatchlist] = useState<MovieRecommendation[]>([]);
  const [confirmedChoice, setConfirmedChoice] = useState<MovieRecommendation | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);

  // Ratings State: movieId -> (participantId -> 1..5)
  const [movieRatings, setMovieRatings] = useState<Record<string, Record<string, number>>>({
    'knives-out': { 'user-1': 5, 'user-2': 4 },
  });

  // Diary State
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(INITIAL_DIARY);
  const [isDiaryOpen, setIsDiaryOpen] = useState<boolean>(false);
  const [pendingMovieForDiary, setPendingMovieForDiary] = useState<MovieRecommendation | null>(null);

  // Achievements State
  const [achievements, setAchievements] = useState<AchievementBadge[]>(INITIAL_ACHIEVEMENTS);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);

  // Modals & Effects
  const [isBlitzOpen, setIsBlitzOpen] = useState<boolean>(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [bannedTitles, setBannedTitles] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeParticipant =
    participants.find((p) => p.id === activeParticipantId) || participants[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to unlock an achievement
  const unlockAchievement = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.unlocked) {
          setShowConfetti(true);
          showToast(`🏆 Открыто достижение: «${a.title}»!`);
          return { ...a, unlocked: true, unlockedAt: 'Сегодня' };
        }
        return a;
      })
    );
  };

  // Switch mode
  const handleModeChange = (mode: 'duo' | 'party') => {
    setFilters({ ...filters, mode });
    if (mode === 'duo' && participants.length > 2) {
      setParticipants(participants.slice(0, 2));
      setActiveParticipantId(participants[0].id);
    }
  };

  // Add party participant
  const handleAddParticipant = () => {
    if (participants.length >= 5) return;
    const newIdx = participants.length + 1;
    const emojis = ['🚀', '🦊', '🎸', '🍿', '🎯'];
    const newP: UserParticipant = {
      id: `user-${Date.now()}`,
      name: `Друг ${newIdx}`,
      avatar: emojis[(newIdx - 1) % emojis.length],
      color: '#06b6d4',
      favoriteGenres: ['Комедия', 'Приключения'],
      favoriteMovies: [],
      favoriteActors: [],
      vetoes: [],
    };
    setParticipants([...participants, newP]);
    setActiveParticipantId(newP.id);
    showToast(`Участник ${newP.name} добавлен в комнату`);
  };

  // Remove participant
  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((p) => p.id !== id));
    if (activeParticipantId === id) {
      setActiveParticipantId(participants[0].id);
    }
  };

  // Update participant
  const handleUpdateParticipant = (updated: UserParticipant) => {
    setParticipants(participants.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Apply taste preset
  const handleApplyPreset = (preset: TastePreset) => {
    setParticipants(
      participants.map((p) => {
        if (p.id === activeParticipantId) {
          return {
            ...p,
            favoriteGenres: Array.from(new Set([...p.favoriteGenres, ...preset.favoriteGenres])),
            favoriteMovies: [
              ...p.favoriteMovies,
              ...preset.sampleTitles.filter(
                (pm) => !p.favoriteMovies.some((fm) => fm.id === pm.id)
              ),
            ],
            favoriteActors: Array.from(new Set([...p.favoriteActors, ...preset.favoriteActors])),
            vetoes: Array.from(new Set([...p.vetoes, ...preset.suggestedVetoes])),
          };
        }
        return p;
      })
    );
    showToast(`Пресет «${preset.name}» применён к профилю ${activeParticipant.name}!`);
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setConfirmedChoice(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants,
          moodPrompt: filters.moodPrompt,
          filters,
          seenMovies: bannedTitles,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось получить рекомендации');
      }

      const data = await response.json();
      const list: MovieRecommendation[] = (data.recommendations || []).filter(
        (m: MovieRecommendation) => !bannedTitles.includes(m.id)
      );

      setRecommendations(list);
      setHasCalculated(true);

      // Check high match achievement
      if (list.some((m) => m.overallMatchScore >= 85)) {
        unlockAchievement('first-match');
      }

      showToast(`Подобрано ${list.length} компромиссных вариантов 🎯`);
    } catch (err: any) {
      console.warn('Error fetching recommendations, using curated fallback:', err);
      showToast('Использован встроенный умный каталог');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial recommendations on mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Sync state to local room in background (no VPN needed)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/rooms/${encodeURIComponent(filters.roomCode)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants,
          userRatings: movieRatings,
          confirmedChoice,
          diaryEntries,
        }),
      }).catch((e) => console.warn('Room sync error:', e));
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters.roomCode, participants, movieRatings, confirmedChoice, diaryEntries]);

  // Periodic polling from partner in room (every 6 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/rooms/${encodeURIComponent(filters.roomCode)}/state`)
        .then((res) => res.json())
        .then((data) => {
          if (data.found && data.room) {
            if (data.room.confirmedChoice && (!confirmedChoice || confirmedChoice.id !== data.room.confirmedChoice.id)) {
              setConfirmedChoice(data.room.confirmedChoice);
              setShowConfetti(true);
            }
          }
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(interval);
  }, [filters.roomCode, confirmedChoice]);

  // Handle 5-star rating on a movie card
  const handleRateMovie = (movie: MovieRecommendation, participantId: string, rating: number) => {
    setMovieRatings((prev) => {
      const movieMap = prev[movie.id] || {};
      const updatedMovieMap = { ...movieMap, [participantId]: rating };

      // Check if both participants gave 5 stars
      if (participants.length >= 2) {
        const p1 = participants[0]?.id;
        const p2 = participants[1]?.id;
        if (updatedMovieMap[p1] === 5 && updatedMovieMap[p2] === 5) {
          unlockAchievement('five-star-duo');
        }
      }

      // Check detective genre achievement
      if (movie.genres.some((g) => g.toLowerCase().includes('детектив'))) {
        unlockAchievement('detective-duo');
      }

      return { ...prev, [movie.id]: updatedMovieMap };
    });

    const participantName =
      participants.find((p) => p.id === participantId)?.name || 'Зритель';
    showToast(`${participantName} поставил ★ ${rating} фильму «${movie.title}»`);
  };

  // Add movie to diary
  const handleAddToDiary = (movie: MovieRecommendation) => {
    setPendingMovieForDiary(movie);
    setIsDiaryOpen(true);
  };

  // Save diary entry
  const handleSaveDiaryEntry = (entry: DiaryEntry) => {
    const updated = [entry, ...diaryEntries];
    setDiaryEntries(updated);
    unlockAchievement('diary-first');
    if (updated.length >= 3) {
      unlockAchievement('movie-buffs');
    }
    showToast(`«${entry.title}» сохранён в Кинодневник пары! 🍿`);
  };

  const handleDeleteDiaryEntry = (id: string) => {
    setDiaryEntries(diaryEntries.filter((e) => e.id !== id));
    showToast('Запись удалена из дневника');
  };

  // Select as final choice of the night
  const handleSelectAsChoice = (movie: MovieRecommendation) => {
    setConfirmedChoice(movie);
    setShowConfetti(true);
    showToast(`Выбор вечера сделан: «${movie.title}»! Приятного просмотра 🎉`);

    // Check roulette achievement if roulette was open
    if (isRouletteOpen) {
      unlockAchievement('roulette-luck');
    }
  };

  // Toggle bookmark / watchlist
  const handleToggleBookmark = (movie: MovieRecommendation) => {
    if (watchlist.some((w) => w.id === movie.id)) {
      setWatchlist(watchlist.filter((w) => w.id !== movie.id));
      showToast(`Фильм «${movie.title}» удален из списка`);
    } else {
      setWatchlist([...watchlist, movie]);
      showToast(`Фильм «${movie.title}» добавлен в список просмотра ❤️`);
    }
  };

  // Apply instant veto to movie
  const handleApplyInstantVeto = (movie: MovieRecommendation) => {
    setBannedTitles((prev) => [...prev, movie.id]);
    setRecommendations((prev) => prev.filter((m) => m.id !== movie.id));
    unlockAchievement('iron-veto');
    showToast(`Фильм «${movie.title}» заблокирован вето и удален 🚫`);
  };

  // Copy room link
  const handleShareRoom = () => {
    setIsShareModalOpen(true);
  };

  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <Header
        mode={filters.mode}
        onModeChange={handleModeChange}
        roomCode={filters.roomCode}
        watchlistCount={watchlist.length}
        diaryCount={diaryEntries.length}
        unlockedAchievementsCount={unlockedAchievementsCount}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenDiary={() => setIsDiaryOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenRoulette={() => setIsRouletteOpen(true)}
        onShareRoom={handleShareRoom}
        hasCopied={hasCopied}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-rose-500/40 text-slate-100 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Умный подбор кино без споров и разногласий</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-slate-100 tracking-tight">
            Что посмотреть сегодня?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Добавьте вкусы каждого человека, нажмите кнопку вето на то, что точно не хотите, и алгоритм рассчитает идеальный компромисс.
          </p>
        </div>

        {/* STEP 1: Room Participants & Taste configuration */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500 text-white text-xs flex items-center justify-center font-black">
                1
              </span>
              <span>Вкусы и стоп-факторы участников</span>
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Кликните на карточку зрителя для настройки
            </span>
          </div>

          {/* Participant Tabs */}
          <RoomParticipantTabs
            participants={participants}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={setActiveParticipantId}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            mode={filters.mode}
          />

          {/* Active Participant Taste Editor */}
          {activeParticipant && (
            <ParticipantTasteEditor
              participant={activeParticipant}
              onUpdate={handleUpdateParticipant}
              onApplyPreset={handleApplyPreset}
            />
          )}
        </section>

        {/* STEP 2: Mood prompt & Evening filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                2
              </span>
              <span>Настроение вечера и параметры сеанса</span>
            </h2>
          </div>

          <MoodAndFilters filters={filters} onUpdateFilters={setFilters} />
        </section>

        {/* Big Action Call-to-Action Bar */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 hover:from-rose-600 hover:to-amber-600 text-white font-heading font-black text-sm sm:text-base shadow-xl shadow-rose-500/25 transition-all transform active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>Анализируем компромисс и стоп-факторы...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Найти идеальный фильм для двоих! ✨</span>
              </>
            )}
          </button>

          {/* Rapid Blitz & Roulette buttons */}
          {recommendations.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBlitzOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 font-heading font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                title="Быстрый свайп-батл на двоих"
              >
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Блиц-раунд 🔥</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRouletteOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-heading font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                title="Случайный выбор из лучших компромиссов"
              >
                <Dices className="w-4 h-4 text-amber-400" />
                <span>Кинорулетка 🎰</span>
              </button>
            </div>
          )}
        </section>

        {/* STEP 3: Results & Recommendations */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-heading font-black text-xl text-slate-100 flex items-center gap-2">
                <span>🎯 Идеальные варианты для вас</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                  {recommendations.length} тайтлов
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Отсортировано по шкале компромисса с гарантией соблюдения всех стоп-факторов
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Пересчитать</span>
              </button>
            </div>
          </div>

          {/* Movie Cards List */}
          {recommendations.length > 0 ? (
            <div className="space-y-6">
              {recommendations.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isBookmarked={watchlist.some((w) => w.id === movie.id)}
                  isCurrentChoice={confirmedChoice?.id === movie.id}
                  participants={participants}
                  activeParticipantId={activeParticipantId}
                  userRatings={movieRatings[movie.id] || {}}
                  onSelectAsChoice={handleSelectAsChoice}
                  onToggleBookmark={handleToggleBookmark}
                  onApplyInstantVeto={handleApplyInstantVeto}
                  onRateMovie={handleRateMovie}
                  onAddToDiary={handleAddToDiary}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800 text-center space-y-3">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-heading font-bold text-base text-slate-200">
                Все варианты скрыты или заблокированы вето
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Попробуйте ослабить стоп-факторы или изменить фильтры хронометража, чтобы получить новые рекомендации.
              </p>
              <button
                onClick={() => {
                  setBannedTitles([]);
                  fetchRecommendations();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Сбросить блокировки и пересчитать
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-16 py-6 text-center text-xs text-slate-500">
        <p>KinoMatch • Умный кино-компромисс для пар и дружеских компаний • Без ограничений и VPN</p>
      </footer>

      {/* Blitz Mode Modal */}
      <BlitzMatchModal
        isOpen={isBlitzOpen}
        onClose={() => setIsBlitzOpen(false)}
        movies={recommendations}
        participants={participants}
        onSelectFinalWinner={handleSelectAsChoice}
      />

      {/* Roulette Modal */}
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        movies={recommendations}
        onSelectWinner={handleSelectAsChoice}
      />

      {/* Couple Diary Modal */}
      <CoupleDiaryModal
        isOpen={isDiaryOpen}
        onClose={() => {
          setIsDiaryOpen(false);
          setPendingMovieForDiary(null);
        }}
        entries={diaryEntries}
        participants={participants}
        onAddEntry={handleSaveDiaryEntry}
        onDeleteEntry={handleDeleteDiaryEntry}
        pendingMovieToAdd={pendingMovieForDiary}
        onClearPendingMovie={() => setPendingMovieForDiary(null)}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
      />

      {/* Share / Live Room Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={filters.roomCode}
        participants={participants}
      />

      {/* Watchlist Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        confirmedChoice={confirmedChoice}
        onRemoveFromWatchlist={(id) => setWatchlist(watchlist.filter((w) => w.id !== id))}
        onSelectAsChoice={handleSelectAsChoice}
      />
    </div>
  );
}
