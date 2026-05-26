import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Layers, Pill } from 'lucide-react';
import StatCard from './StatCard';

const API_BASE = 'http://165.22.91.187:5000/api/PharmacyOrder';

const MedicineProgress = ({ name, progress, sales }) => (
  <div className="medicine-item">
    <div className="med-icon">
      <Pill size={18} />
    </div>
    <div className="med-info">
      <div className="med-name-row">
        <span>{name}</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {sales} sold
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  </div>
);

const DashboardHome = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentOrders, setRecentOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [topMedicines, setTopMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── Auth header ──────────────────────────────────────────────────────────
  const authHeader = () => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('authToken') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ─── Field helpers ────────────────────────────────────────────────────────
  const getId     = o => o.id;
  const getName   = o => o.patientName ?? '—';
  const getStatus = o => o.status ?? '—';
  const getDate   = o => o.createdAt ?? null;
  const getItems  = o => Array.isArray(o.orderItems) ? o.orderItems : [];

  // Total price: subtract 2 like Orders page does for display
  const getTotalDisplay = o =>
    o.totalPrice != null
      ? `$${(Number(o.totalPrice) - 2).toFixed(2)}`
      : '—';

  // Raw numeric total for calculations
  const getTotalRaw = o =>
    o.totalPrice != null ? Number(o.totalPrice) : 0;

  // ─── Parse response ───────────────────────────────────────────────────────
  const toList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.records)) return data.records;
    if (data && typeof data === 'object') return [data];
    return [];
  };

  // ─── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Load orders ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadOrders();
    countMedicines();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/active`, {
          headers: { Accept: 'application/json', ...authHeader() },
        }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/history`, {
          headers: { Accept: 'application/json', ...authHeader() },
        }).catch(() => ({ ok: false })),
      ]);

      let allOrders = [];

      if (activeRes.ok) {
        const text = await activeRes.text();
        if (text.trim()) allOrders = [...toList(JSON.parse(text))];
      }

      if (historyRes.ok) {
        const text = await historyRes.text();
        if (text.trim()) {
          const historyList = toList(JSON.parse(text));
          const existingIds = new Set(allOrders.map(o => getId(o)));
          historyList.forEach(o => {
            if (!existingIds.has(getId(o))) allOrders.push(o);
          });
        }
      }

      // Sort newest first
      allOrders.sort((a, b) =>
        new Date(getDate(b)) - new Date(getDate(a))
      );

      setRecentOrders(allOrders);
      setTotalOrders(allOrders.length);

      // ── Calculate total sales (only completed orders) ──
      const completedOrders = allOrders.filter(
        o => getStatus(o) === 'Delivered'
      );
      const sales = completedOrders.reduce(
        (sum, o) => sum + getTotalRaw(o), 0
      );
      setTotalSales(sales);

      // ── Calculate top 5 medicines ──
      const medicineMap = {};
      allOrders.forEach(order => {
        getItems(order).forEach(item => {
          const name = item.medicationName ?? 'Unknown';
          const qty  = Number(item.quantity) || 0;
          if (!medicineMap[name]) medicineMap[name] = 0;
          medicineMap[name] += qty;
        });
      });

      // Sort by quantity sold
      const sorted = Object.entries(medicineMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Calculate progress relative to top seller
      const maxSales = sorted[0]?.[1] || 1;
      const top5 = sorted.map(([name, sales]) => ({
        name,
        sales,
        progress: Math.round((sales / maxSales) * 100),
      }));

      setTopMedicines(top5);

    } catch (err) {
      console.error('Failed to load orders:', err);
      setRecentOrders([]);
      setTotalOrders(0);
      setTotalSales(0);
      setTopMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const countMedicines = () => {
    const saved = localStorage.getItem('pharmacyMedicines');
    if (saved) {
      try {
        const medicines = JSON.parse(saved);
        const count = medicines.reduce(
          (total, cat) => total + cat.medicines.length, 0
        );
        setTotalMedicines(count);
      } catch {
        setTotalMedicines(0);
      }
    }
  };

  const formatDateTime = (date) =>
    date.toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', ' at');

  const formatDate = (val) =>
    val ? new Date(val).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    }) : '—';

  const statusClass = (s) =>
    s === 'Pending'   ? 'status-pending'   :
    s === 'Completed' ? 'status-completed' :
    s === 'Rejected'  ? 'status-rejected'  :
    s === 'Ready'     ? 'status-completed' :
    'status-processing';

  // Total units sold across all medicines
  const totalUnitsSold = topMedicines.reduce((sum, m) => sum + m.sales, 0);

  // =========================================================================
  return (
    <>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Daily Overview</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-grid">
        <StatCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString('en-US', {
            minimumFractionDigits: 2 })}`}
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

      {/* ── Two Column Layout ── */}
      <div className="content-row">

        {/* ── Recent Orders ── */}
        <section className="card">
          <div className="card-title">
            Recent Orders
            <span
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('orders')}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  onNavigate && onNavigate('orders');
              }}
              style={{
                color: 'var(--accent)', fontSize: '0.85rem',
                cursor: 'pointer', fontWeight: 500,
                textDecoration: 'underline', marginLeft: '1.5rem',
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
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center',
                      padding: '2rem', color: 'var(--text-muted)' }}>
                      Loading orders…
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center',
                      padding: '2rem', color: 'var(--text-muted)' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <tr
                      key={getId(order)}
                      onClick={() => onNavigate && onNavigate('orders')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e =>
                        e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                      onMouseLeave={e =>
                        e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ fontWeight: 600 }}>#{getId(order)}</td>
                      <td>{getName(order)}</td>
                      <td style={{ fontSize: '0.85rem',
                        color: 'var(--text-muted)' }}>
                        {formatDate(getDate(order))}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          statusClass(getStatus(order))}`}>
                          {getStatus(order)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {getTotalDisplay(order)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Top 5 Medicines ── */}
        <section className="card">
          <div className="card-title">
            Top 5 Medicines
            <span style={{ fontSize: '0.75rem',
              color: 'var(--text-muted)', fontWeight: 400 }}>
              <br />Best sellers this week
            </span>
          </div>

          <div className="medicine-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem',
                color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Loading medicines…
              </div>
            ) : topMedicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem',
                color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No medicine data yet
              </div>
            ) : (
              topMedicines.map((medicine, index) => (
                <MedicineProgress
                  key={index}
                  name={medicine.name}
                  progress={medicine.progress}
                  sales={medicine.sales}
                />
              ))
            )}
          </div>

          <div style={{
            marginTop: '1.5rem', paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Units Sold
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700,
              color: 'var(--accent)' }}>
              {totalUnitsSold.toLocaleString()}
            </span>
          </div>
        </section>
      </div>
    </>
  );
};

export default DashboardHome;