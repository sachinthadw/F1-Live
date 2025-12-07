
import React, { useEffect, useState } from 'react';
import { DriverStanding } from '../types';

interface StandingsProps {
  standings: DriverStanding[];
  onSelectDriver: (driverNumber: number) => void;
  selectedDriver: number | null;
  sessionType?: string;
}

const TYRE_STYLES: Record<string, { color: string, label: string, ring: string }> = {
    'SOFT': { color: '#ef4444', label: 'S', ring: '#ef4444' },
    'MEDIUM': { color: '#eab308', label: 'M', ring: '#eab308' },
    'HARD': { color: '#ffffff', label: 'H', ring: '#ffffff' },
    'INTERMEDIATE': { color: '#22c55e', label: 'I', ring: '#22c55e' },
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

  // Auto-toggle but keep Interval visible for longer (8s Interval, 4s Gap)
  useEffect(() => {
    const timer = setInterval(() => {
        setShowGap(prev => !prev);
    }, showGap ? 4000 : 8000); 
    return () => clearInterval(timer);
  }, [showGap]);

  const isPractice = sessionType?.toLowerCase().includes('practice') || sessionType?.toLowerCase().includes('qualifying');

  return (
    <div className="h-full flex flex-col bg-[#1a1a20] rounded-xl overflow-hidden border border-white/5 shadow-xl">
      <div className="px-4 py-3 bg-[#15151E] border-b border-white/5 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase flex items-center gap-2">
            <span className="w-1 h-4 bg-f1-red"></span>
            Leaderboard
        </h2>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-[10px] font-mono text-gray-400 uppercase">LIVE</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1F1F23] sticky top-0 z-10 text-[10px] uppercase text-gray-500 font-bold font-mono tracking-wider shadow-sm">
            <tr>
              <th className="p-2 text-center w-8">Pos</th>
              {!isPractice && <th className="p-2 text-center w-8">Grid</th>}
              <th className="p-2 text-left w-32">Driver</th>
              <th className="p-2 text-left">Team</th>
              <th className="p-2 text-center w-16">Aero</th>
              <th className="p-2 text-center w-12">MOM</th>
              <th className="p-2 text-right transition-colors duration-500 text-white cursor-pointer" onClick={() => setShowGap(!showGap)}>
                  {/* Click header to manually toggle */}
                  {showGap ? 'GAP' : 'INTERVAL'}
              </th>
              <th className="p-2 text-center w-10">Tyre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((driver, index) => {
              const teamColor = driver.team_colour ? `#${driver.team_colour}` : '#FFFFFF';
              const isSelected = selectedDriver === driver.driver_number;
              const tyreInfo = getTyreStyle(driver.tyre_compound);
              
              // Accurate Position Gained Logic
              const startPos = driver.grid_position || 20;
              const posChange = startPos - driver.position;
              
              const gainColor = posChange > 0 ? 'text-green-500' : (posChange < 0 ? 'text-red-500' : 'text-gray-600');
              const gainIcon = posChange > 0 ? '▲' : (posChange < 0 ? '▼' : '-');

              // Display logic for gap vs interval
              // Leader always shows 'LEADER' in Gap, but '-' in interval usually
              const displayTime = showGap ? driver.gap : driver.interval;

              return (
                <tr 
                  key={driver.driver_number}
                  onClick={() => onSelectDriver(driver.driver_number)}
                  className={`
                    cursor-pointer transition-all duration-150 group
                    ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                  `}
                >
                  {/* Current Position */}
                  <td className="p-2 text-center relative font-mono">
                     <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} style={{ backgroundColor: teamColor }}></div>
                     <span className={`font-bold text-lg leading-none ${index < 3 ? 'text-white drop-shadow-md' : 'text-gray-400'}`}>{driver.position}</span>
                  </td>

                  {/* Grid / Change - Hide in Practice */}
                  {!isPractice && (
                    <td className="p-2 text-center">
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[9px] text-gray-600 font-mono">G{startPos}</span>
                            <div className={`flex items-center text-[10px] font-bold ${gainColor}`}>
                                <span>{gainIcon}</span>
                                <span>{Math.abs(posChange)}</span>
                            </div>
                        </div>
                    </td>
                  )}

                  {/* Driver Name + Penalties */}
                  <td className="p-2">
                     <div className="flex items-center gap-2">
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={`font-sans font-bold text-base tracking-wide uppercase truncate ${isSelected ? 'text-f1-red' : 'text-white'}`}>
                                    {driver.name_acronym}
                                </span>
                                {driver.penalties && driver.penalties.map((p, i) => (
                                    <span key={i} className="px-1 py-px bg-white text-black text-[9px] font-bold rounded flex items-center justify-center animate-pulse">
                                        {p}
                                    </span>
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono truncate hidden md:inline">{driver.last_name}</span>
                        </div>
                     </div>
                  </td>

                  {/* Team Name (Colored Text) - FUTURE PROOF */}
                  <td className="p-2">
                     <span 
                        className="font-rajdhani font-bold text-sm tracking-wide uppercase truncate block"
                        style={{ color: teamColor }}
                     >
                        {driver.team_name}
                     </span>
                  </td>

                  {/* 2026 Aero Status */}
                  <td className="p-2 text-center">
                     <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${driver.aero_status === 'X-MODE' ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-500'}`}>
                        {driver.aero_status === 'X-MODE' ? 'X' : 'Z'}
                     </div>
                  </td>

                  {/* 2026 MOM Status */}
                  <td className="p-2 text-center">
                     <div className={`w-3 h-3 rounded-full mx-auto ${driver.mom_status === 'ACTIVE' ? 'bg-f1-cyan animate-pulse shadow-[0_0_8px_#27F4D2]' : (driver.mom_status === 'READY' ? 'bg-f1-cyan/50' : 'bg-gray-800')}`} title="Manual Override Mode"></div>
                  </td>

                  {/* Dynamic Gap/Interval */}
                  <td className="p-2 text-right font-mono text-sm">
                    <span className={`font-bold ${!showGap ? 'text-f1-cyan' : 'text-white'}`}>{displayTime}</span>
                  </td>

                  {/* Tyre */}
                  <td className="p-2 flex justify-center items-center">
                     <div className="relative w-5 h-5 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-[2px]" style={{ borderColor: tyreInfo.ring }}></div>
                        <span className="text-[8px] font-bold relative z-10" style={{ color: tyreInfo.color }}>{tyreInfo.label}</span>
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
