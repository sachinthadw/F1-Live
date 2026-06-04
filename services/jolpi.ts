import { RaceEvent, Session, DriverStanding } from '../types';
import { normalizeTeamName } from './openf1';

const JOLPI_API = 'https://api.jolpi.ca/ergast/f1';

export const getTeamColorCode = (team: string): string => {
    switch (team) {
        case "Kick Sauber": return "52E252";
        case "VCARB": return "6692FF";
        case "Audi": return "F50537";
        case "Haas F1 Team": return "B6BABD";
        case "Aston Martin": return "229971";
        case "Red Bull Racing": return "3671C6";
        case "Mercedes": return "27F4D2";
        case "Ferrari": return "E8002D";
        case "McLaren": return "FF8000";
        case "Alpine": return "0093CC";
        case "Williams": return "64C4FF";
        default: return "FFFFFF";
    }
};

export async function fetchJolpi<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(`${JOLPI_API}${endpoint}`, { mode: 'cors' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function getJolpiSchedule(year: number): Promise<RaceEvent[]> {
    const data = await fetchJolpi<any>(`/${year}.json`);
    if (!data?.MRData?.RaceTable?.Races) return [];

    const now = new Date();
    
    return data.MRData.RaceTable.Races.map((r: any) => {
        const sessions: Session[] = [];
        const mk = parseInt(r.round) * 1000;
        
        const addSession = (obj: any, name: string, offset: number) => {
            if (obj && obj.date && obj.time) {
                sessions.push({
                    session_key: mk + offset,
                    meeting_key: mk,
                    circuit_key: 0,
                    circuit_short_name: r.Circuit.circuitName,
                    country_name: r.Circuit.Location.country,
                    country_key: 0,
                    country_code: '',
                    location: r.Circuit.Location.locality,
                    year: parseInt(r.season),
                    date_start: obj.date + 'T' + obj.time,
                    date_end: obj.date + 'T' + obj.time,
                    gmt_offset: '00:00:00',
                    session_name: name,
                    session_type: name,
                });
            }
        };

        addSession(r.FirstPractice, "Practice 1", 1);
        addSession(r.SecondPractice, "Practice 2", 2);
        addSession(r.ThirdPractice, "Practice 3", 3);
        addSession(r.SprintShootout, "Sprint Shootout", 4);
        addSession(r.Sprint, "Sprint", 5);
        addSession(r.Qualifying, "Qualifying", 6);
        addSession({ date: r.date, time: r.time }, "Race", 7);
        
        sessions.sort((a,b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
        
        const isCompleted = sessions.length > 0 && new Date(sessions[sessions.length-1].date_start).getTime() < now.getTime();
        
        return {
           meeting_key: mk,
           meeting_name: r.raceName,
           meeting_official_name: r.raceName,
           location: r.Circuit.Location.locality,
           country_code: "",
           circuit_short_name: r.Circuit.circuitName,
           date_start: sessions.length > 0 ? sessions[0].date_start : r.date,
           sessions,
           is_completed: isCompleted,
           round_number: parseInt(r.round)
        };
    });
}

export async function getJolpiDriverStandings(year: number): Promise<DriverStanding[]> {
    const data = await fetchJolpi<any>(`/${year}/driverStandings.json`);
    if (!data?.MRData?.StandingsTable?.StandingsLists?.[0]) return [];
    
    const list = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
    
    return list.map((d: any) => {
        const teamName = d.Constructors[0]?.name || "Unknown";
        return {
            driver_number: parseInt(d.Driver.permanentNumber || '0'),
            broadcast_name: `${d.Driver.givenName.charAt(0).toUpperCase()} ${d.Driver.familyName.toUpperCase()}`,
            full_name: `${d.Driver.givenName} ${d.Driver.familyName}`,
            name_acronym: d.Driver.code || d.Driver.familyName.substring(0,3).toUpperCase(),
            team_name: teamName,
            team_colour: getTeamColorCode(normalizeTeamName(teamName)),
            first_name: d.Driver.givenName,
            last_name: d.Driver.familyName,
            headshot_url: '',
            country_code: d.Driver.nationality,
            session_key: 0,
            meeting_key: 0,
            position: parseInt(d.position),
            gap: d.points + " PTS",
            interval: '-',
        } as DriverStanding;
    });
}
