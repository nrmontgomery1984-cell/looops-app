// Media logging types for Fun loop
// Manual tracking of movies, TV shows, books, games, and other media

export type MediaType = "movie" | "tv_show" | "book" | "game" | "podcast" | "music_album";

export type MediaStatus = "want" | "in_progress" | "completed" | "dropped";

export type StreamingService =
  | "netflix"
  | "prime"
  | "disney"
  | "hbo"
  | "hulu"
  | "apple"
  | "peacock"
  | "paramount"
  | "youtube"
  | "crunchyroll"
  | "theater"
  | "physical"
  | "other";

export const STREAMING_SERVICES: Record<StreamingService, { name: string; icon: string }> = {
  netflix: { name: "Netflix", icon: "🔴" },
  prime: { name: "Prime Video", icon: "📦" },
  disney: { name: "Disney+", icon: "🏰" },
  hbo: { name: "Max", icon: "🟣" },
  hulu: { name: "Hulu", icon: "🟢" },
  apple: { name: "Apple TV+", icon: "🍎" },
  peacock: { name: "Peacock", icon: "🦚" },
  paramount: { name: "Paramount+", icon: "⛰️" },
  youtube: { name: "YouTube", icon: "▶️" },
  crunchyroll: { name: "Crunchyroll", icon: "🍥" },
  theater: { name: "Theater", icon: "🎬" },
  physical: { name: "Physical/Own", icon: "💿" },
  other: { name: "Other", icon: "📺" },
};

export interface MediaEntry {
  id: string;
  type: MediaType;
  title: string;
  creator?: string; // Director, Author, Developer, Artist, etc.
  status: MediaStatus;
  rating?: number; // 1-5 stars
  notes?: string;
  startedAt?: string; // ISO date
  completedAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
  // Optional metadata
  imageUrl?: string;
  year?: number;
  genre?: string;
  streamingService?: StreamingService; // Where watched/played
  // For TV shows
  season?: number;
  episode?: number;
  // For books
  pages?: number;
  pagesRead?: number;
  // For games
  platform?: string;
  hoursPlayed?: number;
}

export interface MediaState {
  entries: MediaEntry[];
  loading: boolean;
  error: string | null;
}

export const DEFAULT_MEDIA_STATE: MediaState = {
  entries: [],
  loading: false,
  error: null,
};

// Helper functions
export function getMediaTypeLabel(type: MediaType): string {
  const labels: Record<MediaType, string> = {
    movie: "Movie",
    tv_show: "TV Show",
    book: "Book",
    game: "Game",
    podcast: "Podcast",
    music_album: "Album",
  };
  return labels[type];
}

export function getMediaTypeIcon(type: MediaType): string {
  const icons: Record<MediaType, string> = {
    movie: "film",
    tv_show: "tv",
    book: "book",
    game: "gamepad",
    podcast: "mic",
    music_album: "disc",
  };
  return icons[type];
}

export function getStatusLabel(status: MediaStatus): string {
  const labels: Record<MediaStatus, string> = {
    want: "Want",
    in_progress: "In Progress",
    completed: "Completed",
    dropped: "Dropped",
  };
  return labels[status];
}

export function getStatusColor(status: MediaStatus): string {
  const colors: Record<MediaStatus, string> = {
    want: "var(--color-text-tertiary)",
    in_progress: "var(--color-primary)",
    completed: "var(--color-success)",
    dropped: "var(--color-danger)",
  };
  return colors[status];
}

export function createMediaEntry(
  type: MediaType,
  title: string,
  status: MediaStatus = "want"
): MediaEntry {
  const now = new Date().toISOString();
  return {
    id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export function filterMediaByType(entries: MediaEntry[], type: MediaType): MediaEntry[] {
  return entries.filter((e) => e.type === type);
}

export function filterMediaByStatus(entries: MediaEntry[], status: MediaStatus): MediaEntry[] {
  return entries.filter((e) => e.status === status);
}

export function getRecentMedia(entries: MediaEntry[], limit: number = 10): MediaEntry[] {
  return [...entries]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export function getMediaStats(entries: MediaEntry[]): {
  total: number;
  byType: Record<MediaType, number>;
  byStatus: Record<MediaStatus, number>;
  completedThisMonth: number;
  completedThisYear: number;
} {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const byType: Record<MediaType, number> = {
    movie: 0,
    tv_show: 0,
    book: 0,
    game: 0,
    podcast: 0,
    music_album: 0,
  };

  const byStatus: Record<MediaStatus, number> = {
    want: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
  };

  let completedThisMonth = 0;
  let completedThisYear = 0;

  entries.forEach((entry) => {
    byType[entry.type]++;
    byStatus[entry.status]++;

    if (entry.completedAt) {
      const completedDate = new Date(entry.completedAt);
      if (completedDate >= startOfMonth) {
        completedThisMonth++;
      }
      if (completedDate >= startOfYear) {
        completedThisYear++;
      }
    }
  });

  return {
    total: entries.length,
    byType,
    byStatus,
    completedThisMonth,
    completedThisYear,
  };
}
