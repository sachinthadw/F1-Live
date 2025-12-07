
import React, { useEffect, useState, useMemo } from 'react';
import { Session, Location, CircuitInfo, RaceResult } from '../types';
import { getTrackMapFromPreviousYear, getRaceResults } from '../services/openf1';
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
    const [lastRaceResults, setLastRaceResults] = useState<RaceResult[]>([]);

    // Circuit Info from Database
    const circuitInfo: CircuitInfo | undefined = CIRCUIT_INFO[nextSession.circuit_short_name];

    // Fetch Last Race Results
    useEffect(() => {
        if (lastSession) {
            getRaceResults(lastSession.session_key).then(setLastRaceResults);
        }
    }, [lastSession]);

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
                // Keep showing 00:00:00 if strictly 0, switch to starting if slightly past
                // The main App.tsx handles the switch to Live Dashboard, but this provides feedback
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

        const padding = 1500;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const d = trackPath.map(p => `${p.x - minX + padding},${(maxY - p.y) + padding}`).join(' ');
        
        return { d: `M ${d}`, viewBox: `0 0 ${width} ${height}` };
    }, [trackPath]);

    const title = nextSession.country_name === "United States" ? "US Grand Prix" : `${nextSession.country_name} Grand Prix`;

    return (
        <div className="w-full h-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto bg-[#0f0f12]">
            
            {/* LEFT COLUMN: MISSION CONTROL */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                
                {/* 1. COUNTDOWN MODULE */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none"></div>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-f1-cyan/5 rounded-full blur-3xl"></div>

                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-cyan opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-f1-cyan"></span>
                            </span>
                            <div className="text-xs font-mono text-f1-cyan uppercase tracking-[0.3em] font-bold">NEXT OPERATION</div>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-black text-white font-sans uppercase italic mb-2 leading-none tracking-tight drop-shadow-lg">
                            {title}
                        </h1>
                        <div className="text-lg text-gray-400 font-mono uppercase mb-8 border-l-4 border-f1-red pl-4">
                            {nextSession.circuit_short_name}
                        </div>

                        {isStarting ? (
                             <div className="bg-f1-red/10 border border-f1-red/50 p-6 rounded-xl text-center animate-pulse">
                                <div className="text-3xl font-bold text-white tracking-widest uppercase font-sans">SESSION LIVE</div>
                                <div className="text-xs font-mono text-f1-red mt-2 tracking-widest">INITIALIZING DATA STREAMS...</div>
                             </div>
                        ) : (
                             <div className="grid grid-cols-4 gap-2 md:gap-4">
                                {['DAYS', 'HRS', 'MIN', 'SEC'].map((label, i) => {
                                    const val = Object.values(timeLeft)[i];
                                    return (
                                        <div key={label} className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden shadow-inner group-hover:border-f1-cyan/30 transition-colors duration-500">
                                            <span className="text-3xl md:text-5xl font-mono font-bold text-white tracking-tighter tabular-nums">{String(val).padStart(2, '0')}</span>
                                            <span className="text-[9px] text-gray-500 font-bold tracking-[0.2em] mt-2">{label}</span>
                                        </div>
                                    )
                                })}
                             </div>
                        )}
                     </div>
                </div>

                {/* 2. CIRCUIT INTEL */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-6 flex-1 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
                         <div className="w-1 h-4 bg-white"></div>
                         <div className="text-xs font-mono text-gray-500 uppercase tracking-widest font-bold">CIRCUIT INTELLIGENCE</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                        <div className="group">
                            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-wider group-hover:text-f1-cyan transition-colors">LENGTH</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.length || "TBA"}</div>
                        </div>
                        <div className="group">
                            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-wider group-hover:text-f1-cyan transition-colors">LAPS</div>
                            <div className="text-2xl font-sans font-bold text-f1-cyan">{circuitInfo?.laps || "TBA"}</div>
                        </div>
                        <div className="group">
                            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-wider group-hover:text-f1-cyan transition-colors">CORNERS</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.corners || "TBA"}</div>
                        </div>
                        <div className="group">
                            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-wider group-hover:text-f1-cyan transition-colors">AERO ZONES</div>
                            <div className="text-2xl font-sans font-bold text-white">{circuitInfo?.aero_zones || "TBA"}</div>
                        </div>
                        <div className="col-span-2 bg-white/5 p-4 rounded-xl border border-white/5 mt-2 hover:bg-white/10 transition-colors">
                            <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider">LAP RECORD</div>
                            <div className="text-sm font-mono text-white">{circuitInfo?.lap_record || "Data Unavailable"}</div>
                        </div>
                    </div>
                </div>

                {/* 3. LAST MISSION SUMMARY */}
                {lastSession && lastRaceResults.length > 0 && (
                    <div className="bg-[#15151E] rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                             <div className="w-1 h-4 bg-f1-red"></div>
                             <div className="text-xs font-mono text-gray-500 uppercase tracking-widest font-bold">PREVIOUS MISSION</div>
                             <span className="ml-auto text-white text-xs font-bold">{lastSession.country_name.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {lastRaceResults.map((r) => (
                                <div key={r.driver_number} className="flex items-center bg-black/20 p-2 rounded border border-white/5 hover:bg-white/5 transition-colors">
                                    <div 
                                        className={`w-8 h-8 flex items-center justify-center font-bold text-black rounded font-mono mr-3 shadow-lg`} 
                                        style={{ backgroundColor: r.position === 1 ? '#FFD700' : r.position === 2 ? '#C0C0C0' : '#CD7F32' }}
                                    >
                                        {r.position}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white uppercase tracking-wide">{r.driver_name}</div>
                                        <div className="text-[10px] font-mono font-bold" style={{ color: `#${r.team_colour}` }}>{r.team_name}</div>
                                    </div>
                                    <div className="text-xl font-bold font-sans italic opacity-20 text-white">
                                        {r.acronym}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: HOLOGRAPHIC MAP */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                <div className="flex-1 bg-[#15151E] rounded-2xl border border-white/10 p-1 relative overflow-hidden min-h-[600px] group flex flex-col">
                     
                     {/* Holographic Header */}
                    <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
                         <div>
                             <div className="text-xs font-mono text-f1-cyan uppercase tracking-[0.2em] mb-1 font-bold animate-pulse">TOPOLOGY SCAN</div>
                             <div className="text-3xl font-black text-white font-sans italic tracking-tighter">CIRCUIT MAP</div>
                         </div>
                         <div className="text-right hidden sm:block">
                             <div className="text-[10px] font-mono text-gray-400">STATUS</div>
                             <div className="text-f1-cyan font-bold tracking-widest">ONLINE</div>
                         </div>
                    </div>

                    <div className="w-full h-full bg-[#0f0f12] rounded-xl relative flex items-center justify-center overflow-hidden flex-1 border border-white/5">
                        
                        {/* 1. Animated Grid Floor */}
                        <div className="absolute inset-0 z-0" 
                             style={{ 
                                 backgroundImage: `linear-gradient(rgba(39, 244, 210, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(39, 244, 210, 0.05) 1px, transparent 1px)`,
                                 backgroundSize: '50px 50px',
                                 transform: 'perspective(500px) rotateX(10deg) scale(1.5)',
                                 transformOrigin: 'center bottom',
                                 opacity: 0.3
                             }}>
                        </div>
                        
                        {/* 2. Map Container */}
                        {mapData ? (
                            <div className="w-full h-full relative p-8 md:p-16 z-10 transition-transform duration-1000 hover:scale-105">
                                <svg viewBox={mapData.viewBox} className="w-full h-full drop-shadow-[0_0_30px_rgba(39,244,210,0.3)]">
                                    <defs>
                                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#27F4D2" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Base Outline (Ghost) */}
                                    <path 
                                        d={mapData.d} 
                                        fill="none" 
                                        stroke="#1f2937" 
                                        strokeWidth="300" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                    />

                                    {/* Main Neon Path */}
                                    <path 
                                        d={mapData.d} 
                                        fill="none" 
                                        stroke="url(#neonGradient)" 
                                        strokeWidth="150" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        filter="url(#glow)"
                                        className="animate-[pulse_4s_ease-in-out_infinite]"
                                    />

                                    {/* Animated Scanner Segment */}
                                    <path 
                                        d={mapData.d} 
                                        fill="none" 
                                        stroke="white" 
                                        strokeWidth="150" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeDasharray="1000 10000"
                                        className="animate-[dash_10s_linear_infinite]"
                                    >
                                        <animate attributeName="stroke-dashoffset" from="0" to="-10000" dur="20s" repeatCount="indefinite" />
                                    </path>
                                </svg>
                                
                                {/* 3. Scanning Laser Overlay */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-f1-cyan to-transparent opacity-30 animate-[slideUp_5s_linear_infinite] pointer-events-none"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-6 z-10">
                                {isLoadingMap ? (
                                    <>
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-f1-cyan border-t-transparent rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 border-4 border-f1-cyan/20 rounded-full"></div>
                                        </div>
                                        <div className="text-xs font-mono animate-pulse tracking-[0.2em] text-f1-cyan">DOWNLOADING TOPOLOGY...</div>
                                    </>
                                ) : (
                                    <div className="text-xs font-mono border border-f1-red/30 text-f1-red px-6 py-3 rounded bg-f1-red/5 tracking-widest">MAP DATA UNAVAILABLE</div>
                                )}
                            </div>
                        )}
                        
                        {/* Footer Overlay */}
                        <div className="absolute bottom-6 left-6 z-20 flex gap-4 text-[10px] font-mono text-gray-500">
                             <div className="bg-black/40 px-2 py-1 rounded border border-white/5">LAT: {circuitInfo ? CIRCUIT_INFO[nextSession.circuit_short_name]?.length : '--'}</div>
                             <div className="bg-black/40 px-2 py-1 rounded border border-white/5">MODE: PREVIEW</div>
                        </div>
                    </div>
                </div>

                {/* 4. ATMOSPHERICS */}
                <div className="bg-[#15151E] rounded-2xl border border-white/10 p-6">
                     <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest font-bold">ATMOSPHERICS</div>
                        <div className="text-[10px] bg-f1-cyan/10 text-f1-cyan px-2 py-0.5 rounded font-bold border border-f1-cyan/20 tracking-wider">FORECAST</div>
                     </div>

                     {weather ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                 <span className="text-gray-500 text-[9px] uppercase mb-1 tracking-wider font-bold">AIR</span>
                                 <span className="text-2xl font-sans font-bold text-white">{weather.air_temperature}°C</span>
                             </div>
                             <div className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                 <span className="text-gray-500 text-[9px] uppercase mb-1 tracking-wider font-bold">TRACK</span>
                                 <span className="text-2xl font-sans font-bold text-f1-red">{weather.track_temperature}°C</span>
                             </div>
                             <div className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                 <span className="text-gray-500 text-[9px] uppercase mb-1 tracking-wider font-bold">HUMIDITY</span>
                                 <span className="text-2xl font-sans font-bold text-blue-400">{weather.humidity}%</span>
                             </div>
                             <div className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                 <span className="text-gray-500 text-[9px] uppercase mb-1 tracking-wider font-bold">RAIN</span>
                                 <span className="text-2xl font-sans font-bold text-white">{weather.rainfall}mm</span>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center text-gray-600 font-mono text-xs py-4 bg-black/20 rounded border border-white/5">WEATHER DATA UNAVAILABLE</div>
                     )}
                </div>
            </div>
        </div>
    );
};
