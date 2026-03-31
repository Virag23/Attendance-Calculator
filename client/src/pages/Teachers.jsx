import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Plus, X, User, BookOpen, Sparkles } from 'lucide-react';

import { API } from '../config.js';

const TT = {
  contentStyle: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: 'var(--text-primary)' },
  labelStyle: { color: 'var(--text-secondary)' },
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', subject: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    axios.get(`${API}/teachers`)
      .then(r => setTeachers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await axios.post(`${API}/teachers`, form);
      setForm({ name: '', subject: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add teacher');
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...teachers].sort((a, b) => b.attendanceAverage - a.attendanceAverage);

  const barColor = (v) => v > 80 ? 'var(--emerald)' : v > 60 ? 'var(--indigo)' : 'var(--rose)';

  const topTeacher = sorted[0];
  const avgAll = teachers.length
    ? (teachers.reduce((s, t) => s + t.attendanceAverage, 0) / teachers.length).toFixed(1)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Teacher <span className="gradient-text">Performance</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Attendance correlation per lecturer</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 8, border: 'none',
          background: showForm ? 'var(--rose-dim)' : 'var(--indigo)',
          color: showForm ? 'var(--rose)' : '#fff',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: showForm ? 'none' : '0 0 18px rgba(99,120,255,0.3)',
          transition: 'all 0.15s',
        }}>
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Add Teacher'}
        </button>
      </div>

      {/* Add Teacher Form */}
      {showForm && (
        <div className="card card-glow" style={{ padding: '22px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>New Teacher</div>
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 7, background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--rose)', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}
          <form onSubmit={addTeacher} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}><User size={12} /> Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dr. Sharma" required style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}><BookOpen size={12} /> Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Physics" required style={inputStyle} />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: 'var(--indigo)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 14px rgba(99,120,255,0.3)',
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading teachers...</div>
      ) : teachers.length === 0 ? (
        <div className="card card-glow" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>No teachers added yet.</div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Add your first teacher
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SCard label="Total Teachers" value={teachers.length} color="indigo" />
            <SCard label="Avg Attendance" value={`${avgAll}%`} color="amber" />
            <SCard label="Top Performer" value={topTeacher?.name ?? '—'} sub={topTeacher?.subject} color="emerald" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Bar Chart */}
            <div className="card card-glow" style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Attendance per Teacher</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Average % in their lectures</div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sorted} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip {...TT} cursor={{ fill: 'rgba(99,120,255,0.06)' }} />
                    <Bar dataKey="attendanceAverage" radius={[6, 6, 0, 0]} name="Attendance %">
                      {sorted.map((t, i) => <Cell key={i} fill={barColor(t.attendanceAverage)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Performance Ranking
              </div>
              {sorted.map((teacher, i) => {
                const v = teacher.attendanceAverage;
                const color = v > 80 ? 'var(--emerald)' : v > 60 ? 'var(--indigo)' : 'var(--rose)';
                return (
                  <div key={teacher._id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      }}>
                        #{i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{teacher.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{teacher.subject}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 18, fontWeight: 800, color }}>{v}%</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                        {v > 70
                          ? <TrendingUp size={11} color="var(--emerald)" />
                          : <TrendingDown size={11} color="var(--rose)" />}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {v > 80 ? 'Excellent' : v > 60 ? 'Average' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Observation */}
              {topTeacher && (
                <div style={{ padding: '16px', borderRadius: 10, background: 'var(--emerald-dim)', border: '1px solid rgba(16,217,138,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={14} color="var(--emerald)" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)' }}>AI Observation</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{topTeacher.name}'s lectures show the highest engagement at {topTeacher.attendanceAverage}%.
                    Consider sharing their teaching approach with lower-ranked departments."
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SCard({ label, value, sub, color }) {
  const colors = {
    indigo:  { text: 'var(--indigo)',  bg: 'var(--indigo-dim)'  },
    emerald: { text: 'var(--emerald)', bg: 'var(--emerald-dim)' },
    amber:   { text: 'var(--amber)',   bg: 'var(--amber-dim)'   },
  };
  const c = colors[color];
  return (
    <div className="card card-glow" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
