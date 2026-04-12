import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Layers, MoreVertical, Pill } from 'lucide-react';
import StatCard from './StatCard';

const MedicineProgress = ({ name, progress, sales }) => (
  <div className="medicine-item">
    <div className="med-icon">
      <Pill size={18} />
    </div>
    <div className="med-info">
      <div className="med-name-row">
        <span>{name}</span>
        <span style={{color: 'var(--accent)', fontWeight: 600}}>{sales} sold</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  </div>
);

const DashboardHome = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentOrders, setRecentOrders] = useState([
    { id: '#ORD-2841', name: 'James Miller', status: 'Pending', amount: '$142.00', date: '2024-02-05T10:30:00' },
    { id: '#ORD-2839', name: 'Thomas Shelby', status: 'Completed', amount: '$210.80', date: '2024-02-04T14:20:00' },
    { id: '#ORD-2838', name: 'Arthur Shelby', status: 'Completed', amount: '$85.00', date: '2024-02-04T09:15:00' },
    { id: '#ORD-2837', name: 'John Doe', status: 'Pending', amount: '$45.20', date: '2024-02-03T16:45:00' },
    { id: '#ORD-2836', name: 'Sarah Wilson', status: 'Processing', amount: '$178.50', date: '2024-02-03T11:00:00' }
  ]);

  const [topMedicines] = useState([
    { name: 'Panadol', progress: 85, sales: 342 },
    { name: 'Aspirin', progress: 65, sales: 256 },
    { name: 'Vitamin D3', progress: 58, sales: 198 },
    { name: 'Ibuprofen', progress: 42, sales: 145 },
    { name: 'Amoxicillin', progress: 30, sales: 89 }
  ]);

  const [activeDropdownOrder, setActiveDropdownOrder] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownOrder(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
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

  const updateOrderStatus = (orderId, newStatus) => {
    setRecentOrders(prev => prev.map(order => 
      order.id === orderId ? {...order, status: newStatus} : order
    ));
    setActiveDropdownOrder(null);
  };

  const toggleOrderDropdown = (orderId) => {
    setActiveDropdownOrder(prev => (prev === orderId ? null : orderId));
  };

  // Sort orders by date (newest first)
  const sortedOrders = [...recentOrders].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Daily Overview</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard 
          title="Total Sales" 
          value="$14,250.00"  
          icon={TrendingUp} 
          colorClass="sales"
        />
        <StatCard 
          title="New Orders" 
          value="24" 
          icon={Package} 
          colorClass="orders"
        />
        <StatCard 
          title="Active Items" 
          value="1,842"  
          icon={Layers} 
          colorClass="items"
        />
      </section>

      {/* Two Column Layout for Recent Orders and Top Medicines */}
      <div className="content-row">
        {/* Recent Orders - Left Side */}
        <section className="card">
          <div className="card-title">
            Recent Orders
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th style={{textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.slice(0, 5).map((order) => (
                  <tr key={order.id}> 
                    <td style={{fontWeight: 600}}>{order.id}</td>
                    <td>{order.name}</td>
                    <td style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        order.status === 'Pending' ? 'status-pending' : 
                        order.status === 'Completed' ? 'status-completed' : 
                        'status-processing'
                      }`}>
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

        {/* Top Medicines - Right Side */}
        <section className="card">
          <div className="card-title">
            Top 5 Medicines
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400}}><br />              Best sellers this week
            </span>
          </div>
          <div className="medicine-list">
            {topMedicines.map((medicine, index) => (
              <MedicineProgress 
                key={index}
                name={medicine.name} 
                progress={medicine.progress}
                sales={medicine.sales}
              />
            ))}
          </div>
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
              Total Units Sold
            </span>
            <span style={{fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)'}}>
              1,030
            </span>
          </div>
        </section>
      </div>
    </>
  );
};

export default DashboardHome;