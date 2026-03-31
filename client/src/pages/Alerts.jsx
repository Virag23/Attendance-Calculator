import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, AlertTriangle, Info, CheckCircle, Trash2, Clock, School, Trash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

const S = {
  critical: { icon: AlertTriangle, color: 'var(--rose)',    bg: 'var(--rose-dim)',    border: 'rgba(244,63,94,0.3)',  label: 'Critical' },
  warning:  { icon: Info,          color: 'var(--amber)',   bg: 'var(--amber-dim)',   border: 'rgba(245,158,11,0.3)', label: 'Warning'  },
  info:     { icon: CheckCircle,   color: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,217,138,0.3)', label: 'Insight'  },
};

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/alerts`);
      setAlerts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/alerts/${id}/read`);
      load();
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all institutional alerts?')) return;
    try {
      await axios.delete(`${API}/alerts/clear`);
      setAlerts([]);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Synchronizing system alerts...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bell size={18} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              System Notifications
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Security & <span className="gradient-text">Alerts</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time institutional warnings for {user?.institution}.</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={clearAll} style={clearBtn}>
            <Trash size={14} /> Clear All Alerts
          </button>
        )}
      </div>

      {/* Alerts Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
         {alerts.length === 0 ? (
           <div style={{ padding: 80, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px dashed var(--border)' }}>
              <CheckCircle size={32} color="var(--emerald)" style={{ marginBottom: 16 }} />
              <div style={{ fontWeight: 700, fontSize: 16 }}>All Systems Operational</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>No overcrowding or attendance anomalies detected in the last 24 hours.</p>
           </div>
         ) : alerts.map((alert) => {
           const cfg = S[alert.severity] || S.info;
           const Icon = cfg.icon;
           return (
             <div key={alert._id} className="card card-glow" style={{ 
               padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, 
               background: alert.isRead ? 'var(--bg-surface)' : 'var(--bg-elevated)',
               border: `1px solid ${alert.isRead ? 'var(--border)' : cfg.border}`,
               opacity: alert.isRead ? 0.6 : 1
             }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color
                }}>
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: cfg.color }}>{cfg.label}</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                         <Clock size={11} /> {new Date(alert.createdAt).toLocaleString()}
                      </div>
                   </div>
                   <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.message}</div>
                   {alert.room && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--indigo)', marginTop: 6, fontWeight: 500 }}>
                        <School size={12} /> Root Cause: {alert.room.name}
                     </div>
                   )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                   {!alert.isRead && (
                     <button onClick={() => markRead(alert._id)} style={actionBtn}>Acknowledge</button>
                   )}
                </div>
             </div>
           );
         })}
      </div>

    </div>
  );
}

const clearBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
  background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer'
};

const actionBtn = {
  padding: '6px 14px', borderRadius: 6, background: 'var(--indigo)', color: '#fff',
  border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 10px rgba(99,120,255,0.3)'
};
