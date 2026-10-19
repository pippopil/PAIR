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
