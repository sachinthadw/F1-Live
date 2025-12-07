
import React, { useEffect, useState } from 'react';
import { getSeasonSchedule } from '../services/openf1';
import { RaceEvent, Session } from '../types';

export const Schedule: React.FC = () => {
    const [events, setEvents] = useState<RaceEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            const data = await getSeasonSchedule();
            setEvents(data);
            setLoading(false);
        };
        fetchSchedule();
    }, []);

    const addToGoogleCalendar = (session: Session) => {
        const start = new Date(session.date_start).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(session.date_start).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`F1: ${session.session_name} - ${session.location}`)}&dates=${start}/${end}&details=${encodeURIComponent("F1 Session via VelocityX")}&location=${encodeURIComponent(session.location)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-f1-cyan animate-pulse font-mono tracking-widest">
                LOADING {new Date().getFullYear()} SEASON DATA...
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#15151E] overflow-y-auto custom-scrollbar p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-f1-red"></span>
                {new Date().getFullYear()} SEASON CALENDAR
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.meeting_key} className={`relative bg-[#1f1f23] border ${event.is_completed ? 'border-white/5 opacity-50' : 'border-white/10'} rounded-xl overflow-hidden hover:border-f1-red/50 transition-colors group`}>
                        <div className="p-5 border-b border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs text-f1-red font-bold uppercase tracking-wider mb-1">ROUND {event.round_number}</div>
                                    <h3 className="text-xl font-bold text-white leading-none mb-1">{event.meeting_name}</h3>
                                    <div className="text-sm text-gray-400 font-mono">{event.circuit_short_name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white font-sans">{new Date(event.date_start).getDate()}</div>
                                    <div className="text-xs text-gray-400 uppercase">{new Date(event.date_start).toLocaleString('default', { month: 'short' })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="p-3 bg-[#1a1a20]">
                            {event.sessions.map((session) => {
                                const isRace = session.session_name === 'Race';
                                const date = new Date(session.date_start);
                                return (
                                    <div key={session.session_key} className={`flex justify-between items-center p-2 rounded ${isRace ? 'bg-white/5' : ''} hover:bg-white/10 transition-colors group/session`}>
                                        <div className="flex items-center gap-2">
                                            {isRace && <span className="w-1 h-3 bg-f1-red"></span>}
                                            <span className={`text-xs font-bold uppercase ${isRace ? 'text-white' : 'text-gray-400'}`}>
                                                {session.session_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500">
                                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                            <button 
                                                onClick={() => addToGoogleCalendar(session)}
                                                className="opacity-0 group-hover/session:opacity-100 text-[10px] bg-f1-red text-white px-1.5 py-0.5 rounded transition-opacity"
                                            >
                                                CAL
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
