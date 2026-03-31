import { Navigate, BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Camera, FileText, Users, Zap, LogOut, School, History, BarChart2, Bell, Settings } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome          from './pages/Welcome';
import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import LiveStream       from './pages/LiveStream';
import AttendanceHistory from './pages/AttendanceHistory';
import Analytics        from './pages/Analytics';
import Classrooms       from './pages/Classrooms';
import Teachers         from './pages/Teachers';
import Alerts           from './pages/Alerts';
import SettingsPage     from './pages/Settings';
import './index.css';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/live',       icon: Camera,          label: 'Live Capture' },
  { to: '/history',    icon: History,         label: 'History'      },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics'    },
  { to: '/classrooms', icon: School,          label: 'Classrooms'   },
  { to: '/teachers',   icon: Users,           label: 'Teachers'     },
  { to: '/alerts',     icon: Bell,            label: 'Alerts'       },
  { to: '/settings',   icon: Settings,        label: 'Settings'     },
];

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 232, background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '22px 12px',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #6378ff, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(99,120,255,0.4)', flexShrink: 0,
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }} className="gradient-text">AttendAI</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campus Intelligence</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>
            Navigation
          </div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
              color: isActive ? 'var(--indigo)' : 'var(--text-secondary)',
              background: isActive ? 'var(--indigo-dim)' : 'transparent',
              border: isActive ? '1px solid rgba(99,120,255,0.2)' : '1px solid transparent',
            })}>
              {({ isActive }) => (
                <>
                  <Icon size={16} color={isActive ? 'var(--indigo)' : 'var(--text-muted)'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {user && (
            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{user.name}</div>
              <div style={{ fontSize: 9, color: 'var(--indigo)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{user.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.institution || user.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 9, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s', width: '100%', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose-dim)'; e.currentTarget.style.color = 'var(--rose)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={15} /> Sign Out
          </button>
          <div style={{ padding: '9px 12px', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 5px var(--emerald)' }} />
              <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>All Systems Online</span>
            </div>
            YOLOv8 · FastAPI · MongoDB
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/live"       element={<LiveStream />} />
          <Route path="/history"    element={<AttendanceHistory />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/classrooms" element={<Classrooms />} />
          <Route path="/teachers"   element={<Teachers />} />
          <Route path="/alerts"     element={<Alerts />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"         element={<GuestRoute><Welcome /></GuestRoute>} />
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/*"        element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
