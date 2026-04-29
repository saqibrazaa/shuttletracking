import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import API_BASE_URL from '../config';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapEnhancements, { MapController } from '../components/MapSearch';
import LiveDriverMarkers from '../components/LiveDriverMarkers';
import { useMemo } from 'react';



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

export default function StudentDashboard() {
  const { user, logout, updateProfile } = useAuth();
  const { shuttles, liveDrivers } = useTracking();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });
  const [newImage, setNewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  // Selected vehicle in the Overview panel
  const [overviewSelectedId, setOverviewSelectedId] = useState(null);
  const [registeredVehicles, setRegisteredVehicles] = useState([]);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);

  // Memoized list of all vehicles (live + registered)
  const allVehicles = useMemo(() => {
    const dummyLocs = [
      { lat: 33.6844, lng: 73.0479, speed: 45 },
      { lat: 33.6946, lng: 73.0583, speed: 38 },
      { lat: 33.7050, lng: 73.0691, speed: 12 },
      { lat: 33.6740, lng: 73.0370, speed: 28 },
      { lat: 33.6800, lng: 73.0500, speed: 20 },
    ];

    return [
      ...liveDrivers.map(d => ({
        id: d.id,
        name: d.name || `Shuttle ${d.id?.toUpperCase()}`,
        route: d.route || 'Active Patrol',
        lat: d.lat,
        lng: d.lng,
        speed: d.speed || 0,
        status: 'Active',
        driverName: d.driverName,
        isLive: true,
        lastSeen: d.lastSeen,
      })),
      ...registeredVehicles.map((v, i) => {
          const loc = dummyLocs[i % dummyLocs.length];
          return {
              id: v.shuttleId,
              name: `Shuttle ${v.shuttleId.toUpperCase()}`,
              route: v.route,
              lat: loc.lat,
              lng: loc.lng,
              speed: loc.speed,
              status: v.status,
              driverName: v.driverName,
              isLive: false,
          };
      }),
    ];
  }, [liveDrivers, registeredVehicles]);

  const selectedVehicle = useMemo(() => {
    return allVehicles.find(v => v.id === overviewSelectedId) || allVehicles[0];
  }, [allVehicles, overviewSelectedId]);

  // Update map target when selection changes
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.lat && selectedVehicle.lng) {
      setMapTarget([selectedVehicle.lat, selectedVehicle.lng]);
    }
  }, [overviewSelectedId]);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const generateCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setNewImage(croppedImage);
      setImageToCrop(null); // Close cropper
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVehicles = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/vehicles`);
        const data = await res.json();
        setRegisteredVehicles(data);
    } catch (err) {
        console.error('Error fetching vehicles:', err);
    }
  };

  // Sync editData when user updates
  useEffect(() => {
    setEditData({ ...user });
    fetchVehicles();
  }, [user]);

  const getProfileImageUrl = (path) => {
    if (!path) return null;
    return `${API_BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
        const data = new FormData();
        // Explicitly append all fields to ensure they are sent correctly
        data.append('name', editData.name || '');
        data.append('fatherName', editData.fatherName || '');
        data.append('department', editData.department || '');
        data.append('semester', editData.semester || '');
        data.append('rollNumber', editData.rollNumber || '');
        data.append('phoneNumber', editData.phoneNumber || '');
        data.append('dob', editData.dob || '');

        if (newImage) {
            data.append('profilePicture', newImage);
        }

        const result = await updateProfile(user.id, data);
        if (result.success) {
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            setNewImage(null);
            setTimeout(() => setMessage(''), 5000);
        } else {
            console.error('Update Failed:', result.msg);
            setMessage(`Update failed: ${result.msg}`);
        }
    } catch (err) {
        console.error('Submit Error:', err);
        setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const renderProfileView = () => (
    <section className="flex-grow h-full p-8 md:p-12 overflow-y-auto bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div className="flex items-center gap-6">
                    <div 
                        onClick={() => !isEditing && setShowFullImage(true)}
                        className={`w-36 h-36 rounded-3xl overflow-hidden shadow-2xl border-4 border-primary/20 relative group ${!isEditing ? 'cursor-pointer' : ''}`}
                    >
                        <img 
                            src={newImage ? URL.createObjectURL(newImage) : getProfileImageUrl(user.profilePicture) || 'https://via.placeholder.com/150'} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="material-symbols-outlined text-white text-3xl mb-1">add_a_photo</span>
                                <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Change</span>
                            </div>
                        )}
                        {isEditing && (
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange} 
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            />
                        )}
                    </div>
                    <div>
                        <h2 className="text-4xl font-headline font-extrabold text-white tracking-tighter">{user.name}</h2>
                        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mt-1">{user.role} Identity</p>
                        <div className="flex gap-2 mt-4">
                            <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase">{user.department || 'No Dept'}</span>
                            <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase">{user.semester || 'N/A'} Sem</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-surface-container-low w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-white font-bold tracking-tight">Crop Profile Picture</h3>
                            <button onClick={() => setImageToCrop(null)} className="text-on-surface-variant hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        
                        <div className="relative flex-grow bg-black/40">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-6 bg-surface-container-low space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                    <span>Zoom level</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={generateCroppedImage}
                                    className="flex-grow bg-primary text-on-primary py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Apply Crop
                                </button>
                                <button 
                                    onClick={() => setImageToCrop(null)}
                                    className="px-6 py-3 rounded-xl bg-surface-container-high text-white font-bold hover:bg-surface-bright transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-3xl mb-8">
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-6 py-2 rounded-xl font-bold flex gap-2 items-center transition-all shadow-lg"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <span className="bg-secondary/20 text-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm animate-pulse">edit_note</span>
                                Editing Mode
                             </span>
                        </div>
                    )}
                    
                    {message && (
                        <div className={`p-2 px-4 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest ${message.includes('Error') ? 'bg-error-container/20 text-error' : 'bg-secondary-container/20 text-secondary'}`}>
                            <span className="material-symbols-outlined text-xs">{message.includes('Error') ? 'error' : 'check_circle'}</span>
                            {message}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-2">Account Meta</p>
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-[10px] text-on-surface-variant uppercase mb-1">User ID</p>
                            <p className="text-xs font-mono text-white">{user.id}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-[10px] text-on-surface-variant uppercase mb-1">Email</p>
                            <p className="text-xs text-white truncate">{user.email}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <form onSubmit={handleUpdateSubmit} className="bg-surface-container-low rounded-3xl p-8 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Full Name</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.name}
                                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Father's Name</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.fatherName}
                                    onChange={(e) => setEditData({...editData, fatherName: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Department</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.department}
                                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Semester</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.semester}
                                    onChange={(e) => setEditData({...editData, semester: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Roll Number</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.rollNumber}
                                    onChange={(e) => setEditData({...editData, rollNumber: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Phone Number</label>
                                <input 
                                    disabled={!isEditing}
                                    value={editData.phoneNumber}
                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                    className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-10 flex gap-4">
                                <button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => { setIsEditing(false); setEditData(user); setNewImage(null); }} className="px-6 py-3 rounded-xl bg-surface-container-high text-white font-bold hover:bg-surface-bright transition-colors">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    </section>
  );

  const renderOverview = () => {
    const [selectedId, setSelectedId] = [overviewSelectedId, setOverviewSelectedId];
    const selected = selectedVehicle;
    const hasLive = liveDrivers.length > 0;

    return (
      <>
        {/* ── Left panel ─────────────────────────────────────── */}
        <section className="w-[380px] shrink-0 h-full flex flex-col overflow-hidden bg-[#101415]/80 backdrop-blur-md border-r border-white/5 z-10">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-headline font-extrabold tracking-tight text-white">Live Monitoring</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {allVehicles.length} vehicle{allVehicles.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
            {hasLive && (
              <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live GPS</span>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{scrollbarWidth:'none'}}>

            {/* ── Selected vehicle hero card ── */}
            {selected ? (
              <div className="bg-[#191c1e] rounded-2xl p-5 relative overflow-hidden border border-white/5 shadow-xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/8 blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>

                {/* Status + name */}
                <div className="flex justify-between items-start mb-5 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${selected.isLive ? 'bg-blue-400 animate-ping' : 'bg-secondary animate-pulse'}`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selected.isLive ? 'text-blue-400' : 'text-secondary'}`}>
                        {selected.isLive ? '🔴 Live GPS' : 'In Transit'}
                      </span>
                    </div>
                    <h2 className="text-lg font-headline font-bold text-white leading-tight">{selected.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selected.route}</p>
                    {selected.driverName && (
                      <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wide">
                        👤 {selected.driverName}
                      </p>
                    )}
                  </div>
                  <div className="bg-[#101415] px-3 py-1.5 rounded-full border border-white/8 shrink-0">
                    <span className="text-xs font-bold text-primary font-mono">#{selected.id?.toUpperCase().slice(0,7)}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="bg-[#101415] p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Current Speed</p>
                    <p className="text-2xl font-headline font-extrabold text-white leading-none">
                      {selected.speed || 0}
                      <span className="text-xs font-normal text-slate-500 ml-1">km/h</span>
                    </p>
                    <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, ((selected.speed || 0) / 80) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-[#101415] p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Status</p>
                    <p className={`text-sm font-black uppercase tracking-wide mt-1 ${selected.status === 'Active' ? 'text-secondary' : selected.status === 'Delayed' ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {selected.status || 'Active'}
                    </p>
                    {selected.isLive && selected.lastSeen && (
                      <p className="text-[9px] text-slate-600 mt-1">
                        Updated {Math.round((Date.now() - selected.lastSeen) / 1000)}s ago
                      </p>
                    )}
                    {!selected.isLive && (
                      <p className="text-[9px] text-slate-600 mt-1">Simulation mode</p>
                    )}
                  </div>
                  {selected.lat && selected.lng && (
                    <div className="col-span-2 bg-[#101415] p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">📍 Coordinates</p>
                      <p className="text-xs font-mono text-slate-300">
                        {selected.lat?.toFixed(5)}, {selected.lng?.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#191c1e] rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-white/5">
                <span className="text-4xl mb-3">🚌</span>
                <p className="text-sm font-bold text-slate-400">No vehicles online</p>
                <p className="text-[10px] text-slate-600 mt-1">Drivers must start their trip to appear here</p>
              </div>
            )}

            {/* ── Vehicle Picker ── */}
            {allVehicles.length > 0 && (
              <div className="bg-[#191c1e] rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">All Vehicles</p>
                <div className="space-y-2">
                  {allVehicles.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border text-left
                        ${selectedId === v.id || (!selectedId && v.id === allVehicles[0]?.id)
                          ? 'bg-primary/15 border-primary/30 shadow-lg'
                          : 'bg-white/3 border-transparent hover:bg-white/6 hover:border-white/8'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0
                        ${v.isLive ? 'bg-blue-600/20' : 'bg-surface-container-high'}`}>
                        🚌
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{v.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{v.route}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase
                          ${v.isLive ? 'bg-blue-600/20 text-blue-400' : 'bg-secondary/10 text-secondary'}`}>
                          {v.isLive ? 'LIVE' : v.status}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{v.speed || 0} km/h</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Route Timeline ── */}
            <div className="bg-[#191c1e] rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Route Segments</p>
                <span className="text-[10px] text-primary font-bold">4 stops</span>
              </div>
              <div className="space-y-5 relative pl-2">
                <div className="absolute left-[14px] top-2 bottom-2 w-px bg-white/8"></div>
                <div className="absolute left-[14px] top-2 w-px bg-gradient-to-b from-primary to-secondary" style={{height:'50%'}}></div>

                {[
                  { name: 'Main Library Entrance', time: '10:42 AM', info: 'Departure complete', done: true },
                  { name: 'Engineering Block C', time: 'ARRIVING', info: '0.4 km away', done: false, current: true },
                  { name: 'Science Complex', time: 'ETA ~4 min', info: 'Upcoming stop', done: false },
                  { name: 'Central Gate', time: 'ETA ~9 min', info: 'Final stop', done: false },
                ].map((stop, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ring-4 ring-[#191c1e] mt-0.5
                      ${stop.done ? 'bg-primary' : stop.current ? 'bg-[#101415] border-2 border-primary' : 'bg-[#101415] border-2 border-white/10'}`}>
                      {stop.done
                        ? <span className="material-symbols-outlined text-[12px] text-white" style={{fontVariationSettings:"'FILL' 1"}}>check</span>
                        : stop.current
                          ? <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          : <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                      }
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-bold leading-tight ${stop.current ? 'text-white' : stop.done ? 'text-slate-400' : 'text-slate-500'}`}>
                          {stop.name}
                        </p>
                        <span className={`text-[9px] font-bold shrink-0 ${stop.current ? 'text-secondary' : 'text-slate-600'}`}>{stop.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{stop.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent Activity Log ── */}
            <div className="bg-[#191c1e] rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Activity Log</p>
              <div className="space-y-3">
                {(hasLive ? liveDrivers : []).map(d => (
                  <div key={d.id} className="flex gap-3 items-center p-3 bg-blue-600/8 rounded-xl border border-blue-500/15">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-sm shrink-0">🚌</div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.driverName || 'Driver'} started trip</p>
                      <p className="text-[9px] text-slate-500">{d.name} • Live GPS Active</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 items-center p-3 bg-white/3 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-sm shrink-0">
                    <span className="material-symbols-outlined text-secondary text-sm">person_add</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">12 students boarded</p>
                    <p className="text-[9px] text-slate-500">Shuttle Beta-02 • 4 mins ago</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Map section ─────────────────────────────────────── */}
        <section className="flex-1 h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0f1113] overflow-hidden">
                  <MapContainer 
                    id="student-overview-map"
                    center={[33.6844, 73.0479]} 
                    zoom={13} 
                    className="w-full h-full"
                    zoomControl={false}
                  >
                      {mapTarget && <MapController center={mapTarget} zoom={15} />}
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
                      {allVehicles.filter(v => !v.isLive).map(s => (
                          <Marker key={s.id} position={[s.lat, s.lng]}>
                              <Popup className="custom-popup">
                                  <div className="p-1">
                                      <p className="font-bold text-sm text-slate-900">Alpha-{s.id.slice(-2)}</p>
                                      <p className="text-[10px] text-slate-500">{s.route}</p>
                                  </div>
                              </Popup>
                          </Marker>
                      ))}
                      {/* Search + current location */}
                      <MapEnhancements />
                      {/* Live driver GPS markers */}
                      <LiveDriverMarkers />
                  </MapContainer>


                  
                  <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
                      <div className="glass-panel px-4 py-3 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-secondary animate-ping"></div>
                              <p className="text-xs font-black text-white uppercase tracking-widest italic">Live Fleet Stream Active</p>
                          </div>
                      </div>
                      {liveDrivers.length > 0 && (
                          <div className="glass-panel px-4 py-3 rounded-2xl border border-blue-500/30 shadow-2xl backdrop-blur-xl bg-blue-600/10">
                              <div className="flex items-center gap-3">
                                  <span style={{fontSize:'18px'}}>🚌</span>
                                  <div>
                                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{liveDrivers.length} Driver{liveDrivers.length > 1 ? 's' : ''} Online</p>
                                      <p className="text-[9px] text-slate-400">{liveDrivers.map(d => d.driverName || d.id).join(', ')}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

              </div>
        </section>
      </>
    );
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-72 z-40 bg-[#101415] flex flex-col p-4 font-headline font-medium text-sm">
          <div className="bg-[#191c1e] ml-2 my-2 rounded-3xl flex flex-col h-full p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16"></div>
              
              <div className="flex flex-col items-center mb-10 px-2 relative z-10">
                  <div 
                    onClick={() => setShowFullImage(true)}
                    className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl mb-4 bg-surface-container-low cursor-pointer hover:ring-4 hover:ring-primary/40 transition-all active:scale-95 group"
                  >
                      <img src={getProfileImageUrl(user.profilePicture) || 'https://via.placeholder.com/150'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                      <h2 className="text-base font-extrabold text-white leading-tight mb-1">{user.name}</h2>
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                        <p className="text-[10px] text-primary tracking-widest uppercase font-bold">Standard Student</p>
                      </div>
                  </div>
              </div>
              
              <nav className="flex-grow space-y-2 mt-4 relative z-10">
                  <button 
                    onClick={() => setActiveTab('Overview')} 
                    className={`w-full flex items-center gap-3 py-3.5 px-4 transition-all duration-300 rounded-xl ${activeTab === 'Overview' ? 'bg-gradient-to-r from-[#2563eb]/20 to-transparent text-blue-400 border-l-4 border-blue-500 translate-x-1' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                      <span className="material-symbols-outlined">dashboard</span>
                      <span className="tracking-wide">Overview</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('Profile')} 
                    className={`w-full flex items-center gap-3 py-3.5 px-4 transition-all duration-300 rounded-xl ${activeTab === 'Profile' ? 'bg-gradient-to-r from-[#2563eb]/20 to-transparent text-blue-400 border-l-4 border-blue-500 translate-x-1' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                      <span className="material-symbols-outlined">person</span>
                      <span className="tracking-wide">Profile Settings</span>
                  </button>
              </nav>

              <div className="pt-6 border-t border-white/5 space-y-1 relative z-10">
                  <button onClick={logout} className="w-full flex items-center gap-3 text-slate-500 py-3 px-4 hover:text-slate-300 transition-all rounded-xl">
                      <span className="material-symbols-outlined">logout</span>
                      <span>Logout Signal</span>
                  </button>
              </div>
          </div>
      </aside>

      <main className="ml-72 h-screen flex relative overflow-hidden">
          {activeTab === 'Overview' ? renderOverview() : renderProfileView()}
      </main>

      {/* Image Preview Modal */}
      {showFullImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
              <button 
                onClick={() => setShowFullImage(false)}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 z-10"
              >
                  <span className="material-symbols-outlined text-3xl">close</span>
              </button>
              
              <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                  <img 
                    src={getProfileImageUrl(user.profilePicture) || 'https://via.placeholder.com/150'} 
                    className="w-full h-full object-contain"
                    alt="Full Profile"
                  />
              </div>
          </div>
      )}
    </div>
  );
}
