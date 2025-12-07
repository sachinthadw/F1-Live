
import { ChampionshipEntry } from '../types';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

export async function getChampionshipStandings(): Promise<{ drivers: ChampionshipEntry[], constructors: ChampionshipEntry[] }> {
    try {
        // Fetch Drivers
        const driversRes = await fetch(`${BASE_URL}/current/driverStandings.json`);
        const driversJson = await driversRes.json();
        const driverList = driversJson.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

        const drivers: ChampionshipEntry[] = driverList.map((d: any) => ({
            position: parseInt(d.position),
            entity_name: `${d.Driver.givenName} ${d.Driver.familyName}`,
            team_name: d.Constructors[0]?.name || "Unknown",
            // Map common team names to hex codes roughly (or use the one from OpenF1 if we merged data, but static map is safer for standings)
            team_colour: getTeamColor(d.Constructors[0]?.name),
            points: parseFloat(d.points),
            wins: parseInt(d.wins),
            acronym: d.Driver.code || d.Driver.familyName.substring(0,3).toUpperCase()
        }));

        // Fetch Constructors
        const constructorsRes = await fetch(`${BASE_URL}/current/constructorStandings.json`);
        const constructorsJson = await constructorsRes.json();
        const constructorList = constructorsJson.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];

        const constructors: ChampionshipEntry[] = constructorList.map((c: any) => ({
            position: parseInt(c.position),
            entity_name: c.Constructor.name,
            team_name: c.Constructor.name,
            team_colour: getTeamColor(c.Constructor.name),
            points: parseFloat(c.points),
            wins: parseInt(c.wins)
        }));

        return { drivers, constructors };

    } catch (e) {
        console.error("Jolpica/Ergast API Error", e);
        return { drivers: [], constructors: [] };
    }
}

// Helper to ensure the standings look pretty with colors, 
// since Jolpica doesn't return colors directly.
function getTeamColor(teamName: string): string {
    const n = (teamName || "").toLowerCase();
    if (n.includes("red bull")) return "3671C6";
    if (n.includes("mercedes")) return "27F4D2";
    if (n.includes("ferrari")) return "E80020";
    if (n.includes("mclaren")) return "FF8000";
    if (n.includes("aston")) return "229971";
    if (n.includes("alpine")) return "0093CC";
    if (n.includes("williams")) return "64C4FF";
    if (n.includes("rb") || n.includes("alpha")) return "6692FF";
    if (n.includes("sauber") || n.includes("stake") || n.includes("kick")) return "52E252";
    if (n.includes("haas")) return "B6BABD";
    if (n.includes("audi")) return "F24456"; // Future proofing
    return "FFFFFF";
}
