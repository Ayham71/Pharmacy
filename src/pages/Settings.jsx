import React, { useState, useEffect } from 'react';

const Settings = ({ pharmacyName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const options = { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  return (
    <div style={{padding: '2rem'}}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Settings</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      <div className="content-row">
        <div className="card">
          <div className="card-title">General Settings</div>
          <div style={{padding: '1rem'}}>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Pharmacy Name</label>
              <input 
                type="text" 
                defaultValue={pharmacyName || "Pharmacy"} 
                style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} 
              />
            </div>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Contact Email</label>
              <input 
                type="email" 
                defaultValue="contact@pharmacy.com" 
                style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} 
              />
            </div>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Phone Number</label>
              <input 
                type="tel" 
                defaultValue="+962 (79) 999-9999" 
                style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} 
              />
            </div>
            <button className="btn-primary" style={{marginTop: '1rem'}}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;