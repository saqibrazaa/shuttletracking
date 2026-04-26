import React, { createContext, useState, useContext, useEffect } from 'react';
import API_BASE_URL from '../config';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('shuttle_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('shuttle_token', data.token);
        localStorage.setItem('shuttle_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, msg: data.msg };
    } catch (err) {
      return { success: false, msg: 'Server error' };
    }
  };

  const register = async (userData) => {
    try {
      const isFormData = userData instanceof FormData;
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? userData : JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('shuttle_token', data.token);
        localStorage.setItem('shuttle_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, msg: data.msg };
    } catch (err) {
      return { success: false, msg: 'Server error' };
    }
  };

  const updateProfile = async (id, userData) => {
    try {
      console.log('Attempting to update profile for ID:', id);
      const isFormData = userData instanceof FormData;
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/${id}`, {
        method: 'PUT',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? userData : JSON.stringify(userData),
      });
      
      const data = await res.json();
      console.log('Update Profile Response Data:', data);

      if (res.ok) {
        setUser(data);
        localStorage.setItem('shuttle_user', JSON.stringify(data));
        return { success: true, user: data };
      }
      return { success: false, msg: data.msg || 'Update failed' };
    } catch (err) {
      console.error('Update Profile Fetch Error:', err);
      return { success: false, msg: `Network or Server Error. Please ensure backend is running at ${API_BASE_URL}` };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shuttle_token');
    localStorage.removeItem('shuttle_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
