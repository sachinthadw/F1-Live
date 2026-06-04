import React from 'react';
import { DriverStanding } from '../types';
import { Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface TeammateComparisonProps {
    selectedDriver: number | null;
    standings: DriverStanding[];
}

export const TeammateComparison: React.FC<TeammateComparisonProps> = ({ selectedDriver, standings }) => {
    const driver = standings.find(d => d.driver_number === selectedDriver);
    if (!driver) return null;

    // Find Teammate
    const teammate = standings.find(d => d.team_name === driver.team_name && d.driver_number !== driver.driver_number);

    if (!teammate) return (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="h-full flex flex-col items-center justify-center text-[var(--color-f1-cyan)]/50 font-mono text-xs gap-3 tracking-[0.2em]"
         >
           <Users className="w-6 h-6 animate-pulse" />
           NO TEAMMATE FOUND
         </motion.div>
    );

    return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full flex flex-col p-3 relative overflow-hidden"
        >
             <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-2">
                <div className="flex flex-col">
                   <div className="text-xs font-mono text-[var(--color-f1-cyan)] tracking-widest mb-1">TEAM BATTLE</div>
                   <h3 className="text-lg font-mono font-bold text-[var(--heading-color)] uppercase tracking-wider flex items-center gap-2">
                     <Users className="w-4 h-4 text-[var(--color-f1-cyan)]" />
                     {driver.team_name}
                   </h3>
                </div>
                <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] font-mono text-[var(--color-f1-cyan)] animate-pulse flex items-center gap-1 border border-[var(--color-f1-cyan)]/30 px-1 py-0.5 bg-[var(--color-f1-cyan)]/10">
                       <Zap className="w-3 h-3" />
                       LIVE METRICS
                     </span>
                </div>
            </div>

            <div className="flex-1 flex gap-4 mt-2">
                {/* Visual Faceoff */}
                <div className="flex flex-col justify-around w-[40%] border-r border-[var(--border-subtle)] pr-4">
                     <div className="text-right">
                          <div className="text-3xl font-mono font-bold leading-none" style={{ color: `#${driver.team_colour}` }}>{driver.name_acronym}</div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">POS {driver.position}</div>
                     </div>
                     <div className="text-right text-[10px] font-mono text-[var(--color-f1-cyan)] tracking-widest my-2 opacity-50 border-y border-[var(--border-subtle)] py-1">VS</div>
                     <div className="text-right opacity-70">
                          <div className="text-xl font-mono font-bold text-[var(--heading-color)] leading-none">{teammate.name_acronym}</div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">POS {teammate.position}</div>
                     </div>
                </div>

                {/* Real Data Comparison */}
                <div className="flex-1 min-w-0 bg-[var(--card-bg-subtle)] backdrop-blur-sm border border-[var(--border-subtle)] relative rounded-lg p-3 hover:bg-[var(--panel-hover)] transition-all flex flex-col justify-center gap-3">
                    <div className="absolute top-1 right-2 text-[9px] font-mono text-[var(--text-muted)] z-10 text-right">RACE METRICS</div>
                    
                    <div className="flex flex-col gap-4 w-full mt-4 justify-center h-full">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-[var(--text-app)] w-10 text-right font-bold">{driver.grid_position || 'N/A'}</span>
                            <span className="text-[var(--text-muted)] text-[10px] tracking-widest mx-2">GRID</span>
                            <span className="text-[var(--text-app)] w-10 font-bold">{teammate.grid_position || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className={`w-10 text-right font-bold ${((driver.grid_position || driver.position) - driver.position) > 0 ? 'text-[#34C759]' : ((driver.grid_position || driver.position) - driver.position) < 0 ? 'text-[#FF3B30]' : 'text-[var(--text-app)]'}`}>{(driver.grid_position || driver.position) - driver.position > 0 ? '+' : ''}{(driver.grid_position || driver.position) - driver.position}</span>
                            <span className="text-[var(--text-muted)] text-[10px] tracking-widest mx-2 whitespace-nowrap">GAIN/LOSS</span>
                            <span className={`w-10 font-bold ${((teammate.grid_position || teammate.position) - teammate.position) > 0 ? 'text-[#34C759]' : ((teammate.grid_position || teammate.position) - teammate.position) < 0 ? 'text-[#FF3B30]' : 'text-[var(--text-app)]'}`}>{(teammate.grid_position || teammate.position) - teammate.position > 0 ? '+' : ''}{(teammate.grid_position || teammate.position) - teammate.position}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-[var(--text-app)] w-10 text-right truncate">{driver.interval || '-'}</span>
                            <span className="text-[var(--text-muted)] text-[10px] tracking-widest mx-2">INT</span>
                            <span className="text-[var(--text-app)] w-10 truncate">{teammate.interval || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
