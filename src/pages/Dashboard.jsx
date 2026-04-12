import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardHome from './DashboardHome';
import Orders from './Orders';
import MedicineCatalog from './MedicineCatalog';
import GlobalCatalog from './GlobalCatalog';
import FinancialReports from './FinancialReports';
import Settings from './Settings';

const Dashboard = ({ userData, onSignOut }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(true);
  const [pharmacyProfile, setPharmacyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Automatically load pharmacy profile from API on mount
  useEffect(() => {
    loadPharmacyProfile();
  }, []);

  const loadPharmacyProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      console.log('Loading pharmacy profile with token:', token.substring(0, 20) + '...');

      const res = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Pharmacy profile loaded successfully:', data);
        
        // Log each field to debug
        console.log('Pharmacy Name:', data.name);
        console.log('Owner Name:', data.ownerName);
        console.log('Email:', data.email);
        console.log('Phone:', data.phone);
        console.log('Is Active:', data.isActive);
        
        setPharmacyProfile(data);
        setIsPharmacyOpen(data.isActive ?? true);
        
        // Store pharmacy name in localStorage for easy access
        if (data.name) {
          localStorage.setItem('pharmacyName', data.name);
        }
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to load profile. Status:', res.status, 'Error:', errorText);
        
        // Set a default profile if API fails
        setPharmacyProfile({
          name: localStorage.getItem('pharmacyName') || 'Your Pharmacy',
          email: '',
          phone: '',
          address: '',
          ownerName: '',
          isActive: true
        });
      }
    } catch (err) {
      console.error('❌ Network error loading profile:', err);
      
      // Set a default profile if API fails
      setPharmacyProfile({
        name: localStorage.getItem('pharmacyName') || 'Your Pharmacy',
        email: '',
        phone: '',
        address: '',
        ownerName: '',
        isActive: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwitch = async () => {
    const newStatus = !isPharmacyOpen;
    setIsPharmacyOpen(newStatus);

    // Automatically save status to API
    try {
      const token = localStorage.getItem('authToken');
      
      const updateData = {
        ...pharmacyProfile,
        isActive: newStatus
      };
      
      console.log('Updating pharmacy status to:', newStatus);

      const res = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        console.log('✅ Status updated successfully');
        setPharmacyProfile(prev => ({...prev, isActive: newStatus}));
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to update status:', errorText);
        setIsPharmacyOpen(!newStatus); // Revert on failure
      }
    } catch (err) {
      console.error('❌ Network error updating status:', err);
      setIsPharmacyOpen(!newStatus); // Revert on failure
    }
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
  };

  if (loading && !pharmacyProfile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-muted)'
      }}>
        Loading pharmacy data...
      </div>
    );
  }

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
        <Header pharmacyName={pharmacyProfile?.name || 'Your Pharmacy'} />

        {activeMenu === 'dashboard' && <DashboardHome />}
        {activeMenu === 'orders' && <Orders />}
        {activeMenu === 'catalog' && <MedicineCatalog />}
        {activeMenu === 'globalCatalog' && <GlobalCatalog />}
        {activeMenu === 'reports' && <FinancialReports />}
        {activeMenu === 'settings' && (
          <Settings 
            pharmacyProfile={pharmacyProfile} 
            reloadProfile={loadPharmacyProfile}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;