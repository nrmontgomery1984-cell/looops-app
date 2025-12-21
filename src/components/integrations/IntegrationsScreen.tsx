// IntegrationsScreen - Manage external service connections
// Fitbit (Health), Todoist (Tasks), Tiller/Google Sheets (Wealth), Calendar, Spotify

import React, { useState, useEffect, useCallback } from "react";
import {
  getAllIntegrationsStatus,
  handleOAuthCallback,
  getFitbitAuthUrl,
  getFitbitHealth,
  getTodoistAuthUrl,
  syncTodoist,
  getTillerAuthUrl,
  getCalendarAuthUrl,
  getSpotifyAuthUrl,
  IntegrationStatus,
  FitbitHealthData,
} from "../../services/integrations";

// Icons for each integration
const FitbitIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

const TodoistIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M21 5.5l-9 9-4-4L3.5 15 12 23.5l13.5-13.5L21 5.5zm-9 6.5L7.5 7.5 3 12l9 9 13.5-13.5L21 3l-9 9z" />
  </svg>
);

const SheetsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.36c-.2.3-.54.4-.86.22-2.36-1.44-5.34-1.77-8.84-.97-.34.08-.66-.14-.74-.46-.08-.34.14-.66.46-.74 3.84-.88 7.14-.5 9.78 1.12.32.2.4.56.2.83zm1.22-2.7c-.24.38-.76.5-1.14.24-2.7-1.66-6.82-2.14-10.02-1.17-.4.12-.82-.1-.94-.5-.12-.4.1-.82.5-.94 3.64-1.1 8.18-.57 11.3 1.34.36.24.48.74.3 1.03zm.1-2.82c-3.24-1.92-8.58-2.1-11.68-1.16-.5.14-1.02-.14-1.16-.62-.14-.5.14-1.02.62-1.16 3.56-1.08 9.48-.86 13.22 1.34.44.26.58.84.32 1.28-.26.42-.82.58-1.32.32z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus | null;
  loopBadge?: string;
  loopColor?: string;
  onConnect?: () => void;
  onSync?: () => Promise<void>;
  onDisconnect?: () => void;
  previewData?: React.ReactNode;
  isLoading?: boolean;
  isSyncing?: boolean;
}

function IntegrationCard({
  name,
  description,
  icon,
  status,
  loopBadge,
  loopColor,
  onConnect,
  onSync,
  previewData,
  isLoading,
  isSyncing,
}: IntegrationCardProps) {
  const isConnected = status?.authorized || false;
  const isConfigured = status?.configured || false;

  return (
    <div className={`integration-card ${isConnected ? "integration-card--connected" : ""}`}>
      <div className="integration-card__header">
        <div className="integration-card__icon" style={{ color: loopColor }}>
          {icon}
        </div>
        <div className="integration-card__info">
          <div className="integration-card__title-row">
            <h3 className="integration-card__name">{name}</h3>
            {loopBadge && (
              <span
                className="integration-card__loop-badge"
                style={{ backgroundColor: loopColor }}
              >
                {loopBadge}
              </span>
            )}
          </div>
          <p className="integration-card__description">{description}</p>
        </div>
        <div className="integration-card__status">
          {isLoading ? (
            <span className="integration-card__status-loading">
              <RefreshIcon /> Checking...
            </span>
          ) : isConnected ? (
            <span className="integration-card__status-connected">
              <CheckIcon /> Connected
            </span>
          ) : isConfigured ? (
            <span className="integration-card__status-configured">
              <WarningIcon /> Not Authorized
            </span>
          ) : (
            <span className="integration-card__status-disconnected">
              Not Configured
            </span>
          )}
        </div>
      </div>

      {previewData && isConnected && (
        <div className="integration-card__preview">{previewData}</div>
      )}

      <div className="integration-card__actions">
        {!isConnected && onConnect && (
          <button
            className="integration-card__btn integration-card__btn--primary"
            onClick={onConnect}
            disabled={isLoading}
          >
            {isConfigured ? "Authorize" : "Connect"}
          </button>
        )}
        {isConnected && onSync && (
          <button
            className="integration-card__btn integration-card__btn--secondary"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshIcon /> Syncing...
              </>
            ) : (
              <>
                <RefreshIcon /> Sync Now
              </>
            )}
          </button>
        )}
        {status?.lastSync && (
          <span className="integration-card__last-sync">
            Last synced: {new Date(status.lastSync).toLocaleString()}
          </span>
        )}
      </div>

      {status?.message && !isConnected && (
        <div className="integration-card__message">{status.message}</div>
      )}
    </div>
  );
}

