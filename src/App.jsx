import React, { useState, useEffect } from 'react';
import './styles.css';
import './pages/login.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
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