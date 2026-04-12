import React, { useState, useEffect } from 'react';
import { Plus, Pill } from 'lucide-react';

const MedicineCatalog = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Panadol', category: 'Pain Relief', price: '$5.99', inStock: true },
    { id: 2, name: 'Aspirin', category: 'Pain Relief', price: '$3.49', inStock: true },
    { id: 3, name: 'Vitamin D3', category: 'Vitamins', price: '$12.99', inStock: false },
    { id: 4, name: 'Ibuprofen', category: 'Pain Relief', price: '$4.99', inStock: true },
    { id: 5, name: 'Amoxicillin', category: 'Antibiotics', price: '$15.99', inStock: true }
  ]);

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

  const toggleStock = (id) => {
    setMedicines(prev => prev.map(medicine => 
      medicine.id === id ? {...medicine, inStock: !medicine.inStock} : medicine
    ));
  };

  return (
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
            <input 
              type="text" 
              placeholder="Search medicines..." 
              style={{padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px'}} 
            />
            <select style={{
              padding: '0.5rem',
              border: '1px solid var(--border)', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              <option>All Categories</option>
              <option>Pain Relief</option>
              <option>Antibiotics</option>
              <option>Vitamins</option>
            </select>
          </div>
        </div>
        <div className="medicine-list">
          {medicines.map((medicine) => (
            <div 
              key={medicine.id} 
              className="medicine-item" 
              style={{
                padding: '1rem', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                marginBottom: '0.5rem'
              }}
            >
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
                  <button
                    onClick={() => toggleStock(medicine.id)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      backgroundColor: medicine.inStock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: medicine.inStock ? 'var(--success)' : 'var(--danger)'
                    }}
                  >
                    {medicine.inStock ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MedicineCatalog;