import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, MainTabType } from './components/NavigationTabs';
import { QuickMoodBar } from './components/QuickMoodBar';
import { RoomParticipantTabs } from './components/RoomParticipantTabs';
import { ParticipantTasteEditor } from './components/ParticipantTasteEditor';
import { DiaryAndAchievementsTab } from './components/DiaryAndAchievementsTab';
import { MovieCard } from './components/MovieCard';
import { BlitzMatchModal } from './components/BlitzMatchModal';
import { RouletteModal } from './components/RouletteModal';
import { CoupleDiaryModal } from './components/CoupleDiaryModal';
import { AchievementsModal } from './components/AchievementsModal';
import { ShareRoomModal } from './components/ShareRoomModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { Confetti } from './components/Confetti';
import { PWAManager } from './components/PWAManager';
import {
  UserParticipant,
  MovieRecommendation,
  SessionFilterOptions,
  DiaryEntry,
  AchievementBadge,
} from './types';
import { TastePreset } from './data/presets';
import { INITIAL_ACHIEVEMENTS } from './data/achievements';
import {
  Sparkles,
  RotateCcw,
  Film,
  CheckCircle,
  Sliders,
  Dices,
  Flame,
  ArrowRight,
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
    posterUrl: 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
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
  const [activeTab, setActiveTab] = useState<MainTabType>('feed');
  const [participants, setParticipants] = useState<UserParticipant[]>(INITIAL_PARTICIPANTS);
  const [activeParticipantId, setActiveParticipantId] = useState<string>('user-1');
  const [filters, setFilters] = useState<SessionFilterOptions>(INITIAL_FILTERS);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>(() => {
    try {
      const saved = localStorage.getItem('kinomatch_last_recs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataFromCache, setIsDataFromCache] = useState<boolean>(false);

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

  const handleModeChange = (mode: 'duo' | 'party') => {
    setFilters({ ...filters, mode });
    if (mode === 'duo' && participants.length > 2) {
      setParticipants(participants.slice(0, 2));
      setActiveParticipantId(participants[0].id);
    }
  };

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

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((p) => p.id !== id));
    if (activeParticipantId === id) {
      setActiveParticipantId(participants[0].id);
    }
  };

  const handleUpdateParticipant = (updated: UserParticipant) => {
    setParticipants(participants.map((p) => (p.id === updated.id ? updated : p)));
  };

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

  const fetchRecommendations = async () => {
    setIsLoading(true);

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

      const fromCacheHeader =
        response.headers.get('X-From-Cache') === 'true' ||
        response.headers.get('X-Offline-Mode') === 'true' ||
        !navigator.onLine;

      if (!response.ok && !fromCacheHeader) {
        throw new Error('Не удалось получить рекомендации');
      }

      const data = await response.json();
      let list: MovieRecommendation[] = (data.recommendations || []).filter(
        (m: MovieRecommendation) => !bannedTitles.includes(m.id)
      );

      // If empty offline response, recover from localStorage
      if (list.length === 0) {
        const saved = localStorage.getItem('kinomatch_last_recs');
        if (saved) {
          try {
            list = JSON.parse(saved);
          } catch {}
        }
      }

      if (list.length > 0) {
        setRecommendations(list);
        try {
          localStorage.setItem('kinomatch_last_recs', JSON.stringify(list));
        } catch {}
      }

      setIsDataFromCache(fromCacheHeader || !navigator.onLine);

      if (fromCacheHeader || !navigator.onLine) {
        showToast('Офлайн: показаны сохранённые фильмы из кэша 📡');
      } else {
        if (list.some((m) => m.overallMatchScore >= 85)) {
          unlockAchievement('first-match');
        }
        showToast(`Подобрано ${list.length} компромиссных вариантов 🎯`);
      }
    } catch {
      // LocalStorage fallback when offline without service worker cache
      const saved = localStorage.getItem('kinomatch_last_recs');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (list.length > 0) {
            setRecommendations(list);
            setIsDataFromCache(true);
            showToast('Офлайн-режим: загружены сохранённые рекомендации');
            return;
          }
        } catch {}
      }
      showToast('Использован встроенный умный каталог');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [filters.targetType, filters.durationLimit]);

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

      if (participants.length >= 2) {
        const p1 = participants[0]?.id;
        const p2 = participants[1]?.id;
        if (updatedMovieMap[p1] === 5 && updatedMovieMap[p2] === 5) {
          unlockAchievement('five-star-duo');
        }
      }

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

  const handleSelectAsChoice = (movie: MovieRecommendation) => {
    setConfirmedChoice(movie);
    setShowConfetti(true);
    showToast(`Выбор вечера сделан: «${movie.title}»! Приятного просмотра 🎉`);

    if (isRouletteOpen) {
      unlockAchievement('roulette-luck');
    }
  };

  const handleToggleBookmark = (movie: MovieRecommendation) => {
    if (watchlist.some((w) => w.id === movie.id)) {
      setWatchlist(watchlist.filter((w) => w.id !== movie.id));
      showToast(`Фильм «${movie.title}» удален из списка`);
    } else {
      setWatchlist([...watchlist, movie]);
      showToast(`Фильм «${movie.title}» добавлен в список просмотра ❤️`);
    }
  };

  const handleApplyInstantVeto = (movie: MovieRecommendation) => {
    setBannedTitles((prev) => [...prev, movie.id]);
    setRecommendations((prev) => prev.filter((m) => m.id !== movie.id));
    unlockAchievement('iron-veto');
    showToast(`Фильм «${movie.title}» заблокирован вето и удален 🚫`);
  };

  const handleShareRoom = () => {
    setIsShareModalOpen(true);
  };

  const totalVetoesCount = participants.reduce(
    (acc, p) => acc + (p.vetoes || []).length,
    0
  );
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased w-full max-w-full overflow-x-hidden">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Streamlined Minimal Header with PWA Install / Updates / Offline slot */}
      <Header
        mode={filters.mode}
        onModeChange={handleModeChange}
        roomCode={filters.roomCode}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onShareRoom={handleShareRoom}
        hasCopied={hasCopied}
        pwaInstallSlot={<PWAManager isDataFromCache={isDataFromCache} />}
      />

      {/* Intuitive 3-Tab Navigation Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={recommendations.length}
        vetoCount={totalVetoesCount}
        diaryCount={diaryEntries.length}
        unlockedBadgesCount={unlockedAchievementsCount}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-rose-500/40 text-slate-100 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[90vw]">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        {/* TAB 1: MOVIE FEED & QUICK SEARCH */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Quick Mood & Instant Search Bar */}
            <QuickMoodBar
              filters={filters}
              onUpdateFilters={setFilters}
              onSearch={fetchRecommendations}
              isLoading={isLoading}
              onOpenRoulette={() => setIsRouletteOpen(true)}
              onOpenBlitz={() => setIsBlitzOpen(true)}
            />

            {/* Confirmed Choice of the Night Hero Banner */}
            {confirmedChoice && (
              <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={confirmedChoice.posterUrl}
                    alt={confirmedChoice.title}
                    className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl border border-emerald-500/30"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Выбор вечера подтвержден!</span>
                    </span>
                    <h3 className="font-heading font-black text-lg text-white">
                      «{confirmedChoice.title}» ({confirmedChoice.year})
                    </h3>
                    <p className="text-xs text-slate-300">
                      Компромисс {confirmedChoice.overallMatchScore}% • Приятного просмотра! 🍿
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAddToDiary(confirmedChoice)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Записать в дневник
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmedChoice(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Сменить
                  </button>
                </div>
              </div>
            )}

            {/* Movie List Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="font-heading font-black text-xl text-slate-100 flex items-center gap-2">
                  <span>🎯 Лучшие совпадения для вас</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300">
                    {recommendations.length} тайтлов
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Отсортировано по шкале компромисса с гарантией отсутствия стоп-факторов
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
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {/* Movie Cards List */}
            {recommendations.length > 0 ? (
              <div className="space-y-5">
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
              <div className="bg-slate-900/50 rounded-3xl p-10 border border-slate-800 text-center space-y-3">
                <Film className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="font-heading font-bold text-base text-slate-200">
                  Все предложенные варианты заблокированы вето
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Попробуйте ослабить стоп-факторы во вкладке «Вкусы и ВЕТО» или изменить фильтры.
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
          </div>
        )}

        {/* TAB 2: TASTES & VETO CONFIGURATION */}
        {activeTab === 'tastes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-heading font-black text-xl text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>Вкусы и стоп-факторы зрителей</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Настройте любимые жанры, актёров и табу каждого человека
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('feed');
                  fetchRecommendations();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Готово, к фильмам</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
          </div>
        )}

        {/* TAB 3: COUPLE DIARY & ACHIEVEMENTS */}
        {activeTab === 'diary' && (
          <DiaryAndAchievementsTab
            diaryEntries={diaryEntries}
            achievements={achievements}
            participants={participants}
            onAddDiaryEntry={handleSaveDiaryEntry}
            onDeleteDiaryEntry={handleDeleteDiaryEntry}
            onOpenNewEntryModal={() => setIsDiaryOpen(true)}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 mt-12 py-6 text-center text-xs text-slate-500">
        <p>KinoMatch • Кинокомпромисс для двоих и компаний • 100% без VPN в РФ</p>
      </footer>

      {/* Modals */}
      <BlitzMatchModal
        isOpen={isBlitzOpen}
        onClose={() => setIsBlitzOpen(false)}
        movies={recommendations}
        participants={participants}
        onSelectFinalWinner={handleSelectAsChoice}
      />

      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        movies={recommendations}
        onSelectWinner={handleSelectAsChoice}
      />

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

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={filters.roomCode}
        participants={participants}
      />

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
