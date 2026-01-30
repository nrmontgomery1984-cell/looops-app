// Weather Widget - Current weather and forecast using Open-Meteo API (free, no key required)
import React, { useEffect, useState } from "react";

interface WeatherData {
  current: {
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    isDay: boolean;
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
  }[];
  location: string;
}

interface SavedLocation {
  name: string;
  lat: number;
  lon: number;
}

interface WeatherSettings {
  units: "imperial" | "metric";
  savedLocation: SavedLocation | null;
}

const STORAGE_KEY = "weather_settings";

function loadSettings(): WeatherSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { units: "imperial", savedLocation: null };
}

function saveSettings(settings: WeatherSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface WeatherWidgetProps {
  units?: "imperial" | "metric";
}

// Weather code to description and icon mapping
const WEATHER_CODES: Record<number, { description: string; icon: string; nightIcon?: string }> = {
  0: { description: "Clear sky", icon: "☀️", nightIcon: "🌙" },
  1: { description: "Mainly clear", icon: "🌤️", nightIcon: "🌙" },
  2: { description: "Partly cloudy", icon: "⛅", nightIcon: "☁️" },
  3: { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Rime fog", icon: "🌫️" },
  51: { description: "Light drizzle", icon: "🌧️" },
  53: { description: "Drizzle", icon: "🌧️" },
  55: { description: "Dense drizzle", icon: "🌧️" },
  61: { description: "Light rain", icon: "🌧️" },
  63: { description: "Rain", icon: "🌧️" },
  65: { description: "Heavy rain", icon: "🌧️" },
  66: { description: "Freezing rain", icon: "🌨️" },
  67: { description: "Heavy freezing rain", icon: "🌨️" },
  71: { description: "Light snow", icon: "🌨️" },
  73: { description: "Snow", icon: "❄️" },
  75: { description: "Heavy snow", icon: "❄️" },
  77: { description: "Snow grains", icon: "🌨️" },
  80: { description: "Light showers", icon: "🌦️" },
  81: { description: "Showers", icon: "🌦️" },
  82: { description: "Heavy showers", icon: "🌧️" },
  85: { description: "Light snow showers", icon: "🌨️" },
  86: { description: "Snow showers", icon: "🌨️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
  96: { description: "Thunderstorm with hail", icon: "⛈️" },
  99: { description: "Heavy thunderstorm", icon: "⛈️" },
};

function getWeatherInfo(code: number, isDay: boolean = true) {
  const info = WEATHER_CODES[code] || { description: "Unknown", icon: "❓" };
  return {
    description: info.description,
    icon: !isDay && info.nightIcon ? info.nightIcon : info.icon,
  };
}

export function WeatherWidget({ units: propUnits }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<WeatherSettings>(loadSettings);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SavedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use prop units or saved settings
  const units = propUnits || settings.units;

  // Get user's location or use saved location
  useEffect(() => {
    if (settings.savedLocation) {
      setLocation({ lat: settings.savedLocation.lat, lon: settings.savedLocation.lon });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Default to New York if geolocation fails
          setLocation({ lat: 40.7128, lon: -74.006 });
          setError("Using default location");
        }
      );
    } else {
      setLocation({ lat: 40.7128, lon: -74.006 });
    }
  }, [settings.savedLocation]);

  // Search for locations
  const searchLocation = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const response = await fetch(url, {
        headers: { "User-Agent": "LooopsApp/1.0" },
      });
      const data = await response.json();
      setSearchResults(
        data.map((item: { display_name: string; lat: string; lon: string }) => ({
          name: item.display_name.split(",").slice(0, 2).join(","),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (loc: SavedLocation) => {
    const newSettings = { ...settings, savedLocation: loc };
    setSettings(newSettings);
    saveSettings(newSettings);
    setLocation({ lat: loc.lat, lon: loc.lon });
    setLocationSearch("");
    setSearchResults([]);
    setShowSettings(false);
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newSettings = { ...settings, savedLocation: null };
          setSettings(newSettings);
          saveSettings(newSettings);
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setShowSettings(false);
        },
        () => {
          setError("Could not get current location");
        }
      );
    }
  };

  const toggleUnits = () => {
    const newUnits: "imperial" | "metric" = settings.units === "imperial" ? "metric" : "imperial";
    const newSettings: WeatherSettings = { ...settings, units: newUnits };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Fetch weather when location is available
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
        const windUnit = units === "imperial" ? "mph" : "kmh";

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=5`;

        const response = await fetch(url);
        const data = await response.json();

        // Get location name via reverse geocoding
        let locationName = "Your Location";
        try {
          const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`;
          const geoResponse = await fetch(geoUrl, {
            headers: { "User-Agent": "LooopsApp/1.0" },
          });
          const geoData = await geoResponse.json();
          locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Your Location";
        } catch {
          // Ignore geocoding errors
        }

        setWeather({
          current: {
            temperature: Math.round(data.current.temperature_2m),
            apparentTemperature: Math.round(data.current.apparent_temperature),
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            isDay: data.current.is_day === 1,
          },
          daily: data.daily.time.slice(1, 5).map((date: string, i: number) => ({
            date,
            tempMax: Math.round(data.daily.temperature_2m_max[i + 1]),
            tempMin: Math.round(data.daily.temperature_2m_min[i + 1]),
            weatherCode: data.daily.weather_code[i + 1],
          })),
          location: locationName,
        });
        setError(null);
      } catch (err) {
        setError("Failed to load weather");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location, units]);

  if (isLoading && !weather) {
    return (
      <div className="weather-widget weather-widget--loading">
        <div className="weather-loading-spinner" />
        <span>Getting weather...</span>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-widget weather-widget--error">
        <span className="weather-error-icon">🌤️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  const currentWeather = getWeatherInfo(weather.current.weatherCode, weather.current.isDay);
  const tempSymbol = units === "imperial" ? "°F" : "°C";
  const windSymbol = units === "imperial" ? "mph" : "km/h";

  return (
    <div className="weather-widget">
      {/* Settings Panel */}
      {showSettings && (
        <div className="weather-settings">
          <div className="weather-settings-header">
            <span>Settings</span>
            <button className="weather-settings-close" onClick={() => setShowSettings(false)}>×</button>
          </div>

          {/* Units Toggle */}
          <div className="weather-settings-section">
            <label className="weather-settings-label">Temperature</label>
            <div className="weather-units-toggle">
              <button
                className={`weather-unit-btn ${settings.units === "imperial" ? "active" : ""}`}
                onClick={() => {
                  if (settings.units !== "imperial") toggleUnits();
                }}
              >
                °F
              </button>
              <button
                className={`weather-unit-btn ${settings.units === "metric" ? "active" : ""}`}
                onClick={() => {
                  if (settings.units !== "metric") toggleUnits();
                }}
              >
                °C
              </button>
            </div>
          </div>

          {/* Location Search */}
          <div className="weather-settings-section">
            <label className="weather-settings-label">Location</label>
            <div className="weather-location-search">
              <input
                type="text"
                placeholder="Search city..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  searchLocation(e.target.value);
                }}
                className="weather-search-input"
              />
              {isSearching && <span className="weather-search-spinner">...</span>}
            </div>
            {searchResults.length > 0 && (
              <div className="weather-search-results">
                {searchResults.map((loc, i) => (
                  <button
                    key={i}
                    className="weather-search-result"
                    onClick={() => selectLocation(loc)}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
            <button className="weather-use-current" onClick={useCurrentLocation}>
              📍 Use current location
            </button>
            {settings.savedLocation && (
              <div className="weather-saved-location">
                Current: {settings.savedLocation.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="weather-location">
        <span className="weather-location-icon">📍</span>
        <span className="weather-location-name">{weather.location}</span>
        <button className="weather-settings-btn" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </button>
      </div>

      {/* Current Weather */}
      <div className="weather-current">
        <div className="weather-current-icon">{currentWeather.icon}</div>
        <div className="weather-current-temp">
          <span className="weather-temp-value">{weather.current.temperature}</span>
          <span className="weather-temp-symbol">{tempSymbol}</span>
        </div>
        <div className="weather-current-desc">{currentWeather.description}</div>
      </div>

      {/* Current Details */}
      <div className="weather-details">
        <div className="weather-detail">
          <span className="weather-detail-icon">🌡️</span>
          <span className="weather-detail-value">Feels {weather.current.apparentTemperature}{tempSymbol}</span>
        </div>
        <div className="weather-detail">
          <span className="weather-detail-icon">💧</span>
          <span className="weather-detail-value">{weather.current.humidity}%</span>
        </div>
        <div className="weather-detail">
          <span className="weather-detail-icon">💨</span>
          <span className="weather-detail-value">{weather.current.windSpeed} {windSymbol}</span>
        </div>
      </div>

      {/* Forecast */}
      <div className="weather-forecast">
        {weather.daily.map((day) => {
          const dayWeather = getWeatherInfo(day.weatherCode, true);
          const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div key={day.date} className="weather-forecast-day">
              <span className="weather-forecast-name">{dayName}</span>
              <span className="weather-forecast-icon">{dayWeather.icon}</span>
              <span className="weather-forecast-temps">
                <span className="weather-forecast-high">{day.tempMax}°</span>
                <span className="weather-forecast-low">{day.tempMin}°</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeatherWidget;
