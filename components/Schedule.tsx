import React, { useEffect, useState } from 'react';
import { getSeasonSchedule } from '../services/openf1';
import { RaceEvent, Session } from '../types';
import { Calendar, CalendarPlus, MapPin, AlertCircle, Loader2, Timer, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Schedule: React.FC = () => {
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [hasData, setHasData] = useState(true);

    const nextEvent = events.find(e => !e.is_completed);
    const nextSession = nextEvent?.sessions.find(s => new Date(s.date_start).getTime() > Date.now()) || nextEvent?.sessions[0];

    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

    useEffect(() => {
        if (!nextSession) return;
        const target = new Date(nextSession.date_start).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = target - now;
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [nextSession]);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            setEvents([]);
            const data = await getSeasonSchedule(year);
            setEvents(data);
            setHasData(data.length > 0);
            setLoading(false);
        };
        fetchSchedule();
    }, [year]);

    const addToGoogleCalendar = (session: Session) => {
        const start = new Date(session.date_start).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(session.date_start).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`F1: ${session.session_name} - ${session.location}`)}&dates=${start}/${end}&details=${encodeURIComponent("F1 Session via VelocityX")}&location=${encodeURIComponent(session.location)}`;
        window.open(url, '_blank');
    };

    const currentYear = new Date().getFullYear();
    const availableYears = [currentYear - 1, currentYear, currentYear + 1];

    return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full bg-transparent overflow-y-auto custom-scrollbar p-6"
        >
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6 bg-[var(--glass-bg)] backdrop-blur-md p-6 rounded-2xl border border-[var(--border-subtle)] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-f1-cyan)]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                <div className="flex flex-col">
                    <h2 className="text-xl font-medium font-sans text-[var(--heading-color)] flex items-center gap-3 tracking-tight">
                        <Calendar className="w-5 h-5 text-[var(--color-f1-cyan)]" />
                        EVENT SCHEDULE
                    </h2>
                    <div className="text-[10px] text-[var(--color-f1-cyan)] mt-1 tracking-widest uppercase font-medium">GLOBAL TOUR // {year}</div>
                </div>

                {/* Countdown Timer */}
                {timeLeft && nextEvent && (
                    <div className="flex bg-[var(--card-bg-subtle)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-xl p-3 items-center gap-6 shadow-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono flex items-center gap-1.5 mb-1"><Timer className="w-3 h-3 text-[var(--color-f1-red)] animate-pulse" /> NEXT SESSION</span>
                            <span className="text-sm text-[var(--text-app)] font-medium tracking-tight truncate max-w-[150px] sm:max-w-[300px] md:max-w-none">{nextEvent.circuit_short_name} - {nextSession?.session_name}</span>
                        </div>
                        <div className="border-l border-[var(--border-subtle)] h-8"></div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center min-w-[30px]">
                                <span className="font-mono text-xl text-[var(--heading-color)] font-bold">{timeLeft.days}</span>
                                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Dys</span>
                            </div>
                            <div className="flex flex-col items-center min-w-[30px]">
                                <span className="font-mono text-xl text-[var(--heading-color)] font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Hrs</span>
                            </div>
                            <div className="flex flex-col items-center min-w-[30px]">
                                <span className="font-mono text-xl text-[var(--color-f1-cyan)] font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Min</span>
                            </div>
                            <div className="flex flex-col items-center min-w-[30px]">
                                <span className="font-mono text-xl text-[var(--text-app)] opacity-70 font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Sec</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex bg-[var(--nav-bg)] backdrop-blur-lg rounded-full border border-[var(--border-subtle)] p-1">
                    {availableYears.map(y => (
                        <button
                            key={y}
                            onClick={() => setYear(y)}
                            className={`px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition-all rounded-full ${year === y ? 'bg-[var(--heading-color)] text-[var(--bg-app)] shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--heading-color)]'}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96 text-[var(--color-f1-cyan)]/50 animate-pulse font-mono tracking-widest gap-3 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ACQUIRING {year} DATA...
                </div>
            ) : !hasData ? (
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="flex flex-col items-center justify-center h-96 border border-[var(--border-subtle)] bg-[var(--card-bg-subtle)] rounded-xl"
                 >
                    <AlertCircle className="w-12 h-12 text-[#FF3B30] mb-4" />
                     <div className="text-[var(--text-muted)] font-mono tracking-widest uppercase text-xs">NO SCHEDULE DATA AVAILABLE FOR {year}</div>
                 </motion.div>
            ) : (
                 <motion.div 
                   initial="hidden"
                   animate="visible"
                   variants={{
                     hidden: { opacity: 0 },
                     visible: {
                       opacity: 1,
                       transition: { staggerChildren: 0.05 }
                     }
                   }}
                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                 >
                     {events.map((event) => {
                         const isNextEvent = event === nextEvent;
                         return (
                         <motion.div 
                           variants={{
                             hidden: { opacity: 0, y: 10 },
                             visible: { opacity: 1, y: 0 }
                           }}
                           key={event.meeting_key} 
                           className={`relative backdrop-blur-xl border rounded-2xl overflow-hidden transition-all group shadow-sm 
                                     ${event.is_completed ? 'bg-[var(--glass-bg)] border-[var(--border-subtle)] opacity-60 hover:border-[var(--glass-border)]' : 
                                       isNextEvent ? 'bg-[var(--glass-bg)] border-[var(--color-f1-cyan)] shadow-[0_4px_20px_rgba(10,132,255,0.08)] ring-1 ring-[var(--color-f1-cyan)]/35' : 
                                       'bg-[var(--glass-bg)] border-[var(--border-subtle)] hover:border-[var(--glass-border)]'}`}
                         >
                             <div className={`p-5 border-b ${isNextEvent ? 'border-[var(--color-f1-cyan)]/25 bg-gradient-to-tr from-[var(--color-f1-cyan)]/5 to-transparent' : 'border-[var(--border-subtle)]'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                     <div>
                                         <div className="flex items-center gap-2 mb-1.5">
                                             <div className="text-[10px] text-[var(--color-f1-cyan)] font-medium uppercase tracking-widest">Round {event.round_number}</div>
                                             {isNextEvent && <span className="text-[9px] bg-[var(--color-f1-cyan)] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(10,132,255,0.5)]">Next Event</span>}
                                         </div>
                                         <h3 className="text-lg font-bold text-[var(--heading-color)] leading-tight mb-1 tracking-tight">{event.meeting_name}</h3>
                                         <div className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1.5 tracking-wide">
                                           <MapPin className="w-3.5 h-3.5" />
                                           {event.circuit_short_name}
                                         </div>
                                     </div>
                                     <div className="text-right flex flex-col items-end">
                                         <div className={`text-2xl font-bold leading-none ${isNextEvent ? 'text-[var(--color-f1-cyan)]' : 'text-[var(--heading-color)]'}`}>{new Date(event.date_start).getDate()}</div>
                                         <div className={`text-[10px] font-medium uppercase tracking-widest mt-1.5 ${isNextEvent ? 'text-[var(--text-app)] opacity-80' : 'text-[var(--color-f1-cyan)]'}`}>{new Date(event.date_start).toLocaleString('default', { month: 'short' })}</div>
                                     </div>
                                 </div>
                             </div>

                             {/* Sessions List */}
                             <div className="p-3 bg-[var(--card-bg-subtle)]">
                                 {event.sessions.map((session) => {
                                     const isRace = session.session_name === 'Race';
                                     const date = new Date(session.date_start);
                                     const isNextActiveSession = session === nextSession;
                                     
                                     return (
                                         <div key={session.session_key} className={`flex justify-between items-center p-2 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--panel-hover)] transition-colors group/session rounded-md ${isNextActiveSession ? 'bg-[var(--card-bg-subtle)] border-[var(--color-f1-cyan)]/40 shadow-sm' : ''}`}>
                                             <div className="flex items-center gap-2">
                                                 {isRace && <span className="w-1 h-3 bg-[#FF3B30] rounded-full shadow-[0_0_5px_rgba(255,59,48,0.6)]"></span>}
                                                 <span className={`text-[10px] uppercase font-mono tracking-wider ${isRace ? 'text-[var(--heading-color)] font-bold' : 'text-[var(--text-muted)]'} ${isNextActiveSession ? 'text-[var(--color-f1-cyan)] font-bold' : ''}`}>
                                                     {session.session_name}
                                                     {isNextActiveSession && <span className="ml-2 text-[8px] bg-[var(--color-f1-cyan)]/20 text-[var(--color-f1-cyan)] px-1 rounded uppercase tracking-widest">Upcoming</span>}
                                                 </span>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                 <span className={`text-[10px] font-mono ${isNextActiveSession ? 'text-[var(--heading-color)] font-bold' : 'text-[var(--text-muted)]'}`}>
                                                     {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                 </span>
                                                 <button 
                                                     onClick={() => addToGoogleCalendar(session)}
                                                     className="opacity-0 group-hover/session:opacity-100 text-[9px] font-medium uppercase bg-[var(--card-bg-subtle)] border border-[var(--border-subtle)] text-[var(--heading-color)] px-2 py-0.5 rounded-full transition-all flex items-center gap-1 hover:bg-[var(--panel-hover)]"
                                                 >
                                                     <CalendarPlus className="w-3 h-3" />
                                                     Add
                                                 </button>
                                             </div>
                                         </div>
                                     )
                                 })}
                             </div>
                         </motion.div>
                     )})}
                 </motion.div>
            )}
        </motion.div>
    );
};
