import { CircuitInfo, Driver, Session } from './types';

export const DEFAULT_COLOR = "#FFFFFF";

export const TEAM_COLORS: Record<string, string> = {
    "Red Bull Racing": "#3671C6",
    "Mercedes": "#27F4D2",
    "Ferrari": "#E80020",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#0093CC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "VCARB": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD",
    "Audi": "#F50537",
};

export const CIRCUIT_COORDINATES: Record<string, { lat: number, lon: number }> = {
    "Sakhir": { lat: 26.0325, lon: 50.5106 },
    "Jeddah": { lat: 21.6319, lon: 39.1044 },
    "Melbourne": { lat: -37.8497, lon: 144.968 },
    "Suzuka": { lat: 34.8431, lon: 136.541 },
    "Shanghai": { lat: 31.3389, lon: 121.220 },
    "Miami": { lat: 25.9581, lon: -80.2389 },
    "Imola": { lat: 44.3439, lon: 11.7167 },
    "Monaco": { lat: 43.7347, lon: 7.4206 },
    "Montreal": { lat: 45.5000, lon: -73.5228 },
    "Barcelona": { lat: 41.5700, lon: 2.2611 },
    "Spielberg": { lat: 47.2197, lon: 14.7647 },
    "Silverstone": { lat: 52.0786, lon: -1.0169 },
    "Budapest": { lat: 47.5789, lon: 19.2486 },
    "Spa": { lat: 50.4372, lon: 5.9714 },
    "Zandvoort": { lat: 52.3888, lon: 4.5409 },
    "Monza": { lat: 45.6156, lon: 9.2811 },
    "Baku": { lat: 40.3725, lon: 49.8533 },
    "Singapore": { lat: 1.2914, lon: 103.864 },
    "Austin": { lat: 30.1328, lon: -97.6411 },
    "Mexico City": { lat: 19.4042, lon: -99.0907 },
    "Sao Paulo": { lat: -23.7036, lon: -46.6997 },
    "Las Vegas": { lat: 36.1147, lon: -115.173 },
    "Lusail": { lat: 25.4888, lon: 51.4542 },
    "Yas Marina": { lat: 24.4672, lon: 54.6031 }
};

export const CIRCUIT_INFO: Record<string, CircuitInfo> = {
    "Sakhir": { laps: 57, length: "5.412 km", corners: 15, aero_zones: 3, lap_record: "1:31.447 (Pedro de la Rosa, 2005)" },
    "Jeddah": { laps: 50, length: "6.174 km", corners: 27, aero_zones: 3, lap_record: "1:30.734 (Lewis Hamilton, 2021)" },
    "Melbourne": { laps: 58, length: "5.278 km", corners: 14, aero_zones: 4, lap_record: "1:19.813 (Charles Leclerc, 2024)" },
    "Suzuka": { laps: 53, length: "5.807 km", corners: 18, aero_zones: 1, lap_record: "1:30.983 (Lewis Hamilton, 2019)" },
    "Shanghai": { laps: 56, length: "5.451 km", corners: 16, aero_zones: 2, lap_record: "1:32.238 (Michael Schumacher, 2004)" },
    "Miami": { laps: 57, length: "5.412 km", corners: 19, aero_zones: 3, lap_record: "1:29.708 (Max Verstappen, 2023)" },
    "Imola": { laps: 63, length: "4.909 km", corners: 19, aero_zones: 1, lap_record: "1:15.484 (Lewis Hamilton, 2020)" },
    "Monaco": { laps: 78, length: "3.337 km", corners: 19, aero_zones: 1, lap_record: "1:12.909 (Lewis Hamilton, 2021)" },
    "Montreal": { laps: 70, length: "4.361 km", corners: 14, aero_zones: 3, lap_record: "1:13.078 (Valtteri Bottas, 2019)" },
    "Barcelona": { laps: 66, length: "4.657 km", corners: 14, aero_zones: 2, lap_record: "1:16.330 (Max Verstappen, 2023)" },
    "Spielberg": { laps: 71, length: "4.318 km", corners: 10, aero_zones: 3, lap_record: "1:05.619 (Carlos Sainz, 2020)" },
    "Silverstone": { laps: 52, length: "5.891 km", corners: 18, aero_zones: 2, lap_record: "1:27.097 (Max Verstappen, 2020)" },
    "Budapest": { laps: 70, length: "4.381 km", corners: 14, aero_zones: 2, lap_record: "1:16.627 (Lewis Hamilton, 2020)" },
    "Spa": { laps: 44, length: "7.004 km", corners: 19, aero_zones: 2, lap_record: "1:46.286 (Valtteri Bottas, 2018)" },
    "Zandvoort": { laps: 72, length: "4.259 km", corners: 14, aero_zones: 2, lap_record: "1:11.097 (Lewis Hamilton, 2021)" },
    "Monza": { laps: 53, length: "5.793 km", corners: 11, aero_zones: 2, lap_record: "1:21.046 (Rubens Barrichello, 2004)" },
    "Baku": { laps: 51, length: "6.003 km", corners: 20, aero_zones: 2, lap_record: "1:43.009 (Charles Leclerc, 2019)" },
    "Singapore": { laps: 62, length: "4.940 km", corners: 19, aero_zones: 3, lap_record: "1:35.867 (Lewis Hamilton, 2023)" },
    "Austin": { laps: 56, length: "5.513 km", corners: 20, aero_zones: 2, lap_record: "1:36.169 (Charles Leclerc, 2019)" },
    "Mexico City": { laps: 71, length: "4.304 km", corners: 17, aero_zones: 3, lap_record: "1:17.774 (Valtteri Bottas, 2021)" },
    "Sao Paulo": { laps: 71, length: "4.309 km", corners: 15, aero_zones: 2, lap_record: "1:10.540 (Valtteri Bottas, 2018)" },
    "Las Vegas": { laps: 50, length: "6.201 km", corners: 17, aero_zones: 2, lap_record: "1:35.490 (Oscar Piastri, 2023)" },
    "Lusail": { laps: 57, length: "5.419 km", corners: 16, aero_zones: 1, lap_record: "1:24.319 (Max Verstappen, 2023)" },
    "Yas Marina": { laps: 58, length: "5.281 km", corners: 16, aero_zones: 2, lap_record: "1:26.103 (Max Verstappen, 2021)" }
};

