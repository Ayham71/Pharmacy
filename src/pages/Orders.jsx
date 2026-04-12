import React, { useState, useEffect } from 'react';
import { MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';

const Orders = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeDropdownOrder, setActiveDropdownOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [allOrders, setAllOrders] = useState([
    { 
      id: '#ORD-2841', 
      name: 'James Miller', 
      items: [
        { name: 'Panadol', quantity: 2, price: '$10.00' },
        { name: 'Aspirin', quantity: 1, price: '$5.00' }
      ],
      total: '$142.00', 
      status: 'Pending', 
      date: '2024-02-05T10:30:00' 
    },
    { 
      id: '#ORD-2839', 
      name: 'Thomas Shelby', 
      items: [
        { name: 'Vitamin D3', quantity: 3, price: '$38.97' },
        { name: 'Ibuprofen', quantity: 2, price: '$9.98' }
      ],
      total: '$210.80', 
      status: 'Completed', 
      date: '2024-02-04T14:20:00' 
    },
    { 
      id: '#ORD-2838', 
      name: 'Arthur Shelby', 
      items: [
        { name: 'Amoxicillin', quantity: 1, price: '$15.99' }
      ],
      total: '$85.00', 
      status: 'Completed', 
      date: '2024-02-04T09:15:00' 
    },
    { 
      id: '#ORD-2837', 
      name: 'John Doe', 
      items: [
        { name: 'Panadol', quantity: 1, price: '$5.00' }
      ],
      total: '$45.20', 
      status: 'Pending', 
      date: '2024-02-03T16:45:00' 
    },
    { 
      id: '#ORD-2836', 
      name: 'Sarah Wilson', 
      items: [
        { name: 'Vitamin C', quantity: 2, price: '$20.00' },
        { name: 'Paracetamol', quantity: 3, price: '$15.00' }
      ],
      total: '$178.50', 
      status: 'Processing', 
      date: '2024-02-03T11:00:00' 
    }
  ]);

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
    setAllOrders(prev => prev.map(order => 
      order.id === orderId ? {...order, status: newStatus} : order
    ));
    setActiveDropdownOrder(null);
  };

  const toggleOrderDropdown = (orderId) => {
    setActiveDropdownOrder(prev => (prev === orderId ? null : orderId));
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(prev => (prev === orderId ? null : orderId));
  };

  // Filter and search orders
  const filteredOrders = allOrders
    .filter(order => statusFilter ? order.status === statusFilter : true)
    .filter(order => 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

  return (
    <div style={{padding: '2rem'}}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Orders Management</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      <section className="card">
        <div className="card-title">
          All Orders
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <input 
              type="text" 
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} 
            />
            <select 
              value={statusFilter || ''} 
              onChange={(e) => setStatusFilter(e.target.value || null)} 
              style={{
                padding: '0.5rem', 
                border: '1px solid var(--border)', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
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
                <React.Fragment key={order.id}>
                  <tr>
                    <td style={{fontWeight: 600}}>
                      <span 
                        onClick={() => toggleExpandOrder(order.id)}
                        style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                      >
                        {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {order.id}
                      </span>
                    </td>
                    <td>{order.name}</td>
                    <td>{order.items.length} items</td>
                    <td style={{fontWeight: 600}}>{order.total}</td>
                    <td>
                      <span 
                        className={`status-badge ${
                          order.status === 'Pending' ? 'status-pending' : 
                          order.status === 'Completed' ? 'status-completed' : 
                          'status-processing'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.date).toLocaleDateString()}</td>
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
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan="7" style={{backgroundColor: 'var(--bg-main)', padding: '1rem'}}>
                        <div style={{marginLeft: '2rem'}}>
                          <h4 style={{marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                            Order Items:
                          </h4>
                          <ul style={{listStyle: 'none', padding: 0}}>
                            {order.items.map((item, index) => (
                              <li key={index} style={{
                                padding: '0.5rem 0',
                                borderBottom: index < order.items.length - 1 ? '1px solid var(--border)' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.9rem'
                              }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{fontWeight: 600}}>{item.price}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Orders;