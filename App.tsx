import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { getRelevantSession, getDrivers, getLiveLocations, getRaceControlMessages, getPositions, getIntervals, getWeather, getLastCompletedSession, getStints } from './services/openf1';
import { getForecastWeather } from './services/weather';
import { Session, DriverStanding, Driver, Location, DriverMapData, RaceControlMessage, Position, Interval, TrackStatus, WeatherData, Stint } from './types';
import { Standings } from './components/Standings';
import { TrackMap } from './components/TrackMap';
import { TelemetryCharts } from './components/TelemetryCharts';
import { RaceControl } from './components/RaceControl';
import { NotificationToast } from './components/NotificationToast';
import { WeatherWidget } from './components/WeatherWidget';
import { NextRace } from './components/NextRace';
import { TeammateComparison } from './components/TeammateComparison';
import { CIRCUIT_INFO, FALLBACK_SESSION, FALLBACK_DRIVERS } from './constants';
import { Activity, Calendar, Trophy, Timer, WifiOff, RadioTower, Sun, Moon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load heavy tab content
const Schedule = lazy(() => import('./components/Schedule').then(m => ({ default: m.Schedule })));
const Championships = lazy(() => import('./components/Championships').then(m => ({ default: m.Championships })));

const LazyFallback = () => (
  <div className="flex items-center justify-center h-full gap-3 text-[var(--color-f1-cyan)]">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="font-mono text-xs tracking-widest animate-pulse">LOADING MODULE...</span>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  
  // Theme Management State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Dashboard Data State
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverMapData[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [raceControlMessages, setRaceControlMessages] = useState<RaceControlMessage[]>([]);
  const [latestNotification, setLatestNotification] = useState<RaceControlMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("SYSTEM BOOT");
  const [currentTimeUTC, setCurrentTimeUTC] = useState<string>('');
  const [trackStatus, setTrackStatus] = useState<TrackStatus>('GREEN');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'championship'>('dashboard');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'LIVE' | 'OFFLINE'>('CONNECTING');
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps, setTotalLaps] = useState<number>(55);

  const driversRef = useRef<Driver[]>([]);
  // Track consecutive poll failures for backoff
  const consecutiveFailures = useRef<number>(0);
  const lastNotificationDate = useRef<string | null>(null);

  // UTC Clock
  useEffect(() => {
      const updateTime = () => {
          const now = new Date();
          const utcTime = now.toISOString().substring(11, 19) + ' UTC';
          setCurrentTimeUTC(utcTime);
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
  }, []);

  // Initialization
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        setLoadingStatus("ESTABLISHING UPLINK...");
        
        // 10s timeout for session fetch
        const fastFetchSession = Promise.race([
            getRelevantSession(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
        ]);
        
        const fetchedSession: Session | null = await fastFetchSession;
        
        let relevantSession: Session;
        
        if (!fetchedSession || !fetchedSession.session_key) {
            console.warn("[VelocityX] API timed out or offline. Using fallback session data.");
            relevantSession = FALLBACK_SESSION;
        } else {
            relevantSession = fetchedSession;
        }
        
        if (isMounted) {
            setSession(relevantSession);
            
            if (relevantSession.is_live) {
                setConnectionStatus('LIVE');
            } else {
                setConnectionStatus('OFFLINE');
            }

            // Fetch last completed session concurrently
            getLastCompletedSession().then(ls => {
                if (isMounted) setLastSession(ls);
            }).catch(e => console.warn("Failed to load last complete session", e));

            // Fetch drivers
            setLoadingStatus("LOADING DRIVER MATRIX...");
            try {
                let driversList = await getDrivers(relevantSession.session_key, relevantSession.meeting_key);
                
                if (!driversList || driversList.length === 0) {
                    driversList = FALLBACK_DRIVERS;
                }
                
                driversRef.current = driversList;
                
                const initialStandings = driversList.map((d, i) => ({
                    ...d, 
                    position: i + 1, 
                    grid_position: i + 1,
                    pos_change: 0,
                    gap: '-',
                    interval: '-',
                    aero_status: 'Z-MODE' as const,
                    mom_status: 'READY' as const
                }));
                setStandings(initialStandings);
                if (driversList.length > 0) setSelectedDriver(driversList[0].driver_number);
                
                setLoadingStatus("SYNCING WEATHER TELEMETRY...");
                const w = await getWeather(relevantSession.session_key);
                setWeather(w);
            } catch (driverError) {
                 console.error("[VelocityX] Failed to fetch drivers", driverError);
            }
            setLoading(false);
        }
      } catch (e) {
          if (isMounted) {
              console.error("[VelocityX] Init failed:", e);
              setConnectionStatus('OFFLINE');
              setLoading(false);
          }
      }
    };

    initSession();

    return () => {
        isMounted = false;
    };
  }, []);

  const mapLocationsToDriverMapData = useCallback((locations: Location[]): DriverMapData[] => {
    return locations.map(loc => {
      const d = driversRef.current?.find(driver => driver.driver_number === loc.driver_number);
      return {
        driver_number: loc.driver_number,
        x: loc.x,
        y: loc.y,
        team_colour: d?.team_colour ? `#${d.team_colour}` : '#FFFFFF',
        acronym: d?.name_acronym || `${loc.driver_number}`
      };
    });
  }, []);

  // Live Data Polling with adaptive backoff
  useEffect(() => {
    if (!session || activeTab !== 'dashboard') return;
    if (connectionStatus === 'OFFLINE') return;

    const fetchData = async () => {
      try {
          // Parallel fetch all live data
          const [newLocs, newWeather, msgs, positions, intervals, stints] = await Promise.all([
             getLiveLocations(session.session_key),
             getWeather(session.session_key),
             getRaceControlMessages(session.session_key),
             getPositions(session.session_key),
             getIntervals(session.session_key),
             getStints(session.session_key),
          ]);

          // Reset failure counter on success
          consecutiveFailures.current = 0;

          // Update driver locations on track map
          if (newLocs.length > 0) setDriverLocations(mapLocationsToDriverMapData(newLocs));
          if (newWeather) setWeather(newWeather);
          
          // Update race control messages and show notifications
          if (msgs.length > 0) {
              const latest = msgs[msgs.length - 1];
              if (latest.date !== lastNotificationDate.current) {
                  setRaceControlMessages(msgs);
                  setLatestNotification(latest);
                  lastNotificationDate.current = latest.date;

                  // Extract track status from race control flags
                  if (latest.flag) {
                      if (latest.flag === 'RED') setTrackStatus('RED');
                      else if (latest.flag === 'GREEN') setTrackStatus('GREEN');
                      else if (latest.message?.includes('SAFETY CAR')) setTrackStatus('SC');
                      else if (latest.message?.includes('VIRTUAL SAFETY CAR')) setTrackStatus('VSC');
                      else if (latest.flag === 'CHEQUERED') setTrackStatus('CHEQUERED');
                  }
              }
          }

          // Update standings with live positions, intervals, and stints
          if (positions.length > 0 || intervals.length > 0 || stints.length > 0) {
              setStandings(prev => {
                  const posMap = new Map(positions.map(p => [p.driver_number, p.position]));
                  const intMap = new Map(intervals.map(i => [i.driver_number, i]));

                  // Build stint map: latest stint per driver
                  const stintMap = new Map<number, Stint>();
                  stints.forEach(st => {
                      const existing = stintMap.get(st.driver_number);
                      if (!existing || st.stint_number > existing.stint_number) {
                          stintMap.set(st.driver_number, st);
                      }
                  });

                  return prev.map(d => {
                      const newPos = posMap.get(d.driver_number) ?? d.position;
                      const intData = intMap.get(d.driver_number);
                      const stintData = stintMap.get(d.driver_number);

                      return {
                          ...d,
                          position: newPos,
                          gap: intData?.gap_to_leader !== null && intData?.gap_to_leader !== undefined
                              ? (intData.gap_to_leader === 0 ? 'LEADER' : `+${intData.gap_to_leader.toFixed(3)}`)
                              : d.gap,
                          interval: intData?.interval !== null && intData?.interval !== undefined
                              ? (intData.interval === 0 ? '-' : `+${intData.interval.toFixed(3)}`)
                              : d.interval,
                          tyre_compound: stintData?.compound ?? d.tyre_compound,
                          pit_count: stintData ? stintData.stint_number - 1 : d.pit_count,
                      };
                  }).sort((a, b) => a.position - b.position);
              });

              // Track current lap from leader
              const leaderPos = positions.find(p => p.position === 1);
              if (leaderPos) {
                  // We can infer lap from stints if available
                  const leaderStint = stints.find(s => s.driver_number === leaderPos.driver_number);
                  if (leaderStint?.lap_end) {
                      setCurrentLap(leaderStint.lap_end);
                  }
              }
          }

      } catch (e) {
          consecutiveFailures.current++;
          console.warn(`[VelocityX] Live poll failed (${consecutiveFailures.current} consecutive):`, e);
      }
    };

    fetchData(); 

    // Adaptive polling: 3s normally, back off on failures up to 15s
    const getInterval = () => {
        if (consecutiveFailures.current === 0) return 3500;
        return Math.min(3500 * Math.pow(1.5, consecutiveFailures.current), 15000);
    };

    let pollTimeout: ReturnType<typeof setTimeout>;
    const schedulePoll = () => {
        pollTimeout = setTimeout(async () => {
            await fetchData();
            schedulePoll();
        }, getInterval());
    };
    schedulePoll();

    return () => clearTimeout(pollTimeout);
  }, [session, activeTab, connectionStatus, mapLocationsToDriverMapData]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[var(--color-f1-dark)] flex flex-col items-center justify-center text-white">
        <div className="w-64 h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[var(--color-f1-cyan)] animate-[progressOrigin_2s_ease-out_infinite]"></div>
        </div>
        <h1 className="font-mono text-sm tracking-[0.2em] text-[var(--color-f1-cyan)] animate-pulse">{loadingStatus}</h1>
      </div>
    );
  }

  const activeDriver = standings.find(d => d.driver_number === selectedDriver) || (standings.length > 0 ? standings[0] : null);

  return (
    <div className="h-screen w-screen bg-transparent text-[var(--text-app)] flex flex-col font-sans overflow-hidden transition-colors duration-300">
      
      <NotificationToast latestMessage={latestNotification} />

      {/* Header - Apple Glassmorphism style */}
      <header className="min-h-16 h-auto md:h-16 flex flex-col md:flex-row items-center justify-between px-4 py-3 md:py-0 md:px-6 bg-transparent backdrop-blur-3xl border-b border-[var(--border-subtle)] z-20 shrink-0 gap-4 relative" role="banner">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 relative z-10 w-full md:w-auto">
          <div className="font-bold text-xl tracking-tight text-[var(--heading-color)] flex items-center gap-2">
            Velocity
            <span className="text-[10px] bg-[var(--card-bg-subtle)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[var(--text-app)] font-mono tracking-widest ml-1 shadow-sm">2.0</span>
          </div>
          
          <nav className="flex apple-segmented-control border border-[var(--border-subtle)] w-full sm:w-auto justify-around sm:justify-start" role="tablist" aria-label="Main navigation">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                aria-controls="tab-dashboard"
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === 'dashboard' ? 'apple-tab-active text-[var(--heading-color)]' : 'text-gray-400 hover:text-[var(--heading-color)]'}`}
              >
                  <Activity size={14} /> Dash
              </button>
              <button 
                onClick={() => setActiveTab('championship')} 
                role="tab"
                aria-selected={activeTab === 'championship'}
                aria-controls="tab-championship"
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === 'championship' ? 'apple-tab-active text-[var(--heading-color)]' : 'text-gray-400 hover:text-[var(--heading-color)]'}`}
              >
                  <Trophy size={14} /> WDC
              </button>
              <button 
                onClick={() => setActiveTab('schedule')} 
                role="tab"
                aria-selected={activeTab === 'schedule'}
                aria-controls="tab-schedule"
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === 'schedule' ? 'apple-tab-active text-[var(--heading-color)]' : 'text-gray-400 hover:text-[var(--heading-color)]'}`}
              >
                  <Calendar size={14} /> Calendar
              </button>
          </nav>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 relative z-10 w-full md:w-auto border-t md:border-t-0 border-[var(--border-subtle)] pt-3 md:pt-0">
            {/* Theme Toggle Button */}
            <button 
                onClick={() => setIsLightMode(!isLightMode)} 
                className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg-subtle)] hover:bg-[var(--panel-hover)] text-[var(--heading-color)] transition-all cursor-pointer shadow-sm shrink-0"
                aria-label={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
                {isLightMode ? <Moon className="w-4 h-4 text-emerald-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 bg-[var(--card-bg-subtle)] backdrop-blur-md px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-full border border-[var(--border-subtle)] shadow-sm" role="status" aria-live="polite">
                {connectionStatus === 'LIVE' ? (
                    <><RadioTower className="w-3.5 h-3.5 text-[var(--color-f1-red)] animate-pulse" /> <span className="text-[var(--color-f1-red)] font-semibold">Live</span></>
                ) : (
                    <><WifiOff className="w-3.5 h-3.5 text-gray-500" /> <span className="text-gray-500 font-semibold font-mono">Offline</span></>
                )}
            </div>

            <div className="hidden lg:block border-l border-[var(--border-subtle)] pl-6">
                <WeatherWidget weather={weather} />
            </div>

            <div className="text-right border-l border-[var(--border-subtle)] pl-6">
                <div className="font-medium text-[var(--heading-color)] text-xs md:text-sm tracking-wide font-mono">{currentTimeUTC}</div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-grid-subtle">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full p-2 md:p-3"
            role="tabpanel"
            id={`tab-${activeTab}`}
          >
            {activeTab === 'dashboard' && (
                session ? (
                    connectionStatus === 'LIVE' ? (
                        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3 overflow-y-auto md:overflow-hidden relative">
                            {/* LEFT: LEADERBOARD */}
                            <div className="col-span-12 lg:col-span-3 h-[400px] lg:h-full flex flex-col min-h-0 order-2 lg:order-1 glass-panel">
                                <Standings 
                                    standings={standings} 
                                    selectedDriver={selectedDriver} 
                                    onSelectDriver={setSelectedDriver} 
                                    sessionType={session?.session_type}
                                />
                            </div>

                            {/* CENTER: MAP & TELEMETRY */}
                            <div className="col-span-12 lg:col-span-6 h-full flex flex-col gap-2 md:gap-3 min-h-0 order-1 lg:order-2">
                                {/* Map Panel */}
                                <div className="flex-[3] relative glass-panel min-h-[250px]">
                                    <TrackMap session={session} drivers={driversRef.current} selectedDriver={selectedDriver} onDriverSelect={setSelectedDriver} driverLocations={driverLocations} trackStatus={trackStatus} />
                                </div>
                                
                                {/* Bottom Split: Telemetry & Comparison */}
                                <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 min-h-0">
                                    <div className="glass-panel overflow-hidden">
                                        <TelemetryCharts sessionKey={session.session_key} driver={activeDriver} isLive={session.is_live || false} />
                                    </div>
                                    <div className="glass-panel overflow-hidden">
                                        <TeammateComparison selectedDriver={selectedDriver} standings={standings} />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: RACE CONTROL & STRATEGY */}
                            <div className="col-span-12 lg:col-span-3 h-[250px] lg:h-full flex flex-col gap-2 md:gap-3 order-3">
                                <div className="flex-[2] overflow-hidden glass-panel">
                                    <RaceControl messages={raceControlMessages} />
                                </div>
                                <div className="flex-1 glass-panel p-4 flex flex-col justify-center items-center text-center">
                                     <div className="text-[var(--color-f1-cyan)] font-mono text-sm mb-2 flex items-center gap-2 uppercase tracking-widest"><Timer size={14} /> Strat. Predict</div>
                                     <div className="text-[10px] text-gray-500 font-mono mb-1">BOX WINDOW ESTIMATION</div>
                                     <div className="text-[var(--heading-color)] font-mono text-lg font-bold">L{currentLap + 15} — L{currentLap + 20}</div>
                                     <div className="w-full bg-white/5 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
                                         <div className="bg-[var(--color-f1-cyan)] h-full w-2/3 shadow-[0_0_10px_rgba(10,132,255,0.8)]"></div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <NextRace nextSession={session} lastSession={lastSession} />
                    )
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-mono">
                        NO ACTIVE RACE DATA ESTABLISHED. RECONNECTING...
                    </div>
                )
            )}

            {activeTab === 'championship' && (
              <Suspense fallback={<LazyFallback />}>
                <Championships />
              </Suspense>
            )}
            {activeTab === 'schedule' && (
              <Suspense fallback={<LazyFallback />}>
                <Schedule />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
