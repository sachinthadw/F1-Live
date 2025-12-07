import React from 'react';
import { RaceControlMessage } from '../types';

interface RaceControlProps {
  messages: RaceControlMessage[];
}

export const RaceControl: React.FC<RaceControlProps> = ({ messages }) => {
  return (
    <div className="h-full flex flex-col bg-f1-panel border border-white/10 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-white/10 bg-gradient-to-r from-f1-panel to-transparent flex justify-between items-center">
        <h2 className="text-lg font-sans font-bold text-white tracking-widest flex items-center gap-2">
           <span className="w-1.5 h-4 bg-f1-yellow"></span>
           RACE CONTROL
        </h2>
        <span className="animate-pulse w-2 h-2 rounded-full bg-f1-red"></span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
         {messages.length === 0 && <div className="text-xs text-gray-500 font-mono text-center mt-4">NO ACTIVE INCIDENTS</div>}
         
         {messages.slice().reverse().map((msg) => (
             <div key={msg.id} className="bg-black/30 border-l-2 border-f1-yellow p-2 rounded-r-md">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-mono text-gray-400">LAP {msg.lap_number} // {msg.date.split('T')[1].substring(0, 5)}</span>
                   {msg.flag && (
                      <span className={`text-[10px] font-bold px-1 rounded ${
                          msg.flag === 'GREEN' ? 'bg-green-500 text-black' : 
                          msg.flag === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                      }`}>
                          {msg.flag}
                      </span>
                   )}
                </div>
                <div className="text-xs font-mono text-white leading-tight">
                   {msg.message}
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};