

import React, { useEffect, useState } from 'react';
import { getChampionshipStandings } from '../services/jolpica';
import { ChampionshipEntry } from '../types';

const DriverPillar: React.FC<{ entry: ChampionshipEntry, rank: number }> = ({ entry, rank }) => {
    const teamColor = `#${entry.team_colour}`;
    const pillarHeight = rank === 1 ? 'h-[280px] md:h-[400px]' : rank === 2 ? 'h-[240px] md:h-[320px]' : 'h-[200px] md:h-[260px]';
    const zIndex = rank === 1 ? 'z-20' : 'z-10';
    const orderClass = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

    const glowColor = rank === 1 ? 'rgba(255, 215, 0, 0.4)' : rank === 2 ? 'rgba(192, 192, 192, 0.3)' : 'rgba(205, 127, 50, 0.3)';
    const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';

    return (
        <div className={`relative flex flex-col justify-end ${orderClass} ${zIndex} w-1/3 max-w-[280px] -mx-1 md:mx-2`}>
            <div className={`mb-2 md:mb-4 flex flex-col items-center transition-all duration-700 delay-100`}>
                <div className="text-[8px] md:text-xs font-mono text-gray-400 tracking-widest uppercase mb-1 hidden md:block">
                    {rank === 1 ? 'CHAMPION' : rank === 2 ? 'RUNNER UP' : '3RD PLACE'}
                </div>
                <div 
                    className="text-3xl md:text-6xl font-bold font-sans italic leading-none drop-shadow-2xl"
                    style={{ color: borderColor }}
                >
                    {rank}
                </div>
            </div>

            <div 
                className={`${pillarHeight} w-full relative group overflow-hidden rounded-t-lg transition-all duration-500 ease-out border-t-4`}
                style={{ 
                    background: `linear-gradient(to top, ${teamColor}15, #15151E 95%)`,
                    borderTopColor: teamColor,
                    boxShadow: `0 -10px 40px -10px ${glowColor}`
                }}
            >
                <div className="absolute -bottom-6 -right-2 text-[80px] md:text-[160px] font-bold font-sans text-white/5 italic select-none leading-none">
                    {rank}
                </div>

                <div className="absolute inset-0 flex flex-col justify-between p-2 md:p-5">
                    <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                             <div className="text-[8px] md:text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300 backdrop-blur-sm border border-white/5 uppercase">
                                {entry.acronym || entry.entity_name.substring(0,3)}
                             </div>
                        </div>
                        <h3 className="text-sm md:text-xl lg:text-2xl font-bold text-white font-sans uppercase italic leading-tight break-words shadow-black drop-shadow-md">
                            {entry.entity_name} 
                        </h3>
                        <div 
                            className="text-[8px] md:text-xs font-bold uppercase tracking-widest mt-1 truncate opacity-80" 
                            style={{ color: teamColor }}
                        >
                            {entry.team_name}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-1 md:mb-2"></div>
                        <div className="flex justify-between items-end">
                            <div className="text-[8px] md:text-[10px] text-gray-500 font-mono mb-0.5">PTS</div>
                            <div className="text-xl md:text-4xl font-bold text-white font-sans tracking-tighter">
                                {entry.points}
                            </div>
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
        <div className="group relative flex items-center gap-3 md:gap-6 p-3 md:p-4 rounded-r-lg bg-gradient-to-r from-[#1A1A20] to-transparent border-l-4 hover:bg-white/5 transition-all duration-200 mb-1"
             style={{ borderLeftColor: teamColor }}>
            
            <div className="w-6 md:w-10 text-center font-mono font-bold text-lg md:text-xl text-gray-600 italic shrink-0">
                {String(rank).padStart(2, '0')}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                    <span className="text-sm md:text-lg font-bold text-gray-200 font-sans uppercase tracking-wide truncate group-hover:text-white transition-colors">
                        {entry.entity_name}
                    </span>
                    <span className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wider truncate" style={{ color: teamColor }}>
                        {entry.team_name}
                    </span>
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className="text-base md:text-xl font-bold text-white font-sans">{entry.points} <span className="text-[9px] text-gray-500 font-mono">PTS</span></div>
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
        }, 150);
    }

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#0f0f12]">
             <div className="w-12 h-12 border-2 border-f1-cyan border-t-transparent rounded-full animate-spin"></div>
             <div className="font-mono text-[10px] animate-pulse text-gray-500 tracking-[0.2em] uppercase">ACCESSING GLOBAL DATABASE...</div>
        </div>
    );

    const currentList = view === 'drivers' ? data.drivers : data.constructors;
    const podium = currentList.slice(0, 3);
    const rest = currentList.slice(3);

    return (
        <div className="w-full h-full bg-[#0f0f12] overflow-y-auto custom-scrollbar flex flex-col">
            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-[#0f0f12]/95 backdrop-blur-md border-b border-white/5 py-6 px-4 md:px-8 shadow-2xl">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-f1-red uppercase tracking-[0.3em] mb-2 flex items-center gap-2 justify-center md:justify-start">
                            <span className="w-1.5 h-1.5 bg-f1-red rounded-full animate-pulse"></span>
                            OFFICIAL STANDINGS
                        </div>
                        {/* STRICT TYPOGRAPHY FIXES - Added pb-6 and pr-4 and leading-relaxed */}
                        <div className="py-2 overflow-visible">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-sans italic tracking-tighter uppercase leading-relaxed drop-shadow-lg pb-6 pr-4">
                                World <span className="text-transparent bg-clip-text bg-gradient-to-r from-f1-cyan to-white">Championship</span>
                            </h1>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex shrink-0 bg-[#1A1A20] p-1 rounded-full border border-white/10">
                        {['drivers', 'constructors'].map((v) => (
                            <button 
                                key={v}
                                onClick={() => handleSwitch(v as any)}
                                className={`px-4 md:px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${view === v ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Podium Section */}
            {podium.length > 0 && (
                <div className="flex-none pt-8 pb-12 bg-gradient-to-b from-[#0f0f12] via-[#15151E] to-[#0f0f12]">
                    <div className={`max-w-4xl mx-auto flex items-end justify-center px-4 transition-all duration-700 transform ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        {podium[1] && <DriverPillar entry={podium[1]} rank={2} />}
                        {podium[0] && <DriverPillar entry={podium[0]} rank={1} />}
                        {podium[2] && <DriverPillar entry={podium[2]} rank={3} />}
                    </div>
                </div>
            )}

            {/* List Section */}
            <div className="flex-1 px-4 md:px-8 pb-12 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-4 opacity-50">
                    <div className="h-px bg-white/20 flex-1"></div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">RANKINGS</div>
                    <div className="h-px bg-white/20 flex-1"></div>
                </div>

                <div className={`flex flex-col gap-1 transition-all duration-700 delay-200 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    {rest.map((entry, idx) => (
                        <ListItem key={entry.entity_name} entry={entry} rank={idx + 4} />
                    ))}
                    {currentList.length === 0 && (
                        <div className="text-center py-10 text-gray-500 font-mono text-xs">AWAITING 2025 SEASON START</div>
                    )}
                </div>
            </div>
        </div>
    );
};