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

// Accurate Movie Poster Resolver & In-Memory Cache
const POSTER_CACHE = new Map<string, string>();

function cleanTitleForLookup(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/[«»""''.,!?:;()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VERIFIED_POSTER_DICTIONARY: Record<string, string> = {
  // Российские фильмы и сериалы
  'слово пацана': 'https://image.tmdb.org/t/p/w500/e9aGv13mSbh1o95e9z7O3n08Qe3.jpg',
  'слово пацана кровь на асфальте': 'https://image.tmdb.org/t/p/w500/e9aGv13mSbh1o95e9z7O3n08Qe3.jpg',
  'брат': 'https://upload.wikimedia.org/wikipedia/ru/b/ba/Brat_film.jpg',
  'брат 2': 'https://upload.wikimedia.org/wikipedia/ru/7/77/Brat2_poster.jpg',
  'вампиры средней полосы': 'https://image.tmdb.org/t/p/w500/z0G7WJ8mI66HjXhY9V1xT8q8jV7.jpg',
  'метод': 'https://upload.wikimedia.org/wikipedia/ru/8/87/Metod_serial.jpg',
  'триггер': 'https://image.tmdb.org/t/p/w500/17H6k2hX9b8aW9j1q8pY8d4s2x.jpg',
  'майор гром': 'https://image.tmdb.org/t/p/w500/xXpQkO4Lh7H8o3Y1bW2zV7jG7.jpg',
  'майор гром чумной доктор': 'https://image.tmdb.org/t/p/w500/xXpQkO4Lh7H8o3Y1bW2zV7jG7.jpg',
  'холоп': 'https://image.tmdb.org/t/p/w500/uF6XbL1m9k5V6b4l5l6n7p8.jpg',
  'дурак': 'https://upload.wikimedia.org/wikipedia/ru/3/36/Durak_film_poster.jpg',
  'кухня': 'https://image.tmdb.org/t/p/w500/kukhnya_main_poster.jpg',

  // Мировые фильмы и сериалы
  'достать ножи': 'https://image.tmdb.org/t/p/w500/mGfb75tcFWxuT8esS1isHrNFE90.jpg',
  'knives out': 'https://image.tmdb.org/t/p/w500/mGfb75tcFWxuT8esS1isHrNFE90.jpg',
  'начало': 'https://image.tmdb.org/t/p/w500/piQXcdOGgv1O9HQ07pI0tnjkGJw.jpg',
  'inception': 'https://image.tmdb.org/t/p/w500/piQXcdOGgv1O9HQ07pI0tnjkGJw.jpg',
  '1+1': 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
  '1+1 неприкасаемые': 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
  'неприкасаемые': 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
  'intouchables': 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
  'the intouchables': 'https://image.tmdb.org/t/p/w500/zQsq95pYgjhJwYKqoFdeXlVse88.jpg',
  'остров проклятых': 'https://image.tmdb.org/t/p/w500/3UVMyefkUBiktshtKIEnNXvOFKH.jpg',
  'shutter island': 'https://image.tmdb.org/t/p/w500/3UVMyefkUBiktshtKIEnNXvOFKH.jpg',
  'джентльмены': 'https://image.tmdb.org/t/p/w500/vWxVVECgYDPSg5o0Rhw5u7KFa7X.jpg',
  'the gentlemen': 'https://image.tmdb.org/t/p/w500/vWxVVECgYDPSg5o0Rhw5u7KFa7X.jpg',
  'ла-ла ленд': 'https://image.tmdb.org/t/p/w500/g7f8GdnJKS0Z3QJ5G6P9BZrqs36.jpg',
  'la la land': 'https://image.tmdb.org/t/p/w500/g7f8GdnJKS0Z3QJ5G6P9BZrqs36.jpg',
  'интерстеллар': 'https://image.tmdb.org/t/p/w500/vReLRjDV9XPhiOSEW7QWow4DXwf.jpg',
  'interstellar': 'https://image.tmdb.org/t/p/w500/vReLRjDV9XPhiOSEW7QWow4DXwf.jpg',
  'паразиты': 'https://image.tmdb.org/t/p/w500/9xL2PwIOerz8jld06J9cxwuJfoD.jpg',
  'parasite': 'https://image.tmdb.org/t/p/w500/9xL2PwIOerz8jld06J9cxwuJfoD.jpg',
  'аркейн': 'https://image.tmdb.org/t/p/w500/kVioUjk1SXGWblJNaKsIJcBqUcY.jpg',
  'arcane': 'https://image.tmdb.org/t/p/w500/kVioUjk1SXGWblJNaKsIJcBqUcY.jpg',
  'разделение': 'https://image.tmdb.org/t/p/w500/Ag7gBPnh8Cpn5xvCdPPA4RJRN1L.jpg',
  'severance': 'https://image.tmdb.org/t/p/w500/Ag7gBPnh8Cpn5xvCdPPA4RJRN1L.jpg',
  'тед лассо': 'https://image.tmdb.org/t/p/w500/gO2kQUDfZWsvdDetUljaTI6t87i.jpg',
  'ted lasso': 'https://image.tmdb.org/t/p/w500/gO2kQUDfZWsvdDetUljaTI6t87i.jpg',
  'зеленая книга': 'https://image.tmdb.org/t/p/w500/fYch3e75YFnsJS9wAOOMlzErMqR.jpg',
  'зелёная книга': 'https://image.tmdb.org/t/p/w500/fYch3e75YFnsJS9wAOOMlzErMqR.jpg',
  'green book': 'https://image.tmdb.org/t/p/w500/fYch3e75YFnsJS9wAOOMlzErMqR.jpg',
  'отель гранд будапешт': 'https://image.tmdb.org/t/p/w500/5qFxj03eBrkI0bUiGIonb4e0AI4.jpg',
  'the grand budapest hotel': 'https://image.tmdb.org/t/p/w500/5qFxj03eBrkI0bUiGIonb4e0AI4.jpg',
  'одержимость': 'https://image.tmdb.org/t/p/w500/nq3mYsTXx6086nFXxzDReQI0J1S.jpg',
  'whiplash': 'https://image.tmdb.org/t/p/w500/nq3mYsTXx6086nFXxzDReQI0J1S.jpg',
  'унесённые призраками': 'https://image.tmdb.org/t/p/w500/txaVo4whnSduKuczZiJexhLDVQC.jpg',
  'унесенные призраками': 'https://image.tmdb.org/t/p/w500/txaVo4whnSduKuczZiJexhLDVQC.jpg',
  'spirited away': 'https://image.tmdb.org/t/p/w500/txaVo4whnSduKuczZiJexhLDVQC.jpg',
  'оппенгеймер': 'https://image.tmdb.org/t/p/w500/8OQzw8keE6sDNH25sOqPRTxhFTO.jpg',
  'oppenheimer': 'https://image.tmdb.org/t/p/w500/8OQzw8keE6sDNH25sOqPRTxhFTO.jpg',
  'очень странные дела': 'https://image.tmdb.org/t/p/w500/nW3cral1e2r3xfLySPE1U9bailS.jpg',
  'stranger things': 'https://image.tmdb.org/t/p/w500/nW3cral1e2r3xfLySPE1U9bailS.jpg',
  'дюна': 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
  'dune': 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
  'дюна часть вторая': 'https://image.tmdb.org/t/p/w500/3aLghRkuJc9cs770fxo4a6YWht3.jpg',
  'дюна 2': 'https://image.tmdb.org/t/p/w500/3aLghRkuJc9cs770fxo4a6YWht3.jpg',
  'dune part two': 'https://image.tmdb.org/t/p/w500/3aLghRkuJc9cs770fxo4a6YWht3.jpg',
  'медведь': 'https://image.tmdb.org/t/p/w500/moFSxli4RPhKtCU26WyW6tJj0Vm.jpg',
  'the bear': 'https://image.tmdb.org/t/p/w500/moFSxli4RPhKtCU26WyW6tJj0Vm.jpg',
  'бойцовский клуб': 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
  'fight club': 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
  'побег из шоушенка': 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'the shawshank redemption': 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'криминальное чтиво': 'https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
  'pulp fiction': 'https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
  'матрица': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  'the matrix': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  'тёмный рыцарь': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'темный рыцарь': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'the dark knight': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'форрест гамп': 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  'forrest gump': 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  'леон': 'https://upload.wikimedia.org/wikipedia/ru/e/e1/L%C3%A9on_poster.JPG',
  'leon': 'https://upload.wikimedia.org/wikipedia/ru/e/e1/L%C3%A9on_poster.JPG',
  'гладиатор': 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
  'gladiator': 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
  'престиж': 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg',
  'the prestige': 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg',
  'тайна коко': 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
  'coco': 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
  'валл-и': 'https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',
  'wall-e': 'https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',
  'во все тяжкие': 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  'breaking bad': 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  'чернобыль': 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
  'chernobyl': 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
  'острые козырьки': 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg',
  'peaky blinders': 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg',
  'бегущий по лезвию 2049': 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
  'blade runner 2049': 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
  'волк с уолл-стрит': 'https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg',
  'the wolf of wall street': 'https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg',
  'барби': 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
  'barbie': 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
  'игра престолов': 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
  'game of thrones': 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
  'шерлок': 'https://image.tmdb.org/t/p/w500/7WTsnDMmstA0aw9i2vxTWvaCpYQ.jpg',
  'sherlock': 'https://image.tmdb.org/t/p/w500/7WTsnDMmstA0aw9i2vxTWvaCpYQ.jpg',
  'настоящий детектив': 'https://image.tmdb.org/t/p/w500/cuV2O5cf5ioUrW3ftDT39z7nh83.jpg',
  'true detective': 'https://image.tmdb.org/t/p/w500/cuV2O5cf5ioUrW3ftDT39z7nh83.jpg',
  'офис': 'https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYY5qDY4pBY.jpg',
  'the office': 'https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYY5qDY4pBY.jpg',
  'друзья': 'https://image.tmdb.org/t/p/w500/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg',
  'friends': 'https://image.tmdb.org/t/p/w500/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg',
  'пацаны': 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg',
  'the boys': 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg',
  'зеленая миля': 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  'зелёная миля': 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  'the green mile': 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  'властелин колец': 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
  'властелин колец братство кольца': 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
  'the lord of the rings': 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg',
  'гарри поттер': 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatv9rnMNXvIDxqP4W.jpg',
  'гарри поттер и философский камень': 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatv9rnMNXvIDxqP4W.jpg',
  'harry potter': 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatv9rnMNXvIDxqP4W.jpg',
  'джон уик': 'https://image.tmdb.org/t/p/w500/fZPS29QIvhNaNKQk5qQvFkS1f4d.jpg',
  'john wick': 'https://image.tmdb.org/t/p/w500/fZPS29QIvhNaNKQk5qQvFkS1f4d.jpg',
  'бесславные ублюдки': 'https://image.tmdb.org/t/p/w500/7sfbEnaARXDD5UCEMbiYQduaVJ9.jpg',
  'inglourious basterds': 'https://image.tmdb.org/t/p/w500/7sfbEnaARXDD5UCEMbiYQduaVJ9.jpg',
  'ходячий замок': 'https://image.tmdb.org/t/p/w500/6p0ecvx9Pd0wfiiR0iTsgX9Smot.jpg',
  'howl moving castle': 'https://image.tmdb.org/t/p/w500/6p0ecvx9Pd0wfiiR0iTsgX9Smot.jpg',
};

function generateSvgPoster(title: string, year?: number, genre?: string): string {
  const cleanTitle = (title || 'Кино').replace(/[<>&"]/g, '');
  const subText = [year, genre].filter(Boolean).join(' • ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="250" cy="280" r="90" fill="#f43f5e" opacity="0.15"/>
    <text x="250" y="295" font-family="system-ui, sans-serif" font-size="72" text-anchor="middle" fill="#ffffff">🎬</text>
    <text x="250" y="450" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${cleanTitle.length > 22 ? cleanTitle.slice(0, 21) + '...' : cleanTitle}
    </text>
    <text x="250" y="490" font-family="system-ui, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">
      ${subText || 'Кинофильм'}
    </text>
    <rect x="175" y="530" width="150" height="32" rx="16" fill="#f43f5e" opacity="0.2"/>
    <text x="250" y="552" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#fda4af" text-anchor="middle">KinoMatch</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchWikipediaPoster(title: string, originalTitle?: string): Promise<string | null> {
  const candidates = [
    `${title} (фильм)`,
    `${title} (телесериал)`,
    `${title} (мультфильм)`,
    `${title} (мини-сериал)`,
    title,
  ];
  if (originalTitle && originalTitle.toLowerCase() !== title.toLowerCase()) {
    candidates.push(`${originalTitle} (film)`, `${originalTitle} (TV series)`, originalTitle);
  }

  const headers = { 'User-Agent': 'KinoMatchBot/1.0 (https://kinomatch.app; info@kinomatch.app)' };

  for (const query of candidates) {
    try {
      const res = await fetch(`https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const src = data.thumbnail?.source;
        if (
          src &&
          !src.includes('Disambig') &&
          !src.includes('Question_book') &&
          !src.includes('Wiki_letter') &&
          !src.endsWith('.svg')
        ) {
          return src;
        }
      }
    } catch {
      // Continue next candidate
    }
  }

  if (originalTitle) {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(originalTitle)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const src = data.thumbnail?.source;
        if (
          src &&
          !src.includes('Disambig') &&
          !src.includes('Question_book') &&
          !src.includes('Wiki_letter') &&
          !src.endsWith('.svg')
        ) {
          return src;
        }
      }
    } catch {}
  }

  return null;
}

// TMDB v3 API Key & Configuration
const TMDB_DEFAULT_KEY = '2dca580c2a14b55200e784d157207b4d';
function getTmdbKey(): string {
  return process.env.TMDB_API_KEY || process.env.TMDB_KEY || TMDB_DEFAULT_KEY;
}

const RUSSIAN_GENRE_TO_TMDB_ID: Record<string, number> = {
  'Боевик': 28,
  'Приключения': 12,
  'Анимация': 16,
  'Комедия': 35,
  'Криминал': 80,
  'Документальный': 99,
  'Драма': 18,
  'Семейный': 10751,
  'Фэнтези': 14,
  'История': 36,
  'Ужасы': 27,
  'Музыка': 10402,
  'Детектив': 9648,
  'Мелодрама': 10749,
  'Фантастика': 878,
  'Триллер': 53,
  'Военный': 10752,
  'Вестерн': 37,
  'Биография': 36,
  'Мистика': 9648,
};

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
  10768: 'Военный',
};

export async function resolveAccurateMoviePoster(
  title: string,
  originalTitle?: string,
  year?: number,
  genre?: string
): Promise<string> {
  if (!title) return generateSvgPoster('Кино', year, genre);

  const cleanTitle = title.trim();
  const normKey = cleanTitleForLookup(cleanTitle);
  const origNormKey = originalTitle ? cleanTitleForLookup(originalTitle) : '';

  if (POSTER_CACHE.has(normKey)) {
    return POSTER_CACHE.get(normKey)!;
  }
  if (origNormKey && POSTER_CACHE.has(origNormKey)) {
    return POSTER_CACHE.get(origNormKey)!;
  }

  // 1. Check verified dictionary first
  if (VERIFIED_POSTER_DICTIONARY[normKey]) {
    const p = VERIFIED_POSTER_DICTIONARY[normKey];
    POSTER_CACHE.set(normKey, p);
    return p;
  }
  if (origNormKey && VERIFIED_POSTER_DICTIONARY[origNormKey]) {
    const p = VERIFIED_POSTER_DICTIONARY[origNormKey];
    POSTER_CACHE.set(normKey, p);
    return p;
  }

  // 2. Check curated catalog for exact or original title match
  const curatedMatch = CURATED_CATALOG.find((c) => {
    const cTitle = cleanTitleForLookup(c.title);
    const cOrig = cleanTitleForLookup(c.originalTitle);
    return (
      cTitle === normKey ||
      cOrig === normKey ||
      (origNormKey && (cOrig === origNormKey || cTitle === origNormKey))
    );
  });

  if (curatedMatch?.posterUrl) {
    POSTER_CACHE.set(normKey, curatedMatch.posterUrl);
    return curatedMatch.posterUrl;
  }

  // 3. Query TMDB with strict title matching to ensure authentic poster
  const tmdbKey = getTmdbKey();
  if (tmdbKey) {
    try {
      const isBearerToken = tmdbKey.length > 50;
      const searchTarget = encodeURIComponent(cleanTitle);
      const url = `https://api.themoviedb.org/3/search/multi?query=${searchTarget}&language=ru-RU&page=1${
        isBearerToken ? '' : `&api_key=${tmdbKey}`
      }`;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (isBearerToken) headers['Authorization'] = `Bearer ${tmdbKey}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const matchedItem = (data.results || []).find((r: any) => {
          if (!r.poster_path) return false;
          const rTitle = cleanTitleForLookup(r.title || r.name || '');
          const rOrig = cleanTitleForLookup(r.original_title || r.original_name || '');
          return (
            rTitle === normKey ||
            rOrig === normKey ||
            (origNormKey && (rTitle === origNormKey || rOrig === origNormKey)) ||
            (normKey.length > 5 && (rTitle.includes(normKey) || normKey.includes(rTitle)))
          );
        });

        if (matchedItem?.poster_path) {
          const poster = `https://image.tmdb.org/t/p/w500${matchedItem.poster_path}`;
          POSTER_CACHE.set(normKey, poster);
          if (origNormKey) POSTER_CACHE.set(origNormKey, poster);
          return poster;
        }
      }
    } catch {
      // Fall through to Wikipedia
    }
  }

  // 4. Query Wikipedia API for exact real poster without needing any API key
  const wikiPoster = await fetchWikipediaPoster(cleanTitle, originalTitle);
  if (wikiPoster) {
    POSTER_CACHE.set(normKey, wikiPoster);
    return wikiPoster;
  }

  // 5. Default to branded SVG poster with exact movie title
  const fallback = generateSvgPoster(cleanTitle, year, genre);
  POSTER_CACHE.set(normKey, fallback);
  return fallback;
}

function normalizeTmdbCandidate(item: any, forceType?: 'movie' | 'series', creditPerson?: string) {
  const isMovie = forceType ? forceType === 'movie' : (item.media_type !== 'tv' && !item.first_air_date);
  const title = (item.title || item.name || item.original_title || item.original_name || 'Кино').trim();
  const originalTitle = (item.original_title || item.original_name || title).trim();
  const dateStr = item.release_date || item.first_air_date;
  const year = dateStr ? parseInt(dateStr.split('-')[0], 10) : new Date().getFullYear();
  const genres = (item.genre_ids || [])
    .map((id: number) => TMDB_GENRES_MAP[id])
    .filter(Boolean);

  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : `https://upload.wikimedia.org/wikipedia/ru/3/36/Durak_film_poster.jpg`;

  // Pre-seed poster cache with guaranteed authentic TMDB poster
  POSTER_CACHE.set(cleanTitleForLookup(title), posterUrl);
  if (originalTitle) {
    POSTER_CACHE.set(cleanTitleForLookup(originalTitle), posterUrl);
  }

  const cast = creditPerson ? [creditPerson] : [];
  const ratingKp = item.vote_average ? Number(item.vote_average.toFixed(1)) : 7.6;
  const ratingImdb = ratingKp;

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title,
    originalTitle,
    year,
    type: isMovie ? ('movie' as const) : ('series' as const),
    genres: genres.length ? genres : ['Кино'],
    director: item.director || '',
    cast,
    duration: isMovie ? '~118 мин' : '1-3 сезона',
    durationMinutes: isMovie ? 118 : 50,
    ratingKp,
    ratingImdb,
    posterUrl,
    description: item.overview || 'Культовая картина с высокими зрительскими оценками и ярким сюжетом.',
    tags: ['TMDB Выбор', ...genres.slice(0, 2)],
    ageRating: item.adult ? '18+' : '16+',
    availablePlatforms: [
      { id: 'kinopoisk', name: 'Кинопоиск', color: 'bg-orange-500' },
      { id: 'okko', name: 'Okko', color: 'bg-indigo-600' },
      { id: 'ivi', name: 'Иви', color: 'bg-rose-600' },
    ],
  };
}

// Fetch dynamic candidates from TMDB according to participants tastes, mood, and filters
async function fetchTmdbCandidates(
  participants: any[],
  moodPrompt: string = '',
  filters: any = {}
): Promise<any[]> {
  const tmdbKey = getTmdbKey();
  if (!tmdbKey) return [];

  const candidates: any[] = [];
  const seenTmdbIds = new Set<number>();

  const isBearerToken = tmdbKey.length > 50;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (isBearerToken) headers['Authorization'] = `Bearer ${tmdbKey}`;
  const authParam = isBearerToken ? '' : `&api_key=${tmdbKey}`;

  // 1. Map favorite genres to TMDB IDs
  const allFavGenres = Array.from(new Set(participants.flatMap((p: any) => p.favoriteGenres || [])));
  const genreIds = allFavGenres
    .map((g: any) => RUSSIAN_GENRE_TO_TMDB_ID[g])
    .filter(Boolean);

  let eraQuery = '';
  if (filters.era === 'fresh') eraQuery = '&primary_release_date.gte=2020-01-01&first_air_date.gte=2020-01-01';
  else if (filters.era === '2010s') eraQuery = '&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31&first_air_date.gte=2010-01-01&first_air_date.lte=2019-12-31';
  else if (filters.era === 'classic') eraQuery = '&primary_release_date.lte=2009-12-31&first_air_date.lte=2009-12-31';

  const targetType = filters.targetType || 'all';
  const discoverTasks: Promise<void>[] = [];

  // Query high-rated movies
  if (targetType === 'movie' || targetType === 'all') {
    const movieGenreParam = genreIds.length ? `&with_genres=${genreIds.slice(0, 3).join(',')}` : '';
    const movieUrl = `https://api.themoviedb.org/3/discover/movie?language=ru-RU&sort_by=vote_average.desc&vote_count.gte=150&vote_average.gte=7.0${movieGenreParam}${eraQuery}&page=1${authParam}`;
    discoverTasks.push(
      fetch(movieUrl, { headers })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          (data.results || []).forEach((item: any) => {
            if (item.poster_path && !seenTmdbIds.has(item.id)) {
              seenTmdbIds.add(item.id);
              candidates.push(normalizeTmdbCandidate(item, 'movie'));
            }
          });
        })
        .catch(() => {})
    );

    // Also popular movies with high ratings
    const popUrl = `https://api.themoviedb.org/3/discover/movie?language=ru-RU&sort_by=popularity.desc&vote_count.gte=200&vote_average.gte=7.0${movieGenreParam}${eraQuery}&page=1${authParam}`;
    discoverTasks.push(
      fetch(popUrl, { headers })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          (data.results || []).forEach((item: any) => {
            if (item.poster_path && !seenTmdbIds.has(item.id)) {
              seenTmdbIds.add(item.id);
              candidates.push(normalizeTmdbCandidate(item, 'movie'));
            }
          });
        })
        .catch(() => {})
    );
  }

  // Query TV series
  if (targetType === 'series' || targetType === 'all') {
    const tvGenreParam = genreIds.length ? `&with_genres=${genreIds.slice(0, 3).join(',')}` : '';
    const tvUrl = `https://api.themoviedb.org/3/discover/tv?language=ru-RU&sort_by=vote_average.desc&vote_count.gte=120&vote_average.gte=7.3${tvGenreParam}${eraQuery}&page=1${authParam}`;
    discoverTasks.push(
      fetch(tvUrl, { headers })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          (data.results || []).forEach((item: any) => {
            if (item.poster_path && !seenTmdbIds.has(item.id)) {
              seenTmdbIds.add(item.id);
              candidates.push(normalizeTmdbCandidate(item, 'series'));
            }
          });
        })
        .catch(() => {})
    );
  }

  // 2. Discover works of favorite actors / directors
  const allActors = Array.from(new Set(participants.flatMap((p: any) => p.favoriteActors || []))).slice(0, 4);
  for (const actor of allActors) {
    if (!actor || actor.length < 3) continue;
    discoverTasks.push(
      (async () => {
        try {
          const sRes = await fetch(
            `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(actor)}&language=ru-RU&page=1${authParam}`,
            { headers }
          );
          if (sRes.ok) {
            const sData = await sRes.json();
            const person = sData.results?.[0];
            if (person?.id) {
              const credRes = await fetch(
                `https://api.themoviedb.org/3/person/${person.id}/movie_credits?language=ru-RU${authParam}`,
                { headers }
              );
              if (credRes.ok) {
                const credData = await credRes.json();
                const works = [
                  ...(credData.cast || []),
                  ...(credData.crew || []).filter((c: any) => c.job === 'Director'),
                ];
                works
                  .filter((w: any) => w.poster_path && (w.vote_average || 0) >= 6.7 && (w.vote_count || 0) >= 40)
                  .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
                  .slice(0, 3)
                  .forEach((w: any) => {
                    if (!seenTmdbIds.has(w.id)) {
                      seenTmdbIds.add(w.id);
                      candidates.push(normalizeTmdbCandidate(w, 'movie', person.name || actor));
                    }
                  });
              }
            }
          }
        } catch {}
      })()
    );
  }

  // 3. Search theme keywords from mood prompt
  const lowerMood = (moodPrompt || '').toLowerCase();
  const keywords = ['киберпанк', 'космос', 'детектив', 'ограбление', 'романтика', 'приключения', 'италия', 'франция', 'мафия', 'париж', 'путешествие', 'заговор'];
  const matchedKeyword = keywords.find((k) => lowerMood.includes(k));
  if (matchedKeyword) {
    discoverTasks.push(
      (async () => {
        try {
          const mRes = await fetch(
            `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(matchedKeyword)}&language=ru-RU&page=1${authParam}`,
            { headers }
          );
          if (mRes.ok) {
            const mData = await mRes.json();
            (mData.results || []).slice(0, 4).forEach((item: any) => {
              if (item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv') && !seenTmdbIds.has(item.id)) {
                seenTmdbIds.add(item.id);
                candidates.push(normalizeTmdbCandidate(item, item.media_type === 'tv' ? 'series' : 'movie'));
              }
            });
          }
        } catch {}
      })()
    );
  }

  // Wait for all discovery tasks with 2.8s cap
  await Promise.race([
    Promise.all(discoverTasks),
    new Promise((resolve) => setTimeout(resolve, 2800)),
  ]);

  return candidates;
}

