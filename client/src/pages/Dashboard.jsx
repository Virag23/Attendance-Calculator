import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Users, UserCheck, UserMinus, TrendingUp, AlertTriangle, Sparkles, Activity } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

const C = {
  indigo:  { text: 'var(--indigo)',  bg: 'var(--indigo-dim)',  border: 'rgba(99,120,255,0.2)'  },
  emerald: { text: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,217,138,0.2)'  },
  rose:    { text: 'var(--rose)',    bg: 'var(--rose-dim)',    border: 'rgba(244,63,94,0.2)'   },
  amber:   { text: 'var(--amber)',   bg: 'var(--amber-dim)',   border: 'rgba(245,158,11,0.2)'  },
  cyan:    { text: 'var(--cyan)',    bg: 'var(--cyan-dim)',    border: 'rgba(34,211,238,0.2)'  },
};

const HOURS = ['9AM', '11AM', '1PM', '3PM', '5PM'];
const DAYS  = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const TT = {
  contentStyle: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: 'var(--text-primary)' },
  labelStyle: { color: 'var(--text-secondary)' },
};

function densityStatus(count, capacity) {
  const pct = count / capacity;
  if (count > capacity) return { label: 'Overcrowded', color: 'rose',    pct: 1 };
  if (pct > 0.66)       return { label: 'High',        color: 'amber',   pct };
  if (pct > 0.33)       return { label: 'Medium',      color: 'cyan',    pct };
  return                       { label: 'Low',          color: 'emerald', pct };
}

