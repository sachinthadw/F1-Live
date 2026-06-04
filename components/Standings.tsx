import React, { useEffect, useState } from 'react';
import { DriverStanding } from '../types';
import { Trophy, ChevronUp, ChevronDown, Minus, Clock, Zap, Wind } from 'lucide-react';
import { motion } from 'motion/react';

interface StandingsProps {
  standings: DriverStanding[];
  onSelectDriver: (driverNumber: number) => void;
  selectedDriver: number | null;
  sessionType?: string;
}

const TYRE_STYLES: Record<string, { color: string, label: string, ring: string }> = {
    'SOFT': { color: '#FF4444', label: 'S', ring: '#FF4444' },
    'MEDIUM': { color: '#FFD500', label: 'M', ring: '#FFD500' },
    'HARD': { color: '#888888', label: 'H', ring: '#888888' },
    'INTERMEDIATE': { color: '#00FFCC', label: 'I', ring: '#00FFCC' }, 
    'WET': { color: '#3b82f6', label: 'W', ring: '#3b82f6' },
};

const getTyreStyle = (compound: string | undefined) => {
    if (!compound) return { color: '#888', label: '?', ring: '#555' };
    const key = compound.toUpperCase();
    for (const type in TYRE_STYLES) {
        if (key.includes(type)) return TYRE_STYLES[type];
    }
    return { color: '#888', label: key[0] || '?', ring: '#888' };
};

export const Standings: React.FC<StandingsProps> = ({ standings, onSelectDriver, selectedDriver, sessionType }) => {
  const [showGap, setShowGap] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
        setShowGap(prev => !prev);
    }, showGap ? 4000 : 8000); 
    return () => clearInterval(timer);
  }, [showGap]);

  const isPractice = sessionType?.toLowerCase().includes('practice') || sessionType?.toLowerCase().includes('qualifying');

  return (
    <div className="h-full flex flex-col w-full relative">
      <div className="px-4 py-3 bg-[var(--card-bg-subtle)] backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold tracking-widest text-[var(--heading-color)] flex items-center gap-2">
            <Trophy size={14} className="text-[var(--color-f1-red)]" />
            STANDINGS
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-[30px_1fr_40px_40px_60px_30px] border-b border-[var(--border-subtle)] bg-[var(--nav-bg)] backdrop-blur-xl sticky top-0 z-10 text-[10px] uppercase text-[var(--text-muted)] font-medium tracking-wide shadow-sm">
            <div className="p-2 text-center text-[var(--text-muted)]">P</div>
            <div className="p-2 text-left">Driver / Team</div>
            <div className="p-2 text-center"><Wind size={10} className="mx-auto" /></div>
            <div className="p-2 text-center"><Zap size={10} className="mx-auto" /></div>
            <div className="p-2 text-right transition-colors duration-500 text-[var(--heading-color)] cursor-pointer hover:text-[var(--color-f1-cyan)]" onClick={() => setShowGap(!showGap)}>
                {showGap ? 'GAP' : 'INT'}
            </div>
            <div className="p-2 text-center">T</div>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
            {standings.map((driver, index) => {
              const teamColor = driver.team_colour ? `#${driver.team_colour}` : '#FFFFFF';
              const isSelected = selectedDriver === driver.driver_number;
              const tyreInfo = getTyreStyle(driver.tyre_compound);
              
              const startPos = driver.grid_position || 20;
              const posChange = startPos - driver.position;
              
              const displayTime = showGap ? driver.gap : driver.interval;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={driver.driver_number}
                  onClick={() => onSelectDriver(driver.driver_number)}
                  className={`
                    grid grid-cols-[30px_1fr_40px_40px_60px_30px] cursor-pointer transition-all duration-150 group
                    ${isSelected ? 'bg-[var(--card-bg-subtle)]' : 'hover:bg-[var(--panel-hover)]'}
                  `}
                >
                  {/* Position */}
                  <div className="p-2 text-center relative font-mono flex items-center justify-center">
                     <div className={`absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} style={{ backgroundColor: teamColor }}></div>
                     <span className={`font-bold text-sm ${index < 3 ? 'text-[var(--heading-color)]' : 'text-[var(--text-muted)]'}`}>{driver.position}</span>
                  </div>

                  {/* Driver Name */}
                  <div className="p-2 flex flex-col justify-center min-w-0">
                     <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-sm tracking-wide uppercase truncate ${isSelected ? 'text-[var(--color-f1-red)]' : 'text-[var(--heading-color)]'}`}>
                              {driver.name_acronym}
                          </span>
                          {!isPractice && posChange !== 0 && (
                             <span className={`text-[8px] font-mono ${posChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                 {posChange > 0 ? '▲' : '▼'}{Math.abs(posChange)}
                             </span>
                          )}
                     </div>
                     <span className="font-mono font-bold text-[9px] tracking-wide uppercase truncate block" style={{ color: teamColor }}>
                        {driver.team_name}
                     </span>
                  </div>

                  {/* Aero Status */}
                  <div className="p-2 flex justify-center items-center">
                     <div className={`text-[9px] font-mono px-1 border ${driver.aero_status === 'X-MODE' ? 'border-[var(--color-f1-cyan)] text-[var(--color-f1-cyan)] bg-[var(--color-f1-cyan)]/10' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                        {driver.aero_status === 'X-MODE' ? 'X' : 'Z'}
                     </div>
                  </div>

                  {/* MOM Status */}
                  <div className="p-2 flex justify-center items-center">
                     <div className={`w-2 h-2 mx-auto ${driver.mom_status === 'ACTIVE' ? 'bg-[var(--color-f1-cyan)] shadow-[0_0_8px_var(--color-f1-cyan)]' : (driver.mom_status === 'READY' ? 'bg-[var(--color-f1-cyan)]/50' : 'bg-transparent border border-gray-400')}`}></div>
                  </div>

                  {/* Gap/Interval */}
                  <div className="p-2 flex justify-end items-center font-mono text-xs">
                    <span className={`${!showGap ? 'text-[var(--color-f1-cyan)]' : 'text-[var(--heading-color)]'}`}>{displayTime}</span>
                  </div>

                  {/* Tyre */}
                  <div className="p-2 flex justify-center items-center">
                     <div className="relative w-4 h-4 flex items-center justify-center">
                        <div className="absolute inset-0 border border-t-[2px]" style={{ borderColor: tyreInfo.ring }}></div>
                        <span className="text-[7px] font-mono font-bold" style={{ color: tyreInfo.color }}>{tyreInfo.label}</span>
                     </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
