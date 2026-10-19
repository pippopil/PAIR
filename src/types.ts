export interface MovieItem {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  type: 'movie' | 'series' | 'animation';
  genres: string[];
  director: string;
  cast: string[];
  duration: string; // e.g., "148 мин" or "8 серий по 50 мин"
  durationMinutes: number;
  ratingKp: number;
  ratingImdb: number;
  posterUrl: string;
  description: string;
  tags: string[];
  availablePlatforms: PlatformAvailability[];
  ageRating?: string;
  triggers?: TriggerReport;
}

export interface TriggerReport {
  petsSafe: boolean;
  petsNote: string;
  jumpScaresLevel: 'none' | 'low' | 'moderate';
  jumpScaresNote: string;
  emotionalTone: string;
  violenceLevel: 'none' | 'mild' | 'moderate' | 'high';
  violenceNote: string;
  hasHappyEnding: boolean;
}

export interface PlatformAvailability {
  id: string;
  name: string;
  color: string;
  url?: string;
  badgeText?: string;
}

export interface UserParticipant {
  id: string;
  name: string;
  avatar: string; // emoji or icon
  color: string; // accent color
  favoriteGenres: string[];
  favoriteMovies: { id: string; title: string; year?: number; posterUrl?: string }[];
  favoriteActors: string[];
  vetoes: string[]; // Absolute stops (e.g., "Хоррор", "Кровь", "Затянутость")
  customVetoInput?: string;
}

export interface MatchBreakdownItem {
  participantId: string;
  participantName: string;
  score: number; // 0 to 100
  reason: string;
  appealFactor: string;
}

export interface MovieRecommendation extends MovieItem {
  overallMatchScore: number; // 0 - 100
  matchBreakdown: MatchBreakdownItem[];
  compromiseRationale: string;
  vetoStatus: {
    isSafe: boolean;
    violatedVeto?: string;
    guaranteeNote: string;
  };
  highlightQuote?: string;
  userRatings?: Record<string, number>; // participantId -> 1..5 stars
}

export interface SessionFilterOptions {
  roomCode: string;
  mode: 'duo' | 'party';
  targetType: 'all' | 'movie' | 'series' | 'animation';
  durationLimit: 'any' | 'under90' | 'under120' | 'over120';
  era: 'any' | 'fresh' | '2010s' | 'classic';
  selectedPlatforms: string[]; // Empty means any
  excludeSeen: boolean;
  moodPrompt: string; // Natural language mood (e.g. "Хотим легкое с Ди Каприо без драмы")
}

export interface BlitzCardVote {
  movieId: string;
  participantId: string;
  vote: 'yes' | 'no' | 'super';
}

export interface DiaryEntry {
  id: string;
  movieId: string;
  title: string;
  originalTitle?: string;
  posterUrl: string;
  year: number;
  genres: string[];
  date: string;
  ratings: Record<string, { rating: number; name: string; avatar: string }>;
  averageRating: number;
  coupleNotes?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'duo' | 'blitz' | 'compromise' | 'diary' | 'veto';
}
