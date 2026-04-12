import React, { useState, useEffect } from 'react';
import { Plus, Pill, Edit2, Trash2 } from 'lucide-react';

const MedicineCatalog = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load medicines from localStorage
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = () => {
    const saved = localStorage.getItem('pharmacyMedicines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMedicines(parsed);
      } catch (e) {
        console.error('Failed to load medicines:', e);
        setMedicines([]);
      }
    } else {
      setMedicines([]);
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

  const toggleStock = (categoryId, medicineName) => {
    const updatedMedicines = medicines.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          medicines: cat.medicines.map(med =>
            med.name === medicineName
              ? { ...med, inStock: !med.inStock }
              : med
          )
        };
      }
      return cat;
    });

    setMedicines(updatedMedicines);
    localStorage.setItem('pharmacyMedicines', JSON.stringify(updatedMedicines));
  };

  const removeMedicine = (categoryId, medicineName) => {
    if (!window.confirm('Remove this medicine from your catalog?')) return;

    const updatedMedicines = medicines.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          medicines: cat.medicines.filter(med => med.name !== medicineName)
        };
      }
      return cat;
    }).filter(cat => cat.medicines.length > 0); // Remove empty categories

    setMedicines(updatedMedicines);
    localStorage.setItem('pharmacyMedicines', JSON.stringify(updatedMedicines));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const filteredMedicines = medicines.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.medicines.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{padding: '2rem'}}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Medicine Catalog</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          maxWidth: '400px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.95rem',
              background: 'transparent'
            }}
          />
        </div>
      </div>

      {/* Medicine List */}
      {filteredMedicines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            No medicines in your catalog
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Go to Global Catalog to add medicines to your inventory
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMedicines.map((category) => (
            <div key={category.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  backgroundColor: 'var(--bg-main)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: expandedCategories[category.id] ? '1px solid var(--border)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '28px' }}>{category.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                      {category.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {category.medicines.length} medicine{category.medicines.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                  {expandedCategories[category.id] ? '▼' : '▶'}
                </span>
              </div>

              {/* Medicines */}
              {expandedCategories[category.id] && (
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {category.medicines.map((medicine) => (
                      <div
                        key={medicine.name}
                        style={{
                          padding: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                      >
                        {/* Icon */}
                        <div className="med-icon">
                          <Pill size={18} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{medicine.name}</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{medicine.price}</span>
                          </div>
                          {medicine.description && (
                            <p style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-muted)',
                              margin: '0.25rem 0 0 0',
                              lineHeight: '1.4'
                            }}>
                              {medicine.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => toggleStock(category.id, medicine.name)}
                              style={{
                                fontSize: '0.85rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                backgroundColor: medicine.inStock !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: medicine.inStock !== false ? 'var(--success)' : 'var(--danger)'
                              }}
                            >
                              {medicine.inStock !== false ? 'In Stock' : 'Out of Stock'}
                            </button>

                            <button
                              onClick={() => removeMedicine(category.id, medicine.name)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                border: '1px solid var(--danger)',
                                backgroundColor: 'transparent',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineCatalog;