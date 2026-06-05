import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Activity, Gauge, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { CarData, Driver } from '../types';
import { getTelemetry, getLaps, getLatestLap, getDriverLatestTelemetry } from '../services/openf1';

interface TelemetryChartsProps {
  sessionKey: number;
  driver: Driver | null;
  isLive?: boolean;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ sessionKey, driver, isLive }) => {
  const [data, setData] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!driver) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        if (isLive) {
            const telemetry = await getDriverLatestTelemetry(sessionKey, driver.driver_number, 60000);
            setData(telemetry);
        } else {
            let targetLapNumber: number | null = null;
            const laps = await getLaps(sessionKey, driver.driver_number);
            const fastestLap = laps
                .filter(l => l.lap_duration && l.lap_duration < 200)
                .sort((a, b) => a.lap_duration - b.lap_duration)[0];
            if (fastestLap) {
                targetLapNumber = fastestLap.lap_number;
            }

            if (targetLapNumber !== null) {
              const telemetry = await getTelemetry(sessionKey, driver.driver_number, targetLapNumber);
              setData(telemetry);
            }
        }
      } catch (err: any) {
        if (err.message !== "OPENF1_UNAUTHORIZED") {
            console.error("[Telemetry] Failed to fetch data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // In live mode, update frequently
    const interval = isLive ? setInterval(fetchData, 2000) : null;
    return () => { if(interval) clearInterval(interval); }

  }, [sessionKey, driver, isLive]);

  if (!driver) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center text-[var(--color-f1-cyan)]/50 font-mono text-xs gap-3 tracking-[0.2em]"
      >
        <Activity className="w-6 h-6 animate-pulse" />
        NO TARGET SELECTED
      </motion.div>
    );
  }

  const latest = data.length > 0 ? data[data.length - 1] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col p-3 relative overflow-hidden"
    >
      <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-2 mb-2 relative z-10">
        <div className="flex flex-col">
           <div className="text-xs font-mono text-[var(--color-f1-cyan)] tracking-widest mb-1">TELEMETRY LINE</div>
           <h3 className="text-lg font-mono font-bold text-[var(--heading-color)] uppercase tracking-wider flex items-center gap-2">
             <Activity className="w-4 h-4 text-[var(--color-f1-cyan)]" />
             {driver.name_acronym} <span className="opacity-50 text-xs font-normal">| #{driver.driver_number}</span>
           </h3>
        </div>
        <div className="text-right">
             <div className="text-2xl font-mono font-bold text-[var(--heading-color)] tabular-nums flex items-end justify-end gap-1 leading-none">
                {latest ? Math.round(latest.speed) : 0} 
                <span className="text-[10px] text-[var(--text-muted)] mb-0.5">KM/H</span>
             </div>
             <div className="flex justify-end gap-1 mt-2">
                  <span className="px-1.5 py-0.5 border border-[var(--border-subtle)] text-[var(--text-app)] text-[9px] font-mono font-bold flex items-center gap-1">
                    G<span className="text-[var(--color-f1-cyan)]">{latest?.n_gear || '-'}</span>
                  </span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold border flex items-center ${latest?.drs && latest.drs > 9 ? 'border-[var(--color-f1-cyan)] text-[var(--color-f1-cyan)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>DRS</span>
             </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-f1-cyan)]/50 animate-pulse font-mono text-xs tracking-widest gap-2">
          ESTABLISHING LINK...
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 min-h-0 relative z-10 mt-2">
          
          {/* Speed Trace */}
          <div className="flex-1 min-h-0 relative border border-[var(--border-subtle)] bg-[var(--card-bg-subtle)] backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="absolute top-1 left-2 text-[9px] font-medium text-[var(--text-muted)] z-10 tracking-widest">V-TRACE</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FFCC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
                <YAxis hide domain={[0, 360]} />
                <Area 
                    type="step" 
                    dataKey="speed" 
                    stroke="#00FFCC" 
                    strokeWidth={1.5}
                    fill="url(#gradSpeed)" 
                    isAnimationActive={false} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Throttle/Brake combo or RPM */}
          <div className="h-12 min-h-0 relative border border-[var(--border-subtle)] bg-[var(--card-bg-subtle)] backdrop-blur-sm mt-1 rounded-lg overflow-hidden">
             <div className="absolute top-1 left-2 text-[9px] font-medium text-[var(--text-muted)] z-10 flex gap-2 tracking-widest">
                 <span className="text-[#FF3B30]">RPM</span>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={[0, 15000]} />
                    <Area 
                        type="step" 
                        dataKey="rpm" 
                        stroke="#FF4444" 
                        strokeWidth={1}
                        fill="url(#gradRpm)" 
                        isAnimationActive={false} 
                    />
                </AreaChart>
             </ResponsiveContainer>
          </div>

        </div>
      )}
    </motion.div>
  );
};
