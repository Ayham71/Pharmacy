import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Database, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown, 
  Plus, 
  TrendingUp,
  Package,
  Layers,
  Truck,
  LogOut,
  Pill,
  MoreVertical
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'MON', value: 18000 },
  { name: 'TUE', value: 24000 },
  { name: 'WED', value: 20000 },
  { name: 'THU', value: 34000 },
  { name: 'FRI', value: 22000 },
  { name: 'SAT', value: 40000 },
  { name: 'SUN', value: 38000 },
];

const StatCard = ({ title, value, change, icon: Icon, colorClass }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={20} />
      </div>
      {change && <span className="stat-change positive">{change}</span>}
    </div>
    <div className="stat-label">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const MedicineProgress = ({ name, progress }) => (
  <div className="medicine-item">
    <div className="med-icon">
      <Pill size={18} />
    </div>
    <div className="med-info">
      <div className="med-name-row">
        <span>{name}</span>
        <span style={{color: 'var(--accent)'}}>{progress}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  </div>
);

const Dashboard = ({ onSignOut }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(true);

  const [recentOrders, setRecentOrders] = useState([
    { id: '#ORD-2841', name: 'James Miller', status: 'Pending', amount: '$142.00' },
    { id: '#ORD-2839', name: 'Thomas Shelby', status: 'Completed', amount: '$210.80' },
    { id: '#ORD-2838', name: 'Arthur Shelby', status: 'Completed', amount: '$85.00' },
    { id: '#ORD-2837', name: 'John Doe', status: 'Pending', amount: '$45.20' }
  ]);

  const [allOrders, setAllOrders] = useState([
    { id: '#ORD-2841', name: 'James Miller', items: 3, total: '$142.00', status: 'Pending', date: '2026-02-05' },
    { id: '#ORD-2839', name: 'Thomas Shelby', items: 5, total: '$210.80', status: 'Completed', date: '2026-02-04' },
    { id: '#ORD-2838', name: 'Arthur Shelby', items: 2, total: '$85.00', status: 'Completed', date: '2026-02-04' },
    { id: '#ORD-2837', name: 'John Doe', items: 1, total: '$45.20', status: 'Pending', date: '2026-02-03' },
    { id: '#ORD-2836', name: 'Sarah Wilson', items: 4, total: '$178.50', status: 'Processing', date: '2026-02-03' }
  ]);

  const [statusFilter, setStatusFilter] = useState(null);

  const filteredOrders = statusFilter ? allOrders.filter(order => order.status === statusFilter) : allOrders;

  const [activeDropdownOrder, setActiveDropdownOrder] = useState(null);

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setActiveDropdownOrder(null);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const update = (orders) => orders.map((order) => order.id === orderId ? {...order, status: newStatus} : order);
    setRecentOrders((prev) => update(prev));
    setAllOrders((prev) => update(prev));
    setActiveDropdownOrder(null);
  };

  const toggleOrderDropdown = (orderId) => {
    setActiveDropdownOrder((prev) => (prev === orderId ? null : orderId));
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownOrder(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);


  const handleToggleSwitch = () => {
    setIsPharmacyOpen(!isPharmacyOpen);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

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
    <div className="app-container">
      {/* Sidebar */}
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
              onClick={handleToggleSwitch}
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
          <a href="#" className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => handleMenuClick('dashboard')}>
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" className={`nav-item ${activeMenu === 'orders' ? 'active' : ''}`} onClick={() => handleMenuClick('orders')}>
            <ShoppingBag size={20} />
            Orders
          </a>
          <a href="#" className={`nav-item ${activeMenu === 'catalog' ? 'active' : ''}`} onClick={() => handleMenuClick('catalog')}>
            <Database size={20} />
            Medicine Catalog
          </a>
          <a href="#" className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`} onClick={() => handleMenuClick('reports')}>
            <BarChart3 size={20} />
            Financial Reports
          </a>
          <a href="#" className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => handleMenuClick('settings')}>
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

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder="Search medicines, orders, or patients..." />
          </div>

          <div className="header-actions">
            <div style={{position: 'relative', cursor: 'pointer'}}>
              <Bell size={20} color="var(--text-muted)" />
              <div style={{position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white'}}></div>
            </div>
            <div className="user-profile">
              The Honey Pharmacy 
            </div>
          </div>
        </header>

        {activeMenu === 'dashboard' && (
          <>
            <section className="overview-header">
              <div className="overview-title">
                <h2>Daily Overview</h2>
                <p>Last updated: {formatDateTime(currentTime)}</p>
              </div>
              
            </section>

            <section className="stats-grid">
              <StatCard 
                title="Total Sales Today" 
                value="$14,250.00" 
                change="+12.4%" 
                icon={TrendingUp} 
                colorClass="sales"
              />
              <StatCard 
                title="New Orders" 
                value="24" 
                change="8 Pending" 
                icon={Package} 
                colorClass="orders"
              />
              <StatCard 
                title="Active Items (SKU)" 
                value="1,842" 
                change="Normal" 
                icon={Layers} 
                colorClass="items"
              />
              <StatCard 
                title="Delivery Success" 
                value="99.2%" 
                change="99.2% Rate" 
                icon={Truck} 
                colorClass="delivery"
              />
            </section>

            <div className="content-row">
              <div className="card">
                <div className="card-title">
                  <div>
                    Sales Performance
                    <div style={{fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: 4}}>Weekly revenue trends</div>
                  </div>
                  <div style={{display: 'flex', gap: 10}}>
                    <span style={{fontSize: '0.75rem', 
                      background: 'var(--accent-light)', 
                      color: 'var(--accent)', padding: '4px 8px', 
                      borderRadius: 4, fontWeight: 600,
                      cursor: 'pointer'}}>Weekly</span>

                    <span style={{fontSize: '0.75rem', 
                      background: 'var(--bg-main)', 
                      color: 'var(--text-muted)', 
                      padding: '4px 8px', borderRadius: 4, 
                      fontWeight: 600, cursor: 'pointer'}}>Monthly</span>
                  </div>
                </div>
                <div style={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
                      <YAxis hide={true} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="var(--accent)" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Top 5 Medicines</div>
                <div className="medicine-list">
                  <MedicineProgress name="Panadol" progress={85} />
                  <MedicineProgress name="Aspirin" progress={65} />
                  <MedicineProgress name="Vitamin D3" progress={58} />
                  <MedicineProgress name="Ibuprofen" progress={42} />
                  <MedicineProgress name="Morphine" progress={30} />
                </div>
              </div>
            </div>

            <section className="card">
              <div className="card-title">
                Recent Orders
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMenuClick('orders')}
                  onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMenuClick('orders'); }}
                  style={{color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer', paddingLeft: '1.5rem'}}
                >
                  View All
                </span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th style={{textAlign: 'right'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr key={order.id}> 
                        <td style={{fontWeight: 600}}>{order.id}</td>
                        <td>{order.name}</td>
                        <td>
                          <span className={`status-badge ${order.status === 'Pending' ? 'status-pending' : order.status === 'Completed' ? 'status-completed' : 'status-processing'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{fontWeight: 600}}>{order.amount}</td>
                        <td style={{textAlign: 'right', position: 'relative'}}>
                          <div style={{display: 'inline-block', position: 'relative'}} onClick={(e) => e.stopPropagation()}>
                            <MoreVertical
                              size={18}
                              color="var(--text-muted)"
                              style={{cursor: 'pointer'}}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderDropdown(order.id);
                              }}
                            />
                            {activeDropdownOrder === order.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: 6,
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 20,
                                padding: '0.25rem 0',
                                minWidth: 140,
                              }}>
                                {['Pending', 'Completed', 'Processing'].map((status) => (
                                  <div
                                    key={status}
                                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, status); }}
                                    style={{
                                      padding: '0.45rem 0.8rem',
                                      cursor: 'pointer',
                                      color: 'var(--text-main)',
                                      fontSize: '0.85rem',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {status}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeMenu === 'orders' && (
          <div style={{padding: '2rem'}}>
            <section className="overview-header">
              <div className="overview-title">
                <h2>Orders Management</h2>
                <p>Last updated: {formatDateTime(currentTime)}</p>
              </div>
              <button className="btn-primary">
                <Plus size={20} />
                New Order
              </button>
            </section>

            <section className="card">
              <div className="card-title">
                All Orders
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <input type="text" placeholder="Search orders..."
                   style={{padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} />
                  <select value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || null)} style={{padding: '0.5rem', 
                    border: '1px solid var(--border)', borderRadius: '6px',
                    cursor: 'pointer'}}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{textAlign: 'right'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={{fontWeight: 600}}>{order.id}</td>
                        <td>{order.name}</td>
                        <td>{order.items} items</td>
                        <td style={{fontWeight: 600}}>{order.total}</td>
                        <td>
                          <span 
                            className={`status-badge ${
                              order.status === 'Pending' ? 'status-pending' : 
                              order.status === 'Completed' ? 'status-completed' : 
                              'status-processing'
                            }`}
                            onClick={() => setStatusFilter(order.status === statusFilter ? null : order.status)}
                            style={{cursor: 'pointer'}}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td style={{textAlign: 'right', position: 'relative'}}>
                          <div style={{display: 'inline-block', position: 'relative'}} onClick={(e) => e.stopPropagation()}>
                            <MoreVertical
                              size={18}
                              color="var(--text-muted)"
                              style={{cursor: 'pointer'}}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderDropdown(order.id);
                              }}
                            />
                            {activeDropdownOrder === order.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: 6,
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 20,
                                padding: '0.25rem 0',
                                minWidth: 140,
                              }}>
                                {['Pending', 'Completed', 'Processing'].map((status) => (
                                  <div
                                    key={status}
                                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, status); }}
                                    style={{
                                      padding: '0.45rem 0.8rem',
                                      cursor: 'pointer',
                                      color: 'var(--text-main)',
                                      fontSize: '0.85rem',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {status}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeMenu === 'catalog' && (
          <div style={{padding: '2rem'}}>
            <section className="overview-header">
              <div className="overview-title">
                <h2>Medicine Catalog</h2>
                <p>Last updated: {formatDateTime(currentTime)}</p>
              </div>
              <button className="btn-primary">
                <Plus size={20} />
                Add Medicine
              </button>
            </section>

            <section className="card">
              <div className="card-title">
                Medicine Inventory
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <input type="text" placeholder="Search medicines..." style={{padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} />
                  <select style={{padding: '0.5rem',
                     border: '1px solid var(--border)', borderRadius: '6px',
                     cursor: 'pointer'}}>
                    <option>All Categories</option>
                    <option>Pain Relief</option>
                    <option>Antibiotics</option>
                    <option>Vitamins</option>
                  </select>
                </div>
              </div>
              <div className="medicine-list">
                {[
                  { name: 'Panadol', category: 'Pain Relief', stock: 150, price: '$5.99' },
                  { name: 'Aspirin', category: 'Pain Relief', stock: 89, price: '$3.49' },
                  { name: 'Vitamin D3', category: 'Vitamins', stock: 200, price: '$12.99' },
                  { name: 'Ibuprofen', category: 'Pain Relief', stock: 75, price: '$4.99' },
                  { name: 'Amoxicillin', category: 'Antibiotics', stock: 45, price: '$15.99' }
                ].map((medicine, i) => (
                  <div key={i} className="medicine-item" style={{padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '0.5rem'}}>
                    <div className="med-icon">
                      <Pill size={18} />
                    </div>
                    <div className="med-info" style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontWeight: 600}}>{medicine.name}</span>
                        <span style={{color: 'var(--accent)', fontWeight: 600}}>{medicine.price}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem'}}>
                        <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{medicine.category}</span>
                        <span style={{fontSize: '0.85rem', color: medicine.stock < 50 ? 'var(--danger)' : 'var(--success)'}}>
                          {medicine.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeMenu === 'reports' && (
          <div style={{padding: '2rem'}}>
            <section className="overview-header">
              <div className="overview-title">
                <h2>Financial Reports</h2>
                <p>Last updated: {formatDateTime(currentTime)}</p>
              </div>
            </section>

            <section className="stats-grid">
              <StatCard 
                title="Monthly Revenue" 
                value="$45,230.00" 
                change="+8.2%" 
                icon={TrendingUp} 
                colorClass="sales"
              />
              <StatCard 
                title="Profit Margin" 
                value="32.4%" 
                change="+2.1%" 
                icon={BarChart3} 
                colorClass="orders"
              />
              <StatCard 
                title="Top Product" 
                value="Panadol" 
                change="$2,340 sales" 
                icon={Package} 
                colorClass="items"
              />
              <StatCard 
                title="Avg Order Value" 
                value="$87.50" 
                change="+5.3%" 
                icon={TrendingUp} 
                colorClass="delivery"
              />
            </section>

            <div className="card">
              <div className="card-title">Revenue Chart</div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
                    <YAxis hide={true} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--accent)" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'settings' && (
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
                    <input type="text" defaultValue="TheHoney Pharmacy " style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} />
                  </div>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Contact Email</label>
                    <input type="email" defaultValue="contact@honey.com" style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} />
                  </div>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Phone Number</label>
                    <input type="tel" defaultValue="+962 (79) 999-9999" style={{width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">System Preferences</div>
                <div style={{padding: '1rem'}}>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <input type="checkbox" defaultChecked />
                      <span>Email notifications for new orders</span>
                    </label>
                  </div>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <input type="checkbox" defaultChecked />
                      <span>Auto-backup data daily</span>
                    </label>
                  </div>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <input type="checkbox" />
                      <span>Two-factor authentication</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
