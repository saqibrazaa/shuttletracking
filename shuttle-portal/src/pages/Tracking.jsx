import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Auto-Center Component
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

export default function Tracking() {
  const { logout } = useAuth();
  const { shuttles, emitLocation } = useTracking();
  const [selectedShuttleId, setSelectedShuttleId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const selectedShuttle = shuttles.find(s => s.id === selectedShuttleId) || shuttles[0];

  // Live Simulation for testing purposes
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      shuttles.forEach(s => {
        const moveData = {
          ...s,
          lat: s.lat + (Math.random() - 0.5) * 0.0004,
          lng: s.lng + (Math.random() - 0.5) * 0.0004,
          speed: Math.floor(20 + Math.random() * 30)
        };
        emitLocation(moveData);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, shuttles, emitLocation]);

  return (
    <div className="flex flex-col h-screen bg-background text-white overflow-hidden">
      {/* Premium Original Header */}
      <header className="bg-[#191c1e]/80 backdrop-blur-lg font-headline text-sm tracking-tight fixed top-0 z-50 flex justify-between items-center px-6 py-3 w-full shadow-xl shadow-blue-900/10 border-b border-white/5">
          <div className="flex items-center gap-8">
              <span className="text-xl font-bold bg-gradient-to-br from-[#b4c5ff] to-[#2563eb] bg-clip-text text-transparent italic">SHUTTLE TRACKING</span>
              <div className="hidden md:flex gap-6 items-center">
                  <Link to="/student/dashboard" className="text-slate-400 hover:text-white transition-colors">Overview</Link>
                  <Link to="/student/tracking" className="text-primary font-semibold px-3 py-1 rounded-lg">Live Map</Link>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isSimulating ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
              >
                  <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-secondary animate-ping' : 'bg-slate-600'}`}></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{isSimulating ? 'Simulating Traffic' : 'Start Simulation'}</span>
              </button>
              <button onClick={logout} className="p-2 text-slate-400 hover:bg-slate-800/50 rounded-full transition-colors">
                  <span className="material-symbols-outlined">logout</span>
              </button>
          </div>
      </header>

      <div className="flex flex-1 pt-16 relative">
          {/* Reverted Sidebar with Vertical Scroll Fix */}
          <aside className="w-80 h-[calc(100vh-64px)] p-4 fixed left-0 top-16 z-40 bg-[#101415]">
              <div className="bg-[#191c1e] rounded-3xl flex flex-col h-full p-4 border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">directions_bus</span>
                      </div>
                      <div>
                          <h3 className="text-lg font-extrabold text-white leading-tight">In Transit</h3>
                          <p className="text-xs text-slate-500">{shuttles.length} Active Nodes</p>
                      </div>
                  </div>
                  
                  {/* Fixed Scrollable Area */}
                  <div className="flex-1 overflow-y-auto px-2 space-y-2 py-4 scrollbar-thin scrollbar-thumb-white/10">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Operational Units</h4>
                      {shuttles.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => setSelectedShuttleId(s.id)}
                            className={`w-full group flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 border ${selectedShuttleId === s.id ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedShuttleId === s.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest'}`}>
                                <span className="material-symbols-outlined text-sm">airport_shuttle</span>
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className={`text-xs font-bold truncate ${selectedShuttleId === s.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>Shuttle Alpha-{s.id.slice(-2)}</p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">{s.route}</p>
                            </div>
                            {selectedShuttleId === s.id && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            )}
                        </button>
                      ))}
                      
                      {shuttles.length === 0 && (
                          <div className="py-20 text-center opacity-30">
                              <span className="material-symbols-outlined text-4xl mb-2">radar</span>
                              <p className="text-xs font-bold uppercase tracking-widest">No Active Units</p>
                          </div>
                      )}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                      <Link to="/student/dashboard" className="flex items-center gap-3 text-slate-500 py-3 px-4 hover:text-slate-300 hover:bg-white/5 transition-all duration-200 rounded-xl">
                          <span className="material-symbols-outlined">dashboard</span>
                          <span className="font-headline font-medium text-sm">Dashboard</span>
                      </Link>
                  </div>
              </div>
          </aside>

          {/* Main Content Area */}
          <main className="ml-80 flex-1 relative h-full">
              {/* Real Map Integration */}
              <div className="absolute inset-0 z-0">
                  <MapContainer 
                    id="live-tracking-map"
                    center={[shuttles[0]?.lat || 33.6844, shuttles[0]?.lng || 73.0479]} 
                    zoom={14} 
                    className="w-full h-full"
                    zoomControl={false}
                  >
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                      />
                      
                      {selectedShuttleId && <MapController center={[selectedShuttle.lat, selectedShuttle.lng]} />}

                      {shuttles.map(s => (
                          <Marker key={s.id} position={[s.lat, s.lng]}>
                              <Popup className="custom-popup">
                                  <div className="p-1">
                                      <p className="font-bold text-sm">Shuttle Alpha-{s.id.slice(-2)}</p>
                                      <p className="text-[10px] text-slate-600">Heading: {s.route}</p>
                                  </div>
                              </Popup>
                          </Marker>
                      ))}
                  </MapContainer>
              </div>

              {/* Fixed Right Detail Panel - The "Show all things under this panel" part */}
              <div className="absolute right-6 top-6 bottom-6 w-96 pointer-events-none z-10">
                  {selectedShuttle ? (
                    <div className="bg-[#121517]/95 glass-panel rounded-[32px] shadow-2xl flex flex-col h-full border border-white/5 pointer-events-auto animate-in slide-in-from-right duration-500 overflow-y-auto scrollbar-none">
                        <div className="p-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className={`px-3 py-1 text-[10px] font-black uppercase rounded-full flex items-center gap-2 w-fit mb-4 ${selectedShuttle.status === 'Active' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>
                                        <span className={`w-2 h-2 rounded-full ${selectedShuttle.status === 'Active' ? 'bg-secondary' : 'bg-error'} animate-pulse`}></span>
                                        System {selectedShuttle.status}
                                    </div>
                                    <h2 className="text-4xl font-headline font-black text-white tracking-tighter leading-none italic uppercase">
                                        ALPHA-{selectedShuttle.id.slice(-2)}
                                    </h2>
                                    <p className="text-primary text-xs font-bold uppercase tracking-widest mt-2">{selectedShuttle.route}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Velocity</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-headline font-black text-white">{selectedShuttle.speed}</span>
                                        <span className="text-[10px] font-bold text-slate-500">KM/H</span>
                                    </div>
                                </div>
                                <div className="flex flex-col border-l border-white/10 pl-6">
                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">ETA</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-headline font-black text-secondary">0{Math.floor(Math.random() * 8) + 2}</span>
                                        <span className="text-[10px] font-bold text-slate-500">MIN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 space-y-6 flex-1 pb-8">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Command Personnel</h4>
                                <div className="group bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-white text-3xl">person</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-headline font-black text-white text-lg italic tracking-tight">Saqib Raza</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Master Driver</p>
                                        </div>
                                        <button className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xl shadow-primary/30">
                                            <span className="material-symbols-outlined">call</span>
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Mission Path</h4>
                                <div className="relative space-y-10 pl-8">
                                    <div className="absolute left-3 top-3 bottom-0 w-[2px] bg-white/5">
                                        <div className="absolute top-0 w-full h-[60%] bg-gradient-to-b from-primary to-secondary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[1.65rem] top-1 w-6 h-6 rounded-full bg-secondary border-4 border-[#121517] flex items-center justify-center shadow-lg">
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Cleared</p>
                                            <p className="font-black text-white text-lg tracking-tight">Main Campus Gate</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[1.65rem] top-1 w-6 h-6 rounded-full bg-primary border-4 border-[#121517] flex items-center justify-center shadow-xl">
                                            <div className="w-2 h-2 rounded-full bg-white animate-spin"></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Approaching</p>
                                            <p className="font-black text-white text-xl tracking-tight italic">Science Complex</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                  ) : (
                    <div className="bg-[#121517]/95 glass-panel rounded-[32px] p-12 flex flex-col items-center justify-center text-center shadow-2xl border border-white/5 pointer-events-auto h-96">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-5xl text-primary animate-pulse">radar</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Sync Loss</h3>
                        <p className="text-slate-500 font-medium text-sm">Please select a fleet unit to establish telemetry.</p>
                    </div>
                  )}
              </div>
          </main>
      </div>
    </div>
  );
}
