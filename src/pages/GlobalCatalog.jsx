import React, { useState, useEffect } from 'react';
import { Plus, Check, Loader, AlertCircle } from 'lucide-react';

const GlobalCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [addedMedicines, setAddedMedicines] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingMedicine, setAddingMedicine] = useState({});

  const API_BASE_URL = 'http://165.22.91.187:5000/api';
  const IMAGE_BASE_URL = 'http://165.22.91.187:5000';

  const getAuthToken = () => {
    return localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt');
  };

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'pain': '💊',
      'antibiotic': '💉',
      'vitamin': '💪',
      'supplement': '💪',
      'cold': '🤧',
      'flu': '🤧',
      'digest': '🍼',
      'allergy': '🤧',
      'skin': '🧴',
      'first aid': '🩹',
      'cardio': '❤️',
      'heart': '❤️',
      'diabetes': '💉',
      'respiratory': '🫁',
      'eye': '👁️',
      'ear': '👂'
    };
    const normalized = (categoryName || '').toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalized.includes(key)) return icon;
    }
    return '💊';
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return 'N/A';
    if (typeof price === 'number') return `$${price.toFixed(2)}`;
    if (typeof price === 'string') {
      if (price.includes('$') || price.includes('€') || price.includes('£')) return price;
      const numPrice = parseFloat(price);
      if (!isNaN(numPrice)) return `$${numPrice.toFixed(2)}`;
    }
    return 'N/A';
  };

  useEffect(() => {
    fetchMedicines();
    loadAddedMedicines();
  }, []);

  // ─── Transform API data ───────────────────────────────────────────────────────
  const transformAPIData = (apiData) => {
    console.log('Raw API data received:', apiData);

    let categories = [];

    // Case 1: direct array of category objects
    if (Array.isArray(apiData)) {
      categories = apiData;
      console.log('Case 1 – top-level array, length:', categories.length);
    }
    // Case 2: { categories: [...] }
    else if (apiData && Array.isArray(apiData.categories)) {
      categories = apiData.categories;
      console.log('Case 2 – apiData.categories, length:', categories.length);
    }
    // Case 3: { data: [...] }
    else if (apiData && Array.isArray(apiData.data)) {
      categories = apiData.data;
      console.log('Case 3 – apiData.data, length:', categories.length);
    }
    // Case 4: { result: [...] }
    else if (apiData && Array.isArray(apiData.result)) {
      categories = apiData.result;
      console.log('Case 4 – apiData.result, length:', categories.length);
    }
    else {
      console.warn('Unknown API shape:', apiData);
      return [];
    }

    return categories.map((cat, index) => {
      // ── category id & name ──────────────────────────────────────────────────
      const categoryId =
        cat.id          ?? cat.categoryId  ?? cat.CategoryId  ??
        cat.CategoryID  ?? cat._id         ?? index + 1;

      const categoryName =
        cat.categoryName ?? cat.name       ?? cat.CategoryName ??
        cat.category     ?? cat.Name       ?? cat.title        ?? 'Uncategorized';

      // ── medications array – try every likely key ────────────────────────────
      const medications =
        cat.medications  ?? cat.medicines  ?? cat.Medications  ??
        cat.Medicines    ?? cat.items      ?? cat.Items        ??
        cat.products     ?? cat.Products   ?? [];

      console.log(`Category "${categoryName}" (id ${categoryId}) – ${medications.length} medications`);

      const transformedMeds = (Array.isArray(medications) ? medications : []).map((med, medIndex) => {
        // ── id ────────────────────────────────────────────────────────────────
        const medId =
          med.id              ?? med.medicationId  ?? med.medicineId  ??
          med.MedicationId    ?? med.MedicineId    ?? med._id         ??
          `${categoryId}-${medIndex}`;

        // ── name ──────────────────────────────────────────────────────────────
        const medName =
          med.medicationName  ?? med.name          ?? med.medicineName ??
          med.MedicationName  ?? med.MedicineName  ?? med.Name        ??
          med.title           ?? med.productName   ?? 'Unnamed Medicine';

        // ── description / active ingredient ───────────────────────────────────
        const medDesc =
          med.activeIngredient ?? med.description  ?? med.details      ??
          med.ActiveIngredient ?? med.Description  ?? med.Details      ??
          med.info             ?? med.summary       ?? med.about        ?? '';

        // ── price ─────────────────────────────────────────────────────────────
        const medPrice =
          med.price ?? med.cost ?? med.Price ?? med.Cost ?? med.amount ?? 0;

        // ── image ─────────────────────────────────────────────────────────────
        const medImage =
          med.image     ?? med.imageUrl  ?? med.imagePath  ??
          med.Image     ?? med.ImageUrl  ?? med.ImagePath  ??
          med.photo     ?? med.Photo     ?? null;

        console.log(`  ✔ ${medName} | id=${medId} | price=${medPrice} | img=${medImage}`);

        return {
          id:          medId,
          name:        medName,
          description: medDesc,
          price:       formatPrice(medPrice),
          image:       getImageUrl(medImage),
          originalData: med
        };
      });

      return {
        id:        categoryId,
        name:      categoryName,
        icon:      getCategoryIcon(categoryName),
        medicines: transformedMeds
      };
    }).filter(cat => cat.medicines.length > 0);
  };

  // ─── Fetch medicines ──────────────────────────────────────────────────────────
  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found. Please log in again.');

      const response = await fetch(
        `${API_BASE_URL}/PharmacyMedication/available-medicines-by-categories`,
        { method: 'GET', headers: getHeaders() }
      );

      if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
      if (!response.ok)           throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('=== RAW GLOBAL CATALOG RESPONSE ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('====================================');

      const transformed = transformAPIData(data);
      console.log('=== TRANSFORMED GLOBAL CATALOG ===');
      console.log(JSON.stringify(transformed, null, 2));
      console.log('===================================');

      setGlobalCategories(transformed);

    } catch (err) {
      console.error('fetchMedicines error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Load already-added medicines from my inventory ───────────────────────────
  const loadAddedMedicines = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/PharmacyMedication/my-inventory`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) return;

      const data = await response.json();
      console.log('My inventory (for added check):', data);

      // Collect every medication id that is already in the pharmacy's inventory
      const addedIds = new Set();

      const collectIds = (items) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          // flat medication
          const directId = item.id ?? item.medicationId ?? item.medicineId ?? item._id;
          if (directId) addedIds.add(String(directId));

          // nested: { categories: [{ medications: [...] }] }
          if (Array.isArray(item.categories)) {
            item.categories.forEach(cat => {
              const meds = cat.medications ?? cat.medicines ?? [];
              meds.forEach(med => {
                const id = med.id ?? med.medicationId ?? med.medicineId ?? med._id;
                if (id) addedIds.add(String(id));
              });
            });
          }
        });
      };

      if (Array.isArray(data)) {
        collectIds(data);
      } else if (data.categories) {
        // single pharmacy object
        data.categories.forEach(cat => {
          const meds = cat.medications ?? cat.medicines ?? [];
          meds.forEach(med => {
            const id = med.id ?? med.medicationId ?? med.medicineId ?? med._id;
            if (id) addedIds.add(String(id));
          });
        });
      } else if (data.data) {
        collectIds(Array.isArray(data.data) ? data.data : [data.data]);
      } else if (data.inventory) {
        collectIds(data.inventory);
      }

      console.log('Already added IDs:', Array.from(addedIds));
      setAddedMedicines(Array.from(addedIds));

    } catch (err) {
      console.error('loadAddedMedicines error:', err);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // ─── Add medicine to pharmacy ─────────────────────────────────────────────────
  const addMedicineToPharmacy = async (category, medicine) => {
    const medicineId = medicine.id;
    const actionKey  = `add-${medicineId}`;

    if (isMedicineAdded(medicineId)) {
      alert(`${medicine.name} is already in your inventory`);
      return;
    }

    setAddingMedicine(prev => ({ ...prev, [actionKey]: true }));

    try {
      const token = getAuthToken();
      if (!token) { alert('Please log in to add medicines'); return; }

      console.log('POSTing add-medicine for id:', medicineId);

      const response = await fetch(
        `${API_BASE_URL}/PharmacyMedication/add-medicine/${medicineId}`,
        { method: 'POST', headers: getHeaders(), body: JSON.stringify(1) }
      );

      let responseData = null;
      try { responseData = await response.json(); } catch (_) {}

      console.log('add-medicine response:', response.status, responseData);

      if (responseData?.error?.toLowerCase().includes('already exists') ||
          response.status === 409) {
        setAddedMedicines(prev => [...prev, String(medicineId)]);
        alert(`${medicine.name} is already in your inventory`);
        return;
      }

      if (response.status === 401) throw new Error('Session expired. Please log in again.');

      if (!response.ok) {
        throw new Error(
          responseData?.message || responseData?.error ||
          `Failed to add medicine (${response.status})`
        );
      }

      setAddedMedicines(prev => [...prev, String(medicineId)]);
      showSuccessNotification(`${medicine.name} added to your inventory!`);
      await loadAddedMedicines();

    } catch (err) {
      console.error('addMedicineToPharmacy error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setAddingMedicine(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const showSuccessNotification = (message) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: #10b981; color: white;
      padding: 1rem 1.5rem; border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000; font-weight: 600;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) document.body.removeChild(notification);
    }, 3000);
  };

  const isMedicineAdded = (medicineId) => addedMedicines.includes(String(medicineId));

  const filteredCategories = globalCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.medicines.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        padding: '2rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', gap: '1rem'
      }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading medicines catalog...</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    const isAuthError = error.includes('Authentication') || error.includes('token');
    return (
      <div style={{ padding: '2rem' }}>
        <section className="overview-header">
          <div className="overview-title">
            <h2>Global Medicine Catalog</h2>
            <p>Browse and add medicines to your pharmacy inventory</p>
          </div>
        </section>
        <div style={{
          marginTop: '2rem', padding: '2rem',
          backgroundColor: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isAuthError ? '🔒' : '❌'}</div>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>
            {isAuthError ? 'Authentication Required' : 'Error Loading Medicines'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={isAuthError ? () => window.location.href = '/login' : fetchMedicines}
            style={{
              padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent)',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontWeight: '600'
            }}
          >
            {isAuthError ? 'Go to Login' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────────────────
  if (globalCategories.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <section className="overview-header">
          <div className="overview-title">
            <h2>Global Medicine Catalog</h2>
            <p>Browse and add medicines to your pharmacy inventory</p>
          </div>
        </section>
        <div style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📦</p>
          <h3>No Medicines Available</h3>
          <p>The catalog is currently empty.</p>
          <button onClick={fetchMedicines} style={{
            marginTop: '1rem', padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
          }}>Refresh</button>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <section className="overview-header">
        <div className="overview-title">
          <h2>Global Medicine Catalog</h2>
          <p>Browse and add medicines to your pharmacy inventory</p>
        </div>
        <button
          onClick={() => { fetchMedicines(); loadAddedMedicines(); }}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem', backgroundColor: 'transparent',
            color: 'var(--accent)', border: '1px solid var(--accent)',
            borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600', display: 'flex', alignItems: 'center',
            gap: '0.5rem', opacity: loading ? 0.6 : 1
          }}
        >
          🔄 Refresh
        </button>
      </section>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: '8px', maxWidth: '400px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search medicines or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none', outline: 'none', width: '100%',
              fontSize: '0.95rem', background: 'transparent'
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredCategories.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No medicines found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="card" style={{ overflow: 'hidden' }}>

              {/* Category header */}
              <div
                onClick={() => toggleCategory(category.id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem', backgroundColor: 'var(--bg-main)',
                  cursor: 'pointer', userSelect: 'none',
                  borderBottom: expandedCategories[category.id]
                    ? '1px solid var(--border)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '28px' }}>{category.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                      {category.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {category.medicines.length} medicine{category.medicines.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                  {expandedCategories[category.id] ? '▼' : '▶'}
                </span>
              </div>

              {/* Medicine grid */}
              {expandedCategories[category.id] && (
                <div style={{ padding: '1rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem'
                  }}>
                    {category.medicines.map((medicine) => {
                      const isAdded  = isMedicineAdded(medicine.id);
                      const actionKey = `add-${medicine.id}`;
                      const isAdding = addingMedicine[actionKey];

                      return (
                        <div
                          key={medicine.id}
                          style={{
                            padding: '1rem',
                            border: `1px solid ${isAdded ? 'var(--success)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-card)',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem'
                          }}
                        >
                          {/* Image */}
                          <div style={{
                            width: '100%', height: '140px', borderRadius: '6px',
                            backgroundColor: 'var(--bg-main)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', overflow: 'hidden'
                          }}>
                            {medicine.image ? (
                              <img
                                src={medicine.image}
                                alt={medicine.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span style="font-size:3rem">💊</span>';
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '3rem' }}>💊</span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <h5 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: '600' }}>
                              {medicine.name}
                            </h5>
                            {medicine.description && (
                              <p style={{
                                margin: 0, fontSize: '0.85rem',
                                color: 'var(--text-muted)', lineHeight: '1.4'
                              }}>
                                {medicine.description}
                              </p>
                            )}
                          </div>

                          {/* Price + button */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border)'
                          }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent)' }}>
                              {medicine.price}
                            </span>

                            <button
                              onClick={() => addMedicineToPharmacy(category, medicine)}
                              disabled={isAdded || isAdding}
                              style={{
                                padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
                                backgroundColor: isAdded ? 'var(--success)' : 'var(--accent)',
                                color: 'white',
                                cursor: (isAdded || isAdding) ? 'default' : 'pointer',
                                fontSize: '0.9rem', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                opacity: (isAdded || isAdding) ? 0.8 : 1,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              {isAdding ? (
                                <>
                                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                  Adding...
                                </>
                              ) : isAdded ? (
                                <><Check size={16} /> Added</>
                              ) : (
                                <><Plus size={16} /> Add to Catalog</>
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
          ))
        )}
      </div>
    </div>
  );
};

export default GlobalCatalog;