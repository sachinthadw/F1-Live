

import React, { useEffect, useState, useMemo } from 'react';
import { Session, Location, CircuitInfo } from '../types';
import { getTrackMapFromPreviousYear, normalizeTeamName } from '../services/openf1';
import { getForecastWeather } from '../services/weather';
import { CIRCUIT_INFO } from '../constants';

interface NextRaceProps {
    nextSession: Session;
    lastSession: Session | null;
}

export const NextRace: React.FC<NextRaceProps> = ({ nextSession, lastSession }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days:0, hours:0, minutes:0, seconds:0 });
    const [trackPath, setTrackPath] = useState<Location[]>([]);
    const [isStarting, setIsStarting] = useState(false);
    const [isLoadingMap, setIsLoadingMap] = useState(true);
    const [weather, setWeather] = useState<any>(null);

    // Circuit Info from Database
    const circuitInfo: CircuitInfo | undefined = CIRCUIT_INFO[nextSession.circuit_short_name];

    // Countdown Logic
    useEffect(() => {
        const update = () => {
            const target = new Date(nextSession.date_start).getTime();
            const now = new Date().getTime();
            const diff = target - now;
            
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((diff % (1000 * 60)) / 1000)
                });
                setIsStarting(false);
            } else {
                if (diff > -4 * 60 * 60 * 1000) {
                    setIsStarting(true);
                }
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [nextSession]);

    // Fetch Weather & Map
    useEffect(() => {
        const initData = async () => {
             setIsLoadingMap(true);
             try {
                const [path, w] = await Promise.all([
                    getTrackMapFromPreviousYear(nextSession.circuit_key),
                    getForecastWeather(nextSession)
                ]);
                setTrackPath(path);
                setWeather(w);
             } catch (e) {
                 console.warn("Could not load preview data", e);
             } finally {
                 setIsLoadingMap(false);
             }
        };
        initData();
    }, [nextSession]);

    // Map Drawing Logic
    const mapData = useMemo(() => {
        if (trackPath.length === 0) return null;
        
        const xs = trackPath.map(p => p.x);
        const ys = trackPath.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const padding = 2000;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const d = trackPath.map(p => `${p.x - minX + padding},${(maxY - p.y) + padding}`).join(' ');
        
        return { d: `M ${d}`, viewBox: `0 0 ${width} ${height}` };
    }, [trackPath]);

    const title = nextSession.country_name === "United States" ? "US Grand Prix" : `${nextSession.country_name} Grand Prix`;

    return (
        <div className="w-full h-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto bg-[#0f0f12]">
            
            {/* LEFT COLUMN: COUNTDOWN & INTEL */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                
                {/* 1. HERO COUNTDOWN CARD */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                     {/* Background Effects */}
                     <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none"></div>
                     <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-f1-red/10 rounded-full blur-3xl animate-pulse"></div>

                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 bg-f1-cyan rounded-full animate-pulse"></span>
                            <div className="text-xs font-mono text-f1-cyan uppercase tracking-[0.3em]">MISSION BRIEFING</div>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-bold text-white font-sans uppercase italic mb-2 leading-none">
                            {title}
                        </h1>
                        <div className="text-lg text-gray-400 font-mono uppercase mb-8">{nextSession.circuit_short_name}</div>

                        {isStarting ? (
                             <div className="bg-f1-red/20 border border-f1-red/50 p-6 rounded-xl text-center animate-pulse">
                                <div className="text-3xl font-bold text-white tracking-widest uppercase">SESSION LIVE</div>
                                <div className="text-xs font-mono text-f1-red mt-2">INITIALIZING TELEMETRY...</div>
                             </div>
                        ) : (
                             <div className="grid grid-cols-4 gap-2 md:gap-4">
                                {['DAYS', 'HRS', 'MIN', 'SEC'].map((label, i) => {
                                    const val = Object.values(timeLeft)[i];
                                    return (
                                        <div key={label} className="flex flex-col items-center p-3 bg-black/40 rounded-lg border border-white/5 backdrop-blur-sm">
                                            <span className="text-3xl md:text-4xl font-mono font-bold text-white">{String(val).padStart(2, '0')}</span>
                                            <span className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{label}</span>
                                        </div>
                                    )
                                })}
                             </div>
                        )}
                     </div>
                </div>

                {/* 2. CIRCUIT INTEL */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-6 flex-1 min-h-[200px]">
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">CIRCUIT INTELLIGENCE</div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">CIRCUIT LENGTH</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.length || "TBA"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">TOTAL LAPS</div>
                            <div className="text-2xl font-sans font-bold text-f1-cyan">{circuitInfo?.laps || "TBA"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">CORNERS</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.corners || "TBA"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">AERO ZONES</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.aero_zones || "TBA"}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">LAP RECORD</div>
                            <div className="text-lg font-mono text-white/80">{circuitInfo?.lap_record || "Data Unavailable"}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: MAP & ATMOSPHERICS */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                
                {/* 3. HOLOGRAPHIC MAP */}
                <div className="flex-1 bg-[#15151E] rounded-2xl border border-white/10 p-1 relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-6 left-6 z-20">
                         <div className="text-xs font-mono text-f1-red uppercase tracking-widest mb-1">TOPOLOGY SCAN</div>
                         <div className="text-xl font-bold text-white font-sans italic">CIRCUIT LAYOUT</div>
                    </div>

                    <div className="w-full h-full bg-[#0f0f12] rounded-xl relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
                        
                        {mapData ? (
                            <svg viewBox={mapData.viewBox} className="w-full h-full p-12 z-10 filter drop-shadow-[0_0_30px_rgba(39,244,210,0.1)]">
                                <path 
                                    d={mapData.d} 
                                    fill="none" 
                                    stroke="url(#trackGradient)" 
                                    strokeWidth="150" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="animate-[pulse_4s_ease-in-out_infinite]"
                                />
                                <defs>
                                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="50%" stopColor="#27F4D2" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 text-gray-600">
                                {isLoadingMap ? (
                                    <>
                                        <div className="w-10 h-10 border-2 border-f1-cyan border-t-transparent rounded-full animate-spin"></div>
                                        <div className="text-xs font-mono animate-pulse">DOWNLOADING TOPOLOGY...</div>
                                    </>
                                ) : (
                                    <div className="text-xs font-mono">MAP DATA UNAVAILABLE</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. WEATHER FORECAST */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-6">
                     <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">FORECAST ATMOSPHERICS</div>
                        <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-bold">PREDICTED</div>
                     </div>

                     {weather ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             <div className="flex flex-col items-center p-3 bg-black/20 rounded">
                                 <span className="text-gray-500 text-[10px] uppercase mb-1">AIR TEMP</span>
                                 <span className="text-2xl font-sans font-bold text-white">{weather.air_temperature}°C</span>
                             </div>
                             <div className="flex flex-col items-center p-3 bg-black/20 rounded">
                                 <span className="text-gray-500 text-[10px] uppercase mb-1">TRACK TEMP</span>
                                 <span className="text-2xl font-sans font-bold text-f1-red">{weather.track_temperature}°C</span>
                             </div>
                             <div className="flex flex-col items-center p-3 bg-black/20 rounded">
                                 <span className="text-gray-500 text-[10px] uppercase mb-1">HUMIDITY</span>
                                 <span className="text-2xl font-sans font-bold text-blue-400">{weather.humidity}%</span>
                             </div>
                             <div className="flex flex-col items-center p-3 bg-black/20 rounded">
                                 <span className="text-gray-500 text-[10px] uppercase mb-1">PRECIPITATION</span>
                                 <span className="text-2xl font-sans font-bold text-white">{weather.rainfall}mm</span>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center text-gray-600 font-mono text-xs py-4">WEATHER DATA UNAVAILABLE</div>
                     )}
                </div>
            </div>
        </div>
    );
};