
import { ChampionshipEntry } from '../types';

// NOTE: Sportradar requires an API Key.
// In a real production environment, this should be proxied via a backend to hide the key.
// For this client-side demo, we look for an env variable.
const API_KEY = (import.meta as any).env?.VITE_SPORTRADAR_API_KEY || '';
const BASE_URL = 'https://api.sportradar.com/formula1/trial/v2/en';

export const isSportradarConfigured = () => !!API_KEY;

async function fetchSR(endpoint: string) {
    if (!API_KEY) return null;
    try {
        const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
        if (!res.ok) throw new Error(`Sportradar API Error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn("Sportradar fetch failed", e);
        return null;
    }
}

export async function getChampionshipsFromSportradar(): Promise<{ drivers: ChampionshipEntry[], constructors: ChampionshipEntry[] } | null> {
    if (!API_KEY) return null;

    try {
        // 1. Get Seasons to find current one
        const seasonsData = await fetchSR('/seasons.json');
        if (!seasonsData) return null;

        const currentYear = new Date().getFullYear();
        // Sportradar seasons usually look like "sr:season:103682"
        // We find the one matching the current year
        const season = seasonsData.seasons.find((s: any) => s.year === String(currentYear));
        
        if (!season) return null;

        // 2. Get Standings
        const standingsData = await fetchSR(`/seasons/${season.id}/standings.json`);
        if (!standingsData || !standingsData.standings) return null;

        // 3. Map Driver Standings
        const drivers: ChampionshipEntry[] = standingsData.standings[0].driver_standings.map((ds: any) => ({
            position: ds.position,
            entity_name: `${ds.driver.first_name} ${ds.driver.last_name}`, // Full Name
            team_name: ds.team.name,
            team_colour: 'FFFFFF', // SR doesn't give hex codes easily, we might need to map or default
            points: ds.points,
            wins: ds.wins || 0,
            podiums: 0, // Not always in summary
            acronym: ds.driver.tla || ds.driver.last_name.substring(0,3).toUpperCase()
        }));

        // 4. Map Constructor Standings
        const constructors: ChampionshipEntry[] = standingsData.standings[0].team_standings.map((ts: any) => ({
            position: ts.position,
            entity_name: ts.team.name,
            team_colour: 'FFFFFF',
            points: ts.points,
            wins: ts.wins || 0,
            podiums: 0
        }));

        return { drivers, constructors };

    } catch (e) {
        console.error("Sportradar Logic Error", e);
        return null;
    }
}