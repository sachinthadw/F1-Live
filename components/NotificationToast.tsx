
import React, { useEffect, useState } from 'react';
import { RaceControlMessage } from '../types';

interface NotificationToastProps {
    latestMessage: RaceControlMessage | null;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ latestMessage }) => {
    const [visible, setVisible] = useState(false);
    const [msg, setMsg] = useState<RaceControlMessage | null>(null);

    useEffect(() => {
        if (latestMessage) {
            setMsg(latestMessage);
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 6000); // Show for 6 seconds
            return () => clearTimeout(timer);
        }
    }, [latestMessage]);

    if (!visible || !msg) return null;

    const borderColor = msg.flag === 'RED' ? 'border-red-600' : (msg.flag === 'YELLOW' ? 'border-yellow-500' : 'border-f1-cyan');
    const title = msg.category || 'RACE CONTROL';

    return (
        <div className={`fixed top-24 right-8 z-50 max-w-md w-full bg-[#15151E] border-l-4 ${borderColor} shadow-2xl rounded-r-lg overflow-hidden transform transition-all duration-500 ease-out animate-slideIn`}>
            <div className="p-4 relative">
                <div className="absolute top-0 right-0 p-1 opacity-20 text-4xl font-bold italic font-sans text-gray-600">RC</div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-f1-red"></span>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
                    <span className="text-[10px] text-gray-600 font-mono ml-auto">{new Date(msg.date).toLocaleTimeString()}</span>
                </div>
                <p className="text-white font-bold font-sans text-lg uppercase leading-tight">
                    {msg.message}
                </p>
                {msg.lap_number && (
                    <div className="mt-2 text-xs font-mono text-f1-cyan">
                        LAP {msg.lap_number}
                    </div>
                )}
            </div>
            {/* Progress bar for timeout */}
            <div className="h-1 bg-white/10 w-full">
                <div className="h-full bg-white/50 w-full animate-progressOrigin"></div>
            </div>
        </div>
    );
};
