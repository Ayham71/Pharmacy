import React, { useState, useEffect, useCallback } from 'react';
import { MoreVertical, ChevronDown, ChevronUp, RefreshCw, Check, X, PackageCheck } from 'lucide-react';

const API_BASE = 'http://165.22.91.187:5000/api/PharmacyOrder';

const Orders = () => {
  const [currentTime, setCurrentTime]           = useState(new Date());
  const [searchQuery, setSearchQuery]           = useState('');
  const [statusFilter, setStatusFilter]         = useState(null);
  const [activeDropdown, setActiveDropdown]     = useState(null);
  const [expandedOrder, setExpandedOrder]       = useState(null);
  const [expandedIncoming, setExpandedIncoming] = useState(null);

  const [activeOrders, setActiveOrders]     = useState([]);
  const [historyOrders, setHistoryOrders]   = useState([]);
  const [loadingActive, setLoadingActive]   = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading]   = useState({});
  const [error, setError]                   = useState({ active: null, history: null });

  // ─── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const close = () => setActiveDropdown(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ─── Auth header ──────────────────────────────────────────────────────────
  const authHeader = () => {
    const token =
      localStorage.getItem('token')        ||
      localStorage.getItem('authToken')    ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token')      ||
      sessionStorage.getItem('authToken')  || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ─── Exact field names confirmed from API response ────────────────────────
  const getId        = o => o.id;
  const getName      = o => o.patientName   ?? '—';
  const getTotal     = o => o.totalPrice    != null ? `$${Number(o.totalPrice).toFixed(2)}` : '—';
  const getStatus    = o => o.status        ?? '—';
  const getDate      = o => o.createdAt     ?? null;
  const getItems     = o => Array.isArray(o.orderItems) ? o.orderItems : [];
  const getImage     = o => o.prescriptionImage ?? null;

  // Item field names confirmed from API
  const getItemName  = i => i.medicationName  ?? '—';
  const getItemQty   = i => i.quantity         ?? 1;
  const getItemPrice = i => i.pricePerUnit != null
    ? `$${Number(i.pricePerUnit).toFixed(2)}`
    : '—';
  const getItemTotal = i => i.totalPrice != null
    ? `$${Number(i.totalPrice).toFixed(2)}`
    : '—';
  const getItemImage = i => i.medicationImage  ?? null;

  // ─── Parse any response shape into array ──────────────────────────────────
  const toList = (data) => {
    if (Array.isArray(data))              return data;
    if (Array.isArray(data?.orders))      return data.orders;
    if (Array.isArray(data?.data))        return data.data;
    if (Array.isArray(data?.result))      return data.result;
    if (Array.isArray(data?.results))     return data.results;
    if (Array.isArray(data?.records))     return data.records;
    if (data && typeof data === 'object') return [data];
    return [];
  };

  // ─── Generic GET ──────────────────────────────────────────────────────────
  const getRequest = async (url) => {
    const res  = await fetch(url, {
      method : 'GET',
      headers: { Accept: 'application/json', ...authHeader() },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} – ${text.slice(0, 200)}`);
    if (!text.trim()) throw new Error('Server returned an empty response');
    return JSON.parse(text);
  };

  // ─── Generic PUT ─────────────────────────────────────────────────────────
  const putAction = async (orderId, action) => {
    const res  = await fetch(`${API_BASE}/${orderId}/${action}`, {
      method : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify({}),
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(text);
        msg = j.message ?? j.error ?? j.detail ?? msg;
      } catch {}
      throw new Error(msg);
    }
    return text;
  };

 // ─── Fetch /active  – only Pending orders for incoming table ─────────────
  const fetchActive = useCallback(async () => {
    setLoadingActive(true);
    setError(e => ({ ...e, active: null }));
    try {
      const data = await getRequest(`${API_BASE}/active`);
      const list = toList(data);
      
      console.group('📊 Active endpoint response');
      console.log('Total orders:', list.length);
      console.log('Status breakdown:', 
        list.reduce((acc, o) => {
          const s = getStatus(o);
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {})
      );
      console.groupEnd();
      
      // Only Pending for incoming table
      const pending = list.filter(o => getStatus(o) === 'Pending');
      setActiveOrders(pending);
      
      // Return all for combining with history
      return list;
    } catch (err) {
      console.error('fetchActive:', err);
      setError(e => ({ ...e, active: err.message }));
      setActiveOrders([]);
      return [];
    } finally {
      setLoadingActive(false);
    }
  }, []);

  // ─── Fetch /history + combine with /active ───────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(e => ({ ...e, history: null }));
    try {
      // Fetch both endpoints
      const [historyData, activeList] = await Promise.all([
        getRequest(`${API_BASE}/history`),
        getRequest(`${API_BASE}/active`).catch(() => ({ data: [] })),
      ]);
      
      const historyList = toList(historyData);
      const activeFullList = toList(activeList);
      
      // Combine and deduplicate by ID
      const combined = [...historyList];
      const existingIds = new Set(historyList.map(o => getId(o)));
      
      activeFullList.forEach(order => {
        if (!existingIds.has(getId(order))) {
          combined.push(order);
        }
      });
      
      console.group('📊 Combined History (history + active)');
      console.log('From /history:', historyList.length);
      console.log('From /active:', activeFullList.length);
      console.log('Combined total:', combined.length);
      console.log('Status breakdown:', 
        combined.reduce((acc, o) => {
          const s = getStatus(o);
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {})
      );
      console.groupEnd();
      
      setHistoryOrders(combined);
    } catch (err) {
      console.error('fetchHistory:', err);
      setError(e => ({ ...e, history: err.message }));
      setHistoryOrders([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    fetchHistory();
  }, [fetchActive, fetchHistory]);

  // ─── Accept / Reject ──────────────────────────────────────────────────────
  const handleIncomingAction = async (orderId, action) => {
    setActionLoading(p => ({ ...p, [`inc_${orderId}`]: action }));
    try {
      await putAction(orderId, action);
      // Remove from active/incoming list immediately
      setActiveOrders(p => p.filter(o => getId(o) !== orderId));
      // Refresh both lists
      await Promise.all([fetchActive(), fetchHistory()]);
    } catch (err) {
      alert(`Failed to ${action} order:\n${err.message}`);
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[`inc_${orderId}`]; return n; });
    }
  };

  // ─── Mark as Ready ────────────────────────────────────────────────────────
  const handleReady = async (orderId) => {
    setActionLoading(p => ({ ...p, [orderId]: 'ready' }));
    try {
      await putAction(orderId, 'ready');
      setHistoryOrders(p =>
        p.map(o => getId(o) === orderId ? { ...o, status: 'Ready' } : o)
      );
    } catch (err) {
      alert(`Failed to mark ready:\n${err.message}`);
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[orderId]; return n; });
      setActiveDropdown(null);
    }
  };

  // ─── Misc helpers ─────────────────────────────────────────────────────────
  const fmt = (date) =>
    date.toLocaleDateString('en-US', {
      month:'short', day:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit', hour12:true,
    }).replace(',', ' at');

  const fmtDate = (val) =>
    val ? new Date(val).toLocaleDateString('en-US', {
      year:'numeric', month:'short', day:'2-digit',
    }) : '—';

  const statusClass = (s) =>
    s === 'Pending'   ? 'status-pending'   :
    s === 'Completed' ? 'status-completed' :
    s === 'Rejected'  ? 'status-rejected'  :
    s === 'Ready'     ? 'status-completed' :
    'status-processing';

  // ─── Filtered history ─────────────────────────────────────────────────────
  const filteredHistory = historyOrders
    .filter(o => statusFilter ? getStatus(o) === statusFilter : true)
    .filter(o =>
      String(getId(o)).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getName(o).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));

  // ─── Shared components ────────────────────────────────────────────────────
  const ErrorBanner = ({ msg, onRetry }) => (
    <div style={{
      background:'#fef2f2', border:'1px solid #fca5a5',
      borderRadius:8, padding:'0.75rem 1rem',
      color:'#7f1d1d', fontSize:'0.88rem',
      display:'flex', justifyContent:'space-between', alignItems:'center',
      margin:'0 1rem 0.5rem',
    }}>
      <span>⚠️ {msg}</span>
      <button onClick={onRetry} style={{
        padding:'0.28rem 0.75rem', background:'#ef4444',
        color:'#fff', border:'none', borderRadius:5,
        cursor:'pointer', fontWeight:600, fontSize:'0.8rem', marginLeft:'1rem',
      }}>Retry</button>
    </div>
  );

  // Items expanded panel
  const ItemsPanel = ({ items, bg = '#fff', borderColor = 'var(--border)', textColor = '#374151' }) => (
    items.length === 0 ? (
      <p style={{ margin:0, color: textColor, fontSize:'0.85rem', fontStyle:'italic' }}>
        No items found.
      </p>
    ) : (
      <div style={{
        borderRadius:8, border:`1px solid ${borderColor}`,
        overflow:'hidden', background: bg,
      }}>
        {/* Header row */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'2fr 1fr 1fr 1fr',
          padding:'0.45rem 0.9rem',
          background: bg === '#fef9c3' ? '#fef08a' : 'var(--bg-main,#f9fafb)',
          borderBottom:`1px solid ${borderColor}`,
          fontSize:'0.75rem', fontWeight:700,
          textTransform:'uppercase', letterSpacing:'0.04em',
          color: bg === '#fef9c3' ? '#78350f' : 'var(--text-muted)',
        }}>
          <span>Medication</span>
          <span style={{ textAlign:'center' }}>Qty</span>
          <span style={{ textAlign:'right' }}>Unit Price</span>
          <span style={{ textAlign:'right' }}>Subtotal</span>
        </div>

        {items.map((item, i) => (
          <div key={i} style={{
            display:'grid',
            gridTemplateColumns:'2fr 1fr 1fr 1fr',
            padding:'0.6rem 0.9rem',
            borderBottom: i < items.length - 1 ? `1px solid ${borderColor}` : 'none',
            alignItems:'center',
            fontSize:'0.88rem', color: textColor,
          }}>
            {/* Name + image */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
              {getItemImage(item) && (
                <img
                  src={`http://165.22.91.187:5000${getItemImage(item)}`}
                  alt={getItemName(item)}
                  style={{
                    width:36, height:36, borderRadius:6,
                    objectFit:'cover',
                    border:`1px solid ${borderColor}`,
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <span style={{ fontWeight:500 }}>{getItemName(item)}</span>
            </div>

            {/* Qty */}
            <span style={{ textAlign:'center' }}>
              <span style={{
                background: bg === '#fef9c3' ? '#fef08a' : 'var(--bg-main,#f3f4f6)',
                color: bg === '#fef9c3' ? '#78350f' : 'var(--text-main)',
                borderRadius:999, padding:'1px 8px',
                fontSize:'0.8rem', fontWeight:600,
              }}>
                ×{getItemQty(item)}
              </span>
            </span>

            {/* Unit price */}
            <span style={{ textAlign:'right', color: bg === '#fef9c3' ? '#92400e' : 'var(--text-muted)', fontSize:'0.85rem' }}>
              {getItemPrice(item)}
            </span>

            {/* Subtotal */}
            <span style={{ textAlign:'right', fontWeight:700 }}>
              {getItemTotal(item)}
            </span>
          </div>
        ))}
      </div>
    )
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding:'2rem' }}>
      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1);}
          50%{opacity:.5;transform:scale(1.45);}
        }
        @keyframes spin {
          from{transform:rotate(0deg);}
          to{transform:rotate(360deg);}
        }

        /* ── Incoming (yellow) ── */
        .inc-wrap{
          border:2px solid #fcd34d;border-radius:12px;
          margin-bottom:2rem;overflow:hidden;
          box-shadow:0 4px 20px rgba(251,191,36,.22);
        }
        .inc-header{
          background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
          padding:1rem 1.5rem;
          display:flex;align-items:center;justify-content:space-between;
        }
        .inc-subheader{
          background:#fef9c3;padding:.45rem 1.5rem;
          border-bottom:1px solid #fde68a;
          font-size:.8rem;color:#92400e;font-style:italic;
        }
        .inc-body{overflow-x:auto;background:#fffdf0;}
        .inc-table{width:100%;border-collapse:collapse;}
        .inc-th{
          padding:.75rem 1rem;font-size:.78rem;font-weight:700;
          letter-spacing:.04em;text-transform:uppercase;
          color:#78350f;background:#fef3c7;
          border-bottom:2px solid #fcd34d;white-space:nowrap;
        }
        .inc-row{transition:background .15s;}
        .inc-row:hover{background:#fefce8!important;}
        .inc-td{
          padding:.88rem 1rem;border-bottom:1px solid #fde68a;
          font-size:.9rem;color:#451a03;
        }
        .inc-expand-td{
          background:#fffbeb;padding:1rem 1.5rem;
          border-bottom:2px solid #fcd34d;
        }
        .inc-footer{
          background:#fef3c7;border-top:1px solid #fde68a;
          padding:.55rem 1.5rem;font-size:.78rem;color:#a16207;
          display:flex;justify-content:space-between;
        }
        .inc-badge{
          background:#fef08a;color:#78350f;
          border-radius:999px;padding:2px 10px;
          font-size:.78rem;font-weight:700;
        }

        /* ── Buttons ── */
        .btn-accept{
          display:inline-flex;align-items:center;gap:.3rem;
          padding:.36rem .85rem;background:#16a34a;color:#fff;
          border:none;border-radius:6px;cursor:pointer;
          font-weight:600;font-size:.8rem;transition:background .2s;
        }
        .btn-accept:hover:not(:disabled){background:#15803d;}
        .btn-accept:disabled{opacity:.5;cursor:not-allowed;}
        .btn-reject{
          display:inline-flex;align-items:center;gap:.3rem;
          padding:.36rem .85rem;background:#dc2626;color:#fff;
          border:none;border-radius:6px;cursor:pointer;
          font-weight:600;font-size:.8rem;transition:background .2s;
        }
        .btn-reject:hover:not(:disabled){background:#b91c1c;}
        .btn-reject:disabled{opacity:.5;cursor:not-allowed;}
        .btn-refresh-yellow{
          display:inline-flex;align-items:center;gap:.4rem;
          padding:.38rem .95rem;background:#fef9c3;color:#78350f;
          border:1.5px solid #fcd34d;border-radius:6px;
          cursor:pointer;font-weight:600;font-size:.8rem;transition:background .2s;
        }
        .btn-refresh-yellow:hover:not(:disabled){background:#fef08a;}
        .btn-refresh-yellow:disabled{opacity:.55;cursor:not-allowed;}
        .btn-refresh-blue{
          display:inline-flex;align-items:center;gap:.4rem;
          padding:.42rem .9rem;background:var(--primary,#3b82f6);color:#fff;
          border:none;border-radius:6px;cursor:pointer;
          font-weight:600;font-size:.82rem;
        }
        .btn-refresh-blue:disabled{opacity:.6;cursor:not-allowed;}
        .dd-item{
          padding:.45rem .8rem;cursor:pointer;
          color:var(--text-main);font-size:.85rem;white-space:nowrap;
          transition:background .15s;
          display:flex;align-items:center;gap:.5rem;
        }
        .dd-item:hover{background:var(--bg-hover,#f3f4f6);}
        .pulse-dot{
          width:11px;height:11px;border-radius:50%;background:#fff;
          display:inline-block;animation:pulse 1.5s infinite;
          box-shadow:0 0 0 3px rgba(255,255,255,.3);
        }
      `}</style>

      {/* ── Page header ── */}
      <section className="overview-header">
        <div className="overview-title">
          <h2>Orders Management</h2>
          <p>Last updated: {fmt(currentTime)}</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
           INCOMING / ACTIVE ORDERS  (yellow)
      ════════════════════════════════════════════ */}
      <div className="inc-wrap">

        {/* Header */}
        <div className="inc-header">
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span className="pulse-dot" />
            <h3 style={{ margin:0, color:'#fff', fontWeight:700, fontSize:'1.05rem' }}>
              Incoming Orders
            </h3>
            <span style={{
              background:'#fff', color:'#d97706',
              borderRadius:999, padding:'2px 10px',
              fontSize:'0.78rem', fontWeight:700,
            }}>
              {activeOrders.length}
            </span>
          </div>
          <button
            className="btn-refresh-yellow"
            onClick={fetchActive}
            disabled={loadingActive}
          >
            <RefreshCw
              size={14}
              style={{ animation: loadingActive ? 'spin 1s linear infinite' : 'none' }}
            />
            {loadingActive ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Sub-header */}
        <div className="inc-subheader">
          New orders awaiting your approval — accept or reject each one below.
        </div>

        {error.active && <ErrorBanner msg={error.active} onRetry={fetchActive} />}

        {/* Table */}
        <div className="inc-body">
          <table className="inc-table">
            <thead>
              <tr>
                {['Order ID','Patient','Items','Total','Date','Actions'].map((h, i) => (
                  <th
                    key={h}
                    className="inc-th"
                    style={{ textAlign: i === 5 ? 'center' : 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingActive ? (
                <tr>
                  <td colSpan={6} style={{
                    textAlign:'center', padding:'2.5rem',
                    color:'#92400e', background:'#fffdf0',
                  }}>
                    Loading incoming orders…
                  </td>
                </tr>
              ) : activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    textAlign:'center', padding:'2.5rem',
                    color:'#92400e', background:'#fffdf0', fontSize:'0.95rem',
                  }}>
                    ✅ No pending incoming orders
                  </td>
                </tr>
              ) : (
                activeOrders.map((order, idx) => {
                  const oid      = getId(order);
                  const items    = getItems(order);
                  const isWorking = !!actionLoading[`inc_${oid}`];
                  const rowBg    = idx % 2 === 0 ? '#fffdf0' : '#fffbeb';

                  return (
                    <React.Fragment key={oid}>
                      <tr className="inc-row" style={{ background: rowBg }}>

                        {/* Order ID */}
                        <td className="inc-td" style={{ fontWeight:700 }}>
                          <span
                            onClick={() =>
                              setExpandedIncoming(p => p === oid ? null : oid)
                            }
                            style={{
                              cursor:'pointer',
                              display:'inline-flex', alignItems:'center', gap:'0.4rem',
                              color:'#b45309',
                            }}
                          >
                            {expandedIncoming === oid
                              ? <ChevronUp size={15} />
                              : <ChevronDown size={15} />}
                            #{oid}
                          </span>
                        </td>

                        {/* Patient name */}
                        <td className="inc-td" style={{ fontWeight:500 }}>
                          {getName(order)}
                        </td>

                        {/* Items count */}
                        <td className="inc-td">
                          <span className="inc-badge">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="inc-td" style={{ fontWeight:700, color:'#92400e' }}>
                          {getTotal(order)}
                        </td>

                        {/* Date */}
                        <td className="inc-td" style={{ color:'#a16207', fontSize:'0.85rem' }}>
                          {fmtDate(getDate(order))}
                        </td>

                        {/* Accept / Reject */}
                        <td className="inc-td" style={{ textAlign:'center' }}>
                          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center' }}>
                            <button
                              className="btn-accept"
                              disabled={isWorking}
                              onClick={() => handleIncomingAction(oid, 'accept')}
                            >
                              {actionLoading[`inc_${oid}`] === 'accept'
                                ? '…'
                                : <><Check size={13} /> Accept</>}
                            </button>
                            <button
                              className="btn-reject"
                              disabled={isWorking}
                              onClick={() => handleIncomingAction(oid, 'reject')}
                            >
                              {actionLoading[`inc_${oid}`] === 'reject'
                                ? '…'
                                : <><X size={13} /> Reject</>}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded items row ── */}
                      {expandedIncoming === oid && (
                        <tr>
                          <td colSpan={6} className="inc-expand-td">
                            <div style={{
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              marginBottom:'0.75rem',
                            }}>
                              <h4 style={{
                                margin:0, fontSize:'0.82rem', fontWeight:700,
                                color:'#92400e',
                                textTransform:'uppercase', letterSpacing:'0.05em',
                              }}>
                                Order Items
                              </h4>
                              {/* Prescription image link if present */}
                              {getImage(order) && (
                                <a
                                  href={`http://165.22.91.187:5000${getImage(order)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize:'0.78rem', color:'#b45309',
                                    textDecoration:'underline',
                                  }}
                                >
                                  View Prescription
                                </a>
                              )}
                            </div>
                            <ItemsPanel
                              items={items}
                              bg="#fef9c3"
                              borderColor="#fde68a"
                              textColor="#78350f"
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {activeOrders.length > 0 && (
          <div className="inc-footer">
            <span>
              {activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} waiting for review
            </span>
            <span>Click an Order ID to see items</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
           ORDER HISTORY TABLE
      ════════════════════════════════════════════ */}
      <section className="card">
        <div className="card-title">
          Order History
          <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <button
              className="btn-refresh-blue"
              onClick={fetchHistory}
              disabled={loadingHistory}
            >
              <RefreshCw
                size={14}
                style={{ animation: loadingHistory ? 'spin 1s linear infinite' : 'none' }}
              />
              {loadingHistory ? 'Loading…' : 'Refresh'}
            </button>

            <input
              type="text"
              placeholder="Search by ID or patient…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding:'0.48rem 0.75rem',
                border:'1px solid var(--border)',
                borderRadius:6, fontSize:'0.88rem',
              }}
            />

            <select
              value={statusFilter || ''}
              onChange={e => setStatusFilter(e.target.value || null)}
              style={{
                padding:'0.48rem 0.65rem',
                border:'1px solid var(--border)',
                borderRadius:6, cursor:'pointer', fontSize:'0.88rem',
              }}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error.history && (
          <ErrorBanner msg={error.history} onRetry={fetchHistory} />
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign:'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={7} style={{
                    textAlign:'center', padding:'2.5rem', color:'var(--text-muted)',
                  }}>
                    Loading order history…
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    textAlign:'center', padding:'2.5rem', color:'var(--text-muted)',
                  }}>
                    {historyOrders.length === 0
                      ? 'No order history found.'
                      : 'No orders match your search / filter.'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((order) => {
                  const oid        = getId(order);
                  const items      = getItems(order);
                  const status     = getStatus(order);
                  const isUpdating = !!actionLoading[oid];

                  return (
                    <React.Fragment key={oid}>
                      <tr>
                        {/* Order ID */}
                        <td style={{ fontWeight:600 }}>
                          <span
                            onClick={() =>
                              setExpandedOrder(p => p === oid ? null : oid)
                            }
                            style={{
                              cursor:'pointer',
                              display:'flex', alignItems:'center', gap:'0.5rem',
                            }}
                          >
                            {expandedOrder === oid
                              ? <ChevronUp size={16} />
                              : <ChevronDown size={16} />}
                            #{oid}
                          </span>
                        </td>

                        <td>{getName(order)}</td>
                        <td>{items.length} items</td>
                        <td style={{ fontWeight:600 }}>{getTotal(order)}</td>

                        {/* Status badge */}
                        <td>
                          <span className={`status-badge ${statusClass(status)}`}>
                            {isUpdating ? '…' : status}
                          </span>
                        </td>

                        <td style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>
                          {fmtDate(getDate(order))}
                        </td>

                        {/* Action dropdown */}
                        <td style={{ textAlign:'right', position:'relative' }}>
                          <div
                            style={{ display:'inline-block', position:'relative' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical
                              size={18}
                              color="var(--text-muted)"
                              style={{
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                opacity: isUpdating ? 0.45 : 1,
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                if (!isUpdating)
                                  setActiveDropdown(p => p === oid ? null : oid);
                              }}
                            />
                            {activeDropdown === oid && (
                              <div style={{
                                position:'absolute', right:0, top:'100%',
                                marginTop:6,
                                background:'var(--bg-main,#fff)',
                                border:'1px solid var(--border)',
                                borderRadius:8,
                                boxShadow:'0 6px 18px rgba(0,0,0,.13)',
                                zIndex:30, padding:'0.3rem 0', minWidth:165,
                              }}>
                                <div
                                  className="dd-item"
                                  onClick={() => handleReady(oid)}
                                >
                                  <PackageCheck size={14} color="#16a34a" />
                                  {status === 'Ready' ? '✓ Already Ready' : 'Mark as Ready'}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded items */}
                      {expandedOrder === oid && (
                        <tr>
                          <td colSpan={7} style={{
                            background:'var(--bg-main)',
                            padding:'1rem 1rem 1.25rem 2.5rem',
                            borderBottom:'1px solid var(--border)',
                          }}>
                            <div style={{
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              marginBottom:'0.6rem',
                            }}>
                              <h4 style={{
                                margin:0, fontSize:'0.85rem', color:'var(--text-muted)',
                              }}>
                                Order Items:
                              </h4>
                              {getImage(order) && (
                                <a
                                  href={`http://165.22.91.187:5000${getImage(order)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize:'0.8rem', color:'var(--primary,#3b82f6)' }}
                                >
                                  View Prescription
                                </a>
                              )}
                            </div>
                            <ItemsPanel items={items} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Orders;