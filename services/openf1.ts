import { Session, Driver, Position, Lap, Location, CarData, RaceControlMessage, Interval, Stint, RaceEvent, PitStop, WeatherData, RaceResult } from '../types';

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

/**
 * Fetch from OpenF1 API with exponential backoff retry.
 * Returns an empty array on failure instead of throwing.
 */
async function fetchAPI<T>(endpoint: string, params: Record<string, any> = {}, retries = 3): Promise<T[]> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per request

      const response = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
          if (response.status === 429) {
              // Rate limited — back off aggressively
              const backoff = Math.min(2000 * Math.pow(2, attempt), 15000);
              console.warn(`[OpenF1] Rate limited on ${endpoint}, backing off ${backoff}ms`);
              await new Promise(resolve => setTimeout(resolve, backoff));
              continue;
          }
          if (attempt === retries - 1) return []; 
          continue; 
      }
      
      const text = await response.text();
      try {
          return JSON.parse(text);
      } catch {
          console.warn(`[OpenF1] Invalid JSON from ${endpoint}`);
          return [];
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
          console.warn(`[OpenF1] Timeout on ${endpoint} (attempt ${attempt + 1}/${retries})`);
      } else {
          console.warn(`[OpenF1] Fetch error on ${endpoint} (attempt ${attempt + 1}/${retries}):`, error.message);
      }
      if (attempt === retries - 1) return [];
      // Exponential backoff: 1.5s, 3s, 6s
      const backoff = 1500 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  return [];
}

import { getJolpiSchedule, getJolpiDriverStandings } from './jolpi';

export async function getMeetings(year: number): Promise<any[]> {
    return await fetchAPI<any>('/meetings', { year });
}

export async function getOpenF1OnlySchedule(year?: number): Promise<RaceEvent[]> {
    const currentYear = new Date().getFullYear();
    let targetYear = year || currentYear;
    
    let meetings: any[] = [];
    let sessionsArr: Session[] = [];
    
    const yearsToTry: number[] = [];
    for (let yr = targetYear; yr >= 2023; yr--) {
        yearsToTry.push(yr);
    }
    if (!yearsToTry.includes(2024)) yearsToTry.push(2024);
    if (!yearsToTry.includes(2023)) yearsToTry.push(2023);

    for (const yr of yearsToTry) {
        try {
            const [m, s] = await Promise.all([
                fetchAPI<any>('/meetings', { year: yr }),
                fetchAPI<Session>('/sessions', { year: yr })
            ]);
            if (m && m.length > 0) {
                meetings = m;
                sessionsArr = s;
                targetYear = yr;
                break;
            }
        } catch (e) {
            console.error(`Failed to fetch F1 schedule for year ${yr}`, e);
        }
    }

    try {
        if (!meetings || meetings.length === 0) return [];

        const now = new Date();

        return meetings
            .filter((m: any) => !m.is_cancelled && m.meeting_name !== "Pre-Season Testing")
            .map((m: any, index: number) => {
                const meetingSessions = sessionsArr
                    .filter((s: Session) => s.meeting_key === m.meeting_key && !s.is_cancelled)
                    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

                let finalSessions = meetingSessions;
                if (finalSessions.length === 0 && m.date_start) {
                    const b = new Date(m.date_start);
                    finalSessions = [
                        { session_name: 'Practice 1', session_key: index * 100 + 1, date_start: new Date(b.getTime() + 13.5 * 3600000).toISOString() } as Session,
                        { session_name: 'Practice 2', session_key: index * 100 + 2, date_start: new Date(b.getTime() + 17 * 3600000).toISOString() } as Session,
                        { session_name: 'Practice 3', session_key: index * 100 + 3, date_start: new Date(b.getTime() + 37.5 * 3600000).toISOString() } as Session,
                        { session_name: 'Qualifying',  session_key: index * 100 + 4, date_start: new Date(b.getTime() + 41 * 3600000).toISOString() } as Session,
                        { session_name: 'Race',       session_key: index * 100 + 5, date_start: new Date(b.getTime() + 65 * 3600000).toISOString() } as Session,
                    ];
                }

                const enrichedSessions = finalSessions.map((s: Session) => ({
                    ...s,
                    meeting_key: s.meeting_key || m.meeting_key,
                    circuit_key: s.circuit_key || m.circuit_key,
                    circuit_short_name: s.circuit_short_name || m.circuit_short_name || m.meeting_name,
                    country_name: s.country_name || m.country_name || m.location || "Unknown Country",
                    country_code: s.country_code || m.country_code || "",
                    location: s.location || m.location || "Unknown",
                    year: s.year || m.year || targetYear,
                }));

                const checkSessions = enrichedSessions.length > 0 ? enrichedSessions : [{ date_end: m.date_start, date_start: m.date_start }];
                const isCompleted = new Date(checkSessions[checkSessions.length - 1].date_end || checkSessions[checkSessions.length - 1].date_start).getTime() < now.getTime();

                return {
                    meeting_key: m.meeting_key,
                    meeting_name: m.meeting_name,
                    meeting_official_name: m.meeting_official_name,
                    location: m.location,
                    country_code: m.country_code,
                    circuit_short_name: m.circuit_short_name,
                    date_start: m.date_start,
                    sessions: enrichedSessions,
                    is_completed: isCompleted,
                    round_number: index + 1
                };
            });
    } catch (e) {
        console.error("Failed to fetch schedule from OpenF1", e);
        return [];
    }
}

