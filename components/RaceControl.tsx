import React from 'react';
import { RaceControlMessage } from '../types';
import { AlertTriangle, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RaceControlProps {
  messages: RaceControlMessage[];
}

export const RaceControl: React.FC<RaceControlProps> = ({ messages }) => {
  return (
    <div className="h-full flex flex-col w-full relative">
      <div className="px-4 py-3 bg-[var(--card-bg-subtle)] backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold tracking-widest text-[#FFCC00] flex items-center gap-2">
            <AlertTriangle size={14} />
            RACE CONTROL
        </h2>
        <span className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,59,48,0.8)]"></span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-transparent" aria-live="polite" aria-label="Race control messages">
         {messages.length === 0 && <div className="text-xs text-gray-500 font-medium text-center mt-4 tracking-widest">NO INCIDENTS</div>}
         
         <AnimatePresence initial={false}>
            {messages.slice(-20).reverse().map((msg, idx) => (
                <motion.div 
                  key={msg.id ?? `${msg.date}-${idx}`} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-[3px] border-[#FFCC00] bg-[var(--card-bg-subtle)] backdrop-blur-sm p-3 rounded-r-lg flex flex-col shadow-sm border border-[var(--border-subtle)] border-l-0"
                >
                   <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-wider">
                          L{msg.lap_number || '?'} <span className="opacity-50">/</span> {new Date(msg.date).toLocaleTimeString('en-GB', {timeZone: 'UTC'})}
                      </span>
                      {msg.flag && (
                         <span className={`text-[8px] font-mono tracking-widest font-bold px-1 py-px border flex items-center gap-1 ${
                             msg.flag === 'GREEN' ? 'border-green-500 text-green-500' : 
                             msg.flag === 'YELLOW' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'
                         }`}>
                             {msg.flag}
                         </span>
                      )}
                   </div>
                   <div className="text-xs font-mono text-[var(--text-app)] leading-snug">
                      {msg.message}
                   </div>
                </motion.div>
            ))}
         </AnimatePresence>
      </div>
    </div>
  );
};
