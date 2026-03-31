import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, Download, Calendar, Filter, Eye, User, School, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

export default function AttendanceHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewImage, setViewImage] = useState(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/attendance`);
      setRecords(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => 
    !filter || 
    r.room?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    r.teacher?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDownload = (type) => {
    window.open(`${API}/attendance/reports/${type}`, '_blank');
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading audit trail...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <History size={18} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Historical Audit
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Attendance <span className="gradient-text">History</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Full traceability for all student captures in {user?.institution}.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handleDownload('pdf')} style={btnOutline}><Download size={15} /> Export PDF</button>
          <button onClick={() => handleDownload('excel')} style={btnPrimary}><Download size={15} /> Export Excel</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              placeholder="Search by classroom or teacher..." 
              value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, width: '100%' }}
            />
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={filterBadge}><Calendar size={12} /> All Time</div>
            <div style={filterBadge}><Filter size={12} /> Institutional Data Only</div>
         </div>
      </div>

      {/* Table */}
      <div className="card card-glow" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>
              <th style={th}>Timestamp</th>
              <th style={th}>Classroom</th>
              <th style={th}>Teacher</th>
              <th style={th}>Count</th>
              <th style={th}>Attendance %</th>
              <th style={th}>Visual Evidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No records matching search criteria.</td></tr>
            ) : filtered.map((rec) => (
              <tr key={rec._id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }} className="hover-row">
                <td style={td}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{new Date(rec.timestamp).toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(rec.timestamp).toLocaleTimeString()}</div>
                </td>
                <td style={td}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <School size={13} color="var(--indigo)" />
                      <span style={{ fontWeight: 600 }}>{rec.room?.name || 'Manual'}</span>
                   </div>
                </td>
                <td style={td}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={13} color="var(--emerald)" />
                      <span>{rec.teacher?.name || 'N/A'}</span>
                   </div>
                </td>
                <td style={td} className="mono">
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{rec.detectedCount} Students</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rec.standingCount} standing · {rec.sittingCount} sitting</span>
                   </div>
                </td>
                <td style={td}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, height: 4, background: 'var(--bg-base)', borderRadius: 2 }}>
                         <div style={{ width: `${rec.attendancePercentage}%`, height: '100%', background: rec.attendancePercentage > 75 ? 'var(--emerald)' : 'var(--amber)', borderRadius: 2 }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{rec.attendancePercentage.toFixed(1)}%</span>
                   </div>
                </td>
                <td style={td}>
                   {rec.imageUrl ? (
                     <button onClick={() => setViewImage(rec.imageUrl)} style={viewBtn}>
                       <Eye size={13} /> View Raw Image
                     </button>
                   ) : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No Image Captured</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Raw Image */}
      {viewImage && (
        <div style={modalOverlay} onClick={() => setViewImage(null)}>
           <div style={modalCard} onClick={e => e.stopPropagation()}>
              <img src={viewImage} style={imgStyle} alt="Audit Evidence" />
              <div style={modalBar}>
                 <div>
                    <div style={{ fontWeight: 800 }}>Institutional Evidence</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Original capture for session authentication.</div>
                 </div>
                 <button onClick={() => setViewImage(null)} style={closeBtn}>Close Audit</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: '14px 20px', fontWeight: 600 };
const td = { padding: '16px 20px', fontSize: 14 };

const btnOutline = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer'
};

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
  background: 'var(--indigo)', border: 'none', color: '#fff',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,120,255,0.3)'
};

const filterBadge = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
  background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600
};

const viewBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
  background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
  fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
};

const modalCard = {
  maxWidth: '90vw', maxHeight: '90vh', background: 'var(--bg-surface)', borderRadius: 20,
  border: '1px solid var(--border)', overflow: 'hidden'
};

const imgStyle = { maxWidth: '100%', maxHeight: '75vh', display: 'block' };

const modalBar = {
  padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtn = {
  background: 'var(--indigo)', color: '#fff', border: 'none', padding: '10px 24px',
  borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer'
};
