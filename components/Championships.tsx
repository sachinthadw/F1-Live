
import React, { useEffect, useState } from 'react';
import { getChampionshipStandings } from '../services/jolpica';
import { ChampionshipEntry } from '../types';

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
                    className="text-4xl md:text-7xl font-bold font-sans italic leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ color: borderColor, textShadow: `0 0 20px ${borderColor}` }}
                >
                    {rank}
                </div>
                <div className="h-1 w-8 md:w-16 mt-2 rounded-full" style={{ backgroundColor: borderColor }}></div>
            </div>

            {/* The Pillar */}
            <div 
                className={`${pillarHeight} w-full relative group overflow-hidden rounded-t-2xl border-t-2 border-x border-white/10 transition-all duration-500 hover:shadow-[0_-20px_80px_-20px_rgba(255,255,255,0.2)]`}
                style={{ 
                    background: `linear-gradient(to bottom, ${teamColor}33, #0f0f12 90%)`,
                    borderTopColor: teamColor,
                    boxShadow: `0 -20px 60px -20px ${teamColor}66` // Glow effect
                }}
            >
                {/* Subtle Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:4px_4px]"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    
                    <div className="mb-auto mt-4 text-center opacity-10 font-bold text-5xl md:text-8xl select-none font-sans italic text-white/50">
                        {entry.acronym}
                    </div>

                    <div className="relative z-10">
                        <div className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-widest mb-1 text-center truncate">
                            {entry.team_name}
                        </div>
                        <h3 className="text-lg md:text-2xl font-black text-white font-sans uppercase italic leading-none text-center mb-4 break-words drop-shadow-md">
                            {entry.entity_name.split(' ').map((n, i) => (
                                <span key={i} className="block">{n}</span>
                            ))}
                        </h3>
                        
                        <div className="w-full h-px bg-white/10 mb-2"></div>
                        
                        <div className="flex justify-center items-baseline gap-1">
                            <span className="text-2xl md:text-4xl font-bold text-white font-mono tracking-tighter">{entry.points}</span>
                            <span className="text-[10px] text-f1-red font-bold uppercase">PTS</span>
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
        <div className="group relative flex items-center gap-4 p-4 mb-2 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300">
            {/* Rank */}
            <div className="w-8 md:w-12 text-center font-mono font-bold text-lg text-gray-500 italic group-hover:text-white transition-colors">
                {String(rank).padStart(2, '0')}
            </div>

            {/* Team Color Strip */}
            <div className="w-1 h-8 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 group-hover:h-full" style={{ backgroundColor: teamColor, color: teamColor }}></div>

            {/* Name & Team */}
            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
                <span className="text-base md:text-lg font-bold text-white font-sans uppercase tracking-wide truncate">
                    {entry.entity_name}
                </span>
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider truncate">
                    {entry.team_name}
                </span>
            </div>

            {/* Points */}
            <div className="text-right shrink-0 bg-black/30 px-3 py-1 rounded border border-white/5 group-hover:border-f1-cyan/50 transition-colors">
                <span className="text-lg font-bold text-white font-mono">{entry.points}</span>
                <span className="text-[9px] text-gray-500 ml-1">PTS</span>
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
        <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#0f0f12]">
             <div className="w-16 h-16 border-4 border-f1-cyan border-t-transparent rounded-full animate-spin"></div>
             <div className="font-mono text-xs animate-pulse text-gray-500 tracking-[0.3em] uppercase">SYNCING CHAMPIONSHIP DATA...</div>
        </div>
    );

    const currentList = view === 'drivers' ? data.drivers : data.constructors;
    const podium = currentList.slice(0, 3);
    const rest = currentList.slice(3);

    return (
        <div className="w-full h-full bg-[#0f0f12] overflow-y-auto custom-scrollbar flex flex-col relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-grid-subtle opacity-10 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-f1-red/5 to-transparent pointer-events-none"></div>

            {/* Header Section */}
            <div className="relative z-10 pt-12 pb-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-end border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-2 h-2 bg-f1-red rounded-full animate-pulse shadow-[0_0_10px_#E10600]"></span>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.4em] font-bold">OFFICIAL STANDINGS</span>
                    </div>
                    
                    {/* Stacked Layout with Visible Overflow to guarantee no cropping */}
                    <div className="flex flex-col overflow-visible">
                        <h1 className="text-5xl md:text-7xl font-black text-white font-sans tracking-tighter uppercase leading-none drop-shadow-2xl">
                            WORLD
                        </h1>
                        {/* INCREASED PADDING BOTTOM TO 8 AND LEADING TO NORMAL */}
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-f1-cyan to-white font-sans tracking-tighter uppercase leading-normal pb-8 drop-shadow-lg">
                            CHAMPIONSHIP
                        </h1>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-black/40 p-1.5 rounded-lg border border-white/10 mt-6 md:mt-0 backdrop-blur-md shadow-xl">
                    {['drivers', 'constructors'].map((v) => (
                        <button 
                            key={v}
                            onClick={() => handleSwitch(v as any)}
                            className={`px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all duration-300 ${view === v ? 'bg-f1-red text-white shadow-[0_0_15px_rgba(225,6,0,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full pt-8">
                
                {/* Podium Stage */}
                {podium.length > 0 && (
                    <div className={`flex justify-center items-end pb-16 transition-all duration-700 transform ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 scale-95'}`}>
                        {podium[1] && <DriverPillar entry={podium[1]} rank={2} />}
                        {podium[0] && <DriverPillar entry={podium[0]} rank={1} />}
                        {podium[2] && <DriverPillar entry={podium[2]} rank={3} />}
                    </div>
                )}

                {/* Rankings List */}
                <div className={`px-4 md:px-0 pb-12 transition-all duration-700 delay-200 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                    <div className="flex items-center gap-4 mb-6 px-4">
                        <div className="text-xs font-mono text-f1-cyan uppercase tracking-widest font-bold">FULL CLASSIFICATION</div>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                         {rest.map((entry, idx) => (
                            <ListItem key={entry.entity_name} entry={entry} rank={idx + 4} />
                        ))}
                    </div>
                    
                    {currentList.length === 0 && (
                         <div className="text-center py-20 border border-white/5 rounded-xl bg-white/5 mx-4">
                            <div className="text-f1-red text-4xl mb-2">⚠</div>
                            <div className="text-gray-400 font-mono uppercase tracking-widest">DATA UNAVAILABLE</div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
