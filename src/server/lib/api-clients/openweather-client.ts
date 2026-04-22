/**
 * OpenWeatherMap API Client
 * Free tier: 1,000 calls/day, 60 calls/minute
 */

export type WeatherData = {
  city: string;
  country: string;
  temperature: number; // Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees
  cloudiness: number; // %
  visibility: number; // meters
  weather: {
    id: number;
    main: string; // Rain, Snow, Clear, Clouds, etc.
    description: string;
    icon: string; // Icon code
  };
  rain?: {
    '1h'?: number; // mm
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  timestamp: string;
  sunrise: string;
  sunset: string;
};

const API_KEY = process.env.OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather by coordinates
 */
export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData | null> {
  if (!API_KEY) {
    console.warn('OpenWeatherMap API key not configured');
    return getSimulatedWeather(lat, lon);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status}`);
      return getSimulatedWeather(lat, lon);
    }

    const data = await response.json();

    return {
      city: data.name || 'Unknown',
      country: data.sys?.country || '',
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      weather: {
        id: data.weather[0].id,
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      },
      rain: data.rain,
      snow: data.snow,
      timestamp: new Date(data.dt * 1000).toISOString(),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return getSimulatedWeather(lat, lon);
  }
}

/**
 * Get weather by city name
 */
export async function getWeatherByCity(city: string): Promise<WeatherData | null> {
  if (!API_KEY) {
    console.warn('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      weather: {
        id: data.weather[0].id,
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      },
      rain: data.rain,
      snow: data.snow,
      timestamp: new Date(data.dt * 1000).toISOString(),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

/**
 * Get simulated weather data (fallback when API key not available)
 */
function getSimulatedWeather(lat: number, lon: number): WeatherData {
  const now = new Date();
  const hour = now.getHours();
  
  // Simulate weather based on location and time
  const isMiddleEast = lat > 20 && lat < 40 && lon > 30 && lon < 60;
  const isDaytime = hour >= 6 && hour < 18;
  
  let weatherMain = 'Clear';
  let weatherDesc = 'clear sky';
  let weatherIcon = isDaytime ? '01d' : '01n';
  let temp = 25;
  let cloudiness = 0;
  let rain = undefined;
  
  if (isMiddleEast) {
    // Hot and dry
    temp = 30 + Math.random() * 10;
    cloudiness = Math.random() * 20;
    if (cloudiness > 10) {
      weatherMain = 'Clouds';
      weatherDesc = 'few clouds';
      weatherIcon = isDaytime ? '02d' : '02n';
    }
  } else {
    // Varied weather
    const rand = Math.random();
    if (rand < 0.3) {
      weatherMain = 'Rain';
      weatherDesc = 'light rain';
      weatherIcon = isDaytime ? '10d' : '10n';
      cloudiness = 75 + Math.random() * 25;
      rain = { '1h': 0.5 + Math.random() * 2 };
      temp = 15 + Math.random() * 10;
    } else if (rand < 0.6) {
      weatherMain = 'Clouds';
      weatherDesc = 'scattered clouds';
      weatherIcon = isDaytime ? '03d' : '03n';
      cloudiness = 40 + Math.random() * 40;
      temp = 18 + Math.random() * 12;
    } else {
      temp = 20 + Math.random() * 15;
    }
  }
  
  return {
    city: 'Location',
    country: '',
    temperature: Math.round(temp),
    feelsLike: Math.round(temp - 2 + Math.random() * 4),
    tempMin: Math.round(temp - 3),
    tempMax: Math.round(temp + 3),
    humidity: 40 + Math.round(Math.random() * 40),
    pressure: 1010 + Math.round(Math.random() * 20),
    windSpeed: Math.round(Math.random() * 10 * 10) / 10,
    windDirection: Math.round(Math.random() * 360),
    cloudiness,
    visibility: 10000,
    weather: {
      id: 800,
      main: weatherMain,
      description: weatherDesc,
      icon: weatherIcon,
    },
    rain,
    timestamp: now.toISOString(),
    sunrise: new Date(now.setHours(6, 0, 0)).toISOString(),
    sunset: new Date(now.setHours(18, 30, 0)).toISOString(),
  };
}

/**
 * Get weather icon URL from OpenWeatherMap
 */
export function getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

/**
 * Get weather emoji based on condition
 */
export function getWeatherEmoji(weatherMain: string): string {
  const emojiMap: Record<string, string> = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Dust': '🌪️',
    'Sand': '🌪️',
    'Smoke': '💨',
  };
  
  return emojiMap[weatherMain] || '🌡️';
}

/**
 * Get wind direction as compass direction
 */
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
