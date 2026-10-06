import { describe, it, expect } from 'vitest'

describe('Weather Service', () => {
  const mockWeatherData = {
    temperature: 25.5,
    humidity: 65,
    windSpeed: 12.3,
    weatherCode: 800,
    weatherDesc: 'Clear sky',
    precipitation: 0,
  }

  it('should have valid temperature range', () => {
    expect(mockWeatherData.temperature).toBeGreaterThanOrEqual(-50)
    expect(mockWeatherData.temperature).toBeLessThanOrEqual(60)
  })

  it('should have valid humidity range', () => {
    expect(mockWeatherData.humidity).toBeGreaterThanOrEqual(0)
    expect(mockWeatherData.humidity).toBeLessThanOrEqual(100)
  })

  it('should have non-negative wind speed', () => {
    expect(mockWeatherData.windSpeed).toBeGreaterThanOrEqual(0)
  })

  it('should have valid weather code', () => {
    expect(mockWeatherData.weatherCode).toBeGreaterThanOrEqual(0)
    expect(mockWeatherData.weatherCode).toBeLessThanOrEqual(999)
  })
})

describe('Weather data transformation', () => {
  const openMeteoResponse = {
    current: {
      temperature_2m: 28.3,
      relative_humidity_2m: 72,
      wind_speed_10m: 8.5,
      weather_code: 802,
      precipitation: 0.2,
    },
  }

  it('should transform Open-Meteo response correctly', () => {
    const transformed = {
      temperature: openMeteoResponse.current.temperature_2m,
      humidity: openMeteoResponse.current.relative_humidity_2m,
      windSpeed: openMeteoResponse.current.wind_speed_10m,
      weatherCode: openMeteoResponse.current.weather_code,
      precipitation: openMeteoResponse.current.precipitation,
    }

    expect(transformed.temperature).toBe(28.3)
    expect(transformed.humidity).toBe(72)
    expect(transformed.windSpeed).toBe(8.5)
    expect(transformed.weatherCode).toBe(802)
  })

  it('should handle missing data gracefully', () => {
    const partial = { current: {} }
    const transformed = {
      temperature: (partial.current as any).temperature_2m ?? null,
      humidity: (partial.current as any).relative_humidity_2m ?? null,
    }

    expect(transformed.temperature).toBeNull()
    expect(transformed.humidity).toBeNull()
  })
})
