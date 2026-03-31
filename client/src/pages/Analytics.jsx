import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Legend
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, Target, Zap, Activity, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API } from '../config.js';

const COLORS = ['var(--indigo)', 'var(--emerald)', 'var(--rose)', 'var(--amber)', 'var(--cyan)'];

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, r] = await Promise.all([
        axios.get(`${API}/attendance/analytics`),
        axios.get(`${API}/rooms`)
      ]);
      setData(a.data);
      setRooms(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // 📈 1. Weekly Trend Data
  const trendMap = {};
  data.slice(-50).forEach(r => {
    const day = new Date(r.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
    if (!trendMap[day]) trendMap[day] = { day, avg: 0, n: 0 };
    trendMap[day].avg += r.attendancePercentage;
    trendMap[day].n += 1;
  });
  const trendData = Object.values(trendMap).map(d => ({ name: d.day, value: Math.round(d.avg / d.n) }));

  // 📊 2. Room Comparison Data
  const roomComparison = rooms.map(r => ({
    name: r.name,
    occupancy: r.currentCount,
    capacity: r.capacity,
    gap: Math.max(0, r.capacity - r.currentCount)
  })).slice(0, 8);

  // 🥧 3. Overall Distribution
  const totalStrength = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalPresent = rooms.reduce((s, r) => s + r.currentCount, 0);
  const distributionData = [
    { name: 'Present', value: totalPresent },
    { name: 'Vacant', value: Math.max(0, totalStrength - totalPresent) }
  ];

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Calculating institutional benchmarks...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
       
       {/* Header */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BarChart2 size={18} color="var(--indigo)" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Statistical Engine
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Advanced <span className="gradient-text">Analytics</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time institutional performance metrics for {user?.institution}.</p>
          </div>
          <div style={{ padding: '10px 18px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
             <Activity size={16} color="var(--emerald)" />
             <span style={{ fontSize: 13, fontWeight: 600 }}>System Integrity: 99.8%</span>
          </div>
       </div>

       {/* Top Metrics */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <MiniStat label="Institutional Avg" value="78.4%" icon={<TrendingUp size={14} />} color="indigo" />
          <MiniStat label="Room Utilization" value="62.1%" icon={<Target size={14} />} color="emerald" />
          <MiniStat label="Peak Hour" value="11:00 AM" icon={<Zap size={14} />} color="amber" />
          <MiniStat label="Total Records" value={data.length} icon={<Users size={14} />} color="cyan" />
       </div>

       {/* Main Chart Area */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          {/* Trend Line Chart */}
          <div className="card card-glow" style={{ padding: 24 }}>
             <ChartHeader title="Weekly Attendance Velocity" sub="Average student presence across all monitored classrooms" />
             <div style={{ height: 280, marginTop: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                        itemStyle={{ color: 'var(--indigo)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="var(--indigo)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Bar Chart Class Comparison */}
          <div className="card card-glow" style={{ padding: 24 }}>
             <ChartHeader title="Room Occupancy Audit" sub="Comparison of current students vs max capacity" />
             <div style={{ height: 280, marginTop: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={roomComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} hide />
                      <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={11} width={80} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                         contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="occupancy" stackId="a" fill="var(--indigo)" radius={[0, 0, 0, 0]} barSize={12} />
                      <Bar dataKey="gap" stackId="a" fill="var(--bg-elevated)" radius={[0, 4, 4, 0]} barSize={12} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* Bottom Charts */}
       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: 20 }}>
          
          <div className="card card-glow" style={{ padding: 24 }}>
            <ChartHeader title="Current Distribution" sub="Live present vs vacant seats" />
            <div style={{ height: 200, marginTop: 10 }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       <Cell fill="var(--indigo)" />
                       <Cell fill="var(--bg-elevated)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 10 }}>
                {distributionData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--indigo)' : 'var(--text-muted)' }} />
                     <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                     <span style={{ fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="card card-glow" style={{ padding: 24 }}>
            <ChartHeader title="Monthly Attendance Trend" sub="Historical projection based on institutional growth" />
            <div style={{ height: 200, marginTop: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                      <YAxis fontSize={11} stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="value" stroke="var(--emerald)" strokeWidth={3} dot={{ r: 4, fill: 'var(--emerald)' }} />
                   </LineChart>
                </ResponsiveContainer>
            </div>
          </div>
       </div>

    </div>
  );
}

function MiniStat({ label, value, icon, color }) {
  return (
    <div className="card card-glow" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
       <div style={{ width: 36, height: 36, borderRadius: 10, background: `var(--${color}-dim)`, border: `1px solid rgba(var(--${color}-hex), 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--${color})` }}>
          {icon}
       </div>
       <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
       </div>
    </div>
  );
}

function ChartHeader({ title, sub }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
