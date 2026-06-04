import React, { useEffect, useState } from 'react';
import { RaceControlMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Flag, Info, ShieldAlert } from 'lucide-react';

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

    const getIcon = (flag?: string, category?: string) => {
        if (flag === 'RED') return <ShieldAlert className="w-5 h-5 text-red-500" />;
        if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        if (flag === 'GREEN' || flag === 'CHEQUERED') return <Flag className="w-5 h-5 text-green-500" />;
        return <Info className="w-5 h-5 text-[var(--color-f1-cyan)]" />;
    };

    const title = msg?.category || 'RACE CONTROL';

    return (
        <AnimatePresence>
            {visible && msg && (
                <motion.div 
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`fixed top-24 right-8 z-50 max-w-md w-full bg-[var(--glass-bg)] backdrop-blur-[40px] border border-[var(--glass-border)] shadow-2xl rounded-2xl overflow-hidden`}
                >
                    <div className="p-4 relative">
                        <div className="absolute top-0 right-0 p-1 opacity-10 text-6xl font-black italic font-sans text-[var(--heading-color)] pointer-events-none">RC</div>
                        <div className="flex items-center gap-3 mb-2">
                            {getIcon(msg.flag, msg.category)}
                            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{title}</h4>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">{new Date(msg.date).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[var(--heading-color)] font-bold font-sans text-lg uppercase leading-tight pr-8">
                            {msg.message}
                        </p>
                        {msg.lap_number && (
                            <div className="mt-3 inline-block px-2 py-1 bg-[var(--card-bg-subtle)] rounded text-xs font-mono text-[var(--color-f1-cyan)] border border-[var(--border-subtle)]">
                                LAP {msg.lap_number}
                            </div>
                        )}
                    </div>
                    {/* Progress bar for timeout */}
                    <div className="h-1 bg-[var(--border-subtle)] w-full">
                        <motion.div 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="h-full bg-[var(--color-f1-cyan)]"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
