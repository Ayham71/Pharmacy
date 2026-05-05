import React, { useState, useEffect } from 'react';
import './styles.css';
import './pages/login.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Clear all auth data on app load to always start with login page
    const clearAuthData = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('pharmacyName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userUsername');
    };

    // Clear on page load
    clearAuthData();

    // Handle page close/refresh - logout immediately
    const handleBeforeUnload = () => {
      clearAuthData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLogin = (data) => {
    console.log('User logged in:', data);
    setUserData(data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('pharmacyName');
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard userData={userData} onSignOut={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;