export async function getSeasonSchedule(year?: number): Promise<RaceEvent[]> {
    const currentYear = new Date().getFullYear();
    let targetYear = year || currentYear;
    
    try {
        // 1. Fetch high-fidelity schedule from Jolpi first to avoid silent fallback data year mismatches
        const jolpiSchedule = await getJolpiSchedule(targetYear);
        if (!jolpiSchedule || jolpiSchedule.length === 0) {
            return await getOpenF1OnlySchedule(targetYear);
        }

        // 2. Fetch OpenF1 meetings & sessions for this specific year
        const [openf1Meetings, openf1Sessions] = await Promise.all([
            fetchAPI<any>('/meetings', { year: targetYear }).catch(() => []),
            fetchAPI<Session>('/sessions', { year: targetYear }).catch(() => [])
        ]);

        // If OpenF1 has meetings/sessions for this year, map OpenF1 session keys so telemetry is fully operational
        if (openf1Meetings && openf1Meetings.length > 0 && openf1Sessions && openf1Sessions.length > 0) {
            return jolpiSchedule.map(event => {
                // Find matching meeting
                const matchedMeeting = openf1Meetings.find((m: any) => 
                    (m.location && event.location && m.location.toLowerCase() === event.location.toLowerCase()) ||
                    (m.meeting_name && event.meeting_name && (m.meeting_name.toLowerCase().includes(event.meeting_name.toLowerCase()) || event.meeting_name.toLowerCase().includes(m.meeting_name.toLowerCase())))
                );

                if (matchedMeeting) {
                    const mappedSessions = event.sessions.map(s => {
                        // Find matching session (e.g. "Practice 1" or "Race")
                        const matchedSession = openf1Sessions.find((os: Session) => 
                            os.meeting_key === matchedMeeting.meeting_key &&
                            os.session_name.toLowerCase().replace(/\s+/g, '') === s.session_name.toLowerCase().replace(/\s+/g, '')
                        );
                        if (matchedSession) {
                            return {
                                ...s,
                                session_key: matchedSession.session_key,
                                meeting_key: matchedSession.meeting_key,
                                circuit_key: matchedSession.circuit_key,
                                country_key: matchedSession.country_key || s.country_key,
                                country_code: matchedSession.country_code || s.country_code,
                                gmt_offset: matchedSession.gmt_offset || s.gmt_offset
                            };
                        }
                        return s;
                    });
                    
                    return {
                        ...event,
                        meeting_key: matchedMeeting.meeting_key,
                        sessions: mappedSessions
                    };
                }
                return event;
            });
        }

        return jolpiSchedule;

    } catch (e) {
        console.error("Failed to compile combined season schedule", e);
        return await getOpenF1OnlySchedule(targetYear);
    }
}