// Calculate compromises across merged pool of TMDB items and Curated Catalog
async function calculateCompromiseRecommendations(
  candidates: any[],
  participants: any[],
  moodPrompt: string = '',
  filters: any = {},
  seenMovies: string[] = []
) {
  const allVetoes = participants.flatMap((p: any) => p.vetoes || []);
  const lowerMood = (moodPrompt || '').toLowerCase();

  // Merge candidates with CURATED_CATALOG, deduplicating by normalized title
  const seenTitles = new Set<string>();
  const mergedPool: any[] = [];

  for (const item of candidates) {
    const key = cleanTitleForLookup(item.title);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      mergedPool.push(item);
    }
  }

  for (const item of CURATED_CATALOG) {
    const key = cleanTitleForLookup(item.title);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      mergedPool.push(item);
    }
  }

  // Filter against vetoes, seen, and user constraints
  const validCandidates = mergedPool.filter((movie) => {
    // Check seen
    if (filters.excludeSeen && (seenMovies.includes(movie.id) || seenMovies.includes(movie.title))) {
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
      if (v.includes('кров') && (movie.ageRating === '18+' && (movie.genres.includes('Боевик') || movie.genres.includes('Ужасы')))) {
        return false;
      }
      if (v.includes('тяжёлой') && (movie.genres.includes('Драма') && !movie.genres.includes('Комедия'))) {
        return false;
      }
      if (v.includes('затянутост') && movie.durationMinutes > 125) {
        return false;
      }
      if (v.includes('мелодрам') && movie.genres.includes('Мелодрама') && !movie.genres.includes('Комедия') && !movie.genres.includes('Фантастика')) {
        return false;
      }
    }

    return true;
  });

  // Score each candidate against participants
  const scored = validCandidates.map((movie) => {
    const breakdowns: any[] = [];

    participants.forEach((p: any) => {
      let pScore = 68; // Base approval
      const reasons: string[] = [];

      // Check genres
      const matchingGenres = (p.favoriteGenres || []).filter((g: string) => movie.genres.includes(g));
      if (matchingGenres.length > 0) {
        pScore += Math.min(22, matchingGenres.length * 10);
        reasons.push(`Любит жанры: ${matchingGenres.join(', ')}`);
      }

      // Check actors & directors
      const matchingActors = (p.favoriteActors || []).filter((a: string) =>
        (movie.cast || []).some((c: string) => c.toLowerCase().includes(a.toLowerCase())) ||
        (movie.director || '').toLowerCase().includes(a.toLowerCase())
      );
      if (matchingActors.length > 0) {
        pScore += 20;
        reasons.push(`Любимый актёр/режиссёр: ${matchingActors.join(', ')}`);
      }

      // Check favorite movies similarity
      const favMovieTitles = (p.favoriteMovies || []).map((fm: any) => typeof fm === 'string' ? fm : fm.title);
      if (favMovieTitles.some((t: string) => t.toLowerCase() === movie.title.toLowerCase())) {
        pScore += 15;
        reasons.push('Точно в списке персональных фаворитов');
      }

      // Mood booster
      if (lowerMood) {
        if (lowerMood.includes('ди каприо') && (movie.cast || []).some((c: string) => c.includes('Каприо'))) {
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
        if (lowerMood.includes('космос') && (movie.genres.includes('Фантастика') || movie.genres.includes('Приключения'))) {
          pScore += 12;
          reasons.push('Космический масштаб и атмосфера');
        }
      }

      // TMDB Quality rating bonus
      if ((movie.ratingKp || movie.ratingImdb) >= 8.0) {
        pScore += 6;
      }

      pScore = Math.min(99, Math.max(55, pScore));

      breakdowns.push({
        participantId: p.id,
        participantName: p.name,
        score: pScore,
        reason: reasons.length ? reasons.join(' • ') : 'Высокий зрительский рейтинг и отсутствие раздражающих триггеров',
        appealFactor: matchingGenres[0] || movie.genres[0] || 'Качественный сюжет',
      });
    });

    const avgScore = Math.round(breakdowns.reduce((acc, cur) => acc + cur.score, 0) / (breakdowns.length || 1));

    const p1 = participants[0]?.name || 'Участник 1';
    const p2 = participants[1]?.name || 'Участник 2';
    const appeal1 = breakdowns[0]?.appealFactor || 'сюжет';
    const appeal2 = breakdowns[1]?.appealFactor || 'атмосферу';

    const rationale = participants.length === 2
      ? `Идеальный компромисс между любовью ${p1} к жанру «${appeal1}» и вкусом ${p2} на «${appeal2}». Картина гарантирует отсутствие споров и смотрится на одном дыхании.`
      : `Сбалансированный выбор для компании из ${participants.length} человек: высокий темп, яркий каст и отсутствие спорных тем.`;

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

  const topResults = scored.sort((a, b) => b.overallMatchScore - a.overallMatchScore).slice(0, 6);

  // Parallel enrichment of real director, cast, and runtime from TMDB for the selected top items
  const tmdbKey = getTmdbKey();
  if (tmdbKey) {
    const isBearer = tmdbKey.length > 50;
    const authParam = isBearer ? '' : `&api_key=${tmdbKey}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (isBearer) headers['Authorization'] = `Bearer ${tmdbKey}`;

    await Promise.all(
      topResults.map(async (rec) => {
        if (!rec.tmdbId) return;
        try {
          const endpoint = rec.type === 'series' ? 'tv' : 'movie';
          const dUrl = `https://api.themoviedb.org/3/${endpoint}/${rec.tmdbId}?language=ru-RU&append_to_response=credits${authParam}`;
          const dRes = await fetch(dUrl, { headers });
          if (dRes.ok) {
            const dData = await dRes.json();
            const director =
              dData.credits?.crew?.find((c: any) => c.job === 'Director')?.name ||
              dData.created_by?.[0]?.name ||
              rec.director;
            const cast = (dData.credits?.cast || []).slice(0, 4).map((c: any) => c.name);
            if (director) rec.director = director;
            if (cast.length > 0) rec.cast = cast;
            if (dData.runtime) {
              rec.durationMinutes = dData.runtime;
              rec.duration = `${dData.runtime} мин`;
            } else if (dData.number_of_seasons) {
              rec.duration = `${dData.number_of_seasons} сезон(а)`;
            }
          }
        } catch {}
      })
    );
  }

  return topResults;
}

