import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import RoleSelector from '../components/auth/RoleSelector';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  const [role, setRole] = useState(null);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <HeartHandshake size={26} color="#3D6FA8" />
          </div>
          <div>
            <h1 style={styles.logoText}>CareConnect</h1>
            <p style={styles.tagline}>Community Emergency Response & Assistance Network</p>
          </div>
        </div>

        <h2 style={styles.heading}>Welcome Back!</h2>
        <p style={styles.sub}>Login to your account to continue</p>

        <p style={styles.sectionLabel}>Login As</p>
        <RoleSelector selectedRole={role} onSelect={setRole} />
        <LoginForm role={role} />

        <p style={styles.footerText}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
        <p style={{ ...styles.footerText, marginTop: '6px' }}>
        <span style={styles.link} onClick={() => setRole('admin')}>Admin Login</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F0F5FA',
    padding: '20px',
  },
  card: {
    background: 'linear-gradient(160deg, #E6F4EC 0%, #EAF2FB 50%, #FDF6EC 100%)',
    padding: '32px',
    borderRadius: '14px',
    width: '400px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  logoIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: '#EAF2FB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { margin: 0, fontSize: '20px', color: '#1B4B43' },
  tagline: { margin: 0, fontSize: '11px', color: '#6B7370' },
  heading: { margin: '8px 0 2px', color: '#1B4B43', fontSize: '22px', textAlign: 'center' },
  sub: { fontSize: '13px', color: '#6B7370', textAlign: 'center', marginBottom: '20px' },
  sectionLabel: { fontSize: '13px', fontWeight: 600, color: '#1B4B43', marginBottom: '10px' },
  footerText: { fontSize: '13px', color: '#6B7370', marginTop: '18px', textAlign: 'center' },
  link: { color: '#3D6FA8', fontWeight: 600, textDecoration: 'none' },
};