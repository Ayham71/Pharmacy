import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardHome from './DashboardHome';
import Orders from './Orders';
import MedicineCatalog from './MedicineCatalog';
import GlobalCatalog from './GlobalCatalog';
import FinancialReports from './FinancialReports';
import Settings from './Settings';

const API_BASE_URL = 'http://165.22.91.187:5000/api';

const Dashboard = ({ userData, onSignOut }) => {
  const [activeMenu, setActiveMenu]           = useState('dashboard');
  const [isPharmacyOpen, setIsPharmacyOpen]   = useState(false);
  const [isToggling, setIsToggling]           = useState(false);
  const [pharmacyProfile, setPharmacyProfile] = useState(null);
  const [loading, setLoading]                 = useState(true);

  const getToken = () =>
    localStorage.getItem('token')       ||
    localStorage.getItem('authToken')   ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt');

  // GET uses JSON, only set Authorization
  const getGetHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    loadPharmacyProfile();
  }, []);

  // ── Load pharmacy profile ─────────────────────────────────────────────────
  const loadPharmacyProfile = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      console.log('Fetching pharmacy profile...');

      const res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
        method: 'GET',
        headers: getGetHeaders()
      });

      console.log('Profile response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Pharmacy profile:', data);

        setPharmacyProfile(data);

        const isActive =
          data.isActive ?? data.IsActive ??
          data.isOpen   ?? data.IsOpen   ??
          data.active   ?? data.Active   ?? false;

        setIsPharmacyOpen(isActive);

        if (data.name) localStorage.setItem('pharmacyName', data.name);
      } else {
        const errText = await res.text();
        console.error('❌ Profile fetch failed:', res.status, errText);

        setPharmacyProfile({
          name:      localStorage.getItem('pharmacyName') || 'Your Pharmacy',
          email:     '',
          phone:     '',
          address:   '',
          ownerName: '',
          isActive:  false
        });
      }
    } catch (err) {
      console.error('❌ Network error fetching profile:', err);
      setPharmacyProfile({
        name:      localStorage.getItem('pharmacyName') || 'Your Pharmacy',
        email:     '',
        phone:     '',
        address:   '',
        ownerName: '',
        isActive:  false
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle pharmacy open / closed ─────────────────────────────────────────
 const handleToggleSwitch = async () => {
    if (isToggling) return;
    setIsToggling(true);

    const newStatus = !isPharmacyOpen;
    setIsPharmacyOpen(newStatus);

    try {
      const token = getToken();
      if (!token) throw new Error('Authentication required');

      console.log(`Toggling pharmacy → isActive: ${newStatus}`);
      console.log('Current pharmacyProfile:', pharmacyProfile);

      // Log validation errors in detail
      const logErrors = (data) => {
        if (data?.errors) {
          console.error('=== VALIDATION ERRORS ===');
          Object.entries(data.errors).forEach(([field, messages]) => {
            console.error(`  Field "${field}":`, messages);
          });
          console.error('=========================');
        }
      };

      // ── Attempt 1: FormData with all profile fields ─────────────────────
      console.log('Attempt 1: FormData with full profile...');
      const formData = new FormData();
      formData.append('isActive', String(newStatus));

      // Append every field from pharmacyProfile
      if (pharmacyProfile) {
        Object.entries(pharmacyProfile).forEach(([key, value]) => {
          if (value !== null && value !== undefined && key !== 'image' && key !== 'logo') {
            formData.append(key, String(value));
            console.log(`  FormData field: ${key} = ${value}`);
          }
        });
      }

      let res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      let responseData = null;
      try { responseData = await res.json(); } catch (_) {}
      console.log('Attempt 1 status:', res.status, responseData);
      logErrors(responseData);

      // ── Attempt 2: JSON with full profile ───────────────────────────────
      if (!res.ok) {
        console.log('Attempt 2: JSON with full profile...');
        const jsonBody = { ...pharmacyProfile, isActive: newStatus };
        console.log('JSON body:', jsonBody);

        res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });

        try { responseData = await res.json(); } catch (_) {}
        console.log('Attempt 2 status:', res.status, responseData);
        logErrors(responseData);
      }

      // ── Attempt 3: JSON with only isActive ──────────────────────────────
      if (!res.ok) {
        console.log('Attempt 3: JSON with only isActive...');
        res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: newStatus })
        });

        try { responseData = await res.json(); } catch (_) {}
        console.log('Attempt 3 status:', res.status, responseData);
        logErrors(responseData);
      }

      // ── Attempt 4: PATCH instead of PUT ─────────────────────────────────
      if (!res.ok) {
        console.log('Attempt 4: PATCH with isActive...');
        res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: newStatus })
        });

        try { responseData = await res.json(); } catch (_) {}
        console.log('Attempt 4 status:', res.status, responseData);
        logErrors(responseData);
      }

      if (res.status === 401) throw new Error('Session expired. Please log in again.');

      if (!res.ok) {
        // Log the full error details so we can fix it
        console.error('All attempts failed. Last error:', responseData);
        console.error('Validation errors detail:', JSON.stringify(responseData?.errors, null, 2));
        throw new Error(
          responseData?.message ||
          responseData?.title   ||
          `Failed to update pharmacy status (${res.status})`
        );
      }

      console.log(`✅ Pharmacy is now ${newStatus ? 'OPEN' : 'CLOSED'}`);
      setPharmacyProfile(prev => prev ? { ...prev, isActive: newStatus } : prev);

    } catch (err) {
      console.error('❌ Toggle failed:', err);
      setIsPharmacyOpen(!newStatus);
      alert(`Could not update pharmacy status:\n${err.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  // ── Loading splash ────────────────────────────────────────────────────────
  if (loading && !pharmacyProfile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', gap: '1rem', color: 'var(--text-muted)'
      }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: 40, height: 40,
          border: '4px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span>Loading pharmacy data...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={setActiveMenu}
        onSignOut={onSignOut}
        isPharmacyOpen={isPharmacyOpen}
        isToggling={isToggling}
        onToggleSwitch={handleToggleSwitch}
      />

      <main className="main-content">
        <Header pharmacyName={pharmacyProfile?.name || 'Your Pharmacy'} />

        {activeMenu === 'dashboard'     && <DashboardHome onNavigate={setActiveMenu} />}
        {activeMenu === 'orders'        && <Orders />}
        {activeMenu === 'catalog'       && <MedicineCatalog />}
        {activeMenu === 'globalCatalog' && <GlobalCatalog />}
        {activeMenu === 'reports'       && <FinancialReports />}
        {activeMenu === 'settings'      && (
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