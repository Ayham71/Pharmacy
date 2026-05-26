import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Package, Clock } from 'lucide-react';
import StatCard from './StatCard';

const API_BASE   = 'http://165.22.91.187:5000/api/PharmacyOrder';
const SETTLE_URL = 'http://165.22.91.187:5000/api/PharmacySettlement';

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const DONE_STATUSES = [
  'Delivered', 'delivered',
  'Completed', 'completed',
  'Ready',     'ready',
];

const FinancialReports = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');

  // ─── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // ─── Field helpers ────────────────────────────────────────────────────────
  const getId     = o => o.id;
  const getName   = o => o.patientName ?? '—';
  const getStatus = o => o.status ?? '—';
  const getItems  = o => Array.isArray(o.orderItems) ? o.orderItems : [];
  const getRaw    = o => o.totalPrice != null ? Number(o.totalPrice) : 0;
  const getDate   = o => o.createdAt ?? null;

  const toList = (data) => {
    if (Array.isArray(data))         return data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data))   return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  // ─── Fetch All Orders ─────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/active`,  { headers: getAuthHeaders() })
          .catch(() => ({ ok: false })),
        fetch(`${API_BASE}/history`, { headers: getAuthHeaders() })
          .catch(() => ({ ok: false })),
      ]);

      let allOrders = [];

      if (activeRes.ok) {
        const text = await activeRes.text();
        if (text.trim()) allOrders = [...toList(JSON.parse(text))];
      }
      if (historyRes.ok) {
        const text = await historyRes.text();
        if (text.trim()) {
          const list = toList(JSON.parse(text));
          const ids  = new Set(allOrders.map(getId));
          list.forEach(o => { if (!ids.has(getId(o))) allOrders.push(o); });
        }
      }

      allOrders.sort((a, b) =>
        new Date(getDate(b) || 0) - new Date(getDate(a) || 0)
      );

      setOrders(allOrders);

    } catch (err) {
      setError(err.message || 'Failed to load data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Derived Stats ────────────────────────────────────────────────────────
  const doneOrders     = orders.filter(o =>
    DONE_STATUSES.includes(getStatus(o)))
  const pendingOrders  = orders.filter(o =>
    ['Pending','pending','Processing','Accepted','accepted']
      .includes(getStatus(o)))
  const rejectedOrders = orders.filter(o =>
    ['Rejected','rejected','Cancelled','cancelled']
      .includes(getStatus(o)))

  const totalSales    = doneOrders.reduce((sum, o) => sum + getRaw(o), 0)
  const avgOrderValue = doneOrders.length > 0
    ? totalSales / doneOrders.length : 0

  // Top medicine
  const medicineMap = {}
  orders.forEach(order => {
    getItems(order).forEach(item => {
      const name = item.medicationName ?? 'Unknown'
      const qty  = Number(item.quantity) || 0
      medicineMap[name] = (medicineMap[name] || 0) + qty
    })
  })
  const topMed = Object.entries(medicineMap)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // ─── Filtered orders for table ────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const s = searchTerm.toLowerCase()
    return (
      String(getId(o)).includes(s) ||
      getName(o).toLowerCase().includes(s) ||
      getStatus(o).toLowerCase().includes(s)
    )
  })

  // ─── Status color ─────────────────────────────────────────────────────────
  const statusColor = (s) =>
    DONE_STATUSES.includes(s)
      ? { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e' } :
    ['Pending','pending','Accepted'].includes(s)
      ? { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' } :
    ['Rejected','rejected','Cancelled'].includes(s)
      ? { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' } :
      { bg: 'rgba(156,163,175,0.15)',  text: '#9ca3af' }

  // ─── Spinner ──────────────────────────────────────────────────────────────
  const Spinner = () => (
    <div style={{ display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '60px', gap: '16px' }}>
      <div style={{
        width: '40px', height: '40px',
        border: '4px solid rgba(245,158,11,0.2)',
        borderTop: '4px solid var(--accent,#f59e0b)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#9ca3af', fontSize: '14px' }}>
        Loading financial data...
      </span>
    </div>
  )

  const formatDateTime = (date) =>
    date.toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', ' at')

  // =========================================================================
  return (
    <div style={{ padding: '2rem' }}>

      {/* ── Header ── */}
      <section className="overview-header">
        <div className="overview-title">
          <h2>Financial Reports</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: '600',
            background: 'transparent',
            border: '1px solid var(--accent,#f59e0b)',
            color: 'var(--accent,#f59e0b)',
            borderRadius: '8px', cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🔄 Refresh
        </button>
      </section>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center',
          gap: '10px', fontSize: '14px', color: '#ef4444',
        }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: '#ef4444', fontWeight: '700',
          }}>✕</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          {/* ── Stats Grid ── */}
          <section className="stats-grid">
            <StatCard
              title="Total Sales"
              value={`$${totalSales.toLocaleString('en-US', {
                minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              colorClass="sales"
            />
            <StatCard
              title="Delivered Orders"
              value={doneOrders.length.toString()}
              icon={BarChart3}
              colorClass="orders"
            />
            <StatCard
              title="Top Medicine"
              value={topMed}
              icon={Package}
              colorClass="items"
            />
            <StatCard
              title="Avg Order Value"
              value={`$${avgOrderValue.toLocaleString('en-US', {
                minimumFractionDigits: 2 })}`}
              icon={Clock}
              colorClass="delivery"
            />
          </section>

          {/* ── Summary Bar ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px', marginBottom: '24px',
          }}>
            {[
              { label: 'Total Orders',
                value: orders.length,
                color: 'var(--accent,#f59e0b)', icon: '📦' },
              { label: 'Delivered',
                value: doneOrders.length,
                color: '#22c55e', icon: '✅' },
              { label: 'Pending',
                value: pendingOrders.length,
                color: '#f59e0b', icon: '⏳' },
              { label: 'Rejected',
                value: rejectedOrders.length,
                color: '#ef4444', icon: '❌' },
            ].map((s, i) => (
              <div key={i} className="card"
                style={{ padding: '16px', display: 'flex',
                  alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '26px' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af',
                    marginBottom: '4px', fontWeight: '500' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '700',
                    color: s.color }}>
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Orders Table ── */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-title" style={{ margin: 0 }}>
                All Orders
              </div>
              <div style={{ display: 'flex', alignItems: 'center',
                gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {filteredOrders.length} of {orders.length}
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input,rgba(255,255,255,0.05))',
                  border: '1px solid var(--border,rgba(255,255,255,0.1))',
                  borderRadius: '8px', padding: '6px 10px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
                    strokeWidth="2" width="14" height="14">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ background: 'none', border: 'none',
                      outline: 'none', color: 'inherit',
                      fontSize: '13px', width: '140px' }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}
                      style={{ background: 'none', border: 'none',
                        cursor: 'pointer', color: '#9ca3af',
                        fontSize: '14px', lineHeight: 1 }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px',
                color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                  📋
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600',
                  marginBottom: '6px' }}>
                  No Orders Found
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%',
                  borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['#', 'Order ID', 'Patient', 'Items',
                        'Total', 'Status', 'Date'].map(col => (
                        <th key={col} style={{
                          padding: '10px 12px', textAlign: 'left',
                          fontSize: '11px', fontWeight: '700',
                          color: '#9ca3af', textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid var(--border,rgba(255,255,255,0.08))',
                          whiteSpace: 'nowrap',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, i) => {
                      const sc = statusColor(getStatus(o))
                      return (
                        <tr key={getId(o)}
                          style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))' }}
                          onMouseEnter={e =>
                            e.currentTarget.style.background =
                              'rgba(245,158,11,0.04)'}
                          onMouseLeave={e =>
                            e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px',
                            color: '#6b7280' }}>{i + 1}</td>
                          <td style={{ padding: '12px', fontWeight: '700',
                            color: 'var(--accent,#f59e0b)' }}>
                            #{getId(o)}
                          </td>
                          <td style={{ padding: '12px',
                            fontWeight: '500' }}>
                            {getName(o)}
                          </td>
                          <td style={{ padding: '12px',
                            color: '#9ca3af' }}>
                            {getItems(o).length} items
                          </td>
                          <td style={{ padding: '12px', fontWeight: '700',
                            color: 'var(--accent,#f59e0b)' }}>
                            ${getRaw(o).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px', borderRadius: '999px',
                              fontSize: '11px', fontWeight: '600',
                              background: sc.bg, color: sc.text,
                            }}>
                              {getStatus(o)}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#9ca3af',
                            whiteSpace: 'nowrap', fontSize: '12px' }}>
                            {o.createdAt
                              ? new Date(o.createdAt)
                                .toLocaleDateString('en-US', {
                                  month: 'short', day: '2-digit',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border,rgba(255,255,255,0.1))' }}>
                      <td colSpan={4} style={{ padding: '12px',
                        fontWeight: '700', color: '#9ca3af',
                        fontSize: '12px' }}>
                        TOTAL ({filteredOrders.length} orders)
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700',
                        color: 'var(--accent,#f59e0b)' }}>
                        ${filteredOrders
                          .reduce((sum, o) => sum + getRaw(o), 0)
                          .toFixed(2)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default FinancialReports