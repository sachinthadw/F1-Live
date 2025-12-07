

import React, { useEffect, useState, useRef } from 'react';
import { getRelevantSession, getDrivers, getLiveLocations, getRaceControlMessages, getPositions, getLatestDataTimestamp, getIntervals, getGridPositions, getLatestTelemetry, getWeather, getLastCompletedSession, getSeasonSchedule, getLatestLap } from './services/openf1';
import { getForecastWeather } from './services/weather';
import { Session, DriverStanding, Driver, Location, DriverMapData, RaceControlMessage, Position, Interval, TrackStatus, CarData, WeatherData } from './types';
import { Standings } from './components/Standings';
import { TrackMap } from './components/TrackMap';
import { TelemetryCharts } from './components/TelemetryCharts';
import { RaceControl } from './components/RaceControl';
import { NotificationToast } from './components/NotificationToast';
import { Spinner } from './components/Spinner';
import { Schedule } from './components/Schedule';
import { WeatherWidget } from './components/WeatherWidget';
import { Championships } from './components/Championships';
import { NextRace } from './components/NextRace';
import { CIRCUIT_INFO } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  
  // Dashboard Data State
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverMapData[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [raceControlMessages, setRaceControlMessages] = useState<RaceControlMessage[]>([]);
  const [latestNotification, setLatestNotification] = useState<RaceControlMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("CONNECTING...");
  const [currentTimeIST, setCurrentTimeIST] = useState<string>('');
  const [trackStatus, setTrackStatus] = useState<TrackStatus>('GREEN');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'championship'>('dashboard');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isForecast, setIsForecast] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps, setTotalLaps] = useState<number>(0);

  const driversRef = useRef<Driver[]>([]);
  const gridPositionsRef = useRef<Map<number, number>>(new Map());
  const prevMessagesLength = useRef<number>(0);
  const lastLocationUpdate = useRef<string | null>(null);

  // 1. Clock (IST)
  useEffect(() => {
      const updateTime = () => {
          const now = new Date();
          const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
          setCurrentTimeIST(istTime);
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
  }, []);

  // 2. Initial Session Setup
  useEffect(() => {
    let retryInterval: ReturnType<typeof setInterval>;
    let isMounted = true;
    let attempts = 0;

    const initSession = async () => {
      try {
        setLoadingStatus("SCANNING FREQUENCIES...");
        
        // Parallel Fetch: Current/Next Session and Last Completed
        const [relevantSession, lastCompleted] = await Promise.all([
            getRelevantSession(),
            getLastCompletedSession()
        ]);
        
        if (isMounted) {
            setLastSession(lastCompleted);

            if (relevantSession) {
                setSession(relevantSession);
                setConnectionError(false);
                if (retryInterval) clearInterval(retryInterval);

                // Check Mode
                if (relevantSession.is_live) {
                    setIsForecast(false);
                    setLoadingStatus("DOWNLOADING DRIVER MANIFEST...");
                    const driversList = await getDrivers(relevantSession.session_key, relevantSession.meeting_key);
                    driversRef.current = driversList;

                    if (relevantSession.session_type.includes("Race")) {
                        const grid = await getGridPositions(relevantSession.session_key);
                        gridPositionsRef.current = grid;
                        
                        // Set total laps from constants
                        const info = CIRCUIT_INFO[relevantSession.circuit_short_name];
                        if (info) setTotalLaps(info.laps);
                    }

                    const initialStandings = driversList.map((d, i) => ({
                        ...d, 
                        position: i + 1, 
                        grid_position: gridPositionsRef.current.get(d.driver_number) || i + 1,
                        pos_change: 0,
                        gap: '-',
                        interval: '-',
                        aero_status: 'Z-MODE' as const,
                        mom_status: 'UNAVAILABLE' as const
                    }));
                    setStandings(initialStandings);
                    if (driversList.length > 0) setSelectedDriver(driversList[0].driver_number);

                    // Sync Time for live
                    setLoadingStatus("SYNCING WITH TRACK TIME...");
                    const serverTime = await getLatestDataTimestamp(relevantSession.session_key);
                    if (serverTime) {
                        const syncTime = new Date(new Date(serverTime).getTime() - 5000).toISOString();
                        lastLocationUpdate.current = syncTime;
                    } else {
                        lastLocationUpdate.current = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                    }
                } else {
                    // Not live: Intermission Mode
                    // Fetch Forecast Weather
                    setIsForecast(true);
                    getForecastWeather(relevantSession).then(w => {
                        if (isMounted && w) setWeather(w);
                    });
                }

                setLoading(false);
                return true;
            }
        }
      } catch (e) {
        console.error("Init Error", e);
      }
      return false;
    };

    setLoading(true);
    initSession().then(success => {
        if (!success && isMounted) {
            retryInterval = setInterval(async () => {
                attempts++;
                const s = await initSession();
                if (s) clearInterval(retryInterval);
                if (attempts > 6) {
                    setLoading(false);
                    setConnectionError(true);
                    clearInterval(retryInterval);
                }
            }, 5000);
        } else if (isMounted) {
            setLoading(false);
        }
    });

    return () => {
        isMounted = false;
        if (retryInterval) clearInterval(retryInterval);
    };
  }, []);

  // 3. Status Polling (Auto-Switch to Live)
  useEffect(() => {
    if (!session || session.is_live) return;
    
    // If we are in "Next Race" mode, check every 30s if the session has gone live
    const checkLiveStatus = async () => {
        const check = await getRelevantSession();
        if (check && check.is_live && check.session_key === session.session_key) {
             // Reload page to trigger full live init
             window.location.reload(); 
        }
    };
    const interval = setInterval(checkLiveStatus, 30000);
    return () => clearInterval(interval);
  }, [session]);


  // 4. Data Polling (Only if LIVE)
  useEffect(() => {
    if (!session || !session.is_live || activeTab !== 'dashboard') return;

    const fetchData = async () => {
      try {
        const sessionKey = session.session_key;
        
        // --- 1. Map Locations ---
        if (lastLocationUpdate.current) {
            const locations = await getLiveLocations(sessionKey, lastLocationUpdate.current, true);
            if (locations.length > 0) {
                 const lastDate = locations[locations.length - 1].date;
                 lastLocationUpdate.current = lastDate;
                 const latestLocMap = new Map<number, Location>();
                 locations.forEach(loc => latestLocMap.set(loc.driver_number, loc));

                 setDriverLocations(prev => {
                    const next = [...prev];
                    latestLocMap.forEach((loc, driverNum) => {
                        const idx = next.findIndex(d => d.driver_number === driverNum);
                        const driver = driversRef.current.find(d => d.driver_number === driverNum);
                        if (driver) {
                            const newData = {
                                driver_number: driverNum,
                                x: loc.x,
                                y: loc.y,
                                team_colour: driver.team_colour,
                                acronym: driver.name_acronym
                            };
                            if (idx >= 0) next[idx] = newData;
                            else next.push(newData);
                        }
                    });
                    return next;
                 });
            }
        } 
        
        // --- 2. Race Control ---
        const msgs = await getRaceControlMessages(sessionKey);
        setRaceControlMessages(msgs);
        
        let currentTrackStatus: TrackStatus = 'GREEN';
        if (msgs.length > 0) {
            const recentMsgs = msgs.slice(-20);
            for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i].message.toUpperCase();
                if (m.includes("CHEQUERED")) { currentTrackStatus = 'CHEQUERED'; break; }
                else if (m.includes("RED FLAG")) { currentTrackStatus = 'RED'; break; }
                else if (m.includes("VIRTUAL SAFETY CAR") && !m.includes("ENDING")) { currentTrackStatus = 'VSC'; break; }
                else if (m.includes("SAFETY CAR") && !m.includes("IN THIS LAP") && !m.includes("ENDING")) { currentTrackStatus = 'SC'; break; }
                else if (m.includes("TRACK CLEAR") || m.includes("GREEN FLAG") || m.includes("VSC ENDING")) { currentTrackStatus = 'GREEN'; break; }
            }
        }
        setTrackStatus(prev => currentTrackStatus === 'CHEQUERED' ? 'CHEQUERED' : currentTrackStatus);

        if (msgs.length > prevMessagesLength.current) {
            setLatestNotification(msgs[msgs.length - 1]);
            prevMessagesLength.current = msgs.length;
        }

        // --- 3. Standings, Telemetry, Laps ---
        const telemetryWindow = new Date(Date.now() - 3000).toISOString();
        const leader = standings.length > 0 ? standings[0].driver_number : undefined;

        const [positions, intervals, bulkTelemetry, weatherData, lapCount] = await Promise.all([
            getPositions(sessionKey, lastLocationUpdate.current || undefined), 
            getIntervals(sessionKey),
            getLatestTelemetry(sessionKey, telemetryWindow),
            getWeather(sessionKey, lastLocationUpdate.current || undefined),
            getLatestLap(sessionKey, leader)
        ]);
        
        if (lapCount > 0) setCurrentLap(lapCount);
        if (weatherData) setWeather(weatherData);

        const latestPosMap = new Map<number, Position>();
        positions.forEach(p => latestPosMap.set(p.driver_number, p)); 

        const intervalMap = new Map<number, Interval>();
        intervals.forEach(i => intervalMap.set(i.driver_number, i));
        
        const telemetryMap = new Map<number, CarData>();
        bulkTelemetry.forEach(t => {
            const existing = telemetryMap.get(t.driver_number);
            if (!existing || new Date(t.date) > new Date(existing.date)) {
                telemetryMap.set(t.driver_number, t);
            }
        });

        if (driversRef.current.length > 0) {
            setStandings(prev => {
                const updated = driversRef.current.map(driver => {
                    const posData = latestPosMap.get(driver.driver_number);
                    const currentPos = posData ? posData.position : (prev.find(p => p.driver_number === driver.driver_number)?.position || 99);
                    
                    const intData = intervalMap.get(driver.driver_number);
                    const gap = intData?.gap_to_leader ? `+${Number(intData.gap_to_leader).toFixed(3)}` : (currentPos === 1 ? 'LEADER' : '-');
                    const interval = intData?.interval ? `+${Number(intData.interval).toFixed(3)}` : '-';
                    
                    const intervalVal = Number(intData?.interval || 0);
                    const isMomReady = intervalVal > 0 && intervalVal < 1.2; 
                    const carData = telemetryMap.get(driver.driver_number);
                    const isXMode = carData && carData.drs > 9;

                    return {
                        ...driver,
                        position: currentPos,
                        grid_position: gridPositionsRef.current.get(driver.driver_number) || driver.driver_number,
                        gap,
                        interval,
                        aero_status: isXMode ? 'X-MODE' : 'Z-MODE',
                        mom_status: isMomReady ? 'READY' : 'UNAVAILABLE'
                    } as DriverStanding;
                });
                return updated.sort((a, b) => a.position - b.position);
            });
        }

      } catch (e) {
        console.error("Polling Error", e);
      }
    };

    fetchData(); 
    const pollInterval = setInterval(fetchData, 2000); 
    return () => clearInterval(pollInterval);
  }, [session, activeTab]);

  const activeDriver = standings.find(d => d.driver_number === selectedDriver) || (standings.length > 0 ? standings[0] : null);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0f0f12] flex flex-col items-center justify-center text-white">
        <Spinner />
        <h1 className="mt-8 font-sans text-xl tracking-[0.3em] text-f1-red animate-pulse">{loadingStatus}</h1>
      </div>
    );
  }

  const showIntermission = session && !session.is_live && activeTab === 'dashboard';

  return (
    <div className="h-screen w-screen bg-[#0f0f12] text-gray-200 flex flex-col font-sans overflow-hidden">
      
      <NotificationToast latestMessage={latestNotification} />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#15151E] border-b border-white/10 shadow-lg z-20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="font-bold text-2xl italic tracking-tighter text-white">
            F1<span className="text-f1-red">LIVE</span>
          </div>
          
          <div className="flex bg-black/20 rounded p-1 border border-white/5">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {session?.is_live ? 'LIVE FEED' : 'NEXT RACE'}
              </button>
              <button onClick={() => setActiveTab('championship')} className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'championship' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Championship</button>
              <button onClick={() => setActiveTab('schedule')} className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'schedule' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Schedule</button>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">{session?.session_name || 'OFFLINE'}</h1>
            <div className="flex items-center gap-2 text-xs font-mono text-f1-red">
               <span className={`w-2 h-2 rounded-full ${session?.is_live ? 'bg-f1-red animate-pulse' : 'bg-gray-500'}`}></span>
               {session?.is_live ? 'REALTIME TELEMETRY' : 'STANDBY MODE'}
            </div>
          </div>
        </div>
        
        {/* CENTER: LAP COUNTER (Only if Live Race) */}
        {session?.is_live && totalLaps > 0 && (
            <div className="hidden md:flex flex-col items-center justify-center bg-black/20 px-6 py-1 rounded border border-white/10">
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-px">CURRENT LAP</div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-f1-red font-mono">{currentLap}</span>
                    <span className="text-sm font-bold text-gray-600 font-mono">/ {totalLaps}</span>
                </div>
            </div>
        )}

        <div className="flex items-center gap-8">
           {/* Show Weather (either live or forecast) */}
           <WeatherWidget weather={weather} isForecast={isForecast} />
           <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-400 font-mono">IST TIME</div>
              <div className="font-bold text-white font-mono text-xl tracking-widest">{currentTimeIST}</div>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* INTERMISSION MODE (Next Race + Summary) */}
        {showIntermission && session && (
            <NextRace nextSession={session} lastSession={lastSession} />
        )}

        {/* LIVE DASHBOARD */}
        {activeTab === 'dashboard' && session && session.is_live && (
            <div className="w-full h-full grid grid-cols-12 gap-4 p-4">
                <div className="col-span-12 md:col-span-5 lg:col-span-5 h-full flex flex-col min-h-0">
                    <Standings 
                        standings={standings} 
                        selectedDriver={selectedDriver} 
                        onSelectDriver={setSelectedDriver} 
                        sessionType={session.session_type}
                    />
                </div>
                <div className="col-span-12 md:col-span-7 lg:col-span-7 h-full flex flex-col gap-4 min-h-0">
                    <div className="flex-[3] rounded-xl overflow-hidden shadow-2xl relative bg-[#15151E] border border-white/5">
                        <TrackMap session={session} drivers={driversRef.current} selectedDriver={selectedDriver} onDriverSelect={setSelectedDriver} driverLocations={driverLocations} trackStatus={trackStatus} />
                    </div>
                    <div className="flex-[1.5] grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                        <div className="rounded-xl overflow-hidden bg-[#1a1a20] border border-white/5 p-1 hidden lg:block">
                            <TelemetryCharts sessionKey={session.session_key} driver={activeDriver} />
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-lg h-full min-h-0">
                            <RaceControl messages={raceControlMessages} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'championship' && <Championships />}
        {activeTab === 'schedule' && <Schedule />}
      </div>
    </div>
  );
};

export default App;
