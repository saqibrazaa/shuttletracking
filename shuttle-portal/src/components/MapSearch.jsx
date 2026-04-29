import { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// ─── Map Controller: fly to a given center ──────────────────────────────────
export function MapController({ center, zoom = 15 }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, map, zoom]);
    return null;
}

// ─── Current Location Marker Effect ──────────────────────────────────────────
function PulsingLocationMarker({ position }) {
    const map = useMap();
    useEffect(() => {
        if (!position) return;
        // Create a pulsing "You are here" div icon
        const pulseIcon = L.divIcon({
            className: '',
            html: `
                <div style="position:relative;width:24px;height:24px;">
                    <div style="
                        position:absolute;inset:0;
                        border-radius:50%;
                        background:rgba(37,99,235,0.25);
                        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
                    "></div>
                    <div style="
                        position:absolute;inset:4px;
                        border-radius:50%;
                        background:#2563eb;
                        border:3px solid white;
                        box-shadow:0 0 12px rgba(37,99,235,0.8);
                    "></div>
                </div>
                <style>
                @keyframes ping{75%,100%{transform:scale(2.5);opacity:0}}
                </style>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
        const marker = L.marker(position, { icon: pulseIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup('<b>📍 You are here</b>');
        return () => map.removeLayer(marker);
    }, [position, map]);
    return null;
}

// ─── Search Result Marker Effect ─────────────────────────────────────────────
function SearchResultMarker({ position, label }) {
    const map = useMap();
    useEffect(() => {
        if (!position) return;
        const icon = L.divIcon({
            className: '',
            html: `
                <div style="position:relative;">
                    <div style="
                        background:#f59e0b;
                        border:3px solid white;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        width:28px;height:28px;
                        box-shadow:0 4px 12px rgba(245,158,11,0.6);
                    "></div>
                    <div style="
                        position:absolute;top:6px;left:6px;
                        transform:rotate(45deg);
                        color:white;font-size:12px;font-weight:bold;
                    ">📍</div>
                </div>
            `,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
        });
        const marker = L.marker(position, { icon, zIndexOffset: 900 })
            .addTo(map)
            .bindPopup(`<b>${label}</b>`)
            .openPopup();
        return () => map.removeLayer(marker);
    }, [position, label, map]);
    return null;
}

// ─── Inner Search & Location Controls (must be inside MapContainer) ──────────
function MapControls({ onSearchResult, onLocationFound }) {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const debounceRef = useRef(null);
    const inputRef = useRef(null);

    // Debounced Nominatim search
    const handleInput = (val) => {
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (!val.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                setResults(data);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 400);
    };

    const selectResult = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        map.flyTo([lat, lng], 16, { duration: 1.8 });
        onSearchResult({ position: [lat, lng], label: item.display_name.split(',')[0] });
        setQuery(item.display_name.split(',')[0]);
        setResults([]);
    };

    const goToCurrentLocation = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                map.flyTo([lat, lng], 16, { duration: 1.8 });
                onLocationFound([lat, lng]);
                setLocating(false);
            },
            () => { alert('Could not get your location'); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <>
            {/* ── Search Bar ── */}
            <div style={{
                position: 'absolute', top: '16px', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000, width: '420px', maxWidth: 'calc(100vw - 32px)'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(16,20,21,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    padding: '10px 14px', gap: '10px'
                }}>
                    <span className="material-symbols-outlined" style={{
                        color: loading ? '#2563eb' : '#64748b', fontSize: '20px',
                        animation: loading ? 'spin 1s linear infinite' : 'none'
                    }}>
                        {loading ? 'progress_activity' : 'search'}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleInput(e.target.value)}
                        placeholder="Search any landmark, city, address…"
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            outline: 'none', color: 'white', fontSize: '13px',
                            fontFamily: 'inherit', fontWeight: 500,
                        }}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); onSearchResult(null); }}
                            style={{ color: '#64748b', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        </button>
                    )}
                </div>

                {/* Dropdown results */}
                {results.length > 0 && (
                    <div style={{
                        marginTop: '6px',
                        background: 'rgba(16,20,21,0.96)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                    }}>
                        {results.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => selectResult(item)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'flex-start',
                                    gap: '10px', padding: '12px 14px', background: 'transparent',
                                    border: 'none', cursor: 'pointer', textAlign: 'left',
                                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span className="material-symbols-outlined" style={{
                                    fontSize: '16px', color: '#f59e0b', marginTop: '1px', flexShrink: 0
                                }}>location_on</span>
                                <div>
                                    <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                                        {item.display_name.split(',')[0]}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0', lineHeight: 1.3 }}>
                                        {item.display_name.split(',').slice(1, 3).join(',')}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Current Location Button (bottom-right) ── */}
            <button
                onClick={goToCurrentLocation}
                title="Go to my location"
                style={{
                    position: 'absolute', bottom: '32px', right: '24px',
                    zIndex: 1000, width: '52px', height: '52px',
                    borderRadius: '16px',
                    background: locating
                        ? 'rgba(37,99,235,0.3)'
                        : 'rgba(16,20,21,0.92)',
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${locating ? '#2563eb' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: locating ? '#60a5fa' : '#94a3b8',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(37,99,235,0.2)';
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.color = '#60a5fa';
                }}
                onMouseLeave={e => {
                    if (!locating) {
                        e.currentTarget.style.background = 'rgba(16,20,21,0.92)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#94a3b8';
                    }
                }}
            >
                <span className="material-symbols-outlined" style={{
                    fontSize: '24px',
                    animation: locating ? 'pulse 1s ease-in-out infinite' : 'none'
                }}>
                    {locating ? 'gps_fixed' : 'my_location'}
                </span>
            </button>
        </>
    );
}

// ─── Main Export: drop this inside a MapContainer ────────────────────────────
export default function MapEnhancements() {
    const [searchResult, setSearchResult] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    return (
        <>
            <MapControls
                onSearchResult={setSearchResult}
                onLocationFound={setUserLocation}
            />
            {userLocation && <PulsingLocationMarker position={userLocation} />}
            {searchResult && (
                <SearchResultMarker
                    position={searchResult.position}
                    label={searchResult.label}
                />
            )}
        </>
    );
}
