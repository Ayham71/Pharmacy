import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const Settings = ({ pharmacyProfile, reloadProfile, loading: profileLoading }) => {
  const [formData, setFormData] = useState({
    name: '', ownerName: '', email: '',
    phone: '', address: '',
    latitude: 31.9539, longitude: 35.9106
  });
  const [subscription, setSubscription] = useState({
    durationInDays: null, startDate: null,
    endDate: null, daysRemaining: null
  });
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [saveMessage, setSaveMessage]         = useState('');
  const [errorDetails, setErrorDetails]       = useState('');
  const [rawError, setRawError]               = useState('');
  const [mapCenter, setMapCenter]             = useState({ lat: 31.9539, lng: 35.9106 });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyAlvXFMVj5f63VgSfj2kqyt7_88sd0o43A'
  });

  // ── Populate from profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (!pharmacyProfile) return;

    const lat = pharmacyProfile.latitude  || pharmacyProfile.lat  || 31.9539;
    const lng = pharmacyProfile.longitude || pharmacyProfile.lng  || 35.9106;

    setFormData({
      name:      pharmacyProfile.pharmacyName  || pharmacyProfile.name      || '',
      ownerName: pharmacyProfile.userName      || pharmacyProfile.ownerName || '',
      email:     pharmacyProfile.email         || '',
      phone:     pharmacyProfile.phoneNumber   || pharmacyProfile.phone     || '',
      address:   pharmacyProfile.address       || '',
      latitude:  lat,
      longitude: lng,
    });

    setSubscription({
      durationInDays: pharmacyProfile.subscriptionDurationInDays ?? null,
      startDate:      pharmacyProfile.subscriptionStartDate      ?? null,
      endDate:        pharmacyProfile.subscriptionEndDate        ?? null,
      daysRemaining:  pharmacyProfile.daysRemaining              ?? null,
    });

    setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
  }, [pharmacyProfile]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onMapClick = useCallback((e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMapCenter({ lat: newLat, lng: newLng });
    setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  const getSubStatus = () => {
    const d = subscription.daysRemaining;
    if (d === null) return null;
    if (d <= 0)  return { label: 'Expired',        color: '#ef4444', bg: '#fef2f2', border: '#fecaca', track: '#fca5a5' };
    if (d <= 7)  return { label: 'Critical',        color: '#ef4444', bg: '#fef2f2', border: '#fecaca', track: '#fca5a5' };
    if (d <= 30) return { label: 'Expiring Soon',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', track: '#fcd34d' };
    return              { label: 'Active',           color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', track: '#6ee7b7' };
  };

  const subStatus = getSubStatus();
  const pct = (subscription.durationInDays && subscription.daysRemaining !== null)
    ? Math.max(0, Math.min(100, (subscription.daysRemaining / subscription.durationInDays) * 100))
    : null;

  // ── Input style helper ─────────────────────────────────────────────────────
  const inputStyle = (hasError = false) => ({
    width: '100%',
    padding: '0.65rem 0.85rem',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '8px',
    fontSize: '0.9rem',
    background: '#fff',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 600,
    fontSize: '0.82rem',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveMessage('');
    setErrorDetails('');
    setRawError('');

    if (password && password !== confirmPassword) {
      setSaveMessage('❌ Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setSaveMessage('❌ No authentication token found'); setLoading(false); return; }

      const fd = new FormData();

      // Append all original fields first
      if (pharmacyProfile) {
        Object.entries(pharmacyProfile).forEach(([key, value]) => {
          if (value !== null && value !== undefined &&
            key !== 'password' && key !== 'passwordHash' && key !== 'passwordSalt') {
            fd.append(key, value);
          }
        });
      }

      // Override with updated values using correct API field names
      const fieldMappings = {
        name:      ['pharmacyName', 'PharmacyName', 'name', 'Name'],
        ownerName: ['userName', 'UserName', 'ownerName', 'OwnerName'],
        email:     ['email', 'Email'],
        phone:     ['phoneNumber', 'PhoneNumber', 'phone', 'Phone'],
        address:   ['address', 'Address'],
        latitude:  ['latitude', 'Latitude'],
        longitude: ['longitude', 'Longitude'],
      };

      const newValues = {
        name: formData.name, ownerName: formData.ownerName,
        email: formData.email, phone: formData.phone,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      Object.entries(fieldMappings).forEach(([formKey, apiKeyOptions]) => {
        const matchingApiKey = apiKeyOptions.find(k => pharmacyProfile && k in pharmacyProfile);
        if (matchingApiKey) {
          fd.delete(matchingApiKey);
          fd.set(matchingApiKey, newValues[formKey]);
        } else {
          apiKeyOptions.forEach(k => fd.set(k, newValues[formKey]));
        }
      });

      if (password) { fd.set('password', password); fd.set('Password', password); }

      const res = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd,
      });

      const responseText = await res.text();

      if (res.ok) {
        setSaveMessage('✅ Settings saved successfully');
        setRawError('');
        if (formData.name) localStorage.setItem('pharmacyName', formData.name);
        await reloadProfile();
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }
        let errorMsg = `❌ Failed to save (Status: ${res.status})`;
        if (typeof responseData === 'object' && responseData !== null) {
          if (responseData.message) errorMsg += `: ${responseData.message}`;
          if (responseData.title)   errorMsg += `: ${responseData.title}`;
          if (responseData.errors) {
            setErrorDetails(Object.entries(responseData.errors)
              .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
              .join(' | '));
          }
        }
        setSaveMessage(errorMsg);
        setRawError(`Status: ${res.status} | ${responseText}`);
      }
    } catch (err) {
      setSaveMessage('❌ Network error: ' + err.message);
      setRawError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Loading pharmacy settings...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Pharmacy Settings
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Managing: <strong style={{ color: 'var(--accent)' }}>
            {formData.name || 'Your Pharmacy'}
          </strong>
        </p>
      </div>

      {/* ── Save message ──────────────────────────────────────────────────── */}
      {saveMessage && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          background: saveMessage.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${saveMessage.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', flexDirection: 'column', gap: '0.4rem'
        }}>
          <p style={{
            color: saveMessage.startsWith('✅') ? '#16a34a' : '#dc2626',
            fontWeight: 600, fontSize: '0.9rem'
          }}>{saveMessage}</p>
          {errorDetails && (
            <p style={{ color: '#dc2626', fontSize: '0.82rem' }}>
              <strong>Details:</strong> {errorDetails}
            </p>
          )}
          {rawError && !saveMessage.startsWith('✅') && (
            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#6b7280' }}>
                🔍 Debug info
              </summary>
              <pre style={{
                fontSize: '0.72rem', background: '#f9fafb', padding: '0.5rem',
                borderRadius: '4px', marginTop: '0.4rem',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                maxHeight: 160, overflow: 'auto'
              }}>{rawError}</pre>
            </details>
          )}
        </div>
      )}

      {/* ── Subscription banner (full width) ──────────────────────────────── */}
      {subStatus && (
        <div style={{
          marginBottom: '1.5rem',
          borderRadius: '12px',
          border: `1px solid ${subStatus.border}`,
          background: subStatus.bg,
          overflow: 'hidden'
        }}>
          {/* Top accent line */}
          <div style={{ height: 3, background: subStatus.color, width: '100%' }} />

          <div style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Status badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.9rem', borderRadius: 999,
              background: 'white',
              border: `1px solid ${subStatus.border}`,
              flexShrink: 0
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: subStatus.color
              }} />
              <span style={{
                fontSize: '0.78rem', fontWeight: 700,
                color: subStatus.color, letterSpacing: '0.04em'
              }}>
                {subStatus.label}
              </span>
            </div>

            {/* Days remaining big */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
              <span style={{
                fontSize: '1.8rem', fontWeight: 800, color: subStatus.color,
                lineHeight: 1
              }}>
                {subscription.daysRemaining <= 0 ? '0' : subscription.daysRemaining}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500 }}>
                days remaining
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: subStatus.border, flexShrink: 0 }} />

            {/* Date info */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Start Date', value: formatDate(subscription.startDate) },
                { label: 'End Date',   value: formatDate(subscription.endDate)   },
                { label: 'Duration',   value: subscription.durationInDays ? `${subscription.durationInDays} days` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1f2937' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress bar — pushed right */}
            {pct !== null && (
              <div style={{ marginLeft: 'auto', minWidth: 140 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Progress</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700,
                    color: subStatus.color }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.08)',
                  borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: subStatus.color, borderRadius: 999,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Warning strip */}
          {subscription.daysRemaining !== null && subscription.daysRemaining <= 30 && (
            <div style={{
              padding: '0.6rem 1.25rem',
              borderTop: `1px solid ${subStatus.border}`,
              background: 'rgba(255,255,255,0.6)',
              fontSize: '0.8rem',
              color: subscription.daysRemaining <= 0 ? '#991b1b' : '#92400e',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              {subscription.daysRemaining <= 0
                ? '🚫 Your subscription has expired. Please contact your administrator immediately.'
                : `⚠️ Your subscription expires in ${subscription.daysRemaining} days. Contact your administrator to renew.`
              }
            </div>
          )}
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSave}>

        {/* Row 1: General Info + Map (side by side, equal height) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          alignItems: 'start'
        }}>

          {/* ── General Information ─────────────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.6rem'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem'
              }}>🏥</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                General Information
              </h3>
            </div>

            {/* Fields */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Name + Owner side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Pharmacy Name *</label>
                  <input type="text" name="name" value={formData.name}
                    onChange={handleChange} required
                    placeholder="Pharmacy name"
                    style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Owner / Username</label>
                  <input type="text" name="ownerName" value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Owner name"
                    style={inputStyle()} />
                </div>
              </div>

              {/* Email + Phone side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} required
                    placeholder="pharmacy@example.com"
                    style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange}
                    placeholder="+962 79 999 9999"
                    style={inputStyle()} />
                </div>
              </div>

              {/* Address full width */}
              <div>
                <label style={labelStyle}>Full Address</label>
                <textarea name="address" value={formData.address}
                  onChange={handleChange} rows={2}
                  placeholder="Enter complete pharmacy address"
                  style={{
                    ...inputStyle(),
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }} />
              </div>

              {/* Coordinates (read-only display) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Latitude</label>
                  <input type="text" readOnly
                    value={parseFloat(formData.latitude).toFixed(6)}
                    style={{ ...inputStyle(), background: '#f9fafb', color: '#6b7280', cursor: 'default' }} />
                </div>
                <div>
                  <label style={labelStyle}>Longitude</label>
                  <input type="text" readOnly
                    value={parseFloat(formData.longitude).toFixed(6)}
                    style={{ ...inputStyle(), background: '#f9fafb', color: '#6b7280', cursor: 'default' }} />
                </div>
              </div>

            </div>
          </div>

          {/* ── Map ─────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.6rem'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem'
              }}>📍</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Pharmacy Location
              </h3>
            </div>

            <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
              {/* Hint */}
              <div style={{
                marginBottom: '0.85rem',
                padding: '0.6rem 0.85rem',
                background: 'var(--accent-light)',
                borderRadius: '6px',
                borderLeft: '3px solid var(--accent)',
                fontSize: '0.8rem',
                color: '#92400e'
              }}>
                💡 Click on the map to update your pharmacy's location
              </div>

              {/* Map */}
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: 260, borderRadius: 8 }}
                  center={mapCenter}
                  zoom={15}
                  onClick={onMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    zoomControl: true
                  }}
                >
                  <Marker
                    position={mapCenter}
                    animation={window.google?.maps?.Animation?.DROP}
                  />
                </GoogleMap>
              ) : (
                <div style={{
                  height: 260, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'var(--bg-main)',
                  borderRadius: 8, border: '1px dashed var(--border)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Loading Google Maps...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Change Password (compact, full width) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem'
            }}>🔐</div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Change Password
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Leave blank to keep your current password
              </p>
            </div>
          </div>

          <div style={{
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle(password && password !== confirmPassword && confirmPassword)} />
              {password && password !== confirmPassword && confirmPassword && (
                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  ⚠️ Passwords do not match
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          gap: '0.75rem', alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={() => {
              reloadProfile();
              setPassword(''); setConfirmPassword('');
              setSaveMessage(''); setErrorDetails(''); setRawError('');
            }}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            🔄 Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (password && password !== confirmPassword)}
            style={{
              opacity: (loading || (password && password !== confirmPassword)) ? 0.6 : 1,
              cursor: (loading || (password && password !== confirmPassword)) ? 'not-allowed' : 'pointer',
              padding: '0.65rem 1.5rem',
              fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            {loading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;