import React, { useState, useMemo } from 'react';
import { UserParticipant, MovieItem } from '../types';
import { GENRES_LIST, POPULAR_ACTORS_LIST, VETO_PRESETS, CURATED_CATALOG } from '../data/catalog';
import { TASTE_PRESETS, TastePreset } from '../data/presets';
import {
  Sparkles,
  ShieldAlert,
  Search,
  Plus,
  X,
  Flame,
  Check,
  ChevronDown,
  Film,
  User,
} from 'lucide-react';

interface ParticipantTasteEditorProps {
  participant: UserParticipant;
  onUpdate: (updated: UserParticipant) => void;
  onApplyPreset: (preset: TastePreset) => void;
}

export const ParticipantTasteEditor: React.FC<ParticipantTasteEditorProps> = ({
  participant,
  onUpdate,
  onApplyPreset,
}) => {
  const [movieQuery, setMovieQuery] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [actorInput, setActorInput] = useState('');
  const [showActorDropdown, setShowActorDropdown] = useState(false);
  const [customVetoInput, setCustomVetoInput] = useState('');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Fetch trending movies on mount for quick inspiration
  React.useEffect(() => {
    fetch('/api/tmdb/trending')
      .then((res) => res.json())
      .then((data) => {
        if (data.results && Array.isArray(data.results)) {
          setTrendingMovies(data.results);
        }
      })
      .catch((e) => console.warn('Could not load trending:', e));
  }, []);

  // Live dynamic TMDB search with debounce
  React.useEffect(() => {
    const trimmed = movieQuery.trim();
    if (trimmed.length < 2) {
      setTmdbSearchResults([]);
      setIsSearchingTmdb(false);
      return;
    }

    setIsSearchingTmdb(true);
    const timer = setTimeout(() => {
      fetch(`/api/tmdb/search?query=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          setTmdbSearchResults(data.results || []);
        })
        .catch((err) => {
          console.warn('TMDB search error:', err);
        })
        .finally(() => {
          setIsSearchingTmdb(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [movieQuery]);

  // Genre toggle
  const toggleGenre = (genreName: string) => {
    const current = participant.favoriteGenres || [];
    const next = current.includes(genreName)
      ? current.filter((g) => g !== genreName)
      : [...current, genreName];
    onUpdate({ ...participant, favoriteGenres: next });
  };

  // Add favorite movie
  const addMovie = (movie: { id: string; title: string; year?: number; posterUrl?: string }) => {
    const current = participant.favoriteMovies || [];
    if (!current.some((m) => m.id === movie.id || m.title.toLowerCase() === movie.title.toLowerCase())) {
      onUpdate({
        ...participant,
        favoriteMovies: [
          ...current,
          { id: movie.id, title: movie.title, year: movie.year, posterUrl: movie.posterUrl },
        ],
      });
    }
    setMovieQuery('');
    setTmdbSearchResults([]);
  };

  const removeMovie = (id: string) => {
    onUpdate({
      ...participant,
      favoriteMovies: (participant.favoriteMovies || []).filter((m) => m.id !== id),
    });
  };

  // Add actor
  const toggleActor = (actorName: string) => {
    const clean = actorName.trim();
    if (!clean) return;
    const current = participant.favoriteActors || [];
    const next = current.includes(clean)
      ? current.filter((a) => a !== clean)
      : [...current, clean];
    onUpdate({ ...participant, favoriteActors: next });
  };

  const addActor = (nameToAdd?: string) => {
    const raw = nameToAdd !== undefined ? nameToAdd : actorInput;
    const name = raw.trim();
    if (!name) return;
    const current = participant.favoriteActors || [];
    if (!current.includes(name)) {
      onUpdate({
        ...participant,
        favoriteActors: [...current, name],
      });
    }
    setActorInput('');
    setShowActorDropdown(false);
  };

  // Prefix-prioritized actor search matching "по началу фразы"
  const actorSuggestions = useMemo(() => {
    const query = actorInput.trim().toLowerCase();
    if (!query) return [];
    const current = participant.favoriteActors || [];

    const startsWithMatches: string[] = [];
    const wordStartsMatches: string[] = [];
    const containsMatches: string[] = [];

    for (const actor of POPULAR_ACTORS_LIST) {
      if (current.includes(actor)) continue;
      const lower = actor.toLowerCase();
      // 1. Prioritize starting with query ("по началу фразы")
      if (lower.startsWith(query)) {
        startsWithMatches.push(actor);
      } else if (lower.split(/\s+/).some((part) => part.startsWith(query))) {
        // 2. Starts with query on second/third word (e.g. "Харди" for "Том Харди")
        wordStartsMatches.push(actor);
      } else if (lower.includes(query)) {
        // 3. General contains
        containsMatches.push(actor);
      }
    }

    return [...startsWithMatches, ...wordStartsMatches, ...containsMatches].slice(0, 10);
  }, [actorInput, participant.favoriteActors]);

  // Veto toggle
  const toggleVeto = (vetoLabel: string) => {
    const current = participant.vetoes || [];
    const next = current.includes(vetoLabel)
      ? current.filter((v) => v !== vetoLabel)
      : [...current, vetoLabel];
    onUpdate({ ...participant, vetoes: next });
  };

  const addCustomVeto = () => {
    if (!customVetoInput.trim()) return;
    const label = `Без: ${customVetoInput.trim()} 🚫`;
    if (!participant.vetoes.includes(label)) {
      onUpdate({
        ...participant,
        vetoes: [...participant.vetoes, label],
      });
    }
    setCustomVetoInput('');
  };

  // Filtered movies for search
  const filteredCatalogMovies = movieQuery.trim()
    ? CURATED_CATALOG.filter(
        (m) =>
          m.title.toLowerCase().includes(movieQuery.toLowerCase()) ||
          m.originalTitle.toLowerCase().includes(movieQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-6 border border-slate-800/80 space-y-6">
      {/* Header: Name, avatar and preset loader */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={participant.avatar}
            onChange={(e) => onUpdate({ ...participant, avatar: e.target.value.slice(0, 2) || '👤' })}
            className="w-12 h-12 text-center text-2xl bg-slate-950 border border-slate-700 rounded-2xl focus:border-rose-500 focus:outline-none"
            title="Нажмите, чтобы сменить эмодзи"
          />
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={participant.name}
                onChange={(e) => onUpdate({ ...participant, name: e.target.value })}
                className="bg-transparent font-heading font-bold text-lg text-slate-100 hover:bg-slate-950/60 focus:bg-slate-950 focus:border-rose-500 px-2 py-0.5 rounded-lg border border-transparent focus:outline-none max-w-[200px]"
                placeholder="Имя участника"
              />
            </div>
            <p className="text-xs text-slate-400 px-2">Настройте вкусы и стоп-факторы</p>
          </div>
        </div>

        {/* Preset quick button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Готовый профиль вкуса</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
          </button>

          {showPresetsMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl z-30 space-y-1">
              <div className="px-2 py-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Быстрый выбор для старта:
              </div>
              {TASTE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset);
                    setShowPresetsMenu(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-amber-300 font-semibold">{preset.badge}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Любимые жанры */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>🎭 Любимые жанры</span>
            <span className="text-slate-500 font-normal">({(participant.favoriteGenres || []).length} выбрано)</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENRES_LIST.map((g) => {
            const isSelected = (participant.favoriteGenres || []).includes(g.name);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 border border-rose-400'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{g.icon}</span>
                <span>{g.name}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Любимые фильмы и сериалы */}
      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
          🎬 Любимые фильмы и сериалы
        </label>

        {/* Selected movie tags */}
        {(participant.favoriteMovies || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {participant.favoriteMovies.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 shadow-sm"
              >
                <Film className="w-3 h-3 text-rose-400" />
                <span>{m.title}</span>
                {m.year && <span className="text-[10px] text-slate-400">({m.year})</span>}
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search movie input */}
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={movieQuery}
              onChange={(e) => setMovieQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && movieQuery.trim()) {
                  addMovie({ id: `custom-${Date.now()}`, title: movieQuery.trim() });
                }
              }}
              placeholder="Найти фильм (напр. Начало, 1+1, Джентльмены...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
            {movieQuery.trim() && (
              <button
                type="button"
                onClick={() => addMovie({ id: `custom-${Date.now()}`, title: movieQuery.trim() })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[11px] font-bold"
              >
                Добавить
              </button>
            )}
          </div>

          {/* Dynamic TMDB Autocomplete dropdown */}
          {movieQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl z-30 max-h-80 overflow-y-auto space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{isSearchingTmdb ? 'Ищем по базе TMDB...' : 'Результаты поиска TMDB:'}</span>
                {isSearchingTmdb && <span className="animate-spin text-rose-500">⏳</span>}
              </div>

              {tmdbSearchResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => addMovie(m)}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-900 flex items-center justify-between gap-2.5 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-8 h-12 object-cover rounded-md shrink-0 bg-slate-900 border border-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-rose-300 truncate">
                          {m.title}
                        </span>
                        {m.year && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({m.year})
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                          {m.type === 'series' ? 'Сериал' : 'Фильм'}
                        </span>
                      </div>
                      {m.originalTitle && m.originalTitle !== m.title && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {m.originalTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {m.rating && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        ★ {m.rating}
                      </span>
                    )}
                    <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      + Добавить
                    </span>
                  </div>
                </button>
              ))}

              {!isSearchingTmdb && tmdbSearchResults.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400 space-y-1.5">
                  <p>По запросу «{movieQuery}» ничего не найдено.</p>
                  <button
                    type="button"
                    onClick={() =>
                      addMovie({
                        id: `custom-${Date.now()}`,
                        title: movieQuery.trim(),
                        year: new Date().getFullYear(),
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
                  >
                    + Добавить «{movieQuery.trim()}» вручную
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Trending / Popular movies row from TMDB */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>В тренде TMDB:</span>
          </span>
          {(trendingMovies.length > 0 ? trendingMovies : CURATED_CATALOG).slice(0, 6).map((m) => {
            const isAdded = (participant.favoriteMovies || []).some(
              (fm) => fm.id === m.id || fm.title.toLowerCase() === m.title.toLowerCase()
            );
            if (isAdded) return null;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => addMovie(m)}
                className="px-2 py-0.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                + {m.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Любимые актеры & режиссеры */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            🌟 Любимые актёры и режиссёры
          </label>
          {(participant.favoriteActors || []).length > 0 && (
            <span className="text-[11px] text-indigo-300 font-semibold">
              {(participant.favoriteActors || []).length} в списке
            </span>
          )}
        </div>

        {/* Selected Actor Tags */}
        {(participant.favoriteActors || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(participant.favoriteActors || []).map((actor) => (
              <span
                key={actor}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 text-xs font-semibold shadow-sm"
              >
                <User className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{actor}</span>
                <button
                  type="button"
                  onClick={() => toggleActor(actor)}
                  className="text-indigo-400 hover:text-white transition-colors ml-0.5 p-0.5 rounded-md hover:bg-indigo-500/20"
                  title="Удалить"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Actor Input with Prefix Autocomplete */}
        <div className="relative mb-3">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={actorInput}
                onChange={(e) => {
                  setActorInput(e.target.value);
                  setShowActorDropdown(true);
                }}
                onFocus={() => {
                  if (actorInput.trim().length > 0) setShowActorDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (actorSuggestions.length > 0) {
                      addActor(actorSuggestions[0]);
                    } else if (actorInput.trim()) {
                      addActor(actorInput.trim());
                    }
                  } else if (e.key === 'Escape') {
                    setShowActorDropdown(false);
                  }
                }}
                placeholder="Начните вводить имя (напр. Бодров, Ди Каприо, Ривз...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (actorSuggestions.length > 0) {
                  addActor(actorSuggestions[0]);
                } else if (actorInput.trim()) {
                  addActor(actorInput.trim());
                }
              }}
              disabled={!actorInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm shrink-0"
            >
              + Добавить
            </button>
          </div>

          {/* Autocomplete suggestions dropdown - "по началу фразы" */}
          {showActorDropdown && actorInput.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl z-40 max-h-60 overflow-y-auto space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
                <span>Подсказки по началу фразы:</span>
                <span className="text-indigo-400 font-normal">{actorSuggestions.length} найдено</span>
              </div>
              {actorSuggestions.map((sug, idx) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => addActor(sug)}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-950/60 hover:text-white flex items-center justify-between transition-colors group text-xs text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="font-semibold">{sug}</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {idx === 0 ? 'Enter ↵' : '+ Добавить'}
                  </span>
                </button>
              ))}

              {actorSuggestions.length === 0 && (
                <div className="p-2.5 text-center text-xs text-slate-400">
                  <p className="mb-1.5">В списке нет «{actorInput.trim()}»</p>
                  <button
                    type="button"
                    onClick={() => addActor(actorInput.trim())}
                    className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    + Добавить «{actorInput.trim()}»
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick popular chips */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_ACTORS_LIST.slice(0, 12).map((actor) => {
            const isSelected = (participant.favoriteActors || []).includes(actor);
            return (
              <button
                key={actor}
                type="button"
                onClick={() => toggleActor(actor)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold border border-indigo-400 shadow-sm'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {isSelected ? `✓ ${actor}` : `+ ${actor}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: КНОПКА «ВЕТО» / СТОП-ФАКТОРЫ */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                Кнопка «ВЕТО» (Стоп-факторы)
              </h5>
              <p className="text-[11px] text-slate-400">
                То, что вы категорически не хотите смотреть сегодня
              </p>
            </div>
          </div>
          {(participant.vetoes || []).length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              {participant.vetoes.length} табу
            </span>
          )}
        </div>

        {/* Quick veto presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2.5">
          {VETO_PRESETS.map((vp) => {
            const isVetoed = (participant.vetoes || []).includes(vp.label);
            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => toggleVeto(vp.label)}
                className={`text-left p-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${
                  isVetoed
                    ? 'bg-rose-950/60 text-rose-200 border-rose-600 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{vp.label}</span>
                {isVetoed ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold shrink-0 ml-1">
                    ВЕТО
                  </span>
                ) : (
                  <span className="text-slate-600 text-[10px] font-bold shrink-0 ml-1">+ Табу</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom veto input */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={customVetoInput}
            onChange={(e) => setCustomVetoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCustomVeto();
            }}
            placeholder="Свой стоп-фактор (напр. 'про клоунов', 'тяжёлый финал')..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
          <button
            type="button"
            onClick={addCustomVeto}
            disabled={!customVetoInput.trim()}
            className="px-3 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-bold disabled:opacity-50"
          >
            + Вето
          </button>
        </div>
      </div>
    </div>
  );
};
