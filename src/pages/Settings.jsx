import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '8px'
};

const Settings = ({ pharmacyProfile, reloadProfile, loading: profileLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    latitude: 31.9539,
    longitude: 35.9106
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [rawError, setRawError] = useState('');
  const [apiFields, setApiFields] = useState(null); // 🆕 Store exact API field names

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAlvXFMVj5f63VgSfj2kqyt7_88sd0o43A"
  });

  const [mapCenter, setMapCenter] = useState({ lat: 31.9539, lng: 35.9106 });

  useEffect(() => {
    if (pharmacyProfile) {
      // 🆕 Store the exact field names the API returns
      setApiFields(Object.keys(pharmacyProfile));
      console.log('🔑 API Field Names:', Object.keys(pharmacyProfile));
      console.log('📋 Full API Response:', pharmacyProfile);

      const name = pharmacyProfile.name || pharmacyProfile.pharmacyName || '';
      const ownerName = pharmacyProfile.ownerName 
        || pharmacyProfile.userName 
        || pharmacyProfile.owner 
        || '';
      const email = pharmacyProfile.email || pharmacyProfile.emailAddress || '';
      const phone = pharmacyProfile.phone 
        || pharmacyProfile.phoneNumber 
        || pharmacyProfile.contactNumber 
        || '';
      const address = pharmacyProfile.address || pharmacyProfile.fullAddress || '';
      const latitude = pharmacyProfile.latitude || pharmacyProfile.lat || 31.9539;
      const longitude = pharmacyProfile.longitude 
        || pharmacyProfile.lng 
        || pharmacyProfile.lon 
        || 35.9106;

      setFormData({ name, ownerName, email, phone, address, latitude, longitude });

      if (latitude && longitude) {
        setMapCenter({
          lat: parseFloat(latitude),
          lng: parseFloat(longitude)
        });
      }
    }
  }, [pharmacyProfile]);

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

    if (!token) {
      setSaveMessage('❌ No authentication token found');
      setLoading(false);
      return;
    }

    // ✅ Build FormData with EXACT field names from API
    const fd = new FormData();

    // 🔍 Log original profile to see field names
    console.log('📋 Original pharmacyProfile:', pharmacyProfile);
    console.log('📋 API field names:', Object.keys(pharmacyProfile || {}));

    // ✅ First append ALL original fields to not lose anything
    if (pharmacyProfile) {
      Object.entries(pharmacyProfile).forEach(([key, value]) => {
        if (
          value !== null && 
          value !== undefined && 
          key !== 'password' && 
          key !== 'passwordHash' &&
          key !== 'passwordSalt'
        ) {
          fd.append(key, value);
        }
      });
    }

    // ✅ Now OVERRIDE with the new values
    // We use the SAME key names that came from the API
    const fieldMappings = {
      // Map our form field names to what the API actually uses
      name: ['name', 'Name', 'pharmacyName', 'PharmacyName'],
      ownerName: ['ownerName', 'OwnerName', 'userName', 'UserName', 'owner', 'Owner'],
      email: ['email', 'Email', 'emailAddress', 'EmailAddress'],
      phone: ['phone', 'Phone', 'phoneNumber', 'PhoneNumber', 'contactNumber'],
      address: ['address', 'Address', 'fullAddress', 'FullAddress'],
      latitude: ['latitude', 'Latitude', 'lat', 'Lat'],
      longitude: ['longitude', 'Longitude', 'lng', 'Lng', 'lon', 'Lon'],
    };

    // For each form field, find which key the API actually uses and update it
    const newValues = {
      name: formData.name,
      ownerName: formData.ownerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    Object.entries(fieldMappings).forEach(([formKey, apiKeyOptions]) => {
      // Find which key actually exists in the API response
      const matchingApiKey = apiKeyOptions.find(
        key => pharmacyProfile && key in pharmacyProfile
      );

      if (matchingApiKey) {
        // Delete old value and set new one
        fd.delete(matchingApiKey);
        fd.set(matchingApiKey, newValues[formKey]);
        console.log(`✅ Updating API field: ${matchingApiKey} = ${newValues[formKey]}`);
      } else {
        // Key not found in profile, try all variations
        console.warn(`⚠️ No matching API key found for: ${formKey}`);
        console.warn(`   Tried: ${apiKeyOptions.join(', ')}`);
        // Set all variations as fallback
        apiKeyOptions.forEach(key => fd.set(key, newValues[formKey]));
      }
    });

    // Add password if changing
    if (password) {
      fd.set('password', password);
      fd.set('Password', password);
    }

    // 🔍 Log EVERYTHING being sent
    console.log('📤 FormData being sent:');
    const sentData = {};
    for (let [key, value] of fd.entries()) {
      console.log(`  ${key}: ${value}`);
      sentData[key] = value;
    }
    console.log('📤 Full sent data object:', sentData);

    const res = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // ❌ NO Content-Type for FormData
      },
      body: fd,
    });

    console.log('📥 Response Status:', res.status);
    const responseText = await res.text();
    console.log('📥 Response Body:', responseText);

    setRawError(`Status: ${res.status} | Sent: ${JSON.stringify(sentData)} | Response: ${responseText || '(empty)'}`);

    if (res.ok) {
      // ✅ Verify the change actually happened
      console.log('🔄 Verifying change by re-fetching profile...');
      
      const verifyRes = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      console.log('✅ Profile AFTER save:', verifyData);
      console.log('📊 Name changed?', verifyData.name, '(was:', pharmacyProfile?.name, ')');

      setSaveMessage('✅ Settings saved successfully');
      setRawError('');
      if (formData.name) localStorage.setItem('pharmacyName', formData.name);
      await reloadProfile();
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveMessage(''), 3000);

    } else {
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      let errorMsg = `❌ Failed to save settings (Status: ${res.status})`;

      if (typeof responseData === 'object' && responseData !== null) {
        if (responseData.message) errorMsg += `: ${responseData.message}`;
        if (responseData.title) errorMsg += `: ${responseData.title}`;
        if (responseData.errors) {
          const errorList = Object.entries(responseData.errors)
            .map(([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
            )
            .join(' | ');
          setErrorDetails(errorList);
        }
      } else if (typeof responseData === 'string' && responseData) {
        errorMsg += `: ${responseData.substring(0, 300)}`;
      }

      setSaveMessage(errorMsg);
    }

  } catch (err) {
    console.error('❌ Error:', err);
    setSaveMessage('❌ Network error: ' + err.message);
    setRawError(`Error: ${err.message}\nStack: ${err.stack}`);
  } finally {
    setLoading(false);
  }
};

  if (profileLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Loading pharmacy settings...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Pharmacy Settings</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Managing: <strong>{formData.name || 'No pharmacy name set'}</strong>
          </p>

         {/* /* 🆕 Show exact API field names 
          {apiFields && (
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280' }}>
                🔑 API Field Names (click to see)
              </summary>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  Fields returned by GET /api/Pharmacy/me:
                </p>
                {apiFields.map(field => (
                  <div key={field} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.2rem 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <code style={{ color: '#7c3aed' }}>{field}</code>
                    <span style={{ color: '#374151' }}>
                      {JSON.stringify(pharmacyProfile[field])}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )} */}

          {saveMessage && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: saveMessage.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${saveMessage.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
            }}>
              <p style={{
                color: saveMessage.startsWith('✅') ? '#16a34a' : '#dc2626',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                {saveMessage}
              </p>
              {errorDetails && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <strong>Details:</strong> {errorDetails}
                </p>
              )}
              {rawError && !saveMessage.startsWith('✅') && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    fontWeight: 600
                  }}>
                    🔍 Debug Info
                  </summary>
                  <pre style={{
                    fontSize: '0.75rem',
                    color: '#374151',
                    background: '#f9fafb',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {rawError}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSave}>
        <div className="content-row">
          <div className="card">
            <div className="card-title">General Information</div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Pharmacy Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter pharmacy name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Owner Name / Username
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner/user name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="pharmacy@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+962 79 999 9999"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter complete pharmacy address"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                marginTop: '0.5rem'
              }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                  🔐 Change Password
                </h4>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                {password && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${password !== confirmPassword && confirmPassword
                          ? 'var(--danger)'
                          : 'var(--border)'}`,
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }}
                    />
                    {password !== confirmPassword && confirmPassword && (
                      <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        ⚠️ Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="card">
            <div className="card-title">📍 Pharmacy Location</div>
            <div style={{ padding: '1rem' }}>
              <p style={{
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                background: 'var(--accent-light)',
                padding: '0.75rem',
                borderRadius: '6px',
                borderLeft: '3px solid var(--accent)'
              }}>
                💡 Click anywhere on the map to set your pharmacy's exact location
              </p>

              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
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
                  height: '350px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-main)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</p>
                    <p style={{ color: 'var(--text-muted)' }}>Loading Google Maps...</p>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: '#f9fafb',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#6b7280'
              }}>
                📌 Coordinates: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              reloadProfile();
              setPassword('');
              setConfirmPassword('');
              setSaveMessage('');
              setErrorDetails('');
              setRawError('');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🔄 Reset Changes
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (password && password !== confirmPassword)}
            style={{
              opacity: (loading || (password && password !== confirmPassword)) ? 0.6 : 1,
              cursor: (loading || (password && password !== confirmPassword)) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Saving Changes...' : '💾 Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;