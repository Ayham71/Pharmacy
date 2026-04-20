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

  // ── Toggle pharmacy open / closed ────────────

const handleToggleSwitch = async () => {
  if (isToggling) return;
  setIsToggling(true);

  const newStatus = !isPharmacyOpen;

  try {
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    console.log('🔄 Toggling pharmacy status to:', newStatus);

    const formData = new FormData();

    // ── 1. Append profile fields (skip status and images) ────────────────
    if (pharmacyProfile) {
      Object.entries(pharmacyProfile).forEach(([key, val]) => {
        if (
          key === 'isActive' || key === 'IsActive' ||
          key === 'image'    || key === 'imageFile' ||
          val === null       || val === undefined
        ) return;
        formData.append(key, String(val));
      });
    }

    // ── 2. Append IsActive with PascalCase (backend expects this) ────────
    formData.append('IsActive', String(newStatus));
    console.log('📤 FormData key: IsActive =', newStatus);

    // ── 3. Send request ──────────────────────────────────────────────────
    const res = await fetch(`${API_BASE_URL}/Pharmacy/me`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const responseText = await res.text();
    console.log('📥 Response Status:', res.status);
    console.log('📥 Raw Response Text:', responseText);

    if (res.status === 401) throw new Error('Session expired. Please log in again.');
    if (!res.ok) throw new Error(`Server error ${res.status}: ${responseText}`);

    // ── 4. Parse response ────────────────────────────────────────────────
    let data = null;
    let parseError = null;

    if (responseText.trim() === '') {
      console.warn('⚠️ Response body is empty. Assuming success but cannot verify status.');
      // If body is empty, we assume success but can't verify
      setIsPharmacyOpen(newStatus);
      setPharmacyProfile(prev =>
        prev ? { ...prev, isActive: newStatus, IsActive: newStatus } : prev
      );
      return;
    }

    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed JSON:', data);
    } catch (e) {
      parseError = e;
      console.error('❌ JSON Parse Error:', e);
      console.error('Response is not valid JSON. First 200 chars:', responseText.slice(0, 200));
      throw new Error('Server returned invalid JSON. Check console for details.');
    }

    // ── 5. Check status field ────────────────────────────────────────────
    // Check both casings
    const confirmedStatus =
      data?.IsActive ?? data?.isActive ?? data?.active ?? null;

    console.log('🔍 Status in response:', confirmedStatus);

    if (confirmedStatus === null) {
      console.warn('⚠️ Response JSON does not contain IsActive or isActive field.');
      console.warn('Available keys:', Object.keys(data));
      // Still update UI optimistically if request succeeded
      setIsPharmacyOpen(newStatus);
      setPharmacyProfile(prev =>
        prev ? { ...prev, isActive: newStatus, IsActive: newStatus } : prev
      );
      alert(
        'Status updated, but response missing status field.\n' +
        'Please verify in database. Backend may need to include IsActive in response DTO.'
      );
      return;
    }

    // ── 6. Verify update ─────────────────────────────────────────────────
    if (confirmedStatus === newStatus) {
      console.log('🎉 SUCCESS: Status updated and confirmed by server!');
      setIsPharmacyOpen(newStatus);
      setPharmacyProfile(prev =>
        prev ? { ...prev, isActive: newStatus, IsActive: newStatus } : prev
      );
    } else {
      console.error(
        `❌ MISMATCH: Sent IsActive=${newStatus}, but server returned ${confirmedStatus}`
      );
      alert(
        `Update failed: Backend ignored the change.\n` +
        `Sent: ${newStatus}\n` +
        `Received: ${confirmedStatus}\n\n` +
        `Backend developer must ensure:\n` +
        `1. FormData binding accepts 'IsActive'\n` +
        `2. Service layer maps dto.IsActive to entity.IsActive\n` +
        `3. Database save includes IsActive`
      );
    }

  } catch (err) {
    console.error('❌ Toggle failed:', err);
    alert(`Could not update status:\n${err.message}`);
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