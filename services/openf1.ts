

import { Session, Driver, Position, Lap, Location, CarData, RaceControlMessage, Interval, Stint, RaceEvent, PitStop, WeatherData } from '../types';

const API_BASE = 'https://api.openf1.org/v1';

// Cache for track maps to prevent repeated fetches
const TRACK_MAP_CACHE = new Map<number, Location[]>();

export const normalizeTeamName = (name: string): string => {
    if (!name) return "Unknown";
    const n = name.toLowerCase();
    
    if (n.includes("stake") || (n.includes("kick") && n.includes("sauber"))) return "Kick Sauber";
    if (n.includes("visa") || n.includes("vcarb") || n.includes("rb")) return "VCARB";
    if (n.includes("audi")) return "Audi"; 
    if (n.includes("haas")) return "Haas F1 Team";
    if (n.includes("aston")) return "Aston Martin";
    if (n.includes("red bull")) return "Red Bull Racing";
    if (n.includes("mercedes")) return "Mercedes";
    if (n.includes("ferrari")) return "Ferrari";
    if (n.includes("mclaren")) return "McLaren";
    if (n.includes("alpine")) return "Alpine";
    if (n.includes("williams")) return "Williams";
    
    return name;
};

async function fetchAPI<T>(endpoint: string, params: Record<string, any> = {}, retries = 3): Promise<T[]> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
          if (attempt === retries - 1) return []; 
          continue; 
      }
      
      const text = await response.text();
      try {
          return JSON.parse(text);
      } catch (e) {
          return [];
      }
    } catch (error) {
      if (attempt === retries - 1) return [];
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return [];
}

export async function getSeasonSchedule(): Promise<RaceEvent[]> {
    try {
        const currentYear = new Date().getFullYear();
        let sessions = await fetchAPI<Session>('/sessions', { year: currentYear });
        if (sessions.length === 0) {
             sessions = await fetchAPI<Session>('/sessions', { year: currentYear - 1 });
        }
        
        if (sessions.length === 0) return [];

        const meetingMap = new Map<number, RaceEvent>();

        sessions.forEach(s => {
            if (!meetingMap.has(s.meeting_key)) {
                meetingMap.set(s.meeting_key, {
                    meeting_key: s.meeting_key,
                    meeting_name: s.country_name === "United States" ? `US Grand Prix (${s.location})` : `${s.country_name} Grand Prix`, 
                    meeting_official_name: s.location,
                    location: s.location,
                    country_code: s.country_code,
                    circuit_short_name: s.circuit_short_name,
                    date_start: s.date_start,
                    sessions: [],
                    is_completed: false
                });
            }
            const event = meetingMap.get(s.meeting_key)!;
            event.sessions.push(s);
            if (new Date(s.date_start) < new Date(event.date_start)) {
                event.date_start = s.date_start;
            }
        });

        const events = Array.from(meetingMap.values());
        events.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
        
        events.forEach(e => {
            e.sessions.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
            const now = new Date();
            const raceSession = e.sessions.find(s => s.session_name === 'Race') || e.sessions[e.sessions.length - 1];
            e.is_completed = raceSession ? new Date(raceSession.date_end) < now : false;
        });

        events.forEach((e, i) => e.round_number = i + 1);

        return events;
    } catch (e) {
        console.error("Error fetching schedule", e);
        return [];
    }
}

export async function getLastCompletedSession(): Promise<Session | null> {
    const currentYear = new Date().getFullYear();
    const sessions = await fetchAPI<Session>('/sessions', { year: currentYear });
    const now = new Date();
    
    const completed = sessions
        .filter(s => new Date(s.date_end) < now && s.session_name === 'Race')
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());
        
    if (completed.length > 0) return completed[0];
    
    const lastYearSessions = await fetchAPI<Session>('/sessions', { year: currentYear - 1 });
    const completedLastYear = lastYearSessions
        .filter(s => new Date(s.date_end) < now && s.session_name === 'Race')
        .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());
        
    if (completedLastYear.length > 0) return completedLastYear[0];
    return null;
}

