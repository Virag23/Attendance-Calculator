import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, User, Users, Building, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: '', role: 'admin' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.institution, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,120,255,0.1), transparent), var(--bg-base)',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #6378ff, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(99,120,255,0.45)',
          }}>
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Set up AttendAI for your institution</p>
        </div>

        {/* Card */}
        <div className="card card-glow" style={{ padding: '32px 28px' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8, marginBottom: 20,
              background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.3)',
              fontSize: 13, color: 'var(--rose)',
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name" icon={<User size={14} />}>
              <input type="text" placeholder="Dr. John Smith"
                value={form.name} onChange={set('name')} required style={inputStyle} />
            </Field>

            <Field label="Email Address" icon={<Mail size={14} />}>
              <input type="email" placeholder="you@institution.edu"
                value={form.email} onChange={set('email')} required style={inputStyle} />
            </Field>

            <Field label="System Role" icon={<Users size={14} />}>
              <select value={form.role} onChange={set('role')} style={inputStyle}>
                <option value="admin">Admin (Full Access / Upload)</option>
                <option value="teacher">Teacher (View Attendance)</option>
                <option value="hod">HOD (View Analytics)</option>
                <option value="principal">Principal (Audit Reports)</option>
              </select>
            </Field>

            <Field label="Institution Name" icon={<Building size={14} />}>
              <input type="text" placeholder="e.g. MIT, IIT Bombay"
                value={form.institution} onChange={set('institution')} required style={inputStyle} />
            </Field>

            <Field label="Password" icon={<Lock size={14} />}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')} required
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width 0.3s',
                      width: form.password.length < 6 ? '33%' : form.password.length < 10 ? '66%' : '100%',
                      background: form.password.length < 6 ? 'var(--rose)' : form.password.length < 10 ? 'var(--amber)' : 'var(--emerald)',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                    {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </Field>

            <button type="submit" disabled={loading} style={{
              marginTop: 8, padding: '12px', borderRadius: 9, border: 'none',
              background: loading ? 'var(--bg-elevated)' : 'var(--indigo)',
              color: loading ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 22px rgba(99,120,255,0.35)',
              transition: 'all 0.15s',
            }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--indigo)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>
        <span style={{ color: 'var(--indigo)' }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 8,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};
