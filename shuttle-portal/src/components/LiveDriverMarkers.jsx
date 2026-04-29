import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTracking } from '../context/TrackingContext';

// Creates a beautiful animated live-driver marker with driver info popup
function createDriverIcon(driverName, vehicleId, speed) {
    const initial = (driverName || 'D').charAt(0).toUpperCase();
    return L.divIcon({
        className: '',
        html: `
            <div style="position:relative;width:48px;height:60px;filter:drop-shadow(0 4px 12px rgba(37,99,235,0.5))">
                <!-- Ping ring -->
                <div style="
                    position:absolute;top:-6px;left:-6px;
                    width:60px;height:60px;border-radius:50%;
                    background:rgba(37,99,235,0.15);
                    animation:driverPing 2s ease-in-out infinite;
                "></div>
                <!-- Bus body -->
                <div style="
                    position:absolute;top:0;left:0;
                    width:48px;height:44px;
                    background:linear-gradient(135deg,#1d4ed8,#2563eb);
                    border-radius:12px;
                    border:3px solid white;
                    box-shadow:0 4px 16px rgba(37,99,235,0.6);
                    display:flex;flex-direction:column;
                    align-items:center;justify-content:center;gap:2px;
                ">
                    <span style="color:white;font-size:18px;line-height:1;">🚌</span>
                    <span style="
                        color:white;font-size:8px;font-weight:900;
                        letter-spacing:0.05em;line-height:1;
                        text-shadow:0 1px 2px rgba(0,0,0,0.4);
                    ">${initial}</span>
                </div>
                <!-- Speed badge -->
                <div style="
                    position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                    background:#10b981;border:2px solid white;
                    border-radius:8px;padding:1px 5px;
                    font-size:8px;font-weight:900;color:white;
                    white-space:nowrap;box-shadow:0 2px 6px rgba(16,185,129,0.5);
                ">${speed || 0} km/h</div>
                <!-- Live dot -->
                <div style="
                    position:absolute;top:-4px;right:-4px;
                    width:12px;height:12px;border-radius:50%;
                    background:#10b981;border:2px solid white;
                    animation:driverBlink 1s ease-in-out infinite;
                "></div>
            </div>
            <style>
            @keyframes driverPing{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.4);opacity:0}}
            @keyframes driverBlink{0%,100%{opacity:1}50%{opacity:0.3}}
            </style>
        `,
        iconSize: [48, 60],
        iconAnchor: [24, 44],
        popupAnchor: [0, -44],
    });
}

// Renders all live driver markers directly on the Leaflet map
export default function LiveDriverMarkers() {
    const map = useMap();
    const { liveDrivers } = useTracking();

    useEffect(() => {
        const markers = [];

        liveDrivers.forEach(driver => {
            if (!driver.lat || !driver.lng) return;

            const icon = createDriverIcon(driver.driverName || driver.name, driver.id, driver.speed);
            const marker = L.marker([driver.lat, driver.lng], { icon, zIndexOffset: 800 });

            const secondsAgo = Math.round((Date.now() - (driver.lastSeen || Date.now())) / 1000);
            marker.bindPopup(`
                <div style="font-family:sans-serif;min-width:180px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <div style="
                            width:36px;height:36px;border-radius:10px;
                            background:linear-gradient(135deg,#1d4ed8,#2563eb);
                            display:flex;align-items:center;justify-content:center;
                            color:white;font-size:16px;
                        ">🚌</div>
                        <div>
                            <p style="font-weight:900;font-size:13px;margin:0;color:#0f172a;">${driver.driverName || 'Driver'}</p>
                            <p style="font-size:10px;margin:0;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${driver.id?.toUpperCase()}</p>
                        </div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <div>
                            <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;font-weight:700;">Speed</p>
                            <p style="font-size:14px;font-weight:900;margin:0;color:#1e293b;">${driver.speed || 0} <span style="font-size:9px;color:#64748b;">km/h</span></p>
                        </div>
                        <div>
                            <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;font-weight:700;">Status</p>
                            <p style="font-size:11px;font-weight:700;margin:0;color:#10b981;">● LIVE</p>
                        </div>
                        <div style="grid-column:1/-1;">
                            <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;font-weight:700;">Route</p>
                            <p style="font-size:11px;font-weight:600;margin:0;color:#1e293b;">${driver.route || 'Active Patrol'}</p>
                        </div>
                        <div style="grid-column:1/-1;">
                            <p style="font-size:9px;color:#94a3b8;margin:0 0 2px;">📍 ${driver.lat?.toFixed(5)}, ${driver.lng?.toFixed(5)}</p>
                            <p style="font-size:9px;color:#94a3b8;margin:0;">⏱ Updated ${secondsAgo}s ago</p>
                        </div>
                    </div>
                </div>
            `);

            marker.addTo(map);
            markers.push(marker);
        });

        return () => {
            markers.forEach(m => map.removeLayer(m));
        };
    }, [map, liveDrivers]);

    return null;
}
