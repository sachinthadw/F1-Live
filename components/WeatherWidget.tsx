
import React from 'react';
import { WeatherData } from '../types';
import { CloudRain, Thermometer, Wind, Droplets, CloudSun } from 'lucide-react';
import { motion } from 'motion/react';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    isForecast?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, isForecast }) => {
    if (!weather) {
        return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-f1-cyan)]/50 animate-pulse tracking-[0.2em]"
            >
                <CloudSun className="w-3 h-3" />
                <span>SCANNING ATMOSPHERICS...</span>
            </motion.div>
        );
    }

    return (
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
            {isForecast && (
                <div className="hidden md:flex items-center gap-1 text-[9px] font-bold font-mono bg-[var(--color-f1-cyan)]/10 border border-[var(--color-f1-cyan)]/30 text-[var(--color-f1-cyan)] px-2 py-0.5 tracking-widest uppercase">
                    FORECAST LINK
                </div>
            )}
            <div className="flex items-center gap-4 text-xs font-mono border-l-2 border-[var(--color-f1-cyan)] pl-3">
                <div className="flex flex-col items-start">
                    <span className="text-gray-500 text-[9px] uppercase tracking-widest flex items-center gap-1">AIR</span>
                    <span className="text-[var(--color-f1-cyan)] font-bold">{weather.air_temperature.toFixed(1)}°</span>
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-gray-500 text-[9px] uppercase tracking-widest flex items-center gap-1">TRK</span>
                    <span className="text-[#FF4444] font-bold">{weather.track_temperature.toFixed(1)}°</span>
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-gray-500 text-[9px] uppercase tracking-widest flex items-center gap-1">RH</span>
                    <span className="text-[var(--heading-color)] font-bold">{weather.humidity.toFixed(0)}%</span>
                </div>
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-gray-500 text-[9px] uppercase tracking-widest flex items-center gap-1">RAIN</span>
                    <span className={`font-bold ${weather.rainfall > 0 ? "text-[#00FFCC] animate-pulse" : "text-gray-400"}`}>
                        {weather.rainfall > 0 ? `YES` : "NO"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
