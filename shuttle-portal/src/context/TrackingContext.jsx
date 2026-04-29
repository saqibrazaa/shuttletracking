import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';

const TrackingContext = createContext();

const SOCKET_URL = API_BASE_URL; // Backend URL

export const TrackingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [shuttles, setShuttles] = useState([
    { id: 'alpha-01', name: 'Shuttle Alpha-01', route: 'North Campus Route', lat: 33.6844, lng: 73.0479, status: 'Active', speed: 45 },
    { id: 'alpha-02', name: 'Shuttle Alpha-02', route: 'Main Loop - Sector E', lat: 33.6946, lng: 73.0583, status: 'Active', speed: 38 },
    { id: 'alpha-03', name: 'Shuttle Alpha-03', route: 'Downtown Express', lat: 33.7050, lng: 73.0691, status: 'Delayed', speed: 12 },
    { id: 'alpha-04', name: 'Shuttle Alpha-04', route: 'Hostel Shuttle', lat: 33.6740, lng: 73.0370, status: 'Active', speed: 28 }
  ]);

  // Live drivers coming from real GPS (DriverDashboard via socket)
  const [liveDrivers, setLiveDrivers] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('locationUpdate', (data) => {
      // data: { id, name, route, lat, lng, speed, status, driverName, isLive }

      if (data.isLive) {
        // Real GPS from DriverDashboard → update liveDrivers list
        setLiveDrivers(prev => {
          const index = prev.findIndex(d => d.id === data.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data, lastSeen: Date.now() };
            return updated;
          }
          return [...prev, { ...data, lastSeen: Date.now() }];
        });
      } else {
        // Simulation data → update demo shuttles
        setShuttles(prev => {
          const index = prev.findIndex(s => s.id === data.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data };
            return updated;
          }
          return prev;
        });
      }
    });

    // Batch update of all currently active live drivers (for late joiners)
    newSocket.on('activeLiveDrivers', (drivers) => {
      setLiveDrivers(drivers.map(d => ({ ...d, lastSeen: Date.now() })));
    });

    // Driver ended trip
    newSocket.on('driverOffline', (driverId) => {
      setLiveDrivers(prev => prev.filter(d => d.id !== driverId));
    });

    return () => newSocket.close();
  }, []);

  // Driver emits live GPS location
  const emitLocation = (data) => {
    if (socket) {
      socket.emit('updateLocation', { ...data, isLive: true });
    }
  };

  const endTrip = (id) => {
    setShuttles(prev => prev.filter(s => s.id !== id));
    if (socket) {
      socket.emit('driverOffline', id);
    }
    setLiveDrivers(prev => prev.filter(d => d.id !== id));
  };

  return (
    <TrackingContext.Provider value={{ shuttles, liveDrivers, emitLocation, endTrip }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
