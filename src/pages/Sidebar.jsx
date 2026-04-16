import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Database,
  Globe,
  BarChart3,
  Settings,
  LogOut,
  Loader
} from 'lucide-react';

const Sidebar = ({
  activeMenu,
  onMenuClick,
  onSignOut,
  isPharmacyOpen,
  isToggling,
  onToggleSwitch
}) => {
  // Mirror the prop so the knob animates immediately (optimistic)
  const [localOpen, setLocalOpen] = useState(isPharmacyOpen);

  useEffect(() => {
    setLocalOpen(isPharmacyOpen);
  }, [isPharmacyOpen]);

  const handleToggle = () => {
    if (isToggling) return;
    setLocalOpen(prev => !prev);   // instant visual flip
    onToggleSwitch();              // parent does the API call + revert if needed
  };

  const navItems = [
    { id: 'dashboard',    icon: <LayoutDashboard size={20} />, label: 'Dashboard'         },
    { id: 'orders',       icon: <ShoppingBag     size={20} />, label: 'Orders'            },
    { id: 'catalog',      icon: <Database        size={20} />, label: 'Medicine Catalog'  },
    { id: 'globalCatalog',icon: <Globe           size={20} />, label: 'Global Catalog'    },
    { id: 'reports',      icon: <BarChart3       size={20} />, label: 'Financial Reports' },
    { id: 'settings',     icon: <Settings        size={20} />, label: 'Settings'          },
  ];

  return (
    <aside className="sidebar">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 4px #10b981; }
          50%       { box-shadow: 0 0 10px #10b981; }
        }
      `}</style>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="logo-section">
        <div className="logo-icon">
          <img src="/logo.jpeg" alt="Logo" style={{ width: 70, height: 70 }} />
        </div>
        <div className="logo-text">
          <h1>PharmaAdmin</h1>
          <span>Portal System</span>
        </div>
      </div>

      {/* ── Pharmacy status toggle ────────────────────────────────────────── */}
      <div className="pharmacy-status">
        <div className="status-label">
          PHARMACY STATUS
          {/* Toggle track */}
          <div
            onClick={handleToggle}
            title={isToggling ? 'Updating…' : localOpen ? 'Click to close' : 'Click to open'}
            style={{
              width: 46,
              height: 26,
              borderRadius: 13,
              background: isToggling
                ? '#9ca3af'
                : localOpen
                  ? '#10b981'
                  : '#d1d5db',
              cursor: isToggling ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'background 0.3s',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '0 3px'
            }}
          >
            {isToggling ? (
              /* spinner while API call is in flight */
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Loader
                  size={14}
                  color="white"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
              </div>
            ) : (
              /* sliding knob */
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                transition: 'transform 0.3s',
                transform: localOpen ? 'translateX(20px)' : 'translateX(0px)'
              }} />
            )}
          </div>
        </div>

        {/* Live / Offline label */}
        <div
          className="status-indicator"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {isToggling ? (
            <>
              <div className="dot" style={{ background: '#f59e0b' }} />
              <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Updating…</span>
            </>
          ) : localOpen ? (
            <>
              <div
                className="dot"
                style={{
                  background: '#10b981',
                  animation: 'pulse-green 2s ease-in-out infinite'
                }}
              />
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                Live · Open
              </span>
            </>
          ) : (
            <>
              <div className="dot" style={{ background: '#6b7280' }} />
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                Offline · Closed
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────────── */}
      <nav className="nav-menu">
        {navItems.map(item => (
          <a
            key={item.id}
            href="#"
            className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onMenuClick(item.id); }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── Sign out ──────────────────────────────────────────────────────── */}
      <div
        className="sign-out"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (window.confirm('Are you sure you want to sign out?')) {
            onSignOut();
          }
        }}
      >
        <LogOut size={20} />
        <div style={{ fontWeight: 600 }}>Sign Out</div>
      </div>
    </aside>
  );
};

export default Sidebar;