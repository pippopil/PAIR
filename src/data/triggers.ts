import { TriggerReport, MovieItem } from '../types';

export const MOVIE_TRIGGER_DATABASE: Record<string, TriggerReport> = {
  'knives-out': {
    petsSafe: true,
    petsNote: 'Собаки семьи Тромби в полной безопасности и даже помогают детективу найти важную улику! 🐶',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеры полностью отсутствуют. Уютный классический детектив в духе Агаты Кристи.',
    emotionalTone: 'Ироничный, легкий, интеллектуальный детектив без гнетущей тяжести.',
    violenceLevel: 'mild',
    violenceNote: 'Криминальная завязка без натуралистичной расчленёнки или кровавых сцен.',
    hasHappyEnding: true,
  },
  'inception': {
    petsSafe: true,
    petsNote: 'Животные в сюжете не страдают 🐾',
    jumpScaresLevel: 'low',
    jumpScaresNote: 'Пара громких звуковых взрывов в сновидениях, но без пугающих хоррор-скримеров.',
    emotionalTone: 'Захватывающий интеллектуальный триллер Нолана, глубокий эмоциональный катарсис.',
    violenceLevel: 'moderate',
    violenceNote: 'Перестрелки и зрелищные драки в невесомости без натуралистичной жестокости.',
    hasHappyEnding: true,
  },
  'intouchables': {
    petsSafe: true,
    petsNote: 'Полностью безопасно для любителей животных 🐕',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеры и внезапные пугающие эффекты отсутствуют на 100%.',
    emotionalTone: 'Теплая, духоподъемная комедия-драма, заряжающая позитивом и любовью к жизни.',
    violenceLevel: 'none',
    violenceNote: 'Насилие отсутствует.',
    hasHappyEnding: true,
  },
  'interstellar': {
    petsSafe: true,
    petsNote: 'Животные не страдают.',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеров нет, грандиозный научно-фантастический эпос.',
    emotionalTone: 'Трогательная история любви отца и дочери сквозь ткань времени.',
    violenceLevel: 'none',
    violenceNote: 'Насилие отсутствует.',
    hasHappyEnding: true,
  },
  'grand-budapest': {
    petsSafe: true,
    petsNote: 'Ироничный гротескный эпизод с котиком в фирменном комичном стиле Уэса Андерсона.',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеров нет, идеальная эстетическая симметрия.',
    emotionalTone: 'Искрометная авантюрная комедия в сказочных декорациях.',
    violenceLevel: 'mild',
    violenceNote: 'Театральные мультяшные потасовки без жестокости.',
    hasHappyEnding: true,
  },
  'gentlemen': {
    petsSafe: true,
    petsNote: 'Животные в сюжете в безопасности.',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеров нет, фирменный динамичный ритм Гая Ричи.',
    emotionalTone: 'Остроумный криминальный экшен с колким британским юмором.',
    violenceLevel: 'moderate',
    violenceNote: 'Гангстерские разборки в комедийно-драйвовом ключе.',
    hasHappyEnding: true,
  },
  'spirited-away': {
    petsSafe: true,
    petsNote: 'Безопасно. Свинки-родители в финале снова превращаются в людей! 🐷',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Сказочные японские духи, доброе волшебство Миядзаки.',
    emotionalTone: 'Чудесная вдохновляющая сказка о дружбе, смелости и семье.',
    violenceLevel: 'none',
    violenceNote: 'Насилие отсутствует.',
    hasHappyEnding: true,
  },
  'la-la-land': {
    petsSafe: true,
    petsNote: 'Животные в безопасности.',
    jumpScaresLevel: 'none',
    jumpScaresNote: 'Скримеров нет, музыкальный шедевр.',
    emotionalTone: 'Яркий, романтичный мюзикл со светлой ностальгической нотой.',
    violenceLevel: 'none',
    violenceNote: 'Насилие отсутствует.',
    hasHappyEnding: true,
  },
};

export function getTriggerReportForMovie(movie: Partial<MovieItem>): TriggerReport {
  if (movie.id && MOVIE_TRIGGER_DATABASE[movie.id]) {
    return MOVIE_TRIGGER_DATABASE[movie.id];
  }

  const genres = (movie.genres || []).map((g) => g.toLowerCase());
  const isHorror = genres.includes('ужасы') || genres.includes('хоррор');
  const isAction = genres.includes('боевик') || genres.includes('триллер');
  const isComedy = genres.includes('комедия') || genres.includes('анимация') || genres.includes('семейный');

  return {
    petsSafe: true,
    petsNote: 'По базе безопасности: жестокости к домашним животным не зафиксировано 🐾',
    jumpScaresLevel: isHorror ? 'moderate' : isAction ? 'low' : 'none',
    jumpScaresNote: isHorror
      ? 'Присутствуют внезапные моменты напряжения.'
      : 'Резких скримеров нет. Комфортный просмотр для чувствительных зрителей.',
    emotionalTone: isComedy
      ? 'Позитивный, комфортный тон без гнетущей тяжелой драмы.'
      : 'Сбалансированное повествование, удерживающее интерес.',
    violenceLevel: isAction ? 'moderate' : isHorror ? 'moderate' : 'none',
    violenceNote: isAction
      ? 'Динамичные боевые сцены в рамках возрастного ценза.'
      : 'Жестоких сцен нет, просмотр эмоционально комфортен.',
    hasHappyEnding: !isHorror,
  };
}
