import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from './utils/api';
import './App.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import AttendanceMarking from './components/AttendanceMarking';
import Analytics from './components/Analytics';
import Header from './components/Header';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionProcessing, setSessionProcessing] = useState(false);

  // Check for session ID in URL fragment
  useEffect(() => {
    const checkAuthStatus = async () => {
      const urlFragment = window.location.hash;
      
      if (urlFragment.includes('session_id=')) {
        setSessionProcessing(true);
        const sessionId = urlFragment.split('session_id=')[1].split('&')[0];
        
        try {
          const response = await axios.get(`${API}/auth/session-data`, {
            headers: { 'X-Session-ID': sessionId }
          });
          
          const userData = response.data;
          
          // Set session token as cookie
          document.cookie = `session_token=${userData.session_token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60}`;
          
          setUser(userData);
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
        } catch (error) {
          console.error('Session processing failed:', error);
          // Clear any existing session
          document.cookie = 'session_token=; path=/; secure; samesite=none; max-age=0';
        } finally {
          setSessionProcessing(false);
        }
      } else {
          // Check if user is already logged in via cookie
          const sessionToken = getCookie('session_token');
          if (sessionToken) {
            try {
              // Verify session is still valid by making a simple authenticated request
              const response = await api.get('/analytics/dashboard');
              if (response.data) {
                // Session is valid, set user data from cookie or make another call
                setUser({ 
                  name: 'User', 
                  email: 'user@example.com', 
                  role: response.data.user_role || 'teacher' 
                });
              }
            } catch (error) {
              // Session is invalid, clear cookie
              document.cookie = 'session_token=; path=/; secure; samesite=none; max-age=0';
            }
          }
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleLogin = () => {
    const redirectUrl = encodeURIComponent(`${window.location.origin}/dashboard`);
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      document.cookie = 'session_token=; path=/; secure; samesite=none; max-age=0';
      setUser(null);
    }
  };

  if (loading || sessionProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-indigo-600 font-medium">
            {sessionProcessing ? 'Processing authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        
        {user && <Header user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/students" 
            element={user ? <StudentManagement user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/attendance" 
            element={user ? <AttendanceMarking user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/analytics" 
            element={user ? <Analytics user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;