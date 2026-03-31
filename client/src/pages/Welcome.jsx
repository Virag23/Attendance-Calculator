import { useNavigate } from 'react-router-dom';
import { Zap, Shield, BarChart2, Camera, Users, FileText, ArrowRight, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: Camera,    title: 'Real-Time Counting',    desc: 'YOLOv8-powered live student detection via webcam' },
  { icon: Shield,    title: 'Face Blur Privacy',     desc: 'Automatic face anonymisation before any storage' },
  { icon: BarChart2, title: 'Analytics Dashboard',   desc: 'Charts, heatmaps and AI-generated insights' },
  { icon: Users,     title: 'Multi-Classroom',       desc: 'Track Room A, B, Labs and Seminar Halls at once' },
  { icon: FileText,  title: 'PDF / Excel Reports',   desc: 'One-click monthly report generation' },
  { icon: Zap,       title: 'Overcrowding Alerts',   desc: 'Instant email alerts when capacity is exceeded' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 60px', borderBottom: '1px solid var(--border)',
        background: 'rgba(5,7,15,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #6378ff, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(99,120,255,0.45)',
          }}>
            <Zap size={17} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }} className="gradient-text">AttendAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 22px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--indigo)'; e.target.style.color = 'var(--indigo)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            Sign In
          </button>
          <button onClick={() => navigate('/register')} style={{
            padding: '8px 22px', borderRadius: 8, border: 'none',
            background: 'var(--indigo)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 0 18px rgba(99,120,255,0.35)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.target.style.boxShadow = '0 0 28px rgba(99,120,255,0.55)'}
            onMouseLeave={e => e.target.style.boxShadow = '0 0 18px rgba(99,120,255,0.35)'}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px 60px', textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,120,255,0.12), transparent)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'var(--indigo-dim)', border: '1px solid rgba(99,120,255,0.25)',
          fontSize: 12, color: 'var(--indigo)', fontWeight: 600,
          marginBottom: 28, letterSpacing: '0.04em',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', boxShadow: '0 0 6px var(--indigo)' }} />
          AI-Powered Campus Intelligence System
        </div>

        <h1 style={{
          fontSize: 58, fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-1.5px', marginBottom: 22, maxWidth: 720,
        }}>
          Smart Attendance<br />
          <span className="gradient-text">Powered by AI</span>
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--text-secondary)', maxWidth: 520,
          lineHeight: 1.7, marginBottom: 40,
        }}>
          Automate student counting, detect overcrowding, generate reports and get AI insights — all in real time using YOLOv8.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/register')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 10, border: 'none',
            background: 'var(--indigo)', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 30px rgba(99,120,255,0.4)',
            transition: 'all 0.15s',
          }}>
            Start Free <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 32px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Sign In
          </button>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 24, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['YOLOv8 Detection', 'Face Blur Privacy', 'MongoDB Atlas', 'Real-Time Alerts'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <CheckCircle size={13} color="var(--emerald)" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 60px 80px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>
            Everything your campus needs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Industry-grade features built for modern institutions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ padding: '22px 20px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: 'var(--indigo-dim)', border: '1px solid rgba(99,120,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color="var(--indigo)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
