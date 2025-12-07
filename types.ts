

export interface Session {
  session_key: number;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  country_key: number;
  country_code: string;
  location: string;
  year: number;
  date_start: string;
  date_end: string;
  session_name: string;
  session_type: string;
  is_live?: boolean;
}

export type SessionStatus = 'upcoming' | 'live' | 'completed';
export type TrackStatus = 'GREEN' | 'YELLOW' | 'SC' | 'VSC' | 'RED' | 'CHEQUERED';

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string;
  country_code: string;
  session_key: number;
  meeting_key: number;
  team_logo_url?: string;
}

export interface Position {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  position: number;
}

export interface Interval {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    gap_to_leader: number | null;
    interval: number | null;
    date: string;
}

export interface Lap {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  lap_number: number;
  date_start: string;
  lap_duration: number;
  is_pit_out_lap: boolean;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  segments_sector_1: any[]; 
  segments_sector_2: any[];
  segments_sector_3: any[];
}

export interface Location {
  x: number;
  y: number;
  z: number;
  driver_number: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface CarData {
  driver_number: number;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number; // > 8 = Open (X-MODE), 0-8 = Closed (Z-MODE)
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface Stint {
    driver_number: number;
    lap_start: number;
    lap_end: number;
    compound: string; // SOFT, MEDIUM, HARD, INTERMEDIATE, WET
    tyre_age_at_start: number;
}

// Internal State Types
export interface DriverStanding extends Driver {
  position: number;
  grid_position?: number; // Starting position for accuracy
  pos_change?: number; // > 0 gained, < 0 lost
  gap: string; 
  interval: string;
  pit_count?: number;
  tyre_compound?: string; 
  penalties?: string[];
  
  // 2026 Specs
  aero_status?: 'X-MODE' | 'Z-MODE'; // Low Drag vs High Downforce
  mom_status?: 'ACTIVE' | 'READY' | 'UNAVAILABLE'; // Manual Override Mode
}

export interface DriverMapData {
  driver_number: number;
  x: number;
  y: number;
  team_colour: string;
  acronym: string;
}

export interface RaceControlMessage {
  id?: number; 
  date: string;
  lap_number: number;
  category: string;
  message: string;
  flag?: string; 
  driver_number?: number;
}

export interface PitStop {
  driver_number: number;
  lap_number: number;
  date: string;
  duration: number;
  session_key: number;
  meeting_key: number;
}

export interface RaceEvent {
    meeting_key: number;
    meeting_name: string;
    meeting_official_name: string;
    location: string;
    country_code: string;
    circuit_short_name: string;
    date_start: string;
    sessions: Session[];
    round_number?: number;
    is_completed: boolean;
}

export interface WeatherData {
    air_temperature: number;
    track_temperature: number;
    humidity: number;
    pressure: number;
    rainfall: number;
    wind_direction: number;
    wind_speed: number;
    date: string;
}

export interface ChampionshipEntry {
    position: number;
    entity_name: string; // Driver Name or Team Name
    team_name?: string; // For driver standing
    team_colour: string;
    points: number;
    wins?: number;
    podiums?: number;
    acronym?: string;
}

export interface CachedChampionshipData {
    lastUpdated: number;
    processedSessionKeys: number[];
    drivers: ChampionshipEntry[];
    constructors: ChampionshipEntry[];
}

export interface CircuitInfo {
    laps: number;
    length: string;
    corners: number;
    aero_zones: number; // Renamed from drs_zones for 2026
    lap_record: string;
}