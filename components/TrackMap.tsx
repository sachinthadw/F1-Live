
import React, { useEffect, useState, useMemo } from 'react';
import { Location, Session, Driver, DriverMapData, TrackStatus } from '../types';
import { getLaps, getSessionLocations } from '../services/openf1';

interface TrackMapProps {
  session: Session;
  drivers: Driver[];
  selectedDriver: number | null;
  onDriverSelect: (driverNumber: number) => void;
  driverLocations: DriverMapData[];
  trackStatus: TrackStatus;
}

export const TrackMap: React.FC<TrackMapProps> = ({ session, drivers, selectedDriver, onDriverSelect, driverLocations, trackStatus }) => {
  const [trackPath, setTrackPath] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the static track map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        const referenceDriver = drivers[0]; 
        if (!referenceDriver) {
            setIsLoading(false);
            return;
        }

        const laps = await getLaps(session.session_key, referenceDriver.driver_number);
        const validLap = laps.find(l => !l.is_pit_out_lap && l.lap_duration < 200); 
        
        if (validLap) {
            const start = new Date(validLap.date_start).toISOString();
            const end = new Date(new Date(validLap.date_start).getTime() + (validLap.lap_duration * 1000)).toISOString();
            const locations = await getSessionLocations(session.session_key, referenceDriver.driver_number);
            const lapLocations = locations.filter(l => l.date >= start && l.date <= end);
            setTrackPath(lapLocations.length > 0 ? lapLocations : locations.slice(0, 500)); 
        } else {
            setTrackPath([]);
        }
      } catch (e) {
        console.error("Failed to load track map", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (drivers.length > 0 && session.session_key) {
      initMap();
    }
  }, [session.session_key, drivers.length]); 

  // Memoize bounds and path data
  const mapData = useMemo(() => {
    let points: Location[] = trackPath;
    let isLiveBounds = false;

    if (trackPath.length === 0) {
        if (driverLocations.length === 0) return null;
        points = driverLocations.map(d => ({ x: d.x, y: d.y } as Location));
        isLiveBounds = true;
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = isLiveBounds ? 5000 : 2000;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const pathData = trackPath.map(p => {
      return `${p.x - minX + padding},${(maxY - p.y) + padding}`; 
    }).join(' ');

    return {
      pathData: pathData.length > 0 ? `M ${pathData}` : "",
      bounds: { minX, maxX, minY, maxY, width, height, padding }
    };
  }, [trackPath, driverLocations]);

  // Determine Overlay Styles based on Track Status (Non-disruptive)
  // We use gradients and borders instead of full block overlays
  let containerClass = "bg-[#15151E] border-white/10";
  let statusText = null;

  if (trackStatus === 'SC' || trackStatus === 'VSC') {
      containerClass = "bg-[#15151E] shadow-[inset_0_0_100px_rgba(234,179,8,0.2)] border-yellow-500/50 animate-pulse";
      statusText = (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-f1-yellow/90 text-black px-4 py-1 rounded font-black text-xl tracking-widest shadow-lg z-30 backdrop-blur-sm border border-black/20">
              {trackStatus === 'SC' ? 'SAFETY CAR' : 'VIRTUAL SC'}
          </div>
      );
  } else if (trackStatus === 'RED') {
      containerClass = "bg-[#15151E] shadow-[inset_0_0_100px_rgba(239,68,68,0.3)] border-red-600/50";
      statusText = (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-f1-red text-white px-6 py-3 rounded font-black text-4xl tracking-widest shadow-2xl z-30 border border-white/20 animate-pulse">
            RED FLAG
        </div>
      );
  } else if (trackStatus === 'CHEQUERED') {
      containerClass = "bg-[#15151E] border-white/10 overflow-hidden relative";
      // No text overlay for chequered, just the background effect
  }

  return (
    <div className={`w-full h-full relative overflow-hidden rounded-xl border flex items-center justify-center group transition-colors duration-700 ${containerClass}`}>
      
      {/* 1. Background Effects (Layer 0) */}
      <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none"></div>

      {/* Chequered Flag Animation Background */}
      {trackStatus === 'CHEQUERED' && (
         <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
              style={{
                  backgroundImage: `
                      linear-gradient(45deg, #ccc 25%, transparent 25%), 
                      linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #ccc 75%), 
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
                  backgroundSize: '40px 40px',
                  backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
              }}>
         </div>
      )}

      {/* 2. UI Status Labels (Layer 20 - Non blocking) */}
      {statusText}

      <div className="absolute top-4 left-4 z-20 bg-black/60 px-3 py-1 rounded backdrop-blur-md border border-white/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          LIVE TRACKER 
          <span className={`w-2 h-2 rounded-full 
             ${trackStatus === 'RED' ? 'bg-f1-red' : 
               (trackStatus === 'SC' || trackStatus === 'VSC' ? 'bg-f1-yellow' : 
               (trackStatus === 'CHEQUERED' ? 'bg-white' : 'bg-green-500 animate-pulse'))}
          `}></span>
        </h3>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20 text-[10px] text-gray-500 font-mono">
         OPENF1 SATELLITE FEED // {session.circuit_short_name?.toUpperCase()}
      </div>

      {/* 3. The Map (Layer 10 - Always Visible) */}
      {mapData ? (
        <div className="w-full h-full p-0 flex items-center justify-center relative z-10">
             <svg 
              viewBox={`0 0 ${mapData.bounds.width} ${mapData.bounds.height}`} 
              className="w-full h-full object-contain p-4 drop-shadow-2xl"
              style={{ overflow: 'visible' }}
            >
              {/* Main Track Line */}
              {mapData.pathData && (
                <>
                    {/* Glow effect for track */}
                    <path 
                        d={mapData.pathData} 
                        fill="none" 
                        stroke={
                            trackStatus === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 
                            (trackStatus === 'SC' || trackStatus === 'VSC' ? 'rgba(234, 179, 8, 0.2)' : 
                            'rgba(255,255,255,0.05)')
                        } 
                        strokeWidth="500" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-colors duration-700"
                    />
                    <path 
                        d={mapData.pathData} 
                        fill="none" 
                        stroke={
                            trackStatus === 'RED' ? '#ef4444' : 
                            (trackStatus === 'SC' || trackStatus === 'VSC' ? '#eab308' : 
                            '#38383F')
                        } 
                        strokeWidth="180" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="opacity-90 transition-colors duration-500"
                    />
                </>
              )}
              
              {/* Drivers */}
              {driverLocations.map((driver) => {
                const cx = driver.x - mapData.bounds.minX + mapData.bounds.padding;
                const cy = (mapData.bounds.maxY - driver.y) + mapData.bounds.padding;
                const isSelected = selectedDriver === driver.driver_number;
                
                return (
                  <g 
                    key={driver.driver_number} 
                    className="cursor-pointer transition-all duration-300 ease-linear hover:opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDriverSelect(driver.driver_number);
                    }}
                    style={{ opacity: selectedDriver ? (isSelected ? 1 : 0.3) : 1 }}
                  >
                    {/* Interaction Area (Invisible but clickable) */}
                    <circle cx={cx} cy={cy} r="400" fill="transparent" />

                    {/* Selected Highlight Ring */}
                    {isSelected && (
                         <circle cx={cx} cy={cy} r="250" fill="none" stroke="white" strokeWidth="20" className="animate-pulse opacity-50" />
                    )}

                    {/* Driver Dot */}
                    <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isSelected ? "140" : "110"} 
                        fill={driver.team_colour} 
                        stroke="#15151E" 
                        strokeWidth="20"
                        className="transition-all duration-300 shadow-lg"
                    />

                    {/* Driver Initials */}
                    <text 
                        x={cx} 
                        y={cy} 
                        fill={driver.team_colour === '#ffffff' ? '#15151E' : 'white'} 
                        fontSize={isSelected ? "90" : "70"} 
                        fontFamily="Rajdhani" 
                        fontWeight="bold"
                        dominantBaseline="central"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none' }}
                    >
                        {driver.acronym}
                    </text>
                  </g>
                );
              })}
            </svg>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500 gap-4 z-10">
             <div className="w-12 h-12 border-4 border-f1-red border-t-transparent rounded-full animate-spin"></div>
             <div className="font-mono text-sm animate-pulse">ACQUIRING TELEMETRY...</div>
        </div>
      )}
    </div>
  );
};
