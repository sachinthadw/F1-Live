
import { WeatherData, Session } from '../types';
import { CIRCUIT_COORDINATES } from '../constants';

export async function getForecastWeather(session: Session): Promise<WeatherData | null> {
    // Try to match by location string (e.g. "Sakhir" in "Sakhir, Bahrain")
    const locationKey = Object.keys(CIRCUIT_COORDINATES).find(k => session.location.includes(k) || session.circuit_short_name.includes(k));
    const coords = locationKey ? CIRCUIT_COORDINATES[locationKey] : null;

    if (!coords) {
        console.warn(`No coordinates found for location: ${session.location}`);
        return null;
    }

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,rain,wind_speed_10m,wind_direction_10m`);
        if (!res.ok) throw new Error("Weather API Error");
        
        const data = await res.json();
        const current = data.current;

        return {
            air_temperature: current.temperature_2m,
            track_temperature: current.temperature_2m + (current.rain > 0 ? 0 : 8), // Estimate track temp: hotter than air if dry
            humidity: current.relative_humidity_2m,
            pressure: current.surface_pressure,
            rainfall: current.rain,
            wind_speed: current.wind_speed_10m,
            wind_direction: current.wind_direction_10m,
            date: new Date().toISOString()
        };
    } catch (e) {
        console.error("Weather forecast failed", e);
        return null;
    }
}
