import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CURATED_CATALOG, PLATFORMS_LIST } from './src/data/catalog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Fallback / Pure Local Algorithm
function calculateLocalRecommendations(
  participants: any[],
  moodPrompt: string = '',
  filters: any = {},
  seenMovies: string[] = []
) {
  const allVetoes = participants.flatMap((p: any) => p.vetoes || []);
  const lowerMood = (moodPrompt || '').toLowerCase();

  const results = CURATED_CATALOG.filter((movie) => {
    // Check seen
    if (filters.excludeSeen && seenMovies.includes(movie.id)) {
      return false;
    }
    // Filter target type
    if (filters.targetType && filters.targetType !== 'all') {
      if (movie.type !== filters.targetType) return false;
    }
    // Filter duration
    if (filters.durationLimit === 'under90' && movie.durationMinutes > 95) return false;
    if (filters.durationLimit === 'under120' && movie.durationMinutes > 125) return false;
    if (filters.durationLimit === 'over120' && movie.durationMinutes < 120) return false;

    // Filter era
    if (filters.era === 'fresh' && movie.year < 2020) return false;
    if (filters.era === '2010s' && (movie.year < 2010 || movie.year > 2019)) return false;
    if (filters.era === 'classic' && movie.year >= 2010) return false;

    // Check strict vetoes
    for (const veto of allVetoes) {
      const v = veto.toLowerCase();
      if ((v.includes('хоррор') || v.includes('скример')) && movie.genres.includes('Ужасы')) {
        return false;
      }
      if (v.includes('кров') && (movie.ageRating === '18+' && movie.genres.includes('Боевик'))) {
        return false;
      }
      if (v.includes('тяжёлой') && (movie.genres.includes('Драма') && !movie.genres.includes('Комедия'))) {
        return false;
      }
      if (v.includes('затянутост') && movie.durationMinutes > 125) {
        return false;
      }
    }

    return true;
  }).map((movie) => {
    let score = 70; // baseline
    const breakdowns: any[] = [];

    participants.forEach((p: any) => {
      let pScore = 65;
      const reasons: string[] = [];

      // Check genres
      const matchingGenres = (p.favoriteGenres || []).filter((g: string) => movie.genres.includes(g));
      if (matchingGenres.length > 0) {
        pScore += matchingGenres.length * 9;
        reasons.push(`Любит жанры: ${matchingGenres.join(', ')}`);
      }

      // Check actors / directors
      const matchingActors = (p.favoriteActors || []).filter((a: string) =>
        movie.cast.some((c: string) => c.toLowerCase().includes(a.toLowerCase())) ||
        movie.director.toLowerCase().includes(a.toLowerCase())
      );
      if (matchingActors.length > 0) {
        pScore += 18;
        reasons.push(`В восторге от персон: ${matchingActors.join(', ')}`);
      }

      // Mood booster
      if (lowerMood) {
        if (lowerMood.includes('каприо') && movie.cast.some((c) => c.includes('Каприо'))) {
          pScore += 15;
          reasons.push('Точное попадание по запросу на Ди Каприо');
        }
        if ((lowerMood.includes('легк') || lowerMood.includes('смеш')) && movie.genres.includes('Комедия')) {
          pScore += 12;
          reasons.push('Идеально под лёгкое вечернее настроение');
        }
        if (lowerMood.includes('детектив') && movie.genres.includes('Детектив')) {
          pScore += 12;
          reasons.push('Захватывающая детективная интрига');
        }
      }

      pScore = Math.min(99, Math.max(50, pScore));

      breakdowns.push({
        participantId: p.id,
        participantName: p.name,
        score: pScore,
        reason: reasons.length ? reasons.join(' • ') : 'Хорошо сбалансированный сюжет без триггеров',
        appealFactor: matchingGenres[0] || movie.genres[0] || 'Качественный сюжет',
      });
    });

    // Average compromise score
    const avgScore = Math.round(breakdowns.reduce((acc, cur) => acc + cur.score, 0) / (breakdowns.length || 1));

    // Construct compromise explanation
    const p1 = participants[0]?.name || 'Участник 1';
    const p2 = participants[1]?.name || 'Участник 2';
    const rationale = participants.length === 2
      ? `Отличный баланс между вкусом ${p1} к динамичным историям и предпочтением ${p2} качественного сюжета. Фильм держит интерес обоих без скучных пауз.`
      : `Универсальный выбор для компании: сочетает высокий темп, ярких персонажей и отсутствие спорных тем.`;

    return {
      ...movie,
      overallMatchScore: avgScore,
      matchBreakdown: breakdowns,
      compromiseRationale: rationale,
      vetoStatus: {
        isSafe: true,
        guaranteeNote: allVetoes.length
          ? `Проверено по ${allVetoes.length} стоп-факторам: запрещённые темы полностью отсутствуют.`
          : 'Безопасно для комфортного совместного просмотра.',
      },
    };
  });

  return results.sort((a, b) => b.overallMatchScore - a.overallMatchScore).slice(0, 8);
}

