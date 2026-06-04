
import React, { useEffect, useState } from 'react';
import { getChampionshipStandings } from '../services/jolpica';
import { ChampionshipEntry } from '../types';
import { Trophy, Users, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DriverPillar: React.FC<{ entry: ChampionshipEntry, rank: number }> = ({ entry, rank }) => {
    const teamColor = `#${entry.team_colour}`;
    // Taller, more majestic pillars
    const pillarHeight = rank === 1 ? 'h-[320px] md:h-[450px]' : rank === 2 ? 'h-[260px] md:h-[360px]' : 'h-[220px] md:h-[300px]';
    const zIndex = rank === 1 ? 'z-20' : 'z-10';
    const orderClass = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
    
    // Cyberpunk borders/accents
    const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';

    return (
        <div className={`relative flex flex-col justify-end ${orderClass} ${zIndex} w-1/3 max-w-[300px] -mx-2 md:mx-4`}>
            {/* Rank Number Floating above */}
            <div className="mb-4 flex flex-col items-center transform transition-transform duration-500 hover:scale-110">
                <div 
                    className="text-4xl md:text-7xl font-bold font-sans leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ color: borderColor, textShadow: `0 0 20px ${borderColor}` }}
                >
                    {rank}
                </div>
                <div className="h-1 w-8 md:w-16 mt-2 rounded-full" style={{ backgroundColor: borderColor }}></div>
            </div>

            {/* The Pillar */}
            <div 
                className={`${pillarHeight} w-full relative group overflow-hidden rounded-t-2xl border-t-2 border-x border-[var(--border-subtle)] transition-all duration-500 hover:shadow-[0_-20px_80px_-20px_rgba(10,132,255,0.08)]`}
                style={{ 
                    background: `linear-gradient(to bottom, ${teamColor}22, var(--glass-bg) 95%)`,
                    borderTopColor: teamColor,
                    boxShadow: `0 -20px 40px -20px ${teamColor}44` // Glow effect
                }}
            >
                {/* Subtle Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:4px_4px]"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    
                    <div className="mb-auto mt-4 text-center opacity-10 font-bold text-5xl md:text-8xl select-none font-sans text-[var(--heading-color)]">
                        {entry.acronym}
                    </div>

                    <div className="relative z-10">
                        <div className="text-[10px] md:text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1 text-center truncate">
                            {entry.team_name}
                        </div>
                        <h3 className="text-lg md:text-2xl font-black text-[var(--heading-color)] font-sans uppercase leading-none text-center mb-4 break-words drop-shadow-sm">
                            {entry.entity_name.split(' ').map((n, i) => (
                                <span key={i} className="block">{n}</span>
                            ))}
                        </h3>
                        
                        <div className="w-full h-px bg-[var(--border-subtle)] mb-2"></div>
                        
                        <div className="flex justify-center items-baseline gap-1">
                            <span className="text-2xl md:text-4xl font-bold text-[var(--heading-color)] font-mono tracking-tighter">{entry.points}</span>
                            <span className="text-[10px] text-[var(--color-f1-red)] font-bold uppercase">PTS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListItem: React.FC<{ entry: ChampionshipEntry, rank: number }> = ({ entry, rank }) => {
    const teamColor = `#${entry.team_colour}`;
    
    return (
        <div className="group relative flex items-center gap-4 p-4 mb-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--panel-hover)] transition-all duration-300">
            {/* Rank */}
            <div className="w-8 md:w-12 text-center font-mono font-bold text-lg text-[var(--text-muted)] group-hover:text-[var(--heading-color)] transition-colors">
                {String(rank).padStart(2, '0')}
            </div>

            {/* Team Color Strip */}
            <div className="w-1 h-8 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 group-hover:h-full" style={{ backgroundColor: teamColor, color: teamColor }}></div>

            {/* Name & Team */}
            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
                <span className="text-base md:text-lg font-bold text-[var(--heading-color)] font-sans uppercase tracking-wide truncate">
                    {entry.entity_name}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider truncate">
                    {entry.team_name}
                </span>
            </div>

            {/* Points */}
            <div className="text-right shrink-0 bg-[var(--card-bg-subtle)] px-3 py-1 rounded border border-[var(--border-subtle)] transition-colors">
                <span className="text-lg font-bold text-[var(--heading-color)] font-mono">{entry.points}</span>
                <span className="text-[9px] text-[var(--text-muted)] ml-1">PTS</span>
            </div>
        </div>
    );
}

export const Championships: React.FC = () => {
    const [data, setData] = useState<{ drivers: ChampionshipEntry[], constructors: ChampionshipEntry[] } | null>(null);
    const [view, setView] = useState<'drivers' | 'constructors'>('drivers');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const res = await getChampionshipStandings();
            setData(res);
            setIsAnimating(true);
        };
        loadData();
    }, []);

    const handleSwitch = (v: 'drivers' | 'constructors') => {
        setIsAnimating(false);
        setTimeout(() => {
            setView(v);
            setIsAnimating(true);
        }, 300);
    }

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 bg-transparent border-t border-[var(--border-subtle)]">
             <Loader2 className="w-12 h-12 text-[var(--color-f1-cyan)] animate-spin" />
             <div className="font-medium text-xs animate-pulse text-[var(--text-muted)] tracking-[0.3em] uppercase">SYNCING CHAMPIONSHIP DATA...</div>
        </div>
    );

    const currentList = view === 'drivers' ? data.drivers : data.constructors;
    const podium = currentList.slice(0, 3);
    const rest = currentList.slice(3);

    return (
        <div className="w-full h-full bg-transparent overflow-y-auto custom-scrollbar flex flex-col relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-grid-subtle opacity-10 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--color-f1-red)]/10 to-transparent pointer-events-none"></div>

            {/* Header Section */}
            <div className="relative z-10 pt-12 pb-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-end border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-3xl rounded-t-2xl">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-5 h-5 text-[var(--color-f1-red)]" />
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-[0.4em] font-bold">OFFICIAL STANDINGS</span>
                    </div>
                    
                    {/* Stacked Layout with Visible Overflow to guarantee no cropping */}
                    <div className="flex flex-col overflow-visible pb-10">
                        <h1 className="text-5xl md:text-7xl font-black text-[var(--heading-color)] font-sans tracking-tighter uppercase leading-[1.1] drop-shadow-sm">
                            WORLD
                        </h1>
                        <h1 className="text-5xl md:text-7xl font-black text-[var(--color-f1-cyan)] font-sans tracking-tighter uppercase leading-[1.1] drop-shadow-sm">
                            CHAMPIONSHIP
                        </h1>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-[var(--nav-bg)] p-1 rounded-lg border border-[var(--border-subtle)] mt-6 md:mt-0 backdrop-blur-md shadow-xl mb-8">
                    {['drivers', 'constructors'].map((v) => (
                        <button 
                            key={v}
                            onClick={() => handleSwitch(v as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${view === v ? 'bg-[var(--color-f1-red)] text-white shadow-[0_4px_12px_rgba(255,59,48,0.2)]' : 'text-[var(--text-muted)] hover:text-[var(--heading-color)] hover:bg-[var(--panel-hover)]'}`}
                        >
                            {v === 'drivers' ? <Users className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full pt-8 pb-20">
                
                {/* Podium Stage */}
                <AnimatePresence mode="wait">
                    {podium.length > 0 && (
                        <motion.div 
                            key={view}
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex justify-center items-end pb-16"
                        >
                            {podium[1] && <DriverPillar entry={podium[1]} rank={2} />}
                            {podium[0] && <DriverPillar entry={podium[0]} rank={1} />}
                            {podium[2] && <DriverPillar entry={podium[2]} rank={3} />}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rankings List */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={view + '-list'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        className="px-4 md:px-0"
                    >
                        <div className="flex items-center gap-4 mb-6 px-4">
                            <div className="text-xs font-mono text-[var(--color-f1-cyan)] uppercase tracking-widest font-bold">FULL CLASSIFICATION</div>
                            <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                             {rest.map((entry, idx) => (
                                <ListItem key={entry.entity_name} entry={entry} rank={idx + 4} />
                            ))}
                        </div>
                        
                        {currentList.length === 0 && (
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20 border border-[var(--border-subtle)] rounded-xl bg-[var(--card-bg-subtle)] mx-4 flex flex-col items-center justify-center gap-4"
                             >
                                <AlertCircle className="w-12 h-12 text-[var(--color-f1-red)]" />
                                <div className="text-[var(--text-muted)] font-mono uppercase tracking-widest">DATA UNAVAILABLE</div>
                             </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
