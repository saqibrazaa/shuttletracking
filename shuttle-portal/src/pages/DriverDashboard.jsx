import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import { Bus, MapPin, Play, Square, Signal, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DriverDashboard() {
  const { logout, user } = useAuth();
  const { emitLocation } = useTracking();
  const [tripActive, setTripActive] = useState(false);
  const [currentLoc, setCurrentLoc] = useState({ lat: null, lng: null });
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState(null);

  const driverId = user?.id || 'demo-driver';
  const driverName = user?.name || 'Assigned Driver';
  const vehicleId = user?.vehicleNumber || 'ALPHA-LIVE';

  useEffect(() => {
    let watchId;

    if (tripActive) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed: geoSpeed } = position.coords;
            const newLoc = { 
                lat: latitude, 
                lng: longitude 
            };
            
            setCurrentLoc(newLoc);
            setSpeed(Math.round((geoSpeed || 0) * 3.6)); // Convert m/s to km/h
            setError(null);

            // Broadcast real-time location to all students/admins
            emitLocation({
              id: vehicleId.toLowerCase(),
              name: `Shuttle ${vehicleId}`,
              route: user?.assignedRoute || 'Active Patrol',
              lat: latitude,
              lng: longitude,
              speed: Math.round((geoSpeed || 0) * 3.6),
              status: 'Active',
              driverName: driverName
            });
          },
          (err) => {
            console.error("Geolocation Error:", err);
            setError("Unable to retrieve GPS. Ensure Location Services are ON.");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tripActive, driverId, vehicleId, driverName, emitLocation, user]);

  const toggleTrip = () => {
    setTripActive(!tripActive);
    if (tripActive) {
        // Reset location view when ending shift
        setCurrentLoc({ lat: null, lng: null });
    }
  };

  return (
    <div className="bg-[#0f1113] text-white font-body min-h-screen flex flex-col items-center">
      <header className="w-full h-20 bg-[#191c1e] border-b border-white/5 flex justify-between items-center px-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Bus size={24}/>
          </div>
          <div>
            <span className="font-headline font-black text-lg tracking-tighter uppercase">Transit Commander</span>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${tripActive ? 'bg-secondary animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tripActive ? 'Broadcasting Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right">
                <p className="text-sm font-black italic">{driverName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{vehicleId}</p>
            </div>
            <button onClick={logout} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <span className="material-symbols-outlined">logout</span>
            </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl p-6 lg:p-12 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-panel rounded-[2rem] p-10 flex flex-col items-center justify-center border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border-2 transition-all duration-700 ${tripActive ? 'bg-secondary/10 border-secondary text-secondary scale-110' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                    <Navigation size={56} className={tripActive ? 'animate-bounce' : ''}/>
                </div>

                <h3 className="font-headline text-4xl font-black tracking-tighter mb-2 italic">
                    {tripActive ? 'MISSION ACTIVE' : 'SYSTEM STANDBY'}
                </h3>
                <p className="text-slate-500 text-sm font-medium text-center max-w-xs mb-10">
                    {tripActive 
                      ? 'Telemetry is currently being streamed to the global satellite network.' 
                      : 'Connect to the satellite grid to begin broadcasting your position.'}
                </p>

                {error && (
                    <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {error}
                    </div>
                )}

                <button 
                    className={`w-full max-w-sm py-5 rounded-2xl font-headline font-black text-lg tracking-tighter italic uppercase flex justify-center items-center gap-3 shadow-2xl transition-all active:scale-95 ${tripActive ? 'bg-error text-white shadow-error/30' : 'bg-gradient-to-r from-secondary to-[#00a86b] text-white shadow-secondary/30'}`}
                    onClick={toggleTrip}
                >
                    {tripActive ? <><Square fill="currentColor"/> ABORT MISSION</> : <><Play fill="currentColor"/> INITIALIZE TRACKING</>}
                </button>
            </div>

            <div className="space-y-6">
                <div className="bg-[#191c1e] p-8 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Live Telemetry</p>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-400 font-bold mb-1">Instant Speed</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-headline font-black italic">{tripActive ? speed : '--'}</span>
                                <span className="text-sm font-bold text-slate-500 uppercase">km/h</span>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                            <p className="text-xs text-slate-400 font-bold mb-1">Link Status</p>
                            <div className="flex items-center gap-2">
                                <Signal size={16} className={tripActive ? 'text-secondary' : 'text-slate-600'}/>
                                <span className={`text-xs font-black uppercase tracking-widest ${tripActive ? 'text-white' : 'text-slate-600'}`}>
                                    {tripActive ? 'Cryptographic Sync' : 'Link Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#191c1e] p-8 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Coordinates</p>
                    <div className="space-y-3 font-mono text-xs">
                         <div className="flex justify-between">
                            <span className="text-slate-500">Latitude:</span>
                            <span className="text-white font-bold">{currentLoc.lat ? currentLoc.lat.toFixed(6) : '0.000000'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Longitude:</span>
                            <span className="text-white font-bold">{currentLoc.lng ? currentLoc.lng.toFixed(6) : '0.000000'}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