export function IntegrationsScreen() {
  const [statuses, setStatuses] = useState<{
    fitbit: IntegrationStatus | null;
    todoist: IntegrationStatus | null;
    tiller: IntegrationStatus | null;
    calendar: IntegrationStatus | null;
    spotify: IntegrationStatus | null;
  }>({
    fitbit: null,
    todoist: null,
    tiller: null,
    calendar: null,
    spotify: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [syncingService, setSyncingService] = useState<string | null>(null);
  const [fitbitData, setFitbitData] = useState<FitbitHealthData | null>(null);
  const [todoistTaskCount, setTodoistTaskCount] = useState<number | null>(null);

  // Fetch all integration statuses
  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const allStatuses = await getAllIntegrationsStatus();
      setStatuses(allStatuses);

      // If Fitbit is connected, fetch health data
      if (allStatuses.fitbit.authorized) {
        const health = await getFitbitHealth();
        setFitbitData(health);
      }
    } catch (error) {
      console.error("Failed to fetch integration statuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle OAuth callback on mount
  useEffect(() => {
    const result = handleOAuthCallback();
    if (result) {
      console.log('OAuth callback:', result);
      // Refresh statuses after OAuth
      fetchStatuses();
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Handle OAuth connect - opens in new window
  const handleConnect = (authUrl: string) => {
    window.open(authUrl, "_blank", "width=600,height=700");
    // Set up polling to check when auth completes
    const checkInterval = setInterval(async () => {
      await fetchStatuses();
    }, 3000);
    // Stop after 2 minutes
    setTimeout(() => clearInterval(checkInterval), 120000);
  };

  // Handle Todoist sync
  const handleTodoistSync = async () => {
    setSyncingService("todoist");
    try {
      const result = await syncTodoist();
      if (result.success) {
        setTodoistTaskCount(result.taskCount || 0);
      }
    } catch (error) {
      console.error("Todoist sync failed:", error);
    } finally {
      setSyncingService(null);
    }
  };

  // Handle Fitbit refresh
  const handleFitbitRefresh = async () => {
    setSyncingService("fitbit");
    try {
      const health = await getFitbitHealth();
      setFitbitData(health);
    } catch (error) {
      console.error("Fitbit refresh failed:", error);
    } finally {
      setSyncingService(null);
    }
  };

  return (
    <div className="screen integrations-screen">
      <div className="screen-header">
        <h2>Integrations</h2>
        <p className="screen-description">
          Connect external services to sync your data automatically
        </p>
      </div>

      <div className="integrations-grid">
        {/* Fitbit - Health Loop */}
        <IntegrationCard
          name="Fitbit"
          description="Sync activity, sleep, and health metrics from your Fitbit device"
          icon={<FitbitIcon />}
          status={statuses.fitbit}
          loopBadge="Health"
          loopColor="#73A58C"
          onConnect={() => handleConnect(getFitbitAuthUrl())}
          onSync={handleFitbitRefresh}
          isLoading={isLoading}
          isSyncing={syncingService === "fitbit"}
          previewData={
            fitbitData?.today && (
              <div className="integration-preview-grid">
                <div className="integration-preview-stat">
                  <span className="integration-preview-label">Steps</span>
                  <span className="integration-preview-value">
                    {fitbitData.today.steps.toLocaleString()}
                  </span>
                </div>
                <div className="integration-preview-stat">
                  <span className="integration-preview-label">Sleep</span>
                  <span className="integration-preview-value">
                    {fitbitData.today.sleepDurationHours}h
                  </span>
                </div>
                <div className="integration-preview-stat">
                  <span className="integration-preview-label">Active Min</span>
                  <span className="integration-preview-value">
                    {fitbitData.today.activeMinutes}
                  </span>
                </div>
                <div className="integration-preview-stat">
                  <span className="integration-preview-label">Readiness</span>
                  <span className="integration-preview-value">
                    {fitbitData.today.scores.readiness || "—"}%
                  </span>
                </div>
              </div>
            )
          }
        />

        {/* Todoist - Tasks */}
        <IntegrationCard
          name="Todoist"
          description="Import tasks from Todoist with labels mapped to Loops"
          icon={<TodoistIcon />}
          status={statuses.todoist}
          loopBadge="Tasks"
          loopColor="#5a7fb8"
          onConnect={() => handleConnect(getTodoistAuthUrl())}
          onSync={handleTodoistSync}
          isLoading={isLoading}
          isSyncing={syncingService === "todoist"}
          previewData={
            todoistTaskCount !== null && (
              <div className="integration-preview-simple">
                <span>{todoistTaskCount} tasks synced</span>
              </div>
            )
          }
        />

        {/* Google Sheets - Wealth Loop */}
        <IntegrationCard
          name="Google Sheets"
          description="Connect to your budget spreadsheets for financial tracking"
          icon={<SheetsIcon />}
          status={statuses.tiller}
          loopBadge="Wealth"
          loopColor="#F4B942"
          onConnect={() => handleConnect(getTillerAuthUrl())}
          isLoading={isLoading}
        />

        {/* Google Calendar */}
        <IntegrationCard
          name="Google Calendar"
          description="View and sync events from your Google Calendar"
          icon={<CalendarIcon />}
          status={statuses.calendar}
          loopBadge="Planning"
          loopColor="#b87fa8"
          onConnect={() => handleConnect(getCalendarAuthUrl())}
          isLoading={isLoading}
        />

        {/* Spotify */}
        <IntegrationCard
          name="Spotify"
          description="See what you're listening to and track music habits"
          icon={<SpotifyIcon />}
          status={statuses.spotify}
          loopBadge="Fun"
          loopColor="#1DB954"
          onConnect={() => handleConnect(getSpotifyAuthUrl())}
          isLoading={isLoading}
        />
      </div>

      {/* Setup Instructions */}
      <div className="integrations-help">
        <h3>Setup Instructions</h3>
        <div className="integrations-help__content">
          <details className="integrations-help__item">
            <summary>Fitbit Setup</summary>
            <ol>
              <li>Create a Fitbit app at <a href="https://dev.fitbit.com" target="_blank" rel="noopener noreferrer">dev.fitbit.com</a></li>
              <li>Set OAuth 2.0 Application Type to "Personal"</li>
              <li>Set Callback URL to: <code>http://localhost:3001/api/fitbit/callback</code></li>
              <li>Add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to server/.env</li>
              <li>Click "Connect" above to authorize</li>
            </ol>
          </details>

          <details className="integrations-help__item">
            <summary>Todoist Setup</summary>
            <ol>
              <li>Go to <a href="https://todoist.com/prefs/integrations" target="_blank" rel="noopener noreferrer">Todoist Integrations</a></li>
              <li>Scroll to "API token" and copy your token</li>
              <li>Add TODOIST_API_TOKEN to server/.env</li>
              <li>Create labels matching Loop names for auto-mapping (Health, Wealth, etc.)</li>
            </ol>
          </details>

          <details className="integrations-help__item">
            <summary>Tiller Money Setup</summary>
            <ol>
              <li>Subscribe to <a href="https://www.tillerhq.com" target="_blank" rel="noopener noreferrer">Tiller Money</a></li>
              <li>Create a Google Cloud service account</li>
              <li>Share your Tiller spreadsheet with the service account email</li>
              <li>Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to server/.env</li>
              <li>Add SHEETS_TILLER_ID (the spreadsheet ID from the URL)</li>
            </ol>
          </details>

          <details className="integrations-help__item">
            <summary>Google Calendar Setup</summary>
            <ol>
              <li>Create OAuth credentials in Google Cloud Console</li>
              <li>Enable the Google Calendar API</li>
              <li>Set Redirect URI to: <code>http://localhost:3001/api/calendar/callback</code></li>
              <li>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env</li>
            </ol>
          </details>

          <details className="integrations-help__item">
            <summary>Spotify Setup</summary>
            <ol>
              <li>Create an app at <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer">Spotify Developer Dashboard</a></li>
              <li>Set Redirect URI to: <code>http://localhost:3001/api/spotify/callback</code></li>
              <li>Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env</li>
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
}

export default IntegrationsScreen;