export async function getRelevantSession(): Promise<Session | null> {
  const currentYear = new Date().getFullYear();
  let sessions = await fetchAPI<Session>('/sessions', { year: currentYear });

  if (sessions.length === 0) {
      sessions = await fetchAPI<Session>('/sessions', { year: currentYear - 1 });
  }
  
  if (sessions.length === 0) return null;

  const now = new Date();

  // 1. Check for Active Live Session
  const liveSession = sessions.find(s => {
      const start = new Date(s.date_start);
      const end = new Date(s.date_end);
      const isOngoing = (start <= now && end >= now);
      const isLikelyLive = (start <= now && (now.getTime() - start.getTime() < 4 * 60 * 60 * 1000));
      return isOngoing || isLikelyLive;
  });

  if (liveSession) {
      return { ...liveSession, is_live: true };
  }

  // 2. Check for Upcoming Session
  const upcoming = sessions
    .filter(s => new Date(s.date_start) > now)
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

  if (upcoming.length > 0) {
      return { ...upcoming[0], is_live: false };
  }

  // 3. Fallback to Last Completed
  const completed = sessions
    .filter(s => new Date(s.date_start) <= now)
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());

  if (completed.length > 0) {
      return { ...completed[0], is_live: false };
  }

  return null;
}

export async function getTrackMapFromPreviousYear(circuitKey: number): Promise<Location[]> {
    if (TRACK_MAP_CACHE.has(circuitKey)) {
        return TRACK_MAP_CACHE.get(circuitKey)!;
    }

    const currentYear = new Date().getFullYear();
    // Scan years backwards: 2025 -> 2024 -> 2023 -> 2022
    for (let year = currentYear; year >= 2022; year--) {
        try {
            // Prefer Qualifying for clean laps, then Race
            let sessions = await fetchAPI<Session>('/sessions', { circuit_key: circuitKey, year: year, session_name: 'Qualifying' });
            if (sessions.length === 0) {
                sessions = await fetchAPI<Session>('/sessions', { circuit_key: circuitKey, year: year, session_name: 'Race' });
            }
            if (sessions.length === 0) continue;
            
            const targetSession = sessions[0];
            
            // Get all laps for this session to find the fastest valid one
            const laps = await fetchAPI<Lap>('/laps', { session_key: targetSession.session_key });
            if (laps.length === 0) continue;

            // Find best lap: completed, not pit in/out, reasonable duration
            const validLaps = laps
                .filter(l => !l.is_pit_out_lap && l.lap_duration < 200 && l.lap_duration > 50)
                .sort((a, b) => a.lap_duration - b.lap_duration);

            if (validLaps.length > 0) {
                const bestLap = validLaps[0];
                const start = new Date(bestLap.date_start).toISOString();
                const end = new Date(new Date(bestLap.date_start).getTime() + (bestLap.lap_duration * 1000) + 2000).toISOString(); // Add buffer
                
                const locations = await fetchAPI<Location>('/location', { 
                    session_key: targetSession.session_key, 
                    driver_number: bestLap.driver_number,
                    date_start: start,
                    date_end: end
                });

                if (locations.length > 50) {
                    TRACK_MAP_CACHE.set(circuitKey, locations);
                    return locations;
                }
            }
        } catch (e) {
            console.warn(`Failed map fetch for year ${year}`, e);
        }
    }
    return [];
}

export async function getDrivers(sessionKey: number, meetingKey: number): Promise<Driver[]> {
  let drivers = await fetchAPI<Driver>('/drivers', { session_key: sessionKey });
  
  if (drivers.length < 10 && meetingKey) {
      const meetingDrivers = await fetchAPI<Driver>('/drivers', { meeting_key: meetingKey });
      const unique = new Map<number, Driver>();
      meetingDrivers.forEach(d => unique.set(d.driver_number, d));
      drivers = Array.from(unique.values());
  }

  return drivers.map(d => {
      const normalizedTeam = normalizeTeamName(d.team_name);
      return {
          ...d,
          team_name: normalizedTeam
      };
  });
}