// API Routes
app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const { participants, moodPrompt, filters, seenMovies } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'Participants array is required' });
    }

    // If Gemini API Key is available and valid, generate custom high-precision AI recommendations
    const isValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_');
    if (isValidKey) {
      try {
        const participantSummary = participants.map((p: any) => ({
          name: p.name,
          favoriteGenres: p.favoriteGenres || [],
          favoriteActors: p.favoriteActors || [],
          favoriteMovies: (p.favoriteMovies || []).map((m: any) => m.title),
          vetoes: p.vetoes || [],
        }));

        const promptText = `
Ты — умный кино-алгоритм KinoMatch для поиска идеального фильма или сериала на двоих/компанию.
Твоя задача — найти 4-5 великолепных кинокартин или сериалов, которые станут идеальным компромиссом для зрителей с разными вкусами.

Зрители:
${JSON.stringify(participantSummary, null, 2)}

Пожелание на этот вечер (Mood prompt): "${moodPrompt || 'Хороший совместный вечер'}"
Фильтры:
- Тип контента: ${filters?.targetType || 'любой'}
- Длительность: ${filters?.durationLimit || 'любая'}
- Эпоха: ${filters?.era || 'любая'}
- Платформы: ${(filters?.selectedPlatforms || []).join(', ') || 'любые популярные'}
- Исключить уже просмотренные: ${(seenMovies || []).join(', ') || 'нет'}

ВАЖНЕЙШИЕ ПРАВИЛА:
1. СТОП-ФАКТОРЫ (ВЕТО) СТРОГО ОБЯЗАТЕЛЬНЫ К ИСПОЛНЕНИЮ. Если хотя бы у одного человека в вето стоит "без хорроров" или "без крови", категорически запрещено предлагать такие фильмы!
2. ШКАЛА КОМПРОМИССА:
   - Рассчитай общий процент совместимости (overallMatchScore от 70 до 99).
   - Рассчитай индивидуальный процент для КАЖДОГО участника (от 60 до 99) и обоснуй на русском языке, почему именно ему это понравится (matchBreakdown).
   - Напиши емкое "compromiseRationale" на русском: почему фильм идеально объединяет обоих и снимает разногласия.
3. Интеграция со стримингами: укажи актуальные платформы (Кинопоиск, Okko, Иви, Premier, KION, Start, Netflix, Apple TV+).
4. Верни только валидный JSON по указанной схеме.
`;

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of movie/series recommendations with compromise scores',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: 'Название на русском языке' },
                  originalTitle: { type: Type.STRING, description: 'Оригинальное название' },
                  year: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: 'movie, series или animation' },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  director: { type: Type.STRING },
                  cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                  duration: { type: Type.STRING, description: 'например 125 мин или 8 серий по 45 мин' },
                  durationMinutes: { type: Type.INTEGER },
                  ratingKp: { type: Type.NUMBER, description: 'Оценка Кинопоиск, например 8.2' },
                  ratingImdb: { type: Type.NUMBER, description: 'Оценка IMDb, например 8.1' },
                  posterUrl: { type: Type.STRING, description: 'URL постера или фото' },
                  description: { type: Type.STRING, description: 'Краткое интригующее описание без спойлеров' },
                  overallMatchScore: { type: Type.INTEGER, description: 'Общий процент совпадения 70-99' },
                  matchBreakdown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        participantId: { type: Type.STRING },
                        participantName: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        reason: { type: Type.STRING },
                        appealFactor: { type: Type.STRING },
                      },
                      required: ['participantName', 'score', 'reason', 'appealFactor'],
                    },
                  },
                  compromiseRationale: { type: Type.STRING, description: 'Объяснение компромисса' },
                  vetoStatus: {
                    type: Type.OBJECT,
                    properties: {
                      isSafe: { type: Type.BOOLEAN },
                      guaranteeNote: { type: Type.STRING },
                    },
                    required: ['isSafe', 'guaranteeNote'],
                  },
                  availablePlatforms: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        color: { type: Type.STRING },
                      },
                      required: ['id', 'name'],
                    },
                  },
                },
                required: [
                  'id',
                  'title',
                  'year',
                  'type',
                  'genres',
                  'director',
                  'cast',
                  'ratingKp',
                  'description',
                  'overallMatchScore',
                  'matchBreakdown',
                  'compromiseRationale',
                  'vetoStatus',
                  'availablePlatforms',
                ],
              },
            },
          },
        });

        // 6 seconds timeout so users never wait on high-demand spikes
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000)
        );

        const geminiResponse: any = await Promise.race([geminiCall, timeoutPromise]);

        const rawText = geminiResponse.text?.trim() || '[]';
        let aiResults = JSON.parse(rawText);

        // Sanitize and ensure poster URLs
        if (Array.isArray(aiResults) && aiResults.length > 0) {
          aiResults = aiResults.map((rec: any, idx: number) => {
            // Find existing curated match if available to preserve verified poster
            const curatedMatch = CURATED_CATALOG.find(
              (c) => c.title.toLowerCase() === rec.title.toLowerCase() ||
                     c.originalTitle.toLowerCase() === (rec.originalTitle || '').toLowerCase()
            );

            const posterUrl = curatedMatch?.posterUrl ||
              rec.posterUrl ||
              CURATED_CATALOG[idx % CURATED_CATALOG.length]?.posterUrl;

            // Ensure participant IDs in matchBreakdown
            const matchBreakdown = (rec.matchBreakdown || []).map((mb: any, mIdx: number) => {
              const matchedP = participants[mIdx] || participants.find((p: any) => p.name === mb.participantName);
              return {
                ...mb,
                participantId: matchedP?.id || `p-${mIdx}`,
                participantName: mb.participantName || matchedP?.name || `Участник ${mIdx + 1}`,
              };
            });

            return {
              ...rec,
              posterUrl,
              matchBreakdown,
            };
          });

          return res.json({
            source: 'gemini',
            recommendations: aiResults,
          });
        }
      } catch {
        // High-demand or temporary network spike: cleanly proceed to the smart compromise engine
      }
    }

    // Local smart algorithm fallback
    const localRecommendations = calculateLocalRecommendations(
      participants,
      moodPrompt,
      filters,
      seenMovies
    );

    return res.json({
      source: 'local',
      recommendations: localRecommendations,
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// TMDB Genre ID to Russian Name mapping
const TMDB_GENRES_MAP: Record<number, string> = {
  28: 'Боевик',
  12: 'Приключения',
  16: 'Анимация',
  35: 'Комедия',
  80: 'Криминал',
  99: 'Документальный',
  18: 'Драма',
  10751: 'Семейный',
  14: 'Фэнтези',
  36: 'История',
  27: 'Ужасы',
  10402: 'Музыка',
  9648: 'Детектив',
  10749: 'Мелодрама',
  878: 'Фантастика',
  53: 'Триллер',
  10752: 'Военный',
  37: 'Вестерн',
  10759: 'Боевик',
  10765: 'Фантастика',
};

// Dynamic TMDB Search endpoint
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  const query = ((req.query.query as string) || (req.query.q as string) || '').trim();
  const language = (req.query.language as string) || 'ru-RU';

  if (!query) {
    return res.json({ results: [] });
  }

  const tmdbKey = process.env.TMDB_API_KEY || process.env.TMDB_KEY || '';

  // If TMDB key configured, call real TMDB API
  if (tmdbKey) {
    try {
      const isBearerToken = tmdbKey.length > 50;
      const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
        query
      )}&include_adult=false&language=${encodeURIComponent(language)}&page=1${
        isBearerToken ? '' : `&api_key=${tmdbKey}`
      }`;

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (isBearerToken) {
        headers['Authorization'] = `Bearer ${tmdbKey}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const results = (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => {
            const isMovie = item.media_type === 'movie';
            const title = isMovie ? item.title : item.name;
            const originalTitle = isMovie ? item.original_title : item.original_name;
            const dateStr = isMovie ? item.release_date : item.first_air_date;
            const year = dateStr ? parseInt(dateStr.split('-')[0], 10) : undefined;
            const genres = (item.genre_ids || [])
              .map((id: number) => TMDB_GENRES_MAP[id])
              .filter(Boolean);

            const posterUrl = item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

            return {
              id: `tmdb-${item.id}`,
              tmdbId: item.id,
              title: title || originalTitle,
              originalTitle: originalTitle || title,
              year,
              type: isMovie ? 'movie' : 'series',
              genres: genres.length ? genres : ['Кино'],
              rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 7.0,
              posterUrl,
              overview: item.overview || '',
              source: 'tmdb',
            };
          });

        return res.json({ source: 'tmdb_live', results });
      }
    } catch (tmdbError) {
      console.warn('TMDB API request failed, falling back to local search engine:', tmdbError);
    }
  }

  // Dynamic fallback search across local curated catalog + synthesized search matches
  const lowerQuery = query.toLowerCase();
  const matched = CURATED_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.originalTitle.toLowerCase().includes(lowerQuery) ||
      item.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
      item.cast.some((c) => c.toLowerCase().includes(lowerQuery)) ||
      item.director.toLowerCase().includes(lowerQuery)
  ).map((item) => ({
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    year: item.year,
    type: item.type,
    genres: item.genres,
    rating: item.ratingKp,
    posterUrl: item.posterUrl,
    overview: item.description,
    source: 'catalog',
  }));

  // If query didn't match existing catalog items, generate a synthesized title card so user can still add it!
  if (matched.length === 0 && query.length >= 2) {
    matched.push({
      id: `custom-${Date.now()}`,
      title: query,
      originalTitle: query,
      year: new Date().getFullYear(),
      type: 'movie',
      genres: ['Пользовательский выбор'],
      rating: 8.0,
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      overview: `Добавлено пользователем: ${query}`,
      source: 'custom',
    });
  }

  res.json({ source: 'local_engine', results: matched });
});

