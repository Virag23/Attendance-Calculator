import { useState } from 'react';
import axios from 'axios';
import { Settings, Shield, Bell, Target, Trash2, Save, User as UserIcon, Lock, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { API } from '../config.js';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(25);
  const [notifications, setNotifications] = useState({ email: true, push: false, alerts: true });

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('CRITICAL ACTION: This will permanently delete your account and all institutional data associated with it. This cannot be undone. Are you absolutely certain?');
    if (!confirm) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API}/auth/me`);
      alert('Account deleted successfully.');
      logout();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 800 }}>
       
       {/* Header */}
       <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Settings size={18} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              System Control
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            System <span className="gradient-text">Settings</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Configure institutional parameters and manage your account security.</p>
       </div>

       {/* Sections */}
       <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Profile Section */}
          <Section icon={<UserIcon size={16} />} title="Institutional Profile">
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                   <Label>Full Name</Label>
                   <input style={input} disabled value={user?.name} />
                </div>
                <div>
                   <Label>Email Identifier</Label>
                   <input style={input} disabled value={user?.email} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                   <Label>Institution Name</Label>
                   <input style={input} disabled value={user?.institution} />
                   <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Institutional names are locked for audit integrity.</p>
                </div>
             </div>
          </Section>

          {/* AI Settings */}
          <Section icon={<Target size={16} />} title="AI Detection Engine">
             <div style={{ padding: '10px 0' }}>
                <Label>Minimum Confidence Threshold</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10 }}>
                   <input 
                     type="range" min="10" max="95" step="5" 
                     value={confidence} onChange={e => setConfidence(e.target.value)}
                     style={{ flex: 1, accentColor: 'var(--indigo)', height: 4 }} 
                   />
                   <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--indigo)', width: 40 }}>{confidence}%</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                   Adjusting this affects how "certain" the AI must be to count a student. Current recommendation for {user?.institution} is 25%.
                </p>
             </div>
          </Section>

          {/* Notifications */}
          <Section icon={<Bell size={16} />} title="Notification Preferences">
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Toggle label="Email Overcrowding Alerts" enabled={notifications.email} onClick={() => setNotifications({...notifications, email: !notifications.email})} />
                <Toggle label="Push Attendance Milestone Reports" enabled={notifications.push} onClick={() => setNotifications({...notifications, push: !notifications.push})} />
                <Toggle label="Direct Dashboard Alerts" enabled={notifications.alerts} onClick={() => setNotifications({...notifications, alerts: !notifications.alerts})} />
             </div>
          </Section>

          {/* Security & Danger Zone */}
          <Section icon={<Shield size={16} />} title="Security & Danger Zone">
             <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                   <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Delete Institutional Account</h4>
                   <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Once you delete your account, there is no going back. All classrooms, teachers, and attendance history will be permanently erased.
                   </p>
                   <button onClick={handleDeleteAccount} disabled={loading} style={dangerBtn}>
                      <Trash2 size={14} /> {loading ? 'Deleting...' : 'Delete My Account Permanently'}
                   </button>
                </div>
             </div>
          </Section>
       </div>

    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="card card-glow" style={{ padding: 24 }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ color: 'var(--indigo)' }}>{icon}</div>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{title}</h3>
       </div>
       {children}
    </div>
  );
}

function Toggle({ label, enabled, onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
       <button onClick={onClick} style={{
         width: 40, height: 20, borderRadius: 20, border: 'none', cursor: 'pointer',
         background: enabled ? 'var(--indigo)' : 'var(--bg-elevated)', transition: 'all 0.2s', position: 'relative'
       }}>
          <div style={{ 
            width: 14, height: 14, borderRadius: '50%', background: '#fff', 
            position: 'absolute', top: 3, left: enabled ? 23 : 3, transition: 'all 0.2s' 
          }} />
       </button>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>{children}</label>;
}

const input = {
  width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 13,
  boxSizing: 'border-box'
};

const dangerBtn = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 8,
  background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.3)',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
};