export async function getLiveLocations(sessionKey: number, dateStart: string, useDateEnd: boolean = false): Promise<Location[]> {
    const params: any = { session_key: sessionKey };
    if (dateStart) params.date_after = dateStart;
    const locations = await fetchAPI<Location>('/location', params);
    return locations;
}

export async function getLaps(sessionKey: number, driverNumber: number): Promise<Lap[]> {
  return await fetchAPI<Lap>('/laps', { session_key: sessionKey, driver_number: driverNumber });
}

export async function getSessionLocations(sessionKey: number, driverNumber: number): Promise<Location[]> {
    return await fetchAPI<Location>('/location', { session_key: sessionKey, driver_number: driverNumber });
}

export async function getTelemetry(sessionKey: number, driverNumber: number, lapNumber: number): Promise<CarData[]> {
  return await fetchAPI<CarData>('/car_data', { 
      session_key: sessionKey, 
      driver_number: driverNumber, 
      lap_number: lapNumber 
  });
}

export async function getLatestTelemetry(sessionKey: number, dateStart: string): Promise<CarData[]> {
    return await fetchAPI<CarData>('/car_data', { 
        session_key: sessionKey, 
        date_after: dateStart
    });
}

export async function getRaceControlMessages(sessionKey: number): Promise<RaceControlMessage[]> {
    return await fetchAPI<RaceControlMessage>('/race_control', { session_key: sessionKey });
}

export async function getPositions(sessionKey: number, dateAfter?: string): Promise<Position[]> {
    const params: any = { session_key: sessionKey };
    if (dateAfter) params.date_after = dateAfter;
    
    const positions = await fetchAPI<Position>('/position', params);
    
    const latestMap = new Map<number, Position>();
    positions.forEach(p => {
        const existing = latestMap.get(p.driver_number);
        if (!existing || new Date(p.date) > new Date(existing.date)) {
            latestMap.set(p.driver_number, p);
        }
    });
    return Array.from(latestMap.values());
}

export async function getGridPositions(sessionKey: number): Promise<Map<number, number>> {
    const positions = await fetchAPI<Position>('/position', { session_key: sessionKey });
    const startMap = new Map<number, { pos: number, time: number }>();
    positions.forEach(p => {
        const time = new Date(p.date).getTime();
        const existing = startMap.get(p.driver_number);
        if (!existing || time < existing.time) {
            startMap.set(p.driver_number, { pos: p.position, time });
        }
    });
    const grid = new Map<number, number>();
    startMap.forEach((val, key) => grid.set(key, val.pos));
    return grid;
}

export async function getIntervals(sessionKey: number): Promise<Interval[]> {
    const intervals = await fetchAPI<Interval>('/intervals', { session_key: sessionKey });
    const latestMap = new Map<number, Interval>();
    intervals.forEach(i => {
        const existing = latestMap.get(i.driver_number);
        if (!existing || new Date(i.date) > new Date(existing.date)) {
            latestMap.set(i.driver_number, i);
        }
    });
    return Array.from(latestMap.values());
}

export async function getLatestDataTimestamp(sessionKey: number): Promise<string | null> {
    try {
        const msgs = await fetchAPI<RaceControlMessage>('/race_control', { session_key: sessionKey });
        if (msgs.length > 0) return msgs[msgs.length - 1].date;
        return null;
    } catch {
        return null;
    }
}

export async function getWeather(sessionKey: number, dateStart?: string): Promise<WeatherData | null> {
    const params: any = { session_key: sessionKey };
    if (dateStart) params.date_after = dateStart;
    const weather = await fetchAPI<WeatherData>('/weather', params);
    return weather.length > 0 ? weather[weather.length - 1] : null;
}

export async function getLatestLap(sessionKey: number, driverNumber?: number): Promise<number> {
    try {
        if (driverNumber) {
            const laps = await getLaps(sessionKey, driverNumber);
            if (laps.length > 0) {
                return Math.max(...laps.map(l => l.lap_number)) + 1;
            }
        }
        return 0;
    } catch {
        return 0;
    }
}