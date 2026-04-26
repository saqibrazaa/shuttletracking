import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const { shuttles } = useTracking();
  const activeCount = shuttles.length;
  const [activeTab, setActiveTab] = useState('Overview');
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
        const res = await fetch('http://localhost:5000/api/auth/users');
        const data = await res.json();
        setStudents(data.students || []);
        setDrivers(data.drivers || []);
        setLoading(false);
    } catch (err) {
        console.error('Error fetching users:', err);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to delete the account for ${name}? This action cannot be undone.`)) {
        try {
            const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
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
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
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
          <button className="bg-primary text-on-primary px-4 py-2 flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
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
                  {shuttles.length > 0 ? shuttles.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-primary flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm text-surface-variant">directions_bus</span>
                           {s.id.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-on-surface">System Default</td>
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
                            <button className="text-on-surface-variant hover:text-primary transition-colors text-xs font-bold opacity-0 group-hover:opacity-100">Config</button>
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
                          />
                          {shuttles.map(s => (
                              <Marker key={s.id} position={[s.lat, s.lng]}>
                                  <Popup>
                                      <div className="text-xs font-bold text-slate-900">Alpha-{s.id.slice(-2)}</div>
                                      <div className="text-[10px] text-slate-500">{s.route}</div>
                                  </Popup>
                              </Marker>
                          ))}
                      </MapContainer>
                      <div className="absolute bottom-4 left-4 z-[400] glass-panel px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white border border-white/10 shadow-xl backdrop-blur-md">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                          Global Coverage Active
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
    </div>
  );
}
