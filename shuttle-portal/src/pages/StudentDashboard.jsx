import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
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

export default function StudentDashboard() {
  const { user, logout, updateProfile } = useAuth();
  const { shuttles } = useTracking();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });
  const [newImage, setNewImage] = useState(null);
  const [message, setMessage] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  // Sync editData when user updates
  useEffect(() => {
    setEditData({ ...user });
  }, [user]);

  const getProfileImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
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

  const renderOverview = () => (
    <>
        <section className="w-[420px] h-full flex flex-col p-6 space-y-6 overflow-y-auto z-10 bg-background/50 backdrop-blur-md">
              <header className="flex justify-between items-center mb-2">
                  <h1 className="text-2xl font-headline font-extrabold tracking-tight text-white">Live Monitoring</h1>
                  <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors">
                          <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>notifications</span>
                      </button>
                  </div>
              </header>

              <div className="bg-surface-container-low rounded-lg p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                              <span className="text-xs font-label font-bold text-secondary tracking-widest uppercase">In Transit</span>
                          </div>
                          <h2 className="text-xl font-headline font-bold text-white">Shuttle Alpha-09</h2>
                          <p className="text-sm text-on-surface-variant">North Campus Route</p>
                      </div>
                      <div className="bg-surface-container-high px-3 py-1.5 rounded-full">
                          <span className="text-sm font-bold text-primary">#SH-4822</span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                      <div className="bg-surface-container-high p-4 rounded-md">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">ETA at Stop 4</p>
                          <p className="text-2xl font-headline font-extrabold text-white">4.5 <span className="text-sm font-normal text-on-surface-variant">min</span></p>
                      </div>
                      <div className="bg-surface-container-high p-4 rounded-md">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Current Speed</p>
                          <p className="text-2xl font-headline font-extrabold text-white">42 <span className="text-sm font-normal text-on-surface-variant">km/h</span></p>
                      </div>
                  </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Segments</h3>
                      <span className="text-xs text-primary font-bold">4 stops left</span>
                  </div>
                  <div className="space-y-6 relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-1 bg-surface-variant"></div>
                      <div className="absolute left-[11px] top-2 h-1/2 w-1 bg-gradient-to-b from-primary to-secondary"></div>
                      
                      <div className="flex items-start gap-4 relative">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10 ring-4 ring-background">
                              <span className="material-symbols-outlined text-[14px] text-on-primary" style={{fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>check</span>
                          </div>
                          <div className="flex-grow pb-1">
                              <div className="flex justify-between items-start">
                                  <p className="text-sm font-bold text-white">Main Library Entrance</p>
                                  <p className="text-[10px] text-on-surface-variant">10:42 AM</p>
                              </div>
                              <p className="text-xs text-on-surface-variant">Departure complete</p>
                          </div>
                      </div>
                      
                      <div className="flex items-start gap-4 relative">
                          <div className="w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 ring-4 ring-background">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          </div>
                          <div className="flex-grow pb-1">
                              <div className="flex justify-between items-start">
                                  <p className="text-sm font-bold text-white">Engineering Block C</p>
                                  <p className="text-[10px] text-secondary font-bold">ARRIVING</p>
                              </div>
                              <p className="text-xs text-on-surface-variant">0.4 km away</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider px-2">Recent Logs</h3>
                  <div className="space-y-3">
                      <div className="bg-surface-container-lowest p-4 rounded-md flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>person_add</span>
                          </div>
                          <div>
                              <p className="text-sm font-medium text-white">12 students boarded</p>
                              <p className="text-[10px] text-on-surface-variant">Shuttle Beta-02 • 4 mins ago</p>
                          </div>
                      </div>
                  </div>
              </div>
        </section>

        <section className="flex-grow h-full relative">
              <div className="absolute inset-0 bg-[#0f1113] overflow-hidden">
                  <MapContainer 
                    id="student-overview-map"
                    center={[33.6844, 73.0479]} 
                    zoom={13} 
                    className="w-full h-full"
                    zoomControl={false}
                  >
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                      />
                      {shuttles.map(s => (
                          <Marker key={s.id} position={[s.lat, s.lng]}>
                              <Popup className="custom-popup">
                                  <div className="p-1">
                                      <p className="font-bold text-sm text-slate-900">Alpha-{s.id.slice(-2)}</p>
                                      <p className="text-[10px] text-slate-500">{s.route}</p>
                                  </div>
                              </Popup>
                          </Marker>
                      ))}
                  </MapContainer>
                  
                  <div className="absolute bottom-6 left-6 z-[1000] glass-panel px-4 py-3 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl pointer-events-none">
                      <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-secondary animate-ping"></div>
                          <p className="text-xs font-black text-white uppercase tracking-widest italic">Live Fleet Stream Active</p>
                      </div>
                  </div>
              </div>
        </section>
    </>
  );

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
