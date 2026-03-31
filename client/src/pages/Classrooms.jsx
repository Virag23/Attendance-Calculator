import { useState, useEffect } from 'react';
import axios from 'axios';
import { School, Plus, Edit2, Trash2, Users, Clock, BookOpen, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

const C = {
  indigo:  { text: 'var(--indigo)',  bg: 'var(--indigo-dim)',  border: 'rgba(99,120,255,0.2)'  },
  emerald: { text: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,217,138,0.2)'  },
  rose:    { text: 'var(--rose)',    bg: 'var(--rose-dim)',    border: 'rgba(244,63,94,0.2)'   },
};

export default function Classrooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' or 'edit'
  const [current, setCurrent] = useState({ name: '', capacity: 40, teacherId: '', subject: '', schedule: '' });

  const load = async () => {
    try {
      const [r, t] = await Promise.all([
        axios.get(`${API}/rooms`),
        axios.get(`${API}/teachers`)
      ]);
      setRooms(r.data);
      setTeachers(t.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await axios.post(`${API}/rooms`, current);
      } else {
        await axios.put(`${API}/rooms/${current._id}`, current);
      }
      setModal(null);
      load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classroom? All associated live data will be lost.')) return;
    try {
      await axios.delete(`${API}/rooms/${id}`);
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading institutional space data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <School size={18} color="var(--indigo)" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Campus Layout
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Manage <span className="gradient-text">Classrooms</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Define rooms, capacity, and faculty assignments for {user?.institution}.</p>
        </div>
        <button onClick={() => { setCurrent({ name: '', capacity: 40, teacherId: '', subject: '', schedule: '' }); setModal('add'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'var(--indigo)', color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,120,255,0.3)'
          }}>
          <Plus size={18} /> Add Classroom
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {rooms.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: 100, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px dashed var(--border)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No classrooms configured yet.</div>
          </div>
        ) : rooms.map(room => (
          <div key={room._id} className="card card-glow" style={{ padding: 24, position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{room.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Hash size={12} /> Capacity: {room.capacity} Students
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setCurrent(room); setModal('edit'); }} style={iconBtn}><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(room._id)} style={{ ...iconBtn, color: 'var(--rose)' }}><Trash2 size={13} /></button>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow icon={<Users size={13} />} label="Teacher" value={room.teacher?.name || 'Unassigned'} color="indigo" />
                <InfoRow icon={<BookOpen size={13} />} label="Subject" value={room.subject || 'Not Set'} color="emerald" />
                <InfoRow icon={<Clock size={13} />} label="Schedule" value={room.schedule || 'Regular'} color="amber" />
             </div>

             <div style={{ marginTop: 20, height: 4, background: 'var(--bg-base)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((room.currentCount / room.capacity) * 100, 100)}%`, background: 'var(--indigo)', transition: 'width 0.3s' }} />
             </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 460, borderRadius: 20, border: '1px solid var(--border)', padding: 32 }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{modal === 'add' ? 'Add New' : 'Edit'} Classroom</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Room Name</Label>
                <input style={input} required value={current.name} onChange={e => setCurrent({...current, name: e.target.value})} placeholder="e.g. Auditorium A1" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <Label>Capacity</Label>
                  <input style={input} type="number" required value={current.capacity} onChange={e => setCurrent({...current, capacity: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Time Slot</Label>
                  <input style={input} value={current.schedule} onChange={e => setCurrent({...current, schedule: e.target.value})} placeholder="e.g. 10:00 AM" />
                </div>
              </div>
              <div>
                <Label>Assign Teacher</Label>
                <select style={input} value={current.teacherId || (current.teacher?._id)} onChange={e => setCurrent({...current, teacherId: e.target.value})}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>)}
                </select>
              </div>
              <div>
                <Label>Subject Name</Label>
                <input style={input} value={current.subject} onChange={e => setCurrent({...current, subject: e.target.value})} placeholder="e.g. Computer Science" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--indigo)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: `var(--${color}-dim)`, border: `1px solid rgba(var(--${color}-hex), 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--${color})`, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{value}</span>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, marginLeft: 2 }}>{children}</label>;
}

const input = {
  width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 13,
  boxSizing: 'border-box'
};

const iconBtn = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
};
