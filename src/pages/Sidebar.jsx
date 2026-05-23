import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, Database,
  Globe, BarChart3, Settings, LogOut, Loader
} from 'lucide-react';

const Sidebar = ({
  activeMenu, onMenuClick, onSignOut,
  isPharmacyOpen, isToggling, onToggleSwitch,
  pharmacyProfile
}) => {
  const [localOpen, setLocalOpen] = useState(isPharmacyOpen);

  useEffect(() => { setLocalOpen(isPharmacyOpen); }, [isPharmacyOpen]);

  const handleToggle = () => {
    if (isToggling) return;
    setLocalOpen(prev => !prev);
    onToggleSwitch();
  };

  const daysRemaining   = pharmacyProfile?.daysRemaining              ?? null;
  const subscriptionEnd = pharmacyProfile?.subscriptionEndDate        ?? null;
  const totalDays       = pharmacyProfile?.subscriptionDurationInDays ?? null;

  const formatShortDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return null; }
  };

  const getSubStyle = () => {
    if (daysRemaining === null) return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' };
    if (daysRemaining <= 0)    return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)'  };
    if (daysRemaining <= 7)    return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)'  };
    if (daysRemaining <= 30)   return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' };
    return                            { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)' };
  };

  const subStyle   = getSubStyle();
  const endDateFmt = formatShortDate(subscriptionEnd);
  const pct        = (totalDays && daysRemaining !== null)
    ? Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100))
    : null;

  const navItems = [
    { id: 'dashboard',        icon: <LayoutDashboard size={20} />, label: 'Dashboard'         },
    { id: 'orders',           icon: <ShoppingBag     size={20} />, label: 'Orders'            },
    { id: 'catalog',          icon: <Database        size={20} />, label: 'Medicine Catalog'  },
    { id: 'centralWarehouse', icon: <Globe           size={20} />, label: 'Central Warehouse' },
    { id: 'reports',          icon: <BarChart3       size={20} />, label: 'Financial Reports' },
    { id: 'settings',         icon: <Settings        size={20} />, label: 'Settings'          },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1rem',
      position: 'fixed',
      height: '100vh',
      overflow: 'hidden',        // outer never scrolls
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 4px #10b981; }
          50%      { box-shadow: 0 0 10px #10b981; }
        }
        @keyframes pulse-red {
          0%,100% { box-shadow: 0 0 4px #ef4444; }
          50%      { box-shadow: 0 0 8px #ef4444; }
        }
        @keyframes pulse-amber {
          0%,100% { box-shadow: 0 0 4px #f59e0b; }
          50%      { box-shadow: 0 0 8px #f59e0b; }
        }

        /* thin custom scrollbar for the middle scroll area */
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
      `}</style>

      {/* ── Logo ── fixed, never scrolls ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.6rem', marginBottom: '1rem', flexShrink: 0
      }}>
        <img src="/logo.png" alt="Logo" style={{ width: 72, height: 72, borderRadius: '50%' }} />
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            PharmaAdmin
          </h1>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Portal System
          </span>
        </div>
      </div>

      {/* ── Scrollable middle section ──────────────────────────────────── */}
      <div
        className="sidebar-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          // small negative margin so scrollbar hugs the edge
          marginRight: '-4px',
          paddingRight: '4px',
        }}
      >
        {/* ── Pharmacy status block ────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-main)',
          borderRadius: '10px',
          padding: '0.75rem',
          marginBottom: '1rem',
          flexShrink: 0
        }}>
          {/* Toggle row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.68rem', fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: '0.05em',
            marginBottom: '0.4rem'
          }}>
            PHARMACY STATUS
            {/* Toggle */}
            <div
              onClick={handleToggle}
              title={isToggling ? 'Updating…' : localOpen ? 'Click to close' : 'Click to open'}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: isToggling ? '#9ca3af' : localOpen ? '#10b981' : '#d1d5db',
                cursor: isToggling ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.3s',
                flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 3px'
              }}
            >
              {isToggling ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Loader size={12} color="white"
                    style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s',
                  transform: localOpen ? 'translateX(18px)' : 'translateX(0px)'
                }} />
              )}
            </div>
          </div>

          {/* Open / Closed label */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '0.35rem', marginBottom: '0.65rem'
          }}>
            {isToggling ? (
              <>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Updating…</span>
              </>
            ) : localOpen ? (
              <>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0,
                  animation: 'pulse-green 2s ease-in-out infinite'
                }} />
                <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                  Live · Open
                </span>
              </>
            ) : (
              <>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6b7280', flexShrink: 0 }} />
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Offline · Closed</span>
              </>
            )}
          </div>

          {/* ── Subscription strip ─────────────────────────────────────── */}
          {daysRemaining !== null && (
            <div style={{
              padding: '0.55rem 0.65rem',
              borderRadius: '7px',
              background: subStyle.bg,
              border: `1px solid ${subStyle.border}`,
              display: 'flex', flexDirection: 'column', gap: '0.35rem'
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>
                  Subscription
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', background: subStyle.color,
                    animation: daysRemaining <= 7
                      ? 'pulse-red 1.2s ease-in-out infinite'
                      : daysRemaining <= 30
                        ? 'pulse-amber 2s ease-in-out infinite'
                        : 'none'
                  }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: subStyle.color }}>
                    {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {pct !== null && (
                <div style={{
                  height: 3, background: 'rgba(0,0,0,0.08)',
                  borderRadius: 999, overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: subStyle.color, borderRadius: 999,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              )}

              {/* Expiry date */}
              {endDateFmt && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Expires</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#374151' }}>
                    {endDateFmt}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Nav items ─────────────────────────────────────────────────── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => (
            <a
              key={item.id}
              href="#"
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onMenuClick(item.id); }}
              style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Sign out ── fixed at bottom, never scrolls away ───────────── */}
      <div
        style={{
          flexShrink: 0,
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => {
          if (window.confirm('Are you sure you want to sign out?')) onSignOut();
        }}
      >
        <LogOut size={20} />
        Sign Out
      </div>
    </aside>
  );
};

export default Sidebar;