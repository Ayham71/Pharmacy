import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Database, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeMenu, onMenuClick, onSignOut, isPharmacyOpen, onToggleSwitch }) => {
  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-icon">
          <img src="/logo.jpeg" alt="Logo" style={{width: 70, height: 70}} />
        </div>
        <div className="logo-text">
          <h1>PharmaAdmin</h1>
          <span>Portal System</span>
        </div>
      </div>

      <div className="pharmacy-status">
        <div className="status-label">
          PHARMACY OPEN
          <div 
            className="toggle-switch" 
            onClick={onToggleSwitch}
            style={{
              width: 30, 
              height: 16, 
              background: isPharmacyOpen ? 'var(--accent)' : '#ccc', 
              borderRadius: 10,
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.3s',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
          >
            <div 
              style={{
                width: 12,
                height: 12,
                background: 'white',
                borderRadius: '50%',
                transition: 'transform 0.3s',
                transform: isPharmacyOpen ? 'translateX(12px)' : 'translateX(0)'
              }}
            />
          </div>
        </div>
        <div className="status-indicator">
          <div className="dot"></div>
          {isPharmacyOpen ? 'Live Server' : 'Offline'}
        </div>
      </div>

      <nav className="nav-menu">
        <a 
          href="#" 
          className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onMenuClick('dashboard'); }}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </a>
        <a 
          href="#" 
          className={`nav-item ${activeMenu === 'orders' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onMenuClick('orders'); }}
        >
          <ShoppingBag size={20} />
          Orders
        </a>
        <a 
          href="#" 
          className={`nav-item ${activeMenu === 'catalog' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onMenuClick('catalog'); }}
        >
          <Database size={20} />
          Medicine Catalog
        </a>
        <a 
          href="#" 
          className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onMenuClick('reports'); }}
        >
          <BarChart3 size={20} />
          Financial Reports
        </a>
        <a 
          href="#" 
          className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); onMenuClick('settings'); }}
        >
          <Settings size={20} />
          Settings
        </a>
      </nav>

      <div className="sign-out" onClick={onSignOut}>
        <LogOut size={20} />
        <div>
          <div style={{fontWeight: 600}}>Sign Out</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;