export default function Dashboard() {
  const { user }                  = useAuth();
  const [rooms, setRooms]         = useState([]);
  const [records, setRecords]     = useState([]);
  const [insights, setInsights]   = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]     = useState(true);

  const loadData = () => {
    Promise.all([
      axios.get(`${API}/rooms`),
      axios.get(`${API}/attendance/analytics`),
      axios.get(`${API}/insights`),
    ]).then(([r, a, i]) => {
      setRooms(r.data);
      setRecords(a.data);
      setInsights(i.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRoom !== 'all') {
      axios.get(`${API}/attendance/predict/${selectedRoom}`)
        .then(res => setPrediction(res.data))
        .catch(err => {
          console.error(err);
          setPrediction(null);
        });
    } else {
      setPrediction(null);
    }
  }, [selectedRoom]);

  // Calculate cumulative stats from Rooms (Live) if "all" is selected
  // Otherwise show stats for specific room
  let totalStrength = 0;
  let totalPresent = 0;

  if (selectedRoom === 'all') {
    totalStrength = rooms.reduce((sum, r) => sum + r.capacity, 0);
    totalPresent  = rooms.reduce((sum, r) => sum + r.currentCount, 0);
  } else {
    const room = rooms.find(r => r._id === selectedRoom);
    totalStrength = room?.capacity ?? 0;
    totalPresent  = room?.currentCount ?? 0;
  }

  const totalAbsent   = Math.max(0, totalStrength - totalPresent);
  const attendancePct = totalStrength ? Math.round((totalPresent / totalStrength) * 100) : 0;

  // Weekly trend — filter by room if selected
  const filteredRecords = selectedRoom === 'all' 
    ? records 
    : records.filter(r => r.room && (r.room._id === selectedRoom || r.room === selectedRoom));

  const trendMap = {};
  filteredRecords.forEach(r => {
    const day = new Date(r.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
    if (!trendMap[day]) trendMap[day] = { day, count: 0, n: 0 };
    trendMap[day].count += r.detectedCount;
    trendMap[day].n += 1;
  });
  const trend = Object.values(trendMap).map(d => ({ day: d.day, count: Math.round(d.count / d.n) })).slice(-7);

  // Heatmap — build from records by day+hour
  const heatmap = {};
  DAYS.forEach(d => { heatmap[d] = [0, 0, 0, 0, 0]; });
  records.forEach(r => {
    const d = new Date(r.timestamp);
    const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
    const h = d.getHours();
    const slot = h < 10 ? 0 : h < 12 ? 1 : h < 14 ? 2 : h < 16 ? 3 : 4;
    if (heatmap[dayKey]) heatmap[dayKey][slot] = Math.max(heatmap[dayKey][slot], r.detectedCount);
  });

  const pieData = [
    { name: 'Present', value: totalPresent, color: 'var(--emerald)' },
    { name: 'Absent',  value: totalAbsent,  color: 'var(--rose)'    },
  ];

  const overcrowded = rooms.filter(r => r.currentCount > r.capacity);

  const STATS = [
    { icon: Users,      label: 'Total Students', value: totalStrength, suffix: '',  color: 'indigo'  },
    { icon: UserCheck,  label: 'Present',         value: totalPresent,  suffix: '',  color: 'emerald' },
    { icon: UserMinus,  label: 'Absent',          value: totalAbsent,   suffix: '',  color: 'rose'    },
    { icon: TrendingUp, label: 'Attendance',      value: attendancePct, suffix: '%', color: 'amber'   },
  ];

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
             <span style={{ 
               padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, 
               textTransform: 'uppercase', color: 'var(--indigo)', background: 'var(--indigo-dim)',
               border: '1px solid rgba(99,120,255,0.3)'
             }}>
               {user?.role === 'hod' ? 'HOD Analytics Panel' : user?.role === 'principal' ? 'Principal Global Overview' : 'Dashboard'}
             </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Attendance <span className="gradient-text">Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {user?.role === 'hod' ? 'Deep analytics · Trend forecasting · Behavior insights' : 'Real-time analytics · AI insights · Multi-room tracking'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select 
            value={selectedRoom} 
            onChange={e => setSelectedRoom(e.target.value)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="all"> {user?.role === 'principal' ? 'Entire College' : 'All Classrooms'}</option>
            {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }}>
            <Activity size={14} color="var(--emerald)" />
            <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Overcrowded Alert */}
      {overcrowded.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderRadius: 12,
          background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.3)',
          color: 'var(--rose)',
        }} className="pulse-alert">
          <AlertTriangle size={18} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            Warning: {overcrowded.map(r => r.name).join(', ')} {overcrowded.length > 1 ? 'are' : 'is'} overcrowded.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STATS.map(({ icon: Icon, label, value, suffix, color }) => (
          <div key={label} className="card card-glow" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: C[color].bg, border: `1px solid ${C[color].border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={C[color].text} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: C[color].text, lineHeight: 1 }}>
                {value}{suffix}
              </div>
            </div>
          </div>
        ))}
        {prediction && (
          <div className="card card-glow" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, border: '1px dashed var(--indigo)' }}>
             <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: 'var(--indigo-dim)', border: '1px solid var(--indigo)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="var(--indigo)" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase' }}>Next Predicted</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--indigo)', lineHeight: 1 }}>
                {prediction.prediction} <span style={{ fontSize: 12 }}>STUDENTS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 20 }}>

        {/* Area Chart */}
        <div className="card card-glow" style={{ padding: 24 }}>
          <ST icon={<TrendingUp size={15} />} title="Weekly Trend" sub="Avg students per day" />
          <div style={{ height: 200, marginTop: 16 }}>
            {trend.length === 0 ? <Empty text="No records yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--indigo)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip {...TT} />
                  <Area type="monotone" dataKey="count" stroke="var(--indigo)" strokeWidth={2.5}
                    fill="url(#ag)" dot={{ r: 4, fill: 'var(--indigo)', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card card-glow" style={{ padding: 24 }}>
          <ST icon={<Activity size={15} />} title="Attendance per Session" sub="Detected count" />
          <div style={{ height: 200, marginTop: 16 }}>
            {trend.length === 0 ? <Empty text="No records yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip {...TT} cursor={{ fill: 'rgba(99,120,255,0.06)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {trend.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--rose)' : 'var(--indigo)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="card card-glow" style={{ padding: 24 }}>
          <ST icon={<Users size={15} />} title="Distribution" sub="Present vs Absent" />
          <div style={{ height: 160, marginTop: 8 }}>
            {totalStrength === 0 ? <Empty text="No data" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68}
                    paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...TT} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                <span className="mono" style={{ color: d.color, fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Classroom Density */}
        <div className="card card-glow" style={{ padding: 24 }}>
          <ST icon={<Users size={15} />} title="Classroom Density" sub="Live occupancy" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {rooms.length === 0 ? <Empty text="No rooms configured" /> : rooms.map(room => {
              const { label, color, pct } = densityStatus(room.currentCount, room.capacity);
              const c = C[color];
              return (
                <div key={room._id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: `1px solid ${c.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{room.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{room.currentCount} / {room.capacity}</span>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: c.text, background: c.bg, border: `1px solid ${c.border}` }}>
                      {label}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(pct * 100, 100)}%`, background: `linear-gradient(90deg, ${c.text}, ${c.text}aa)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap + Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Heatmap */}
          <div className="card card-glow" style={{ padding: 24 }}>
            <ST icon={<Activity size={15} />} title="Attendance Heatmap" sub="By day & time slot" />
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(5, 1fr)', gap: 4, alignItems: 'center' }}>
                <div />
                {HOURS.map(h => <div key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{h}</div>)}
                {DAYS.map(day => (
                  <div key={day} style={{ display: 'contents' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{day}</div>
                    {(heatmap[day] || [0,0,0,0,0]).map((v, i) => (
                      <div key={i} title={`${v} students`} style={{
                        height: 26, borderRadius: 5, cursor: 'help', transition: 'transform 0.15s',
                        background: v > 60
                          ? `rgba(244,63,94,${Math.min(0.3 + (v/70)*0.7, 1)})`
                          : `rgba(99,120,255,${Math.max(0.08, Math.min((v/70)*0.9, 0.9))})`,
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                <span>Low</span>
                {[0.12, 0.3, 0.55, 0.75, 0.92].map((o, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: `rgba(99,120,255,${o})` }} />
                ))}
                <span>High</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="card card-glow" style={{ padding: 24, flex: 1 }}>
            <ST icon={<Sparkles size={15} />} title="AI Insights" sub="Auto-generated" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {insights.length === 0 ? <Empty text="No insights yet — add attendance records to generate insights" /> :
                insights.slice(0, 4).map((ins, i) => {
                  const colorKey = ins.type === 'Alert' ? 'rose' : ins.type === 'Success' ? 'emerald' : ins.type === 'Trend' ? 'indigo' : 'amber';
                  const c = C[colorKey];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, fontSize: 12, color: c.text, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {ins.type === 'Alert' ? '⚠' : ins.type === 'Success' ? '↑' : ins.type === 'Trend' ? '◉' : '◷'}
                      </span>
                      {ins.message}
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ST({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--indigo)' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{text}</div>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 14 }}>
      Loading dashboard data...
    </div>
  );
}