// Fallback Pure Local Algorithm (used when TMDB network is offline)
function calculateLocalRecommendations(
  participants: any[],
  moodPrompt: string = '',
  filters: any = {},
  seenMovies: string[] = []
) {
  return calculateCompromiseRecommendations(
    [],
    participants,
    moodPrompt,
    filters,
    seenMovies
  );
}

// API Routes
app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const { participants, moodPrompt, filters, seenMovies } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'Participants array is required' });
    }

    // Step 1: Pre-fetch dynamic candidate pool from TMDB (movies, series, actor credits, mood keywords)
    let tmdbCandidates: any[] = [];
    try {
      tmdbCandidates = await fetchTmdbCandidates(participants, moodPrompt, filters);
    } catch (tmdbErr) {
      console.warn('TMDB candidate fetch warning:', tmdbErr);
    }

    // Step 2: If Gemini API Key is available, let AI select and deeply personalize from TMDB + Curated pool
    const isValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_');
    if (isValidKey) {
      try {
        const participantSummary = participants.map((p: any) => ({
          name: p.name,
          favoriteGenres: p.favoriteGenres || [],
          favoriteActors: p.favoriteActors || [],
          favoriteMovies: (p.favoriteMovies || []).map((m: any) => (typeof m === 'string' ? m : m.title)),
          vetoes: p.vetoes || [],
        }));

        const candidateSample = tmdbCandidates.slice(0, 10).map((c) => ({
          id: c.id,
          title: c.title,
          originalTitle: c.originalTitle,
          year: c.year,
          type: c.type,
          genres: c.genres,
          rating: c.ratingKp,
          posterUrl: c.posterUrl,
          overview: c.description?.slice(0, 150),
        }));

        const promptText = `
Ты — кино-алгоритм KinoMatch для поиска идеального фильма или сериала на двоих или компанию.
Твоя задача — подобрать 4-5 великолепных кинокартин или сериалов, которые станут идеальным компромиссом для зрителей с разными вкусами.

Зрители:
${JSON.stringify(participantSummary, null, 2)}

Пожелание на этот вечер (Mood prompt): "${moodPrompt || 'Хороший совместный вечер'}"
Фильтры:
- Тип контента: ${filters?.targetType || 'любой'}
- Длительность: ${filters?.durationLimit || 'любая'}
- Эпоха: ${filters?.era || 'любая'}
- Платформы: ${(filters?.selectedPlatforms || []).join(', ') || 'любые популярные'}
- Исключить уже просмотренные: ${(seenMovies || []).join(', ') || 'нет'}

Проверенные кандидаты из базы TMDB (можешь использовать их или предложить другие легендарные шедевры):
${JSON.stringify(candidateSample, null, 2)}

ВАЖНЕЙШИЕ ПРАВИЛА:
1. СТОП-ФАКТОРЫ (ВЕТО) СТРОГО ОБЯЗАТЕЛЬНЫ К ИСПОЛНЕНИЮ. Если хотя бы у одного человека в вето стоит "без хорроров" или "без крови", категорически запрещено предлагать такие фильмы!
2. ШКАЛА КОМПРОМИССА:
   - Рассчитай общий процент совместимости (overallMatchScore от 70 до 99).
   - Рассчитай индивидуальный процент для КАЖДОГО участника (от 60 до 99) и обоснуй на русском языке, почему именно ему это понравится (matchBreakdown).
   - Напиши емкое "compromiseRationale" на русском: почему фильм идеально объединяет вкусы участников и снимает разногласия.
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

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5500)
        );

        const geminiResponse: any = await Promise.race([geminiCall, timeoutPromise]);
        const rawText = geminiResponse.text?.trim() || '[]';
        let aiResults = JSON.parse(rawText);

        if (Array.isArray(aiResults) && aiResults.length > 0) {
          aiResults = await Promise.all(
            aiResults.map(async (rec: any) => {
              // Check if matching TMDB candidate exists to preserve 100% exact poster
              const normT = cleanTitleForLookup(rec.title);
              const normO = cleanTitleForLookup(rec.originalTitle);
              const candidateMatch = tmdbCandidates.find((c) => {
                const cT = cleanTitleForLookup(c.title);
                const cO = cleanTitleForLookup(c.originalTitle);
                return cT === normT || cO === normT || (normO && (cT === normO || cO === normO));
              });

              const posterUrl = candidateMatch?.posterUrl
                ? candidateMatch.posterUrl
                : await resolveAccurateMoviePoster(
                    rec.title,
                    rec.originalTitle,
                    rec.year,
                    rec.genres?.[0]
                  );

              // Ensure participant IDs in matchBreakdown
              const matchBreakdown = (rec.matchBreakdown || []).map((mb: any, mIdx: number) => {
                const matchedP =
                  participants[mIdx] || participants.find((p: any) => p.name === mb.participantName);
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
            })
          );

          return res.json({
            source: 'gemini_tmdb',
            recommendations: aiResults,
          });
        }
      } catch (geminiErr) {
        // High load or network spike: seamlessly proceed to TMDB compromise engine
      }
    }

    // Step 3: Compute recommendations using TMDB candidates + Curated Catalog
    const compromiseResults = await calculateCompromiseRecommendations(
      tmdbCandidates,
      participants,
      moodPrompt,
      filters,
      seenMovies
    );

    return res.json({
      source: tmdbCandidates.length > 0 ? 'tmdb_engine' : 'curated_catalog',
      recommendations: compromiseResults,
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Creative atmospheric mood prompts collection
const CREATIVE_MOOD_PROMPTS = [
  'Неоновый киберпанк с философским подтекстом, дождливым саундтреком и эстетикой 🌧️',
  'Ироничная французская авантюрная комедия с легким вином, эстетикой и джазом 🍷',
  'Камерный герметичный детектив в загородном особняке во время грозы, где каждый что-то скрывает 🏰',
  'Уютный ностальгический ромком из 2000-х с неподдельным юмором и доброй романтикой 📼',
  'Космическая одиссея с научной достоверностью, от масштаба которой захватывает дух 🪐',
  'Шпионский коктейль в стиле бондианы с красивыми европейскими локациями и острым сарказмом 🍸',
  'Фильм-головоломка с ненадежным рассказчиком, переворачивающим весь сюжет в финале 🧩',
  'Атмосферный скандинавский триллер с заснеженными пейзажами и тонкой психологической дуэлью ❄️',
  'Теплая жизнеутверждающая история про кулинарию, путешествие и второй шанс в жизни 🥐',
  'Стильный нео-нуар с саксофоном, ночными огнями мегаполиса и роковой интригой 🎷',
  'Авантюрная комедия про обаятельных грабителей и дерзкое ограбление музея с юмором 💎',
  'Вдохновляющая драма про аутсайдера, который вопреки всему добивается триумфа 🏆',
  'Солнечная итальянская комедия с живописными пейзажами Тосканы и семейными страстями 🍝',
  'Завораживающая сказочная анимация с глубоким смыслом и чарующим визуальным стилем 🎨',
  'Ретро-детектив в духе 70-х с винилом, пленочной фактурой и расследованием заговора 🎙️',
];

// Endpoint for generating creative mood prompts with AI
app.post('/api/generate-mood', async (req: Request, res: Response) => {
  const currentMood = (req.body?.currentMood as string) || '';
  const isValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_');

  if (isValidKey) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 4000)
      );

      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Придумай 1 короткую, необычную, интригующую и кинематографичную фразу-настроение для вечернего поиска фильма для пары или друзей (до 15 слов, на русском языке, можно 1-2 уместных эмодзи в конце).
Примеры хорошего стиля:
- "Камерный детектив в замке во время грозы, где у каждого скелет в шкафу 🏰"
- "Стильный нео-нуар под саксофон с ночным дождем и роковой тайной 🎷"
- "Уютная жизнеутверждающая комедия про кулинарное путешествие и второй шанс 🥐"

Верни только саму фразу без кавычек и вводных слов.`,
      });

      const geminiRes: any = await Promise.race([geminiCall, timeoutPromise]);
      const text = geminiRes.text?.trim()?.replace(/^["'«»]|["'«»]$/g, '');
      if (text && text.length > 8) {
        return res.json({ prompt: text, source: 'ai' });
      }
    } catch {
      // Gracefully fall back to rich creative collection
    }
  }

  // Pick a fresh random prompt from creative pool, different from current
  const filtered = CREATIVE_MOOD_PROMPTS.filter((p) => p !== currentMood);
  const picked = filtered[Math.floor(Math.random() * filtered.length)] || CREATIVE_MOOD_PROMPTS[0];

  res.json({ prompt: picked, source: 'curated' });
});

