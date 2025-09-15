import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  location: string;
  feelsLike: number;
  precipitation: number;
  cloudCover: number;
  isDay: boolean;
}

interface WeatherDashletProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function WeatherDashlet({ latitude, longitude, locationName }: WeatherDashletProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        
        // Open-Meteo API call for current weather
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`
        );
        
        if (!response.ok) {
          throw new Error("Weather data not available");
        }
        
        const data = await response.json();
        
        // Process the weather data
        const current = data.current;
        
        const processedData: WeatherData = {
          temperature: Math.round(current.temperature_2m),
          condition: weatherCodeToCondition(current.weather_code),
          humidity: current.relative_humidity_2m,
          uvIndex: data.daily.uv_index_max[0],
          windSpeed: current.wind_speed_10m,
          windDirection: current.wind_direction_10m,
          pressure: Math.round(current.pressure_msl),
          visibility: current.visibility / 1000, // Convert to km
          location: locationName,
          feelsLike: Math.round(current.apparent_temperature),
          precipitation: current.precipitation,
          cloudCover: current.cloud_cover,
          isDay: current.is_day === 1
        };
        
        setWeatherData(processedData);
        setError(null);
      } catch (err) {
        setError("Failed to load weather data");
        console.error("Weather API error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeatherData();
    }
  }, [latitude, longitude, locationName]);

  if (loading) {
    return (
      <div className="card">
        <h3>Weather Information</h3>
        <div className="loading">Loading weather data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>Weather Information</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <div className="card">
      <div className="weather-header">
        <h3>Weather in {weatherData.location}</h3>
        <div className="current-temp">
          <div className={`weather-icon ${getWeatherIconClass(weatherData.condition, weatherData.isDay)}`}></div>
          <span className="temp">{weatherData.temperature}°C</span>
        </div>
        <div className="condition">{weatherData.condition}</div>
      </div>

      <div className="weather-grid">
        <div className="weather-item">
          <div className="label">Feels Like</div>
          <div className="value">{weatherData.feelsLike}°C</div>
        </div>
        <div className="weather-item">
          <div className="label">Humidity</div>
          <div className="value">{weatherData.humidity}%</div>
        </div>
        <div className="weather-item">
          <div className="label">UV Index</div>
          <div className="value">{weatherData.uvIndex}</div>
        </div>
        <div className="weather-item">
          <div className="label">Wind</div>
          <div className="value">
            {weatherData.windSpeed} km/h, {getWindDirection(weatherData.windDirection)}
          </div>
        </div>
        <div className="weather-item">
          <div className="label">Pressure</div>
          <div className="value">{weatherData.pressure} hPa</div>
        </div>
        <div className="weather-item">
          <div className="label">Visibility</div>
          <div className="value">{weatherData.visibility} km</div>
        </div>
        <div className="weather-item">
          <div className="label">Precipitation</div>
          <div className="value">{weatherData.precipitation} mm</div>
        </div>
        <div className="weather-item">
          <div className="label">Cloud Cover</div>
          <div className="value">{weatherData.cloudCover}%</div>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert WMO weather code to condition string
function weatherCodeToCondition(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  
  return weatherCodes[code] || "Unknown";
}

// Helper function to get weather icon class
function getWeatherIconClass(condition: string, isDay: boolean): string {
  const baseClass = isDay ? "day" : "night";
  
  if (condition.includes("Clear")) return `clear-${baseClass}`;
  if (condition.includes("cloud") || condition.includes("Overcast")) return `cloudy-${baseClass}`;
  if (condition.includes("rain") || condition.includes("drizzle")) return "rainy";
  if (condition.includes("snow") || condition.includes("ice")) return "snowy";
  if (condition.includes("fog") || condition.includes("Fog")) return "foggy";
  if (condition.includes("thunder")) return "thunder";
  
  return "clear-day";
}

// Helper function to convert wind direction in degrees to compass direction
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}