import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Location, Session, Driver, DriverMapData, TrackStatus } from '../types';
import { getLaps, getSessionLocations } from '../services/openf1';
import { motion } from 'motion/react';
import { Map, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

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

  // Animation State
  const [viewBoxStr, setViewBoxStr] = useState<string | null>(null);
  const currentViewBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const initialized = useRef(false);
  const animationRef = useRef<number | null>(null);

  // Initialize the static track map
  useEffect(() => {
    let cancelled = false;

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
        
        if (validLap && !cancelled) {
            const start = new Date(validLap.date_start).toISOString();
            const end = new Date(new Date(validLap.date_start).getTime() + (validLap.lap_duration * 1000)).toISOString();
            const locations = await getSessionLocations(session.session_key, referenceDriver.driver_number);
            const lapLocations = locations.filter(l => l.date >= start && l.date <= end);
            if (!cancelled) {
                setTrackPath(lapLocations.length > 0 ? lapLocations : locations.slice(0, 500)); 
            }
        } else if (!cancelled) {
            setTrackPath([]);
        }
      } catch (e) {
        console.error("Failed to load track map", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (drivers.length > 0 && session.session_key) {
      initMap();
    }

    return () => { cancelled = true; };
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

  // Smooth ViewBox Animation Logic — fixed memory leak
  useEffect(() => {
    if (!mapData) return;

    // Cancel any existing animation before starting a new one
    if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
    }

    let target = { x: 0, y: 0, w: mapData.bounds.width, h: mapData.bounds.height };

    if (selectedDriver) {
        const driver = driverLocations.find(d => d.driver_number === selectedDriver);
        if (driver) {
            const cx = driver.x - mapData.bounds.minX + mapData.bounds.padding;
            const cy = (mapData.bounds.maxY - driver.y) + mapData.bounds.padding;
            
            // Zoom Factor (View 40% of track when selected)
            const zoomRatio = 0.4; 
            const w = mapData.bounds.width * zoomRatio;
            const h = mapData.bounds.height * zoomRatio;
            
            target = { 
                x: cx - w / 2, 
                y: cy - h / 2, 
                w, 
                h 
            };
        }
    }

    // Initialize immediately if first run to prevent jump
    if (!initialized.current) {
        currentViewBox.current = target;
        setViewBoxStr(`${target.x} ${target.y} ${target.w} ${target.h}`);
        initialized.current = true;
        return;
    }

    const animate = () => {
        const current = currentViewBox.current;
        const ease = 0.1; // Smoothing factor

        // Linear Interpolation (Lerp)
        const nx = current.x + (target.x - current.x) * ease;
        const ny = current.y + (target.y - current.y) * ease;
        const nw = current.w + (target.w - current.w) * ease;
        const nh = current.h + (target.h - current.h) * ease;

        // Check if movement is significant enough to continue rendering
        if (Math.abs(nx - target.x) > 1 || Math.abs(nw - target.w) > 1) {
            currentViewBox.current = { x: nx, y: ny, w: nw, h: nh };
            setViewBoxStr(`${nx} ${ny} ${nw} ${nh}`);
            animationRef.current = requestAnimationFrame(animate);
        } else {
             // Snap to target to stop loop
             currentViewBox.current = target;
             setViewBoxStr(`${target.x} ${target.y} ${target.w} ${target.h}`);
             animationRef.current = null;
        }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };
  }, [mapData, selectedDriver, driverLocations]);

  // Determine Overlay Styles based on Track Status (Non-disruptive)
  let containerClass = "bg-transparent border-[var(--border-subtle)]";
  let statusText = null;

  if (trackStatus === 'SC' || trackStatus === 'VSC') {
      containerClass = "bg-transparent border-[#FFD500]/50 shadow-[inset_0_0_50px_rgba(255,213,0,0.1)]";
      statusText = (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#FFD500]/10 text-[#FFD500] px-4 py-1 border border-[#FFD500] flex items-center gap-2 z-30 font-mono tracking-widest text-sm"
            role="alert"
          >
              <AlertTriangle className="w-4 h-4" />
              {trackStatus === 'SC' ? 'SAFETY CAR' : 'VIRTUAL SC'}
          </motion.div>
      );
  } else if (trackStatus === 'RED') {
      containerClass = "bg-transparent shadow-[inset_0_0_50px_rgba(255,68,68,0.15)] border-[#FF4444]/50";
      statusText = (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF4444]/10 text-[#FF4444] px-6 py-2 border border-[#FF4444] font-mono font-bold text-xl tracking-[0.2em] z-30 flex items-center gap-3 backdrop-blur-sm"
            role="alert"
        >
            <ShieldAlert className="w-6 h-6" />
            RED FLAG
        </motion.div>
      );
  }

  return (
    <div 
      className={`w-full h-full relative overflow-hidden border flex items-center justify-center group transition-colors duration-700 ${containerClass}`}
      role="img"
      aria-label={`Track map of ${session.circuit_short_name || 'circuit'} showing live driver positions`}
    >
      
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

      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-[var(--card-bg-subtle)] backdrop-blur-md rounded-full border border-[var(--border-subtle)] flex items-center gap-2 shadow-sm">
        <Map className="w-3.5 h-3.5 text-[var(--heading-color)]" />
        <h3 className="text-[11px] font-medium tracking-wide text-[var(--heading-color)]">
          <span className="opacity-70">Track //</span> {session.circuit_short_name?.substring(0, 3).toUpperCase() || 'TRK'}
        </h3>
        <div className={`w-2 h-2 ml-1 rounded-full 
             ${trackStatus === 'RED' ? 'bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.8)]' : 
               (trackStatus === 'SC' || trackStatus === 'VSC' ? 'bg-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.8)]' : 
               (trackStatus === 'CHEQUERED' ? 'bg-[var(--heading-color)]' : 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse'))}
          `}></div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20 text-[10px] text-[var(--text-muted)] opacity-80 font-medium tracking-wide text-right leading-tight">
         {session.country_name?.toUpperCase()}<br/>
         <span className="text-[var(--color-f1-cyan)]">DATA LINK ACTIVE</span>
      </div>

      {/* 3. The Map (Layer 10 - Always Visible) */}
      {mapData ? (
        <div className="w-full h-full p-0 flex items-center justify-center relative z-10">
             <svg 
              viewBox={viewBoxStr || `0 0 ${mapData.bounds.width} ${mapData.bounds.height}`} 
              className="w-full h-full object-contain p-4 drop-shadow-2xl"
              style={{ overflow: 'visible' }}
              aria-hidden="true"
            >
              <defs>
                  {/* Glow filter for selected driver */}
                  <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur" />
                      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.99 0 0 0 0 0.94  0 0 0 1 0" />
                      <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                      </feMerge>
                  </filter>
              </defs>

              {/* Main Track Line */}
              {mapData.pathData && (
                <>
                    {/* Glow effect for track */}
                    <path 
                        d={mapData.pathData} 
                        fill="none" 
                        stroke={
                            trackStatus === 'RED' ? 'rgba(255, 68, 68, 0.1)' : 
                            (trackStatus === 'SC' || trackStatus === 'VSC' ? 'rgba(255, 213, 0, 0.1)' : 
                            'rgba(0, 255, 204, 0.05)')
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
                            trackStatus === 'RED' ? 'rgba(255,68,68,0.5)' : 
                            (trackStatus === 'SC' || trackStatus === 'VSC' ? 'rgba(255,213,0,0.5)' : 
                            'var(--border-subtle)')
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

                    {/* Selected Highlight Visuals */}
                    {isSelected && (
                        <>
                             {/* Pulsing Radar Ring */}
                             <circle cx={cx} cy={cy} r="400" fill="none" stroke="#00FFCC" strokeWidth="15" className="animate-ping opacity-50" />
                             {/* Crosshair Lines */}
                             <line x1={cx - 600} y1={cy} x2={cx + 600} y2={cy} stroke="#00FFCC" strokeWidth="8" opacity="0.4" />
                             <line x1={cx} y1={cy - 600} x2={cx} y2={cy + 600} stroke="#00FFCC" strokeWidth="8" opacity="0.4" />
                        </>
                    )}

                    {/* Driver Dot */}
                    <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isSelected ? "140" : "110"} 
                        fill={driver.team_colour} 
                        stroke={isSelected ? "#00FFCC" : "#000"} 
                        strokeWidth={isSelected ? "30" : "20"}
                        className="transition-all duration-300 shadow-lg"
                        filter={isSelected ? "url(#glow-selected)" : ""}
                    />

                    {/* Driver Initials */}
                    <text 
                        x={cx} 
                        y={cy} 
                        fill={driver.team_colour === '#ffffff' ? '#000' : 'white'} 
                        fontSize={isSelected ? "90" : "70"} 
                        fontFamily="monospace" 
                        fontWeight="bold"
                        dominantBaseline="central"
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', letterSpacing: '-2px' }}
                    >
                        {driver.acronym}
                    </text>
                  </g>
                );
              })}
            </svg>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-[var(--color-f1-cyan)] gap-4 z-10 w-full h-full bg-transparent">
             <Loader2 className="w-8 h-8 animate-spin opacity-50" />
             <div className="font-mono text-[10px] animate-pulse tracking-[0.2em] opacity-80">CALIBRATING GPS...</div>
        </div>
      )}
    </div>
  );
};