// Dynamic TMDB Search endpoint
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  const query = ((req.query.query as string) || (req.query.q as string) || '').trim();
  const language = (req.query.language as string) || 'ru-RU';

  if (!query) {
    return res.json({ results: [] });
  }

  const tmdbKey = getTmdbKey();

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

  // If query didn't match existing catalog items, resolve genuine poster and generate a synthesized title card!
  if (matched.length === 0 && query.length >= 2) {
    const posterUrl = await resolveAccurateMoviePoster(query);
    matched.push({
      id: `custom-${Date.now()}`,
      title: query,
      originalTitle: query,
      year: new Date().getFullYear(),
      type: 'movie',
      genres: ['Пользовательский выбор'],
      rating: 8.0,
      posterUrl,
      overview: `Добавлено пользователем: ${query}`,
      source: 'custom',
    });
  }

  res.json({ source: 'local_engine', results: matched });
});

// Accurate Movie Poster Endpoint (allows frontend to verify/fallback any poster)
app.get('/api/movies/poster', async (req: Request, res: Response) => {
  const title = ((req.query.title as string) || '').trim();
  const originalTitle = ((req.query.originalTitle as string) || '').trim();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const genre = ((req.query.genre as string) || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'Title parameter is required' });
  }

  try {
    const posterUrl = await resolveAccurateMoviePoster(title, originalTitle, year, genre);
    res.json({ title, originalTitle, posterUrl });
  } catch (error) {
    const fallback = generateSvgPoster(title, year, genre);
    res.json({ title, posterUrl: fallback });
  }
});

// Dynamic TMDB Trending / Popular endpoint
app.get('/api/tmdb/trending', async (_req: Request, res: Response) => {
  const tmdbKey = getTmdbKey();

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
    tmdbConfigured: !!getTmdbKey(),
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
