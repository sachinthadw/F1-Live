
import React from 'react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    isForecast?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, isForecast }) => {
    if (!weather) {
        return (
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500 animate-pulse">
                <span>DETECTING ATMOSPHERICS...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            {isForecast && (
                <div className="hidden md:block text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/5 tracking-wider">
                    FORECAST
                </div>
            )}
            <div className="flex items-center gap-6 text-xs font-mono border border-white/10 rounded px-3 py-1 bg-black/20">
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-[9px] uppercase">AIR</span>
                    <span className="text-f1-cyan font-bold">{weather.air_temperature.toFixed(1)}°C</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-[9px] uppercase">TRACK</span>
                    <span className="text-f1-red font-bold">{weather.track_temperature.toFixed(1)}°C</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-[9px] uppercase">RH</span>
                    <span className="text-white font-bold">{weather.humidity.toFixed(0)}%</span>
                </div>
                <div className="hidden sm:flex flex-col items-center">
                    <span className="text-gray-500 text-[9px] uppercase">RAIN</span>
                    <span className={weather.rainfall > 0 ? "text-blue-400 animate-pulse font-bold" : "text-gray-400"}>
                        {weather.rainfall > 0 ? `${weather.rainfall}mm` : "NONE"}
                    </span>
                </div>
            </div>
        </div>
    );
};
