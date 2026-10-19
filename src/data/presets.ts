export interface TastePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  favoriteGenres: string[];
  favoriteActors: string[];
  sampleTitles: { id: string; title: string; year: number }[];
  suggestedVetoes: string[];
}

export const TASTE_PRESETS: TastePreset[] = [
  {
    id: 'cinematic-aesthetic',
    name: 'Киноман-эстет',
    badge: '🎬 Визуал & Мысль',
    description: 'Нолан, Финчер, глубокие сюжеты с неожиданными развязками',
    favoriteGenres: ['Фантастика', 'Триллер', 'Детектив', 'Драма'],
    favoriteActors: ['Кристофер Нолан', 'Киллиан Мёрфи', 'Леонардо Ди Каприо'],
    sampleTitles: [
      { id: 'inception', title: 'Начало', year: 2010 },
      { id: 'interstellar', title: 'Интерстеллар', year: 2014 },
      { id: 'shutter-island', title: 'Остров проклятых', year: 2009 },
    ],
    suggestedVetoes: ['Без глупых бессмысленных стрелялок 🔫', 'Без банальных слащавых мелодрам 💔'],
  },
  {
    id: 'cozy-evening',
    name: 'Уютный вечер',
    badge: '🛋️ Антистресс & Тепло',
    description: 'Добрые комедии, вдохновляющие истории, искренний смех',
    favoriteGenres: ['Комедия', 'Драма', 'Семейный', 'Биография'],
    favoriteActors: ['Том Хэнкс', 'Эмма Стоун', 'Райан Гослинг'],
    sampleTitles: [
      { id: 'intouchables', title: '1+1 (Неприкасаемые)', year: 2011 },
      { id: 'green-book', title: 'Зеленая книга', year: 2018 },
      { id: 'ted-lasso', title: 'Тед Лассо', year: 2020 },
    ],
    suggestedVetoes: ['Никаких хорроров и скримеров 🚫', 'Без крови, расчленёнки и пыток 🩸', 'Без тяжёлой депрессивной драмы 😢'],
  },
  {
    id: 'adrenaline-drive',
    name: 'Драйв & Экшен',
    badge: '⚡ Динамика & Стиль',
    description: 'Гай Ричи, криминал с черным юмором, крутые перестрелки',
    favoriteGenres: ['Криминал', 'Боевик', 'Комедия', 'Триллер'],
    favoriteActors: ['Гай Ричи', 'Мэттью Макконахи', 'Брэд Питт', 'Киану Ривз'],
    sampleTitles: [
      { id: 'the-gentlemen', title: 'Джентльмены', year: 2019 },
      { id: 'knives-out', title: 'Достать ножи', year: 2019 },
    ],
    suggestedVetoes: ['Без затянутости (> 2 часов) ⏱️', 'Никакого заумного артхауса 🌀'],
  },
  {
    id: 'mystery-detective',
    name: 'Охотник за тайнами',
    badge: '🔍 Интрига до конца',
    description: 'Детективы, загадки, закрытые комнаты, подозрение на каждого',
    favoriteGenres: ['Детектив', 'Триллер', 'Криминал'],
    favoriteActors: ['Дэниел Крэйг', 'Ана де Армас', 'Джейк Джилленхол'],
    sampleTitles: [
      { id: 'knives-out', title: 'Достать ножи', year: 2019 },
      { id: 'severance', title: 'Разделение', year: 2022 },
      { id: 'shutter-island', title: 'Остров проклятых', year: 2009 },
    ],
    suggestedVetoes: ['Без пошлого юмора и кринжа 🙈'],
  },
  {
    id: 'animation-fantasy',
    name: 'Анимация & Фэнтези',
    badge: '🎨 Магия & Воображение',
    description: 'Шедевры Миядзаки, Pixar, Аркейн и Спайдер-Верс',
    favoriteGenres: ['Анимация', 'Фантастика', 'Приключения', 'Семейный'],
    favoriteActors: ['Хаяо Миядзаки'],
    sampleTitles: [
      { id: 'spirited-away', title: 'Унесённые призраками', year: 2001 },
      { id: 'spider-verse', title: 'Человек-паук: Через вселенные', year: 2018 },
      { id: 'arcane', title: 'Аркейн', year: 2021 },
    ],
    suggestedVetoes: ['Без пошлого юмора и кринжа 🙈', 'Без тяжелой депрессивной драмы 😢'],
  },
];