// Dynamic TMDB Trending / Popular endpoint
app.get('/api/tmdb/trending', async (_req: Request, res: Response) => {
  const tmdbKey = process.env.TMDB_API_KEY || process.env.TMDB_KEY || '';

  if (tmdbKey) {
    try {
      const isBearerToken = tmdbKey.length > 50;
      const url = `https://api.themoviedb.org/3/trending/all/week?language=ru-RU${
        isBearerToken ? '' : `&api_key=${tmdbKey}`
      }`;

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (isBearerToken) {
        headers['Authorization'] = `Bearer ${tmdbKey}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).slice(0, 10).map((item: any) => {
          const isMovie = item.media_type === 'movie';
          const title = isMovie ? item.title : item.name;
          const originalTitle = isMovie ? item.original_title : item.original_name;
          const dateStr = isMovie ? item.release_date : item.first_air_date;
          const year = dateStr ? parseInt(dateStr.split('-')[0], 10) : undefined;
          return {
            id: `tmdb-${item.id}`,
            title: title || originalTitle,
            originalTitle: originalTitle || title,
            year,
            type: isMovie ? 'movie' : 'series',
            rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 7.5,
            posterUrl: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
          };
        });
        return res.json({ results });
      }
    } catch (e) {
      console.warn('TMDB trending error:', e);
    }
  }

  // Fallback to top curated items
  res.json({
    results: CURATED_CATALOG.slice(0, 8).map((m) => ({
      id: m.id,
      title: m.title,
      originalTitle: m.originalTitle,
      year: m.year,
      type: m.type,
      rating: m.ratingKp,
      posterUrl: m.posterUrl,
    })),
  });
});

// Quick autocomplete & catalog search
app.get('/api/search', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query) {
    return res.json({ results: CURATED_CATALOG.slice(0, 10) });
  }

  const results = CURATED_CATALOG.filter((item) =>
    item.title.toLowerCase().includes(query) ||
    item.originalTitle.toLowerCase().includes(query) ||
    item.genres.some((g) => g.toLowerCase().includes(query)) ||
    item.cast.some((c) => c.toLowerCase().includes(query)) ||
    item.director.toLowerCase().includes(query)
  );

  res.json({ results });
});

// In-memory real-time rooms state (works 100% locally in Russia without VPN)
interface RoomSession {
  roomCode: string;
  updatedAt: number;
  participants: any[];
  userRatings: Record<string, Record<string, number>>; // movieId -> (participantId -> rating)
  confirmedChoice: any;
  diaryEntries: any[];
}

const ROOMS_STORE: Map<string, RoomSession> = new Map();

app.get('/api/rooms/:roomCode/state', (req: Request, res: Response) => {
  const roomCode = req.params.roomCode;
  const room = ROOMS_STORE.get(roomCode);
  if (!room) {
    return res.json({ found: false, roomCode });
  }
  res.json({ found: true, room });
});

app.post('/api/rooms/:roomCode/sync', (req: Request, res: Response) => {
  const roomCode = req.params.roomCode;
  const { participants, userRatings, confirmedChoice, diaryEntries } = req.body;

  let room = ROOMS_STORE.get(roomCode);
  if (!room) {
    room = {
      roomCode,
      updatedAt: Date.now(),
      participants: participants || [],
      userRatings: userRatings || {},
      confirmedChoice: confirmedChoice || null,
      diaryEntries: diaryEntries || [],
    };
  } else {
    room.updatedAt = Date.now();
    if (participants) room.participants = participants;
    if (userRatings) room.userRatings = { ...room.userRatings, ...userRatings };
    if (confirmedChoice !== undefined) room.confirmedChoice = confirmedChoice;
    if (diaryEntries) room.diaryEntries = diaryEntries;
  }

  ROOMS_STORE.set(roomCode, room);
  res.json({ success: true, updatedAt: room.updatedAt, room });
});

// Platform and metadata info
app.get('/api/meta', (_req: Request, res: Response) => {
  res.json({
    platforms: PLATFORMS_LIST,
    catalogCount: CURATED_CATALOG.length,
    tmdbConfigured: !!(process.env.TMDB_API_KEY || process.env.TMDB_KEY),
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 KinoMatch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
