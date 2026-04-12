import React, { useState } from 'react';
import './styles.css';
import './pages/login.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLogin = (data) => {
    console.log('User logged in:', data);
    setUserData(data);
    setIsLoggedIn(true); // This will show the dashboard
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard userData={userData} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;