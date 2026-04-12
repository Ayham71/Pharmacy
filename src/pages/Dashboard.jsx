import React, { useState, useEffect } from 'react';
import Sidebar from '../pages/Sidebar';
import Header from '../pages/Header';
import DashboardHome from '../pages/DashboardHome';
import Orders from '../pages/Orders';
import MedicineCatalog from '../pages/MedicineCatalog';
import FinancialReports from '../pages/FinancialReports';
import Settings from '../pages/Settings';

const Dashboard = ({ userData, onSignOut, pharmacyName }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(true);

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
  };

  const handleToggleSwitch = () => {
    setIsPharmacyOpen(!isPharmacyOpen);
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        onSignOut={onSignOut}
        isPharmacyOpen={isPharmacyOpen}
        onToggleSwitch={handleToggleSwitch}
      />

      <main className="main-content">
        <Header pharmacyName={pharmacyName} />

        {activeMenu === 'dashboard' && <DashboardHome />}
        {activeMenu === 'orders' && <Orders />}
        {activeMenu === 'catalog' && <MedicineCatalog />}
        {activeMenu === 'reports' && <FinancialReports />}
        {activeMenu === 'settings' && <Settings pharmacyName={pharmacyName} />}
      </main>
    </div>
  );
};

export default Dashboard;