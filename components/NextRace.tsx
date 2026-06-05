import React, { useEffect, useState, useMemo } from 'react';
import { Session, Location, CircuitInfo, RaceResult, RaceEvent } from '../types';
import { getTrackMapFromPreviousYear, getRaceResults, getSeasonSchedule } from '../services/openf1';
import { getForecastWeather } from '../services/weather';
import { CIRCUIT_INFO } from '../constants';
import { Calendar, Map, Flag, Timer, ChevronRight, Wind, Thermometer, CloudRain, Activity, CheckCircle, Zap, ShieldAlert, CircleDot } from 'lucide-react';
import { motion } from 'motion/react';

interface NextRaceProps {
    nextSession: Session;
    lastSession: Session | null;
}

export const NextRace: React.FC<NextRaceProps> = ({ nextSession, lastSession }) => {
    const [weekendEvent, setWeekendEvent] = useState<RaceEvent | null>(null);
    const [timeLeft, setTimeLeft] = useState<{days: number; hours: number; minutes: number; seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [trackPath, setTrackPath] = useState<Location[]>([]);
    const [weather, setWeather] = useState<any>(null);
    const [lastRaceResults, setLastRaceResults] = useState<RaceResult[]>([]);
    const [nowMs, setNowMs] = useState<number>(Date.now());

    const circuitInfo: CircuitInfo | undefined = useMemo(() => {
        if (!nextSession?.circuit_short_name || nextSession.circuit_short_name === "undefined") return undefined;
        const direct = CIRCUIT_INFO[nextSession.circuit_short_name];
        if (direct) return direct;
        
        // Dynamic search if name varies
        const entry = Object.entries(CIRCUIT_INFO).find(([key]) => 
            nextSession.circuit_short_name?.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(nextSession.circuit_short_name?.toLowerCase())
        );
        return entry ? entry[1] : undefined;
    }, [nextSession?.circuit_short_name]);

    // Keep state ticking every second for synchronized timers
    useEffect(() => {
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Get last race results if available
    useEffect(() => {
        if (lastSession) {
            getRaceResults(lastSession.session_key).then(setLastRaceResults).catch(err => console.warn(err));
        }
    }, [lastSession]);

    // Load full weekend schedule
    useEffect(() => {
        const loadWeekend = async () => {
             try {
                 const year = nextSession.year || new Date().getFullYear();
                 const schedule = await getSeasonSchedule(year);
                 const event = schedule.find(e => e.meeting_key === nextSession.meeting_key);
                 if (event) {
                     setWeekendEvent(event);
                 }
             } catch (e) {
                 console.warn("Failed to load weekend event schedule", e);
             }
        };
        loadWeekend();
    }, [nextSession]);

    // Track path and weather loading
    useEffect(() => {
        const initData = async () => {
             try {
                const [path, w] = await Promise.all([
                    getTrackMapFromPreviousYear(nextSession.circuit_key),
                    getForecastWeather(nextSession)
                ]);
                setTrackPath(path);
                setWeather(w);
             } catch (e) {
                 console.warn("Could not load preview data", e);
             }
        };
        initData();
    }, [nextSession]);

    // Format primary countdown
    useEffect(() => {
        const target = new Date(nextSession.date_start).getTime();
        const diff = target - nowMs;
        
        if (diff > 0) {
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }
    }, [nextSession, nowMs]);

    const countryName = useMemo(() => {
        if (!nextSession?.country_name || nextSession.country_name === "undefined" || nextSession.country_name === "null") {
            if (nextSession?.location && nextSession.location !== "undefined" && nextSession.location !== "null") {
                return nextSession.location;
            }
            return "";
        }
        return nextSession.country_name;
    }, [nextSession?.country_name, nextSession?.location]);

    const title = useMemo(() => {
        if (!countryName) {
            if (nextSession?.circuit_short_name && nextSession.circuit_short_name !== "undefined" && nextSession.circuit_short_name !== "null") {
                return nextSession.circuit_short_name.toUpperCase().includes("GRAND PRIX") || nextSession.circuit_short_name.toUpperCase().includes("GP") 
                  ? nextSession.circuit_short_name 
                  : `${nextSession.circuit_short_name} GP`;
            }
            return "Upcoming Grand Prix";
        }
        if (countryName === "United States") return "US Grand Prix";
        return countryName.toUpperCase().includes("GRAND PRIX") || countryName.toUpperCase().includes("GP") 
          ? countryName 
          : `${countryName} Grand Prix`;
    }, [countryName, nextSession?.circuit_short_name]);

    // Dynamic sessions helper
    const sessionsList = useMemo(() => {
        if (!weekendEvent || !weekendEvent.sessions) return [];
        return [...weekendEvent.sessions].sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
    }, [weekendEvent]);

    return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-y-auto bg-transparent border-t border-[var(--border-subtle)] custom-scrollbar"
        >
            
            {/* LEFT COLUMN: PRIMARY DETAILS, COUNTDOWN, AND LAP INFO */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                
                {/* 1. HERO COUNTDOWN CARD */}
                <motion.div 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-6 relative overflow-hidden group rounded-2xl shadow-xl flex-1 flex flex-col justify-between min-h-[300px] text-[var(--text-app)]"
                >
                     <div className="absolute top-0 right-0 p-4 opacity-70">
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--card-bg-subtle)] rounded-full border border-[var(--border-subtle)] backdrop-blur-md">
                               <span className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-f1-red)] opacity-70"></span>
                                 <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-f1-red)] shadow-[0_0_8px_rgba(255,59,48,0.8)]"></span>
                               </span>
                               <span className="text-[9px] font-bold tracking-widest font-mono text-[var(--heading-color)]">UPCOMING // {nextSession.session_name.toUpperCase()}</span>
                          </div>
                     </div>

                     <div className="relative z-10 mt-6 animate-fade-in">
                        <div className="text-[10px] text-[var(--color-f1-cyan)] font-mono tracking-widest uppercase mb-1">F1 OFFICIAL WORLD CHAMPIONSHIP</div>
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[var(--heading-color)] mb-2 leading-tight">
                            {title}
                        </h1>
                        <div className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium uppercase mb-6 inline-flex flex-wrap items-center gap-1.5 bg-[var(--card-bg-subtle)] px-2.5 py-1 rounded border border-[var(--border-subtle)] max-w-full">
                            <Map className="w-3.5 h-3.5 text-[var(--color-f1-cyan)]" />
                            <span className="truncate max-w-[200px] sm:max-w-none">{nextSession.circuit_short_name}</span>
                        </div>

                        {/* General Countdown Timer */}
                        <div className="grid grid-cols-4 gap-2.5 mt-2">
                           {['DAYS', 'HOURS', 'MINS', 'SECS'].map((label, i) => {
                               const val = Object.values(timeLeft)[i];
                               return (
                                   <div key={label} className="flex flex-col items-center justify-center p-3.5 bg-[var(--card-bg-subtle)] border border-[var(--border-subtle)] rounded-xl relative overflow-hidden transition-all shadow-md">
                                       <span className="text-xl md:text-3xl font-extrabold font-mono text-[var(--heading-color)] mb-0.5 tabular-nums tracking-tighter">
                                           {String(val || 0).padStart(2, '0')}
                                       </span>
                                       <span className="text-[8px] text-[var(--text-muted)] font-bold tracking-widest uppercase">{label}</span>
                                   </div>
                               );
                           })}
                        </div>
                     </div>

                     <div className="border-t border-[var(--border-subtle)] pt-4 mt-6 flex justify-between items-center text-xs text-[var(--text-muted)] font-mono">
                          <div>LOCATION: {nextSession.location && nextSession.location !== "undefined" ? nextSession.location : "Circuit"}, {countryName || "Worldwide"}</div>
                          <div className="text-[10px] bg-[var(--color-f1-cyan)]/10 text-[var(--color-f1-cyan)] border border-[var(--color-f1-cyan)]/25 px-2 py-0.5 rounded">R{weekendEvent?.round_number || "—"}</div>
                      </div>
                </motion.div>

                {/* 2. TRACK MAP PREVIEW */}
                {trackPath.length > 0 && (() => {
                    const xs = trackPath.map(p => p.x);
                    const ys = trackPath.map(p => p.y);
                    const minX = Math.min(...xs);
                    const maxX = Math.max(...xs);
                    const minY = Math.min(...ys);
                    const maxY = Math.max(...ys);
                    const padding = 2000;
                    const width = maxX - minX + padding * 2;
                    const height = maxY - minY + padding * 2;
                    const pathData = trackPath.map(p => `${p.x - minX + padding},${(maxY - p.y) + padding}`).join(' ');

                    return (
                        <motion.div
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.12 }}
                          className="glass-panel p-4 flex-1 min-h-[180px] flex flex-col relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Map className="w-3.5 h-3.5 text-[var(--color-f1-cyan)]" />
                                <span className="text-[10px] font-bold tracking-widest text-[var(--heading-color)] uppercase">CIRCUIT LAYOUT</span>
                            </div>
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full flex-1 object-contain" style={{ maxHeight: '200px' }}>
                                <path
                                    d={`M ${pathData}`}
                                    fill="none"
                                    stroke="rgba(0,255,204,0.06)"
                                    strokeWidth="500"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d={`M ${pathData}`}
                                    fill="none"
                                    stroke="var(--color-f1-cyan)"
                                    strokeWidth="120"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.7"
                                />
                            </svg>
                        </motion.div>
                    );
                })()}

                {/* 3. CIRCUIT SPECIFICATIONS */}
                <motion.div 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="glass-panel p-5 flex-1 justify-center flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
                         <CircleDot className="w-4 h-4 text-[var(--color-f1-cyan)]" />
                         <div className="text-xs text-[var(--heading-color)] font-bold tracking-wider font-sans">
                           CIRCUIT CONSTANTS
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                        <div className="bg-[var(--card-bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-0.5">TRACK LENGTH</div>
                            <div className="text-base font-mono font-bold text-[var(--heading-color)] tracking-wide">{circuitInfo?.length || "5.412 KM"}</div>
                        </div>
                        <div className="bg-[var(--card-bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-0.5">RACE LAP COUNT</div>
                            <div className="text-base font-mono font-bold text-[var(--color-f1-cyan)] tracking-wide">{circuitInfo?.laps ? `${circuitInfo.laps} LAPS` : "55 LAPS"}</div>
                        </div>
                        <div className="bg-[var(--card-bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-0.5">CORNERS COUNT</div>
                            <div className="text-base font-mono font-bold text-[var(--heading-color)] tracking-wide">{circuitInfo?.corners || "19"}</div>
                        </div>
                        <div className="bg-[var(--card-bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-0.5">DRS ZONES</div>
                            <div className="text-base font-mono font-bold text-[var(--heading-color)] tracking-wide">{circuitInfo?.aero_zones || "3 ZONES"}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* RIGHT COLUMN: DETAILED WEEKEND CALENDAR COUNTDOWNS & WEATHER */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                  
                  {/* WEEKEND TRACK TIMELINE TIMERS */}
                  <motion.div 
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="glass-panel p-5 flex-1 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[var(--color-f1-cyan)]" /> 
                                <span className="font-extrabold tracking-widest text-xs text-[var(--heading-color)] uppercase font-sans">GP WEEKEND TIMELINE COUNTDOWN</span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">LOCAL TIMEZONE</span>
                        </div>

                        {/* List of sessions each with custom countdown & details */}
                        <div className="flex flex-col gap-2.5 my-auto justify-center">
                            {sessionsList.length > 0 ? (
                                sessionsList.map((s, idx) => {
                                    const sessionTime = new Date(s.date_start).getTime();
                                    const diff = sessionTime - nowMs;
                                    const localTimeStr = new Date(s.date_start).toLocaleString(undefined, { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    });

                                    // Check state
                                    const isCompleted = diff < -2 * 60 * 60 * 1000; // After 2 hours of starting assume complete
                                    const isLiveNow = diff <= 0 && diff >= -2 * 60 * 60 * 1000;
                                    const isNextUp = !isCompleted && !isLiveNow && sessionsList.find(ts => new Date(ts.date_start).getTime() > nowMs)?.session_key === s.session_key;

                                    return (
                                        <div 
                                            key={s.session_key || idx} 
                                            className={`relative p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                                isLiveNow 
                                                    ? 'bg-[var(--color-f1-red)]/10 border-[var(--color-f1-red)]/40 shadow-[0_0_15px_rgba(255,59,48,0.15)]'
                                                    : isNextUp
                                                        ? 'bg-[var(--card-bg-subtle)] border-[var(--color-f1-cyan)]/40 shadow-[0_0_15px_rgba(10,132,255,0.1)]'
                                                        : 'bg-[var(--card-bg-subtle)] border-[var(--border-subtle)] hover:bg-[var(--panel-hover)]'
                                            }`}
                                        >
                                            {/* Left - Session Info */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 animate-pulse">
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-4 h-4 text-gray-500 shrink-0" />
                                                    ) : isLiveNow ? (
                                                        <Zap className="w-4 h-4 text-[var(--color-f1-red)] shrink-0 animate-pulse" />
                                                    ) : (
                                                        <Timer className={`w-4 h-4 shrink-0 ${isNextUp ? 'text-[var(--color-f1-cyan)]' : 'text-[var(--text-muted)]'}`} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold ${isCompleted ? 'text-gray-400' : 'text-[var(--heading-color)]'}`}>
                                                            {s.session_name}
                                                        </span>
                                                        {isLiveNow && (
                                                            <span className="text-[7.5px] bg-[var(--color-f1-red)] px-1.5 py-0.5 font-bold font-mono tracking-widest text-white uppercase rounded shadow animate-pulse">LIVE NOW</span>
                                                        )}
                                                        {isNextUp && (
                                                            <span className="text-[7.5px] bg-[var(--color-f1-cyan)] px-1.5 py-0.5 font-bold font-mono tracking-widest text-white uppercase rounded shadow">NEXT UP</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                                        {localTimeStr}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right - Live Dynamic Timer */}
                                            <div className="flex items-center self-end sm:self-center">
                                                {isCompleted ? (
                                                    <span className="text-[10px] font-bold font-mono text-gray-500 bg-[var(--card-bg-subtle)] border border-[var(--border-subtle)] px-2.5 py-1 rounded">
                                                        COMPLETED
                                                    </span>
                                                ) : isLiveNow ? (
                                                    <span className="text-[10px] font-bold font-mono text-[var(--color-f1-red)] bg-[var(--color-f1-red)]/10 border border-[var(--color-f1-red)]/35 px-2.5 py-1 rounded animate-pulse">
                                                        SESSION ACTIVE
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xs font-extrabold font-mono tracking-wider tabular-nums ${isNextUp ? 'text-[var(--color-f1-cyan)] bg-[var(--color-f1-cyan)]/10 border border-[var(--color-f1-cyan)]/30 px-2 py-0.5 rounded' : 'text-[var(--text-app)]'}`}>
                                                            {(() => {
                                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                                                                
                                                                let text = "";
                                                                if (days > 0) text += `${days}d `;
                                                                text += `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
                                                                return text;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-xs text-[var(--text-muted)] py-6 font-mono">LOADING EVENTS CALENDAR DATA...</div>
                            )}
                        </div>

                        {/* Weather Forecast Widget */}
                        <div className="mt-4 relative z-10 bg-[var(--card-bg-subtle)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-inner">
                              <div className="flex items-center gap-2 mb-2">
                                <Wind className="w-3.5 h-3.5 text-[var(--color-f1-cyan)]" /> 
                                <span className="font-bold tracking-widest uppercase text-[10px] text-[var(--heading-color)]">WEATHER MODEL PROJECTIONS</span>
                              </div>
                              {weather ? (
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-8">
                                            <div>
                                                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-0.5 flex items-center gap-1"><Thermometer className="w-2.5 h-2.5"/> AIR TEMP</div>
                                                <div className="text-base font-bold text-[var(--heading-color)] font-mono">{weather.air_temperature}°C</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-0.5 flex items-center gap-1"><Activity className="w-2.5 h-2.5"/> TRACK TEMP</div>
                                                <div className="text-base font-bold text-[var(--heading-color)] font-mono">{weather.track_temperature}°C</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-0.5 flex items-center gap-1"><CloudRain className="w-2.5 h-2.5"/> PRECIPITATION</div>
                                                <div className="text-base font-bold text-[var(--heading-color)] font-mono">{weather.rainfall ? 'YES' : 'NO'}</div>
                                            </div>
                                        </div>
                                    </div>
                              ) : (
                                  <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Awaiting telemetry forecast models...</div>
                              )}
                        </div>
                  </motion.div>
            </div>
        </motion.div>
    );
};