export async function getLastCompletedSession(): Promise<Session | null> {
    const currentYear = new Date().getFullYear();
    const schedule = await getSeasonSchedule(currentYear);
    
    // Find last completed
    const completedEvents = schedule.filter(e => e.is_completed).sort((a,b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
    
    if (completedEvents.length > 0) {
        const lastEvent = completedEvents[0];
        const lastRace = lastEvent.sessions.find(s => s.session_name === 'Race') || lastEvent.sessions[lastEvent.sessions.length - 1];
        return lastRace;
    }
    return null;
}

export async function getRelevantSession(): Promise<Session | null> {
  const currentYear = new Date().getFullYear();
  const schedule = await getSeasonSchedule(currentYear);
  const now = new Date();

  // 1. Check for Active Live Session
  let liveSession = null;
  let upcomingSession = null;

  for (const event of schedule) {
      for (const s of event.sessions) {
          const start = new Date(s.date_start);
          const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Approximate 2 hours
          
          if (start <= now && end >= now) {
              liveSession = s;
          }
          if (start > now && !upcomingSession) {
              upcomingSession = s;
          }
      }
  }

  if (liveSession) {
      return { ...liveSession, is_live: true };
  }

  if (upcomingSession) {
      return { ...upcomingSession, is_live: false };
  }

  // 3. Fallback to next year
  const nextYearSchedule = await getSeasonSchedule(currentYear + 1);
  if (nextYearSchedule.length > 0 && nextYearSchedule[0].sessions.length > 0) {
      return { ...nextYearSchedule[0].sessions[0], is_live: false };
  }

  return await getLastCompletedSession();
}

export async function getTrackMapFromPreviousYear(circuitKey: number): Promise<Location[]> {
    if (TRACK_MAP_CACHE.has(circuitKey)) {
        return TRACK_MAP_CACHE.get(circuitKey)!;
    }

    const currentYear = new Date().getFullYear();
    // Scan years backwards: current -> 2024 -> 2023 -> 2022
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

  // Fallback to Jolpi API if OpenF1 API blocked (e.g. during live session without key)
  if (drivers.length < 10) {
      const currentYear = new Date().getFullYear();
      const jolpiDrivers = await getJolpiDriverStandings(currentYear);
      if (jolpiDrivers.length > 0) {
          return jolpiDrivers.map(jd => ({
              driver_number: jd.driver_number,
              broadcast_name: jd.broadcast_name,
              full_name: jd.full_name,
              name_acronym: jd.name_acronym,
              team_name: jd.team_name,
              team_colour: jd.team_colour,
              first_name: jd.first_name,
              last_name: jd.last_name,
              headshot_url: '',
              country_code: jd.country_code,
              session_key: sessionKey,
              meeting_key: meetingKey
          }));
      }
  }

  return drivers.map(d => {
      const normalizedTeam = normalizeTeamName(d.team_name);
      return {
          ...d,
          team_name: normalizedTeam
      };
  });
}

export async function getLiveLocations(sessionKey: number, dateStart?: string): Promise<Location[]> {
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

export async function getDriverLatestTelemetry(sessionKey: number, driverNumber: number, windowMs: number = 60000): Promise<CarData[]> {
    const now = new Date();
    const dateAfter = new Date(now.getTime() - windowMs).toISOString();
    const data = await fetchAPI<CarData>('/car_data', { 
        session_key: sessionKey, 
        driver_number: driverNumber,
        date_after: dateAfter
    });
    return data.filter((_, i) => i % 5 === 0);
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

export async function getIntervals(sessionKey: number, dateAfter?: string): Promise<Interval[]> {
    const params: any = { session_key: sessionKey };
    if (dateAfter) params.date_after = dateAfter;
    const intervals = await fetchAPI<Interval>('/intervals', params);
    const latestMap = new Map<number, Interval>();
    intervals.forEach(i => {
        const existing = latestMap.get(i.driver_number);
        if (!existing || new Date(i.date) > new Date(existing.date)) {
            latestMap.set(i.driver_number, i);
        }
    });
    return Array.from(latestMap.values());
}

export async function getStints(sessionKey: number): Promise<Stint[]> {
    return await fetchAPI<Stint>('/stints', { session_key: sessionKey });
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

export async function getRaceResults(sessionKey: number): Promise<RaceResult[]> {
    try {
        // Get Drivers
        const drivers = await getDrivers(sessionKey, 0); // 0 meeting key fallback
        const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

        // Get Final Positions
        const positions = await getPositions(sessionKey);
        
        // Sort by position
        const sorted = positions.sort((a, b) => a.position - b.position);

        const results: RaceResult[] = [];
        for (const p of sorted) {
            // Only top 3 needed
            if (p.position > 3) break;
            
            const d = driverMap.get(p.driver_number);
            if (d) {
                results.push({
                    position: p.position,
                    driver_number: d.driver_number,
                    driver_name: d.full_name,
                    team_name: d.team_name,
                    team_colour: d.team_colour,
                    acronym: d.name_acronym
                });
            }
        }
        return results;
    } catch (e) {
        console.error("Error fetching race results", e);
        return [];
    }
}