import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';

const TrackingContext = createContext();

const SOCKET_URL = 'http://localhost:5000'; // Backend URL

export const TrackingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [shuttles, setShuttles] = useState([
    { id: 'alpha-01', name: 'Shuttle Alpha-01', route: 'North Campus Route', lat: 33.6844, lng: 73.0479, status: 'Active', speed: 45 },
    { id: 'alpha-02', name: 'Shuttle Alpha-02', route: 'Main Loop - Sector E', lat: 33.6946, lng: 73.0583, status: 'Active', speed: 38 },
    { id: 'alpha-03', name: 'Shuttle Alpha-03', route: 'Downtown Express', lat: 33.7050, lng: 73.0691, status: 'Delayed', speed: 12 },
    { id: 'alpha-04', name: 'Shuttle Alpha-04', route: 'Hostel Shuttle', lat: 33.6740, lng: 73.0370, status: 'Active', speed: 28 }
  ]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('locationUpdate', (data) => {
      // Data format: { id, lat, lng, speed, status, route }
      setShuttles(prev => {
        const index = prev.findIndex(s => s.id === data.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        } else {
          return [...prev, data];
        }
      });
    });

    return () => newSocket.close();
  }, []);

  // Method for a driver to emit their real location
  const emitLocation = (data) => {
    // data format: { id, name, route, lat, lng, speed, status }
    if (socket) {
      socket.emit('updateLocation', data);
    }
  };

  const endTrip = (id) => {
    setShuttles(prev => prev.filter(s => s.id !== id));
  };

  return (
    <TrackingContext.Provider value={{ shuttles, emitLocation, endTrip }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
