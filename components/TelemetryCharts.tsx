
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CarData, Driver } from '../types';
import { getTelemetry, getLaps } from '../services/openf1';
import { TEAM_COLORS, DEFAULT_COLOR } from '../constants';

interface TelemetryChartsProps {
  sessionKey: number;
  driver: Driver | null;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ sessionKey, driver }) => {
  const [data, setData] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!driver || !sessionKey) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch a representative lap (e.g., their fastest or just a recent one)
        const laps = await getLaps(sessionKey, driver.driver_number);
        // Sort by lap duration to find fastest valid lap
        const fastestLap = laps
            .filter(l => l.lap_duration && l.lap_duration < 200) // Filter out anomalies
            .sort((a, b) => a.lap_duration - b.lap_duration)[0];

        if (fastestLap) {
          const telemetry = await getTelemetry(sessionKey, driver.driver_number, fastestLap.lap_number);
          // Downsample for performance if needed, but OpenF1 is usually okay for one lap
          setData(telemetry);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionKey, driver]);

  if (!driver) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 font-mono text-sm border border-white/10 rounded-xl bg-f1-dark/50">
        SELECT DRIVER FOR TELEMETRY
      </div>
    );
  }

  const teamColor = TEAM_COLORS[driver.team_name] || DEFAULT_COLOR;

  return (
    <div className="w-full h-full flex flex-col gap-4 bg-f1-dark/50 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-end border-b border-white/10 pb-2 mb-2">
        <div>
           <h3 className="text-lg font-sans font-bold text-white uppercase">{driver.name_acronym} <span className="text-f1-cyan text-sm">TELEMETRY</span></h3>
           <span className="text-xs text-gray-400 font-mono">FASTEST LAP TRACE</span>
        </div>
        <div className="text-right">
             <div className="text-xs text-gray-500">PACKET_LOSS: 0%</div>
             <div className="text-xs text-gray-500">SAMPLING: 20Hz</div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-f1-cyan animate-pulse font-mono">LOADING DATA STREAM...</div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Speed Chart */}
          <div className="flex-1 min-h-0">
            <div className="text-xs font-mono text-gray-400 mb-1">SPEED (KPH)</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={teamColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={teamColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <YAxis domain={[0, 360]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#15151e', borderColor: '#333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="speed" stroke={teamColor} fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Aero/RPM Chart */}
          <div className="flex-1 min-h-0">
            <div className="text-xs font-mono text-gray-400 mb-1">RPM / AERO PROFILE</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff1801" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff1801" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <YAxis domain={[0, 13000]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#15151e', borderColor: '#333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="rpm" stroke="#ff1801" fillOpacity={1} fill="url(#colorRpm)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
