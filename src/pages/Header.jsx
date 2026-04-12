import React from 'react';

const Header = ({ pharmacyName }) => {
  return (
    <header className="header">
      <div className="header-welcome">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Welcome to {pharmacyName || 'Your Pharmacy'}
        </h1>
      </div>
    </header>
  );
};

export default Header;