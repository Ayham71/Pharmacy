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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAlvXFMVj5f63VgSfj2kqyt7_88sd0o43A"
  });

  const [mapCenter, setMapCenter] = useState({ lat: 31.9539, lng: 35.9106 });

  useEffect(() => {
    console.log('📋 Settings component received pharmacyProfile:', pharmacyProfile);
    
    if (pharmacyProfile) {
      // Try multiple possible field names from the API
      const name = pharmacyProfile.name || pharmacyProfile.pharmacyName || '';
      const ownerName = pharmacyProfile.ownerName || pharmacyProfile.userName || pharmacyProfile.owner || '';
      const email = pharmacyProfile.email || pharmacyProfile.emailAddress || '';
      const phone = pharmacyProfile.phone || pharmacyProfile.phoneNumber || pharmacyProfile.contactNumber || '';
      const address = pharmacyProfile.address || pharmacyProfile.fullAddress || '';
      const latitude = pharmacyProfile.latitude || pharmacyProfile.lat || 31.9539;
      const longitude = pharmacyProfile.longitude || pharmacyProfile.lng || pharmacyProfile.lon || 35.9106;

      console.log('📝 Setting form fields:');
      console.log('  Name:', name);
      console.log('  Owner Name:', ownerName);
      console.log('  Email:', email);
      console.log('  Phone:', phone);
      console.log('  Address:', address);
      
      const newFormData = {
        name,
        ownerName,
        email,
        phone,
        address,
        latitude,
        longitude
      };
      
      setFormData(newFormData);
      
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
    console.log(`Field changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onMapClick = useCallback((e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    
    console.log('📍 Map clicked - New location:', newLat, newLng);
    
    setMapCenter({
      lat: newLat,
      lng: newLng
    });
    
    setFormData(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLng
    }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveMessage('');
    setErrorDetails('');

    // Validate password match if changing password
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

      // Build the request body
      const submitData = {
        name: formData.name,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      // Only include password if it's being changed
      if (password) {
        submitData.password = password;
      }

      // Include all other fields from the original profile
      if (pharmacyProfile) {
        Object.keys(pharmacyProfile).forEach(key => {
          if (!(key in submitData) && key !== 'password') {
            submitData[key] = pharmacyProfile[key];
          }
        });
      }

      console.log('💾 Submitting data to API:', submitData);

      const res = await fetch('http://165.22.91.187:5000/api/Pharmacy/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      console.log('📡 API Response Status:', res.status);
      
      const responseText = await res.text();
      console.log('📡 API Response Body:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (res.ok) {
        setSaveMessage('✅ Settings saved successfully');
        
        // Update localStorage with new pharmacy name
        if (formData.name) {
          localStorage.setItem('pharmacyName', formData.name);
        }
        
        await reloadProfile();
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        console.error('❌ Save failed:', responseData);
        
        let errorMsg = '❌ Failed to save settings';
        if (typeof responseData === 'object') {
          if (responseData.message) {
            errorMsg += `: ${responseData.message}`;
          }
          if (responseData.errors) {
            const errorList = Object.values(responseData.errors).flat().join(', ');
            setErrorDetails(errorList);
          }
        } else if (typeof responseData === 'string') {
          errorMsg += `: ${responseData}`;
        }
        
        setSaveMessage(errorMsg);
      }

    } catch (err) {
      console.error('❌ Save error:', err);
      setSaveMessage('❌ Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.1rem', color: 'var(--text-muted)'}}>Loading pharmacy settings...</p>
      </div>
    );
  }

  // Debug display
  console.log('🎨 Rendering form with values:', formData);

  return (
    <div style={{padding: '2rem'}}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Pharmacy Settings</h2>
          <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
            Managing: <strong>{formData.name || 'No pharmacy name set'}</strong>
          </p>
          {saveMessage && (
            <div>
              <p style={{
                color: saveMessage.startsWith('✅') ? 'var(--success)' : 'var(--danger)', 
                marginTop: '0.5rem',
                fontSize: '0.9rem'
              }}>
                {saveMessage}
              </p>
              {errorDetails && (
                <p style={{
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem'
                }}>
                  Details: {errorDetails}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSave}>
        <div className="content-row">
          <div className="card">
            <div className="card-title">General Information</div>
            <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>

              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
                  Pharmacy Name *
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter pharmacy name (e.g., Honey Pharmacy)"
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border)', 
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }} 
                />
                {formData.name && (
                  <p style={{fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem'}}>
                    ✓ Currently set to: {formData.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                <h4 style={{marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-main)'}}>
                  🔐 Change Password
                </h4>
                
                <div style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
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
                        border: `1px solid ${password !== confirmPassword && confirmPassword ? 'var(--danger)' : 'var(--border)'}`, 
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }} 
                    />
                    {password !== confirmPassword && confirmPassword && (
                      <p style={{color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem'}}>
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
            <div style={{padding: '1rem'}}>
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
                  <div style={{textAlign: 'center'}}>
                    <p style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🗺️</p>
                    <p style={{color: 'var(--text-muted)'}}>Loading Google Maps...</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem'}}>
          <button 
            type="button" 
            onClick={() => {
              reloadProfile();
              setPassword('');
              setConfirmPassword('');
              setSaveMessage('');
              setErrorDetails('');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--bg-main)'}
            onMouseOut={(e) => e.target.style.background = 'white'}
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