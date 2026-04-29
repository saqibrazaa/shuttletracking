import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import API_BASE_URL from '../config';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapEnhancements from '../components/MapSearch';
import LiveDriverMarkers from '../components/LiveDriverMarkers';



// Fix for default marker icon issue in React-Leaflet/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { shuttles, liveDrivers } = useTracking();
  const activeCount = shuttles.length + liveDrivers.length;

  const [activeTab, setActiveTab] = useState('Overview');
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Vehicle states
  const [vehicles, setVehicles] = useState([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ shuttleId: '', driverName: '', route: '', status: 'Active' });

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
  }, []);

  const fetchUsers = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/users`);
        const data = await res.json();
        setStudents(data.students || []);
        setDrivers(data.drivers || []);
        setLoading(false);
    } catch (err) {
        console.error('Error fetching users:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/vehicles`);
        const data = await res.json();
        setVehicles(data);
    } catch (err) {
        console.error('Error fetching vehicles:', err);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
        const url = editingVehicle 
            ? `${API_BASE_URL}/api/vehicles/${editingVehicle._id}` 
            : `${API_BASE_URL}/api/vehicles`;
        
        const method = editingVehicle ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleForm)
        });

        if (res.ok) {
            fetchVehicles();
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
            setVehicleForm({ shuttleId: '', driverName: '', route: '', status: 'Active' });
        } else {
            const data = await res.json();
            alert(data.msg || 'Error saving vehicle');
        }
    } catch (err) {
        console.error('Save vehicle error:', err);
        alert('An error occurred while saving the vehicle.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to delete the account for ${name}? This action cannot be undone.`)) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh the list locally
                setStudents(prev => prev.filter(u => u._id !== id));
                setDrivers(prev => prev.filter(u => u._id !== id));
            } else {
                alert(data.msg || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred while deleting the user.');
        }
    }
  };

  const getNavClass = (tabName) => {
    return activeTab === tabName 
        ? "flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-full font-body text-sm font-medium transition-all duration-300 ease-in-out cursor-pointer"
        : "flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-[#272a2c] hover:text-white rounded-full font-body text-sm font-medium transition-all duration-300 ease-in-out cursor-pointer";
  };

  const getProfileImageUrl = (path) => {
    if (!path) return null;
    return `${API_BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.cnic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUsersTable = (users, type) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
          <div>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Registered {type}</h2>
              <p className="text-on-surface-variant mt-2 font-medium">Manage and view all {type.toLowerCase()} currently in the system.</p>
          </div>
          <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder={`Search ${type.toLowerCase()}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container-low border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-primary/40 transition-all outline-none" 
              />
          </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-surface-container-high/50 text-on-surface-variant text-[10px] uppercase tracking-[0.2em]">
                      <th className="px-6 py-5 font-extrabold">Identity</th>
                      <th className="px-6 py-5 font-extrabold">{type === 'Students' ? 'Academic Info' : 'Professional Info'}</th>
                      <th className="px-6 py-5 font-extrabold">Contact Data</th>
                      <th className="px-6 py-5 font-extrabold">Joined At</th>
                      <th className="px-6 py-5 font-extrabold text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                  {users.length > 0 ? users.map(u => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                    <img src={getProfileImageUrl(u.profilePicture) || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-base leading-tight">{u.name}</p>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">{u.role}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {type === 'Students' ? (
                                <div className="space-y-1">
                                    <p className="text-white font-medium">{u.department || 'N/A'}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-slate-400">{u.semester || 'N/A'} Sem</span>
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-slate-400">{u.rollNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-white font-medium">
                                        <span className="material-symbols-outlined text-xs text-primary">directions_bus</span>
                                        {u.vehicleNumber || 'No Vehicle'}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter">CNIC: {u.cnic || 'N/A'}</p>
                                    <p className="text-[10px] text-slate-400">ID: {u.employeeId || 'N/A'}</p>
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="material-symbols-outlined text-xs">mail</span>
                                    <span className="text-xs truncate max-w-[150px]">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="material-symbols-outlined text-xs">call</span>
                                    <span className="text-xs">{u.phoneNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-mono text-[10px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    className="p-2 hover:bg-error/20 text-error rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                  )) : (
                      <tr>
                          <td colSpan="5" className="px-6 py-12 text-on-surface-variant text-center">
                              <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">search_off</span>
                              No {type.toLowerCase()} matching "{searchQuery}" found.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );

  const renderFleetView = () => (
    <div className="space-y-6 animate-fade-in fade-in-up">
      <div className="flex justify-between items-end mb-8">
          <div>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Fleet Management</h2>
              <p className="text-on-surface-variant mt-2 font-medium">Detailed roster of all monitored transit vehicles.</p>
          </div>
          <button 
              onClick={() => {
                  setEditingVehicle(null);
                  setVehicleForm({ shuttleId: '', driverName: '', route: '', status: 'Active' });
                  setIsVehicleModalOpen(true);
              }}
              className="bg-primary text-on-primary px-4 py-2 flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-sm">add</span>
              Register Vehicle
          </button>
      </div>

      <div className="bg-surface-container-low rounded-lg overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-widest">
                      <th className="px-6 py-4 font-bold">Shuttle ID</th>
                      <th className="px-6 py-4 font-bold">Driver Name</th>
                      <th className="px-6 py-4 font-bold">Assigned Route</th>
                      <th className="px-6 py-4 font-bold">Energy Grid</th>
                      <th className="px-6 py-4 font-bold">Health Status</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                  {vehicles.length > 0 ? vehicles.map(s => (
                    <tr key={s._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-primary flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm text-surface-variant">directions_bus</span>
                           {s.shuttleId.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-on-surface">{s.driverName}</td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">{s.route || "Unassigned"}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-secondary w-[88%]"></div>
                                </div>
                                <span className="text-xs font-mono">88%</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${s.status === 'Active' ? 'bg-secondary-container/10 text-secondary' : 'bg-surface-variant/20 text-on-surface-variant'}`}>
                                {s.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-on-surface-variant hover:text-primary transition-colors text-xs font-bold mr-3 opacity-0 group-hover:opacity-100">Ping</button>
                            <button 
                                onClick={() => {
                                    setEditingVehicle(s);
                                    setVehicleForm({ shuttleId: s.shuttleId, driverName: s.driverName, route: s.route, status: s.status });
                                    setIsVehicleModalOpen(true);
                                }}
                                className="text-on-surface-variant hover:text-primary transition-colors text-xs font-bold opacity-0 group-hover:opacity-100">
                                Config
                            </button>
                        </td>
                    </tr>
                  )) : (
                      <tr className="hover:bg-white/5 transition-colors">
                          <td colSpan="6" className="px-6 py-8 text-on-surface-variant text-center">No active vehicles found in transit network.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );

  const renderOverviewView = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">System Overview</h2>
              <p className="text-on-surface-variant mt-2 font-medium">Real-time performance metrics for Shuttle Tracking.</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary-container/20 text-secondary px-4 py-2 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Live Data Active
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-low p-6 rounded-3xl relative overflow-hidden group hover:bg-surface-container-high transition-all duration-300 shadow-xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-3 bg-primary-container/20 text-primary rounded-xl">group</span>
                  <span className="text-secondary text-xs font-bold">{students.length} Total</span>
              </div>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Registered Students</p>
              <h3 className="text-4xl font-extrabold mt-1">{students.length}</h3>
              <div className="mt-6 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[75%]"></div>
              </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl relative overflow-hidden group hover:bg-surface-container-high transition-all duration-300 shadow-xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-3 bg-tertiary-container/20 text-tertiary rounded-xl">badge</span>
                  <span className="text-on-surface-variant text-xs font-bold">{drivers.length} Active</span>
              </div>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Registered Drivers</p>
              <h3 className="text-4xl font-extrabold mt-1">{drivers.length}</h3>
              <div className="mt-6 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-[90%]"></div>
              </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl relative overflow-hidden group hover:bg-surface-container-high transition-all duration-300 shadow-xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-3 bg-secondary-container/20 text-secondary rounded-xl">airport_shuttle</span>
                  <span className="text-secondary text-xs font-bold">{activeCount} Alive</span>
              </div>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Live Shuttles</p>
              <h3 className="text-4xl font-extrabold mt-1">{activeCount}</h3>
              <div className="mt-6 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[40%]"></div>
              </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl relative overflow-hidden group hover:bg-surface-container-high transition-all duration-300 shadow-xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined p-3 bg-blue-600/20 text-blue-400 rounded-xl">verified_user</span>
                  <span className="text-secondary text-xs font-bold">Optimal</span>
              </div>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">System Health %</p>
              <h3 className="text-4xl font-extrabold mt-1">99.2%</h3>
              <div className="mt-6 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[99%]"></div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-2">
                  <h4 className="text-xl font-bold">Recent Registrations</h4>
                  <button onClick={() => setActiveTab('Students')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                      Manage Users <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
              </div>
              <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-surface-container-high/50 text-on-surface-variant text-[10px] uppercase tracking-[0.2em]">
                              <th className="px-6 py-4 font-extrabold">Name</th>
                              <th className="px-6 py-4 font-extrabold">Role</th>
                              <th className="px-6 py-4 font-extrabold">Email</th>
                              <th className="px-6 py-4 font-extrabold">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-white/5 font-medium">
                          {[...students, ...drivers].slice(0, 5).map(u => (
                            <tr key={u._id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                        <img src={getProfileImageUrl(u.profilePicture) || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" />
                                    </div>
                                    {u.name}
                                </td>
                                <td className="px-6 py-4 text-on-surface capitalize">{u.role}</td>
                                <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-secondary-container/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest">Verified</span>
                                </td>
                            </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="space-y-8">
              <div className="bg-surface-container-low rounded-3xl overflow-hidden flex flex-col h-[320px] shadow-2xl border border-white/5">
                  <div className="p-4 flex items-center justify-between bg-surface-container-high/30">
                      <h4 className="font-bold text-sm tracking-tight text-white italic">FLEET NODES LIVE</h4>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                        <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Syncing</span>
                      </div>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                      <MapContainer 
                        id="admin-fleet-map"
                        center={[33.6844, 73.0479]} 
                        zoom={12} 
                        className="w-full h-full"
                        zoomControl={false}
                      >
                          <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                            maxZoom={19}
                          />
                          {/* Landmark labels overlay */}
                          <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                            maxZoom={20}
                            opacity={0.7}
                          />
                          {shuttles.map(s => (
                              <Marker key={s.id} position={[s.lat, s.lng]}>
                                  <Popup>
                                      <div className="text-xs font-bold text-slate-900">Alpha-{s.id.slice(-2)}</div>
                                      <div className="text-[10px] text-slate-500">{s.route}</div>
                                  </Popup>
                              </Marker>
                          ))}
                          {/* Search + current location */}
                          <MapEnhancements />
                          {/* Live driver GPS markers */}
                          <LiveDriverMarkers />
                      </MapContainer>


                      <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-2">
                          <div className="glass-panel px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white border border-white/10 shadow-xl backdrop-blur-md">
                              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                              Global Coverage Active
                          </div>
                          {liveDrivers.length > 0 && (
                              <div className="glass-panel px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-blue-400 border border-blue-500/30 shadow-xl backdrop-blur-md bg-blue-600/10">
                                  <span style={{fontSize:'14px'}}>🚌</span>
                                  {liveDrivers.length} Live Driver{liveDrivers.length > 1 ? 's' : ''} Broadcasting
                              </div>
                          )}
                      </div>

                  </div>
              </div>
          </div>
      </div>
    </>
  );

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-[#191c1e] flex-col py-8 px-4 space-y-2 z-50 transition-all duration-300 ease-in-out shadow-2xl">
        <div className="px-4 mb-8">
            <h1 className="font-headline font-extrabold text-blue-500 text-xl tracking-tighter leading-tight">Shuttle Tracking<br/>Admin Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">Control Hub</p>
        </div>
        <nav className="flex-1 space-y-1">
            <div onClick={() => setActiveTab('Overview')} className={getNavClass('Overview')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>dashboard</span>
                <span>Command Hub</span>
            </div>
            <div onClick={() => setActiveTab('Students')} className={getNavClass('Students')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>group</span>
                <span>Student Roster</span>
            </div>
            <div onClick={() => setActiveTab('Drivers')} className={getNavClass('Drivers')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>badge</span>
                <span>Driver Fleet</span>
            </div>
            <div onClick={() => setActiveTab('Fleet')} className={getNavClass('Fleet')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>directions_bus</span>
                <span>Vehicle Nodes</span>
            </div>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-[#272a2c] hover:text-white rounded-full font-body text-sm font-medium transition-all duration-300 ease-in-out">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>logout</span>
                <span>Terminate Session</span>
            </button>
        </div>
      </aside>

      <main className="md:pl-64 min-h-screen">
          <header className="w-full h-16 sticky top-0 z-40 bg-[#101415]/80 backdrop-blur-lg flex justify-between items-center px-6 border-b border-white/5">
              <div className="flex items-center gap-6">
                  <div className="md:hidden">
                      <span className="material-symbols-outlined text-on-surface">menu</span>
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active View</p>
                      <h4 className="text-sm font-bold text-white tracking-tight">{activeTab} Interface</h4>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex flex-col items-right text-right mr-2">
                       <p className="text-xs font-bold text-white">Super Admin</p>
                       <p className="text-[10px] text-slate-500">Root Access</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-surface-container-high border border-white/10 shadow-lg">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmjvZaGmsWqQ7LFEg7-SsRB3q66aiEh8LGoBRGpJHX5jlW3fB-n5ekfsMxfBsryp-sgDWk-aNWskFJZCJE09Sm9mS-JF7ubbbVjUcHe6gSGCXpIzGpXHYXhQeMFcLDufas5T3hyn87Lyfvs1-3_fQ2JAC7IEenBxvuy07bB-N8qcb-BPlLngTC-8I3--QRBesPurdNASLzYhUbODPlzd6vHMFsTIN_b9jqyXWUvdwAGsJVbLvUyoj74ar_68Lz9TJlnIwLiDIU4mZt" alt="Admin" className="w-full h-full object-cover" />
                  </div>
              </div>
          </header>

          <div className="p-6 lg:p-10 space-y-10">
              {activeTab === 'Overview' && renderOverviewView()}
              {activeTab === 'Students' && renderUsersTable(filteredStudents, 'Students')}
              {activeTab === 'Drivers'  && renderUsersTable(filteredDrivers, 'Drivers')}
              {activeTab === 'Fleet'    && renderFleetView()}
          </div>
      </main>

      {/* Vehicle Registration / Edit Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-container-low w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/10 relative">
                <button 
                    onClick={() => setIsVehicleModalOpen(false)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                    {editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </h3>
                <p className="text-on-surface-variant text-sm mb-6">
                    {editingVehicle ? 'Modify details for the selected transit node.' : 'Add a new vehicle node to the fleet network.'}
                </p>

                <form onSubmit={handleSaveVehicle} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shuttle ID</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. alpha-05"
                            value={vehicleForm.shuttleId}
                            onChange={(e) => setVehicleForm({...vehicleForm, shuttleId: e.target.value})}
                            className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Driver Name</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Enter driver's name"
                            value={vehicleForm.driverName}
                            onChange={(e) => setVehicleForm({...vehicleForm, driverName: e.target.value})}
                            className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assigned Route</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. North Campus Route"
                            value={vehicleForm.route}
                            onChange={(e) => setVehicleForm({...vehicleForm, route: e.target.value})}
                            className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    {editingVehicle && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                            <select 
                                value={vehicleForm.status}
                                onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value})}
                                className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Delayed">Delayed</option>
                            </select>
                        </div>
                    )}
                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setIsVehicleModalOpen(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            {editingVehicle ? 'Save Changes' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
