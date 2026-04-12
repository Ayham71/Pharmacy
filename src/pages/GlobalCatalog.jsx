import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';

const GlobalCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [addedMedicines, setAddedMedicines] = useState([]);
  
  // Global catalog data (this would normally come from an API)
  const [globalCategories] = useState([
    {
      id: 1,
      name: 'Pain Relief',
      icon: '💊',
      medicines: [
        {
          id: 1,
          name: 'Panadol',
          description: 'Paracetamol 500mg - Effective pain relief and fever reduction',
          price: '$5.99',
          image: null
        },
        {
          id: 2,
          name: 'Aspirin',
          description: 'Acetylsalicylic acid 300mg - Pain reliever and anti-inflammatory',
          price: '$3.49',
          image: null
        },
        {
          id: 3,
          name: 'Ibuprofen',
          description: 'Ibuprofen 200mg - Non-steroidal anti-inflammatory drug (NSAID)',
          price: '$4.99',
          image: null
        }
      ]
    },
    {
      id: 2,
      name: 'Antibiotics',
      icon: '💉',
      medicines: [
        {
          id: 4,
          name: 'Amoxicillin',
          description: 'Amoxicillin 500mg - Penicillin antibiotic for bacterial infections',
          price: '$15.99',
          image: null
        },
        {
          id: 5,
          name: 'Azithromycin',
          description: 'Azithromycin 250mg - Macrolide antibiotic',
          price: '$18.50',
          image: null
        }
      ]
    },
    {
      id: 3,
      name: 'Vitamins & Supplements',
      icon: '💪',
      medicines: [
        {
          id: 6,
          name: 'Vitamin D3',
          description: 'Vitamin D3 1000IU - Supports bone health and immune system',
          price: '$12.99',
          image: null
        },
        {
          id: 7,
          name: 'Vitamin C',
          description: 'Vitamin C 1000mg - Immune system support and antioxidant',
          price: '$9.99',
          image: null
        },
        {
          id: 8,
          name: 'Multivitamin',
          description: 'Complete daily multivitamin with minerals',
          price: '$14.99',
          image: null
        }
      ]
    },
    {
      id: 4,
      name: 'Cold & Flu',
      icon: '🤧',
      medicines: [
        {
          id: 9,
          name: 'Cough Syrup',
          description: 'Dextromethorphan 15mg/5ml - Cough suppressant',
          price: '$8.99',
          image: null
        },
        {
          id: 10,
          name: 'Decongestant',
          description: 'Pseudoephedrine 30mg - Nasal decongestant',
          price: '$7.49',
          image: null
        }
      ]
    },
    {
      id: 5,
      name: 'Digestive Health',
      icon: '🍼',
      medicines: [
        {
          id: 11,
          name: 'Antacid',
          description: 'Calcium carbonate 500mg - Relieves heartburn and indigestion',
          price: '$6.99',
          image: null
        },
        {
          id: 12,
          name: 'Probiotics',
          description: 'Multi-strain probiotic - Supports digestive health',
          price: '$19.99',
          image: null
        }
      ]
    }
  ]);

  // Load added medicines from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pharmacyMedicines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const medicineIds = parsed.flatMap(cat => 
          cat.medicines.map(med => `${cat.id}-${med.name}`)
        );
        setAddedMedicines(medicineIds);
      } catch (e) {
        console.error('Failed to load medicines:', e);
      }
    }
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const addMedicineToPharmacy = (category, medicine) => {
    // Get existing pharmacy medicines
    const saved = localStorage.getItem('pharmacyMedicines');
    let pharmacyMedicines = saved ? JSON.parse(saved) : [];

    // Check if category exists
    let categoryIndex = pharmacyMedicines.findIndex(cat => cat.id === category.id);
    
    if (categoryIndex === -1) {
      // Category doesn't exist, create it
      pharmacyMedicines.push({
        id: category.id,
        name: category.name,
        icon: category.icon,
        medicines: [medicine]
      });
    } else {
      // Category exists, check if medicine already added
      const medicineExists = pharmacyMedicines[categoryIndex].medicines.some(
        med => med.name === medicine.name
      );
      
      if (!medicineExists) {
        pharmacyMedicines[categoryIndex].medicines.push(medicine);
      }
    }

    // Save to localStorage
    localStorage.setItem('pharmacyMedicines', JSON.stringify(pharmacyMedicines));
    
    // Update added medicines state
    setAddedMedicines(prev => [...prev, `${category.id}-${medicine.name}`]);
  };

  const isMedicineAdded = (categoryId, medicineName) => {
    return addedMedicines.includes(`${categoryId}-${medicineName}`);
  };

  const filteredCategories = globalCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.medicines.some(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div style={{ padding: '2rem' }}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Global Medicine Catalog</h2>
          <p>Browse and add medicines to your pharmacy inventory</p>
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
            placeholder="Search medicines or categories..."
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

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredCategories.map((category) => (
          <div 
            key={category.id} 
            className="card"
            style={{ overflow: 'hidden' }}
          >
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
                    {category.medicines.length} medicines available
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                {expandedCategories[category.id] ? '▼' : '▶'}
              </span>
            </div>

            {/* Medicines List */}
            {expandedCategories[category.id] && (
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {category.medicines.map((medicine) => {
                    const isAdded = isMedicineAdded(category.id, medicine.name);
                    
                    return (
                      <div
                        key={medicine.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        {/* Medicine Image/Icon */}
                        <div style={{
                          width: '100%',
                          height: '120px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem'
                        }}>
                          {medicine.image ? (
                            <img 
                              src={medicine.image} 
                              alt={medicine.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '6px'
                              }}
                            />
                          ) : (
                            <span>💊</span>
                          )}
                        </div>

                        {/* Medicine Info */}
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                            {medicine.name}
                          </h5>
                          <p style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)',
                            lineHeight: '1.4'
                          }}>
                            {medicine.description}
                          </p>
                        </div>

                        {/* Price and Add Button */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border)'
                        }}>
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--accent)'
                          }}>
                            {medicine.price}
                          </span>
                          
                          <button
                            onClick={() => addMedicineToPharmacy(category, medicine)}
                            disabled={isAdded}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: isAdded ? 'var(--success)' : 'var(--accent)',
                              color: 'white',
                              cursor: isAdded ? 'default' : 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'opacity 0.2s',
                              opacity: isAdded ? 0.7 : 1
                            }}
                          >
                            {isAdded ? (
                              <>
                                <Check size={16} />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus size={16} />
                                Add to Catalog
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalCatalog;