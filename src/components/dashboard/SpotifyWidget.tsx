// Spotify Widget - Shows current playback and recently played
// For the Fun loop dashboard

import React, { useEffect, useState } from "react";

const API_BASE = "/api/spotify";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  albumArt: string | null;
  duration: number;
  url: string;
  playedAt: string | null;
}

interface NowPlaying {
  isPlaying: boolean;
  track: Track | null;
  progress: number;
  device: string;
}

interface ListeningSummary {
  currentlyPlaying: NowPlaying | null;
  recentlyPlayed: Track[];
  topTracks: Track[];
  topArtists: Array<{
    id: string;
    name: string;
    image: string | null;
    genres: string[];
  }>;
  stats: {
    totalListeningMinutes: number;
    uniqueArtists: number;
    uniqueAlbums: number;
    tracksPlayed: number;
  };
}

export function SpotifyWidget() {
  const [summary, setSummary] = useState<ListeningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [view, setView] = useState<"now" | "recent" | "top">("now");

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchSummary();
      // Refresh every 30 seconds for now playing
      const interval = setInterval(fetchSummary, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      setIsConnected(data.configured);
    } catch {
      setIsConnected(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      const data = await res.json();

      if (data.source === "spotify" && data.data) {
        setSummary(data.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth`);
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to get auth URL:", err);
    }
  };

  // Not connected state
  if (isConnected === false) {
    return (
      <div className="spotify-widget spotify-widget--disconnected">
        <div className="spotify-widget-empty">
          <span className="spotify-widget-logo">🎵</span>
          <p>Connect Spotify to see your listening activity</p>
          <button className="spotify-widget-connect-btn" onClick={handleConnect}>
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isConnected === null) {
    return (
      <div className="spotify-widget spotify-widget--loading">
        <div className="spotify-widget-loading">
          <div className="spotify-widget-spinner" />
          <span>Loading music...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="spotify-widget spotify-widget--error">
        <div className="spotify-widget-error">
          <span className="spotify-widget-error-icon">!</span>
          <p>{error}</p>
          <button className="spotify-widget-retry-btn" onClick={fetchSummary}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const nowPlaying = summary?.currentlyPlaying;
  const recentlyPlayed = summary?.recentlyPlayed || [];
  const topTracks = summary?.topTracks || [];
  const stats = summary?.stats;

  return (
    <div className="spotify-widget">
      {/* Now Playing */}
      {nowPlaying?.isPlaying && nowPlaying.track && (
        <div className="spotify-now-playing">
          <div className="spotify-now-playing-indicator">
            <span className="spotify-equalizer">
              <span></span><span></span><span></span>
            </span>
            Now Playing
          </div>
          <div className="spotify-track-card spotify-track-card--large">
            {nowPlaying.track.albumArt && (
              <img
                src={nowPlaying.track.albumArt}
                alt={nowPlaying.track.album || ""}
                className="spotify-album-art"
              />
            )}
            <div className="spotify-track-info">
              <a
                href={nowPlaying.track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="spotify-track-name"
              >
                {nowPlaying.track.name}
              </a>
              <span className="spotify-track-artist">{nowPlaying.track.artist}</span>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="spotify-widget-tabs">
        <button
          className={`spotify-widget-tab ${view === "now" ? "active" : ""}`}
          onClick={() => setView("now")}
        >
          Recent
        </button>
        <button
          className={`spotify-widget-tab ${view === "top" ? "active" : ""}`}
          onClick={() => setView("top")}
        >
          Top Tracks
        </button>
      </div>

      {/* Track List */}
      <div className="spotify-track-list">
        {view === "now" &&
          recentlyPlayed.slice(0, 5).map((track) => (
            <TrackItem key={`${track.id}-${track.playedAt}`} track={track} />
          ))}
        {view === "top" &&
          topTracks.map((track, i) => (
            <TrackItem key={track.id} track={track} rank={i + 1} />
          ))}
      </div>

      {/* Stats */}
      {stats && (
        <div className="spotify-stats">
          <div className="spotify-stat">
            <span className="spotify-stat-value">{stats.tracksPlayed}</span>
            <span className="spotify-stat-label">Tracks</span>
          </div>
          <div className="spotify-stat">
            <span className="spotify-stat-value">{stats.uniqueArtists}</span>
            <span className="spotify-stat-label">Artists</span>
          </div>
          <div className="spotify-stat">
            <span className="spotify-stat-value">{stats.totalListeningMinutes}m</span>
            <span className="spotify-stat-label">Listened</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackItem({ track, rank }: { track: Track; rank?: number }) {
  return (
    <div className="spotify-track-item">
      {rank && <span className="spotify-track-rank">{rank}</span>}
      {track.albumArt && (
        <img
          src={track.albumArt}
          alt={track.album || ""}
          className="spotify-track-thumb"
        />
      )}
      <div className="spotify-track-details">
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="spotify-track-name"
        >
          {track.name}
        </a>
        <span className="spotify-track-artist">{track.artist}</span>
      </div>
      {track.playedAt && (
        <span className="spotify-track-time">
          {formatRelativeTime(track.playedAt)}
        </span>
      )}
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export default SpotifyWidget;
