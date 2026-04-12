import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Layers, Pill } from 'lucide-react';
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

const DashboardHome = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentOrders, setRecentOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalMedicines, setTotalMedicines] = useState(0);

  const [topMedicines] = useState([
    { name: 'Panadol', progress: 85, sales: 342 },
    { name: 'Aspirin', progress: 65, sales: 256 },
    { name: 'Vitamin D3', progress: 58, sales: 198 },
    { name: 'Ibuprofen', progress: 42, sales: 145 },
    { name: 'Amoxicillin', progress: 30, sales: 89 }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load orders and count medicines
  useEffect(() => {
    loadOrders();
    countMedicines();
  }, []);

  const loadOrders = () => {
    // Load from localStorage or use default data
    const savedOrders = localStorage.getItem('allOrders');
    
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        setRecentOrders(orders);
        setTotalOrders(orders.length);
      } catch (e) {
        console.error('Failed to load orders:', e);
        setDefaultOrders();
      }
    } else {
      setDefaultOrders();
    }
  };

  const setDefaultOrders = () => {
    const defaultOrders = [
      { id: '#ORD-2841', name: 'James Miller', status: 'Pending', amount: '$142.00', date: '2024-02-05T10:30:00' },
      { id: '#ORD-2839', name: 'Thomas Shelby', status: 'Completed', amount: '$210.80', date: '2024-02-04T14:20:00' },
      { id: '#ORD-2838', name: 'Arthur Shelby', status: 'Completed', amount: '$85.00', date: '2024-02-04T09:15:00' },
      { id: '#ORD-2837', name: 'John Doe', status: 'Pending', amount: '$45.20', date: '2024-02-03T16:45:00' },
      { id: '#ORD-2836', name: 'Sarah Wilson', status: 'Processing', amount: '$178.50', date: '2024-02-03T11:00:00' }
    ];
    setRecentOrders(defaultOrders);
    setTotalOrders(defaultOrders.length);
    localStorage.setItem('allOrders', JSON.stringify(defaultOrders));
  };

  const countMedicines = () => {
    const savedMedicines = localStorage.getItem('pharmacyMedicines');
    
    if (savedMedicines) {
      try {
        const medicines = JSON.parse(savedMedicines);
        const count = medicines.reduce((total, category) => {
          return total + category.medicines.length;
        }, 0);
        setTotalMedicines(count);
      } catch (e) {
        console.error('Failed to count medicines:', e);
        setTotalMedicines(0);
      }
    } else {
      setTotalMedicines(0);
    }
  };

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
          title="Orders" 
          value={totalOrders.toString()} 
          icon={Package} 
          colorClass="orders"
        />
        <StatCard 
          title="Items" 
          value={totalMedicines.toString()}  
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
            <span
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('orders')}
              onKeyPress={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  onNavigate && onNavigate('orders');
                }
              }}
              style={{
                color: 'var(--accent)', 
                fontSize: '0.85rem', 
                cursor: 'pointer', 
                fontWeight: 500,
                textDecoration: 'underline',
                marginLeft: '1.5rem'
              }}
            >
              View All Orders →
            </span>
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
                </tr>
              </thead>
              <tbody>
                {sortedOrders.slice(0, 5).map((order) => (
                  <tr 
                    key={order.id}
                    onClick={() => onNavigate && onNavigate('orders')}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  > 
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
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400}}>
              <br />Best sellers this week
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