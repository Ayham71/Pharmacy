import React, { useState, useEffect } from 'react';
import { Pill, Trash2, Loader, AlertCircle, Plus, Minus } from 'lucide-react';

const MedicineCatalog = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [quantityLoading, setQuantityLoading] = useState({});

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
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'pain relief': '💊', 'pain': '💊',
      'antibiotics': '💉', 'antibiotic': '💉',
      'vitamins': '💪', 'vitamin': '💪', 'supplements': '💪',
      'cold': '🤧', 'flu': '🤧',
      'digestive': '🍼',
      'allergy': '🤧',
      'skin': '🧴',
      'first aid': '🩹',
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
    return price || 'N/A';
  };

  const formatDateTime = (date) => {
    const options = {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchInventory();
  }, []);

  // ─── Transform flat medications array ───────────────────────────────────────
  const transformFlatMedications = (items) => {
    const categoriesMap = {};

    items.forEach((item) => {
      const categoryName =
        item.category || item.categoryName || item.Category || 'Uncategorized';
      const categoryId =
        item.categoryId || item.category_id || categoryName;

      if (!categoriesMap[categoryId]) {
        categoriesMap[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: getCategoryIcon(categoryName),
          medicines: []
        };
      }

      categoriesMap[categoryId].medicines.push({
        id: item.id || item.medicationId || item.medicineId,
        name: item.medicationName || item.name || item.medicineName || 'Unnamed Medicine',
        description: item.activeIngredient || item.description || '',
        price: formatPrice(item.price || 0),
        inStock: item.isActive !== undefined ? item.isActive : true,
        quantity: item.quantity ?? item.stock ?? item.stockCount ?? 0,
        requiresPrescription:
          item.requiresPrescription ??
          item.RequiresPrescription ??
          item.requires_prescription ??
          item.isPrescription ??
          false,
        image: getImageUrl(item.image || item.imageUrl),
        originalData: item
      });
    });

    return Object.values(categoriesMap);
  };

  // ─── Main transform function ─────────────────────────────────────────────────
  const transformInventoryData = (apiData) => {
    console.log('Raw API data:', apiData);

    let categories = [];

    if (apiData && apiData.categories && Array.isArray(apiData.categories)) {
      categories = apiData.categories;
    } else if (Array.isArray(apiData)) {
      if (apiData.length > 0 && apiData[0] && apiData[0].categories) {
        categories = apiData[0].categories;
      } else {
        return transformFlatMedications(apiData);
      }
    } else if (apiData && apiData.data && Array.isArray(apiData.data)) {
      if (apiData.data.length > 0 && apiData.data[0].categories) {
        categories = apiData.data[0].categories;
      } else {
        return transformFlatMedications(apiData.data);
      }
    } else if (apiData && apiData.inventory && Array.isArray(apiData.inventory)) {
      return transformFlatMedications(apiData.inventory);
    } else {
      console.warn('Unknown API structure', apiData);
      return [];
    }

    if (categories.length === 0) return [];

    const result = categories
      .map((cat) => {
        const categoryId   = cat.id || cat.categoryId || cat.CategoryId;
        const categoryName = cat.categoryName || cat.name || cat.CategoryName || 'Uncategorized';
        const medications  = cat.medications || cat.medicines || cat.Medications || [];

        const transformedMedicines = medications.map((med) => {
          const medId    = med.id || med.medicationId || med.medicineId || med._id;
          const medName  = med.medicationName || med.name || med.medicineName || 'Unnamed Medicine';
          const medDesc  = med.activeIngredient || med.description || med.details || '';
          const medPrice = med.price || med.cost || 0;
          const medInStock =
            med.isActive    !== undefined ? med.isActive :
            med.inStock     !== undefined ? med.inStock  :
            med.isAvailable !== undefined ? med.isAvailable : true;
          const medImage = med.image || med.imageUrl || med.imagePath || null;

          // ── Quantity ──────────────────────────────────────────────────────
          const medQuantity =
            med.quantity    !== undefined ? med.quantity    :
            med.stock       !== undefined ? med.stock       :
            med.stockCount  !== undefined ? med.stockCount  :
            med.Quantity    !== undefined ? med.Quantity    : 0;

          // ── Requires Prescription (from central/global catalog data) ──────
          const medRx =
            med.requiresPrescription  ??
            med.RequiresPrescription  ??
            med.requires_prescription ??
            med.centralMedication?.requiresPrescription ??
            med.medication?.requiresPrescription ??
            med.isPrescription ??
            false;

          return {
            id:                   medId,
            name:                 medName,
            description:          medDesc,
            price:                formatPrice(medPrice),
            inStock:              medInStock,
            quantity:             Number(medQuantity),
            requiresPrescription: Boolean(medRx),
            image:                getImageUrl(medImage),
            originalData:         med
          };
        });

        return {
          id:        categoryId,
          name:      categoryName,
          icon:      getCategoryIcon(categoryName),
          medicines: transformedMedicines
        };
      })
      .filter((cat) => cat.medicines.length > 0);

    return result;
  };

  // ─── Fetch inventory ─────────────────────────────────────────────────────────
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required. Please log in.');

      const response = await fetch(`${API_BASE_URL}/PharmacyMedication/my-inventory`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.status === 401) throw new Error('Session expired. Please log in again.');
      if (!response.ok)           throw new Error(`Failed to fetch inventory: ${response.status}`);

      const data = await response.json();
      console.log('=== RAW INVENTORY RESPONSE ===', JSON.stringify(data, null, 2));

      const transformed = transformInventoryData(data);
      setMedicines(transformed);
      localStorage.setItem('pharmacyMedicines', JSON.stringify(transformed));

    } catch (err) {
      console.error('fetchInventory error:', err);
      setError(err.message);
      const saved = localStorage.getItem('pharmacyMedicines');
      if (saved) {
        try { setMedicines(JSON.parse(saved)); } catch (_) {}
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Toggle stock ─────────────────────────────────────────────────────────────
  const toggleStock = async (categoryId, medicine) => {
    const medicineId = medicine.id;
    const actionKey  = `toggle-${medicineId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(
        `${API_BASE_URL}/PharmacyMedication/toggle-status/${medicineId}`,
        { method: 'PUT', headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`Failed to toggle status: ${response.status}`);

      const updated = medicines.map(cat =>
        cat.id !== categoryId ? cat : {
          ...cat,
          medicines: cat.medicines.map(med =>
            med.id !== medicineId ? med : { ...med, inStock: !med.inStock }
          )
        }
      );
      setMedicines(updated);
      localStorage.setItem('pharmacyMedicines', JSON.stringify(updated));

    } catch (err) {
      console.error('toggleStock error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // ─── Update quantity ──────────────────────────────────────────────────────────
const updateQuantity = async (categoryId, medicine, delta) => {
  const newQty = Math.max(0, (medicine.quantity || 0) + delta);
  const medicineId = medicine.id;
  const qKey = `qty-${medicineId}`;

  // Optimistic update
  setMedicines(prev => prev.map(cat =>
    cat.id !== categoryId ? cat : {
      ...cat,
      medicines: cat.medicines.map(med =>
        med.id !== medicineId ? med : { ...med, quantity: newQty }
      )
    }
  ));

  setQuantityLoading(prev => ({ ...prev, [qKey]: true }));

  try {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    console.log(`📤 Sending quantity update for medicine ${medicineId}: ${newQty}`);

    const response = await fetch(
      `${API_BASE_URL}/PharmacyMedication/update-quantity/${medicineId}`,
      {
        method: 'PUT',
        headers: {
          // ✅ Send as plain integer — NOT application/json
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // ✅ Raw integer as body string, not wrapped in an object
        body: String(newQty)
      }
    );

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed:', errorText);
      throw new Error(`Failed to update quantity: ${response.status} – ${errorText}`);
    }

    const text = await response.text();
    console.log('✅ Quantity updated successfully to', newQty, '| Response:', text);

  } catch (err) {
    console.error('updateQuantity error:', err);
    // Revert optimistic update on error
    setMedicines(prev => prev.map(cat =>
      cat.id !== categoryId ? cat : {
        ...cat,
        medicines: cat.medicines.map(med =>
          med.id !== medicineId ? med : { ...med, quantity: medicine.quantity }
        )
      }
    ));
    alert(`Error updating quantity: ${err.message}`);
  } finally {
    setQuantityLoading(prev => ({ ...prev, [qKey]: false }));
  }
};

  // ─── Remove medicine ──────────────────────────────────────────────────────────
  const removeMedicine = async (categoryId, medicine) => {
    if (!window.confirm(`Remove "${medicine.name}" from your catalog?`)) return;

    const medicineId = medicine.id;
    const actionKey  = `remove-${medicineId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(
        `${API_BASE_URL}/PharmacyMedication/remove-medicine/${medicineId}`,
        { method: 'DELETE', headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`Failed to remove medicine: ${response.status}`);

      const updated = medicines
        .map(cat =>
          cat.id !== categoryId ? cat : {
            ...cat,
            medicines: cat.medicines.filter(med => med.id !== medicineId)
          }
        )
        .filter(cat => cat.medicines.length > 0);

      setMedicines(updated);
      localStorage.setItem('pharmacyMedicines', JSON.stringify(updated));

    } catch (err) {
      console.error('removeMedicine error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const filteredMedicines = medicines.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.medicines.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Prescription Badge ───────────────────────────────────────────────────────
  const PrescriptionBadge = ({ value }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: '600',
      backgroundColor: value ? '#fff3e0' : '#e8f5e9',
      color: value ? '#e65100' : '#2e7d32',
      border: `1.5px solid ${value ? '#ff9800' : '#4caf50'}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '12px' }}>{value ? '📋' : '✅'}</span>
      {value ? 'By Prescription' : 'Without Prescription'}
    </span>
  );

  // ─── Quantity Control ─────────────────────────────────────────────────────────
  const QuantityControl = ({ categoryId, medicine }) => {
    const qKey = `qty-${medicine.id}`;
    const isLoading = quantityLoading[qKey];
    const isRemoving = actionLoading[`remove-${medicine.id}`];
    const disabled = isLoading || isRemoving;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--bg-main)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '3px 6px',
        flexShrink: 0,
      }}>
        {/* Minus */}
        <button
          onClick={() => updateQuantity(categoryId, medicine, -1)}
          disabled={disabled || medicine.quantity <= 0}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: medicine.quantity <= 0 ? 'transparent' : 'rgba(239,68,68,0.1)',
            color: medicine.quantity <= 0 ? 'var(--text-muted)' : 'var(--danger)',
            cursor: (disabled || medicine.quantity <= 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            transition: 'all 0.15s',
            flexShrink: 0,
            opacity: (disabled || medicine.quantity <= 0) ? 0.4 : 1,
          }}
          title="Decrease quantity"
        >
          <Minus size={12} />
        </button>

        {/* Count */}
        <span style={{
          minWidth: '32px',
          textAlign: 'center',
          fontWeight: '700',
          fontSize: '0.95rem',
          color: medicine.quantity === 0
            ? 'var(--danger)'
            : medicine.quantity <= 3
              ? '#f59e0b'
              : 'var(--text-main)',
          position: 'relative',
        }}>
          {isLoading ? (
            <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            medicine.quantity
          )}
        </span>

        {/* Plus */}
        <button
          onClick={() => updateQuantity(categoryId, medicine, +1)}
          disabled={disabled}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(16,185,129,0.1)',
            color: 'var(--success)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            transition: 'all 0.15s',
            flexShrink: 0,
            opacity: disabled ? 0.4 : 1,
          }}
          title="Increase quantity"
        >
          <Plus size={12} />
        </button>
      </div>
    );
  };

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1rem'
      }}>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your inventory...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem' }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .qty-btn:hover:not(:disabled) { filter: brightness(0.9); transform: scale(1.1); }
      `}</style>

      {/* Header */}
      <section className="overview-header">
        <div className="overview-title">
          <h2>Medicine Catalog</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔄 Refresh
        </button>
      </section>

      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--danger)'
        }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Error loading inventory:</strong> {error}
          </div>
          <button
            onClick={fetchInventory}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      )}

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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
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

      {/* Medicine list */}
      {filteredMedicines.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            {searchTerm ? 'No medicines found' : 'No medicines in your catalog'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {searchTerm
              ? `No results for "${searchTerm}"`
              : 'Go to Global Catalog to add medicines to your inventory'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMedicines.map((category) => (
            <div key={category.id} className="card" style={{ overflow: 'hidden' }}>

              {/* Category header */}
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
                      {category.medicines.length} medicine{category.medicines.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                  {expandedCategories[category.id] ? '▼' : '▶'}
                </span>
              </div>

              {/* Medicine rows */}
              {expandedCategories[category.id] && (
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {category.medicines.map((medicine) => {
                      const toggleKey  = `toggle-${medicine.id}`;
                      const removeKey  = `remove-${medicine.id}`;
                      const isToggling = actionLoading[toggleKey];
                      const isRemoving = actionLoading[removeKey];

                      return (
                        <div
                          key={medicine.id}
                          style={{
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            opacity: isRemoving ? 0.5 : 1,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          {/* Image / fallback icon */}
                          {medicine.image ? (
                            <div style={{
                              width: '60px', height: '60px',
                              borderRadius: '6px', overflow: 'hidden', flexShrink: 0
                            }}>
                              <img
                                src={medicine.image}
                                alt={medicine.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className="med-icon" style={{ flexShrink: 0 }}>
                              <Pill size={18} />
                            </div>
                          )}

                          {/* Info block */}
                          <div style={{ flex: 1, minWidth: 0 }}>

                            {/* Row 1 – name + price */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                {medicine.name}
                              </span>
                              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                {medicine.price}
                              </span>
                            </div>

                            {/* Row 2 – description */}
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

                            {/* Row 3 – stock toggle + quantity + remove */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              {/* In Stock / Out of Stock toggle */}
                              <button
                                onClick={() => toggleStock(category.id, medicine)}
                                disabled={isToggling || isRemoving}
                                style={{
                                  fontSize: '0.85rem',
                                  padding: '0.3rem 0.85rem',
                                  borderRadius: '6px',
                                  border: `1.5px solid ${medicine.inStock ? '#10b981' : '#ef4444'}`,
                                  cursor: (isToggling || isRemoving) ? 'not-allowed' : 'pointer',
                                  fontWeight: 600,
                                  backgroundColor: medicine.inStock
                                    ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                  color: medicine.inStock ? 'var(--success)' : 'var(--danger)',
                                  opacity: (isToggling || isRemoving) ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  flexShrink: 0,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {isToggling
                                  ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                  : <span>{medicine.inStock ? '✔' : '✖'}</span>
                                }
                                {medicine.inStock ? 'In Stock' : 'Out of Stock'}
                              </button>

                              {/* Quantity control */}
                              <QuantityControl
                                categoryId={category.id}
                                medicine={medicine}
                              />

                              {/* Spacer */}
                              <div style={{ flex: 1 }} />

                              {/* Remove button */}
                              <button
                                onClick={() => removeMedicine(category.id, medicine)}
                                disabled={isToggling || isRemoving}
                                style={{
                                  padding: '0.3rem 0.85rem',
                                  borderRadius: '6px',
                                  border: '1.5px solid var(--danger)',
                                  backgroundColor: 'transparent',
                                  color: 'var(--danger)',
                                  cursor: (isToggling || isRemoving) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  opacity: (isToggling || isRemoving) ? 0.6 : 1,
                                  flexShrink: 0,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {isRemoving
                                  ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                  : <Trash2 size={14} />
                                }
                                Remove
                              </button>
                            </div>

                            {/* Row 4 – Prescription badge */}
                            <div style={{ marginTop: '0.6rem' }}>
                              <PrescriptionBadge value={medicine.requiresPrescription} />
                            </div>

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
      )}
    </div>
  );
};

export default MedicineCatalog;