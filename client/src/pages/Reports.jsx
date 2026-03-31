import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileDown, FileBarChart, Table, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

const C = {
  emerald: { text: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,217,138,0.2)'  },
  amber:   { text: 'var(--amber)',   bg: 'var(--amber-dim)',   border: 'rgba(245,158,11,0.2)'  },
  rose:    { text: 'var(--rose)',    bg: 'var(--rose-dim)',    border: 'rgba(244,63,94,0.2)'   },
  indigo:  { text: 'var(--indigo)',  bg: 'var(--indigo-dim)',  border: 'rgba(99,120,255,0.2)'  },
};

function statusColor(pct) {
  if (pct >= 75) return 'emerald';
  if (pct >= 50) return 'amber';
  return 'rose';
}

export default function Reports() {
  const { user }              = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [viewImage, setViewImage] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/attendance`)
      .then(r => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = records.filter(r =>
    !filter || r.room?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDownload = (type) => {
    window.open(`${API}/attendance/reports/${type}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
             <span style={{ 
               padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, 
               textTransform: 'uppercase', color: 'var(--emerald)', background: 'var(--emerald-dim)',
               border: '1px solid rgba(16,217,138,0.3)'
             }}>
               {user?.role === 'principal' ? 'College-Wide Reporting' : 'Attendance History'}
             </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Attendance <span className="gradient-text">{user?.role === 'principal' ? 'Audit' : 'Reports'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {user?.role === 'principal' ? 'Consolidated college-wide reports · Full audit history' : 'Full history · Export PDF or Excel'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={btnOutline}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => handleDownload('pdf')} style={btnOutline}>
            <FileDown size={15} /> Export PDF
          </button>
          <button onClick={() => handleDownload('excel')} style={btnPrimary}>
            <FileBarChart size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (() => {
        const avg = records.reduce((s, r) => s + r.attendancePercentage, 0) / records.length;
        const best = records.reduce((a, b) => a.attendancePercentage > b.attendancePercentage ? a : b);
        const worst = records.reduce((a, b) => a.attendancePercentage < b.attendancePercentage ? a : b);
        const prefix = user?.role === 'principal' ? 'College' : '';
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SummaryCard label={`${prefix} Avg Attendance`} value={`${avg.toFixed(1)}%`} color="indigo" />
            <SummaryCard label={`${prefix} Best Session`} value={`${best.attendancePercentage.toFixed(1)}%`} sub={best.room?.name} color="emerald" />
            <SummaryCard label={`${prefix} Lowest Session`} value={`${worst.attendancePercentage.toFixed(1)}%`} sub={worst.room?.name} color="rose" />
          </div>
        );
      })()}

      {/* Table */}
      <div className="card card-glow" style={{ overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <Table size={16} />
            <span>Attendance History</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--indigo-dim)', color: 'var(--indigo)', fontSize: 11, fontWeight: 700 }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }}>
              <Calendar size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>All time</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <Filter size={13} color="var(--text-muted)" />
              <input
                placeholder="Filter by room..."
                value={filter} onChange={e => setFilter(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-primary)', width: 120, fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No records found. Start by capturing attendance in the Live Count page.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {['Date & Time', 'Classroom', 'Teacher', 'Total', 'Present', 'Absent', 'Sitting', 'Standing', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec, i) => {
                  const pct = rec.attendancePercentage;
                  const sc = statusColor(pct);
                  const c = C[sc];
                  return (
                    <tr key={rec._id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-primary)' }}>
                        {new Date(rec.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {rec.room?.name ?? '—'}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--indigo)' }}>
                        {rec.teacher?.name ?? '—'}
                      </td>
                      <td className="mono" style={{ padding: '13px 18px', fontSize: 13 }}>{rec.totalStrength}</td>
                      <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--emerald)' }}>{rec.present}</td>
                      <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--rose)' }}>{rec.absent}</td>
                      <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--cyan)' }}>{rec.sittingCount || 0}</td>
                      <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--amber)' }}>{rec.standingCount || 0}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--bg-base)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: c.text, borderRadius: 2 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: c.text, background: c.bg, border: `1px solid ${c.border}` }}>
                          {sc === 'emerald' ? 'Good' : sc === 'amber' ? 'Average' : 'Low'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        {rec.imageUrl && (
                          <button
                            onClick={() => setViewImage(rec.imageUrl)}
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              borderRadius: 6, padding: '4px 8px', fontSize: 11,
                              color: 'var(--text-muted)', cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--indigo)'; e.currentTarget.style.borderColor = 'var(--indigo)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            View Capture
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Image Viewer Modal ── */}
      {viewImage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(5,7,15,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 40,
        }} onClick={() => setViewImage(null)}>
          <div style={{
            position: 'relative', maxWidth: '100%', maxHeight: '100%',
            background: 'var(--bg-surface)', borderRadius: 20,
            border: '1px solid var(--border-bright)', overflow: 'hidden',
            boxShadow: '0 0 100px rgba(0,0,0,0.8)',
          }} onClick={e => e.stopPropagation()}>
            <img src={viewImage} style={{ maxWidth: 'min(1200px, 90vw)', maxHeight: '85vh', display: 'block' }} alt="Capture" />
            <div style={{
              padding: '16px 24px', background: 'var(--bg-elevated)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Privacy-Blurred Capture</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>All faces were automatically blurred before storage.</div>
              </div>
              <button
                onClick={() => setViewImage(null)}
                style={{
                  background: 'var(--indigo)', color: '#fff', border: 'none',
                  padding: '8px 24px', borderRadius: 8, fontWeight: 700,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }) {
  const c = { indigo: C.indigo, emerald: C.emerald, rose: C.rose }[color];
  return (
    <div className="card card-glow" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: c.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const btnOutline = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
};

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  background: 'var(--indigo)', border: 'none',
  color: '#fff', fontSize: 13, fontWeight: 600,
  boxShadow: '0 0 16px rgba(99,120,255,0.3)',
};