/**
 * Fallback session data used when the OpenF1 API is unreachable.
 * Uses the most recent completed race as a safe demo fallback.
 */
export const FALLBACK_SESSION: Session = {
    session_key: 9649,
    meeting_key: 1251,
    circuit_key: 44,
    circuit_short_name: "Yas Marina Circuit",
    country_name: "United Arab Emirates",
    country_key: 14,
    country_code: "AE",
    gmt_offset: "+04:00",
    location: "Abu Dhabi",
    year: 2024,
    date_start: "2024-12-08T13:00:00",
    date_end: "2024-12-08T15:00:00",
    session_name: "Race",
    session_type: "Race",
    is_live: false
};

/**
 * Fallback driver list used when APIs cannot return driver data.
 */
export const FALLBACK_DRIVERS: Driver[] = [
    { driver_number: 1, full_name: "Max Verstappen", name_acronym: "VER", team_name: "Red Bull Racing", team_colour: "3671C6", country_code: "NLD", broadcast_name: "M VERSTAPPEN", first_name: "Max", last_name: "Verstappen", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 4, full_name: "Lando Norris", name_acronym: "NOR", team_name: "McLaren", team_colour: "FF8000", country_code: "GBR", broadcast_name: "L NORRIS", first_name: "Lando", last_name: "Norris", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 44, full_name: "Lewis Hamilton", name_acronym: "HAM", team_name: "Ferrari", team_colour: "E8002D", country_code: "GBR", broadcast_name: "L HAMILTON", first_name: "Lewis", last_name: "Hamilton", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC", team_name: "Ferrari", team_colour: "E8002D", country_code: "MCO", broadcast_name: "C LECLERC", first_name: "Charles", last_name: "Leclerc", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 81, full_name: "Oscar Piastri", name_acronym: "PIA", team_name: "McLaren", team_colour: "FF8000", country_code: "AUS", broadcast_name: "O PIASTRI", first_name: "Oscar", last_name: "Piastri", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 55, full_name: "Carlos Sainz", name_acronym: "SAI", team_name: "Williams", team_colour: "64C4FF", country_code: "ESP", broadcast_name: "C SAINZ", first_name: "Carlos", last_name: "Sainz", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 63, full_name: "George Russell", name_acronym: "RUS", team_name: "Mercedes", team_colour: "27F4D2", country_code: "GBR", broadcast_name: "G RUSSELL", first_name: "George", last_name: "Russell", headshot_url: "", session_key: 9649, meeting_key: 1251 },
    { driver_number: 14, full_name: "Fernando Alonso", name_acronym: "ALO", team_name: "Aston Martin", team_colour: "229971", country_code: "ESP", broadcast_name: "F ALONSO", first_name: "Fernando", last_name: "Alonso", headshot_url: "", session_key: 9649, meeting_key: 1251 },
];