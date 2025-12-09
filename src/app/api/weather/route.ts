import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
}

// GET - Get weather for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // If facilityId provided, try to get from cache first
    if (facilityId) {
      const cachedWeather = await prisma.weatherCache.findUnique({
        where: { facilityId },
      });

      if (cachedWeather && cachedWeather.expiresAt > new Date()) {
        return NextResponse.json({
          success: true,
          data: {
            temperature: cachedWeather.temperature,
            humidity: cachedWeather.humidity,
            conditions: cachedWeather.conditions,
            icon: cachedWeather.icon,
            cached: true,
          },
        });
      }

      // Get facility location for API call
      const facility = await prisma.facility.findUnique({
        where: { id: facilityId },
        select: { latitude: true, longitude: true, postalCode: true, city: true },
      });

      if (facility?.latitude && facility?.longitude) {
        const weather = await fetchWeatherByCoords(facility.latitude, facility.longitude);
        if (weather) {
          await cacheWeather(facilityId, weather);
          return NextResponse.json({ success: true, data: { ...weather, cached: false } });
        }
      }

      // Fallback to postal code or city
      if (facility?.postalCode || facility?.city) {
        const weather = await fetchWeatherByLocation(
          facility.postalCode || facility.city || ''
        );
        if (weather) {
          await cacheWeather(facilityId, weather);
          return NextResponse.json({ success: true, data: { ...weather, cached: false } });
        }
      }
    }

    // Direct coordinates lookup
    if (lat && lon) {
      const weather = await fetchWeatherByCoords(parseFloat(lat), parseFloat(lon));
      if (weather) {
        return NextResponse.json({ success: true, data: weather });
      }
    }

    // Return default/fallback weather
    return NextResponse.json({
      success: true,
      data: {
        temperature: null,
        humidity: null,
        conditions: 'Weather unavailable',
        icon: null,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}

async function fetchWeatherByCoords(lat: number, lon: number) {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeather API key not configured');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 900 } }); // Cache for 15 min

    if (!response.ok) {
      console.error('OpenWeather API error:', response.status);
      return null;
    }

    const data: OpenWeatherResponse = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      conditions: data.weather[0]?.main || 'Unknown',
      icon: data.weather[0]?.icon || null,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

async function fetchWeatherByLocation(location: string) {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeather API key not configured');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 900 } });

    if (!response.ok) {
      console.error('OpenWeather API error:', response.status);
      return null;
    }

    const data: OpenWeatherResponse = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      conditions: data.weather[0]?.main || 'Unknown',
      icon: data.weather[0]?.icon || null,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

async function cacheWeather(
  facilityId: string,
  weather: { temperature: number; humidity: number; conditions: string; icon: string | null }
) {
  try {
    await prisma.weatherCache.upsert({
      where: { facilityId },
      update: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        conditions: weather.conditions,
        icon: weather.icon,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      },
      create: {
        facilityId,
        temperature: weather.temperature,
        humidity: weather.humidity,
        conditions: weather.conditions,
        icon: weather.icon,
        expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      },
    });
  } catch (error) {
    console.error('Error caching weather:', error);
  }
}
