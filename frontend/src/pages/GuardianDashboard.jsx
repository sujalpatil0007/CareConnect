import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, LogOut, User, Megaphone, X, Building2, Phone } from 'lucide-react';

const API = 'http://localhost:8000';

export default function GuardianDashboard() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const [linkedData, setLinkedData] = useState({ linked: false });

  const [profileForm, setProfileForm] = useState({ age: '', photo_url: '', medical_notes: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const [message, setMessage] = useState('');

  const fetchLinkedResident = async () => {
    try {
      const res = await axios.get(`${API}/guardian-user/${userId}/linked-resident`);
      setLinkedData(res.data);
    } catch (err) {
      console.log('Could not fetch linked resident', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/${userId}/profile`);
      setProfileForm({
        age: res.data.age || '',
        photo_url: res.data.photo_url || '',
        medical_notes: res.data.medical_notes || '',
      });
    } catch (err) {
      console.log('Could not fetch profile', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLinkedResident();
      fetchProfile();
      fetchAnnouncements();
    }
  }, [userId]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/user/${userId}/profile`, {
        age: profileForm.age ? parseInt(profileForm.age) : null,
        photo_url: profileForm.photo_url || null,
        medical_notes: profileForm.medical_notes || null,
      });
      showMessage('Profile updated!');
      setShowProfileModal(false);
    } catch (err) {
      showMessage('Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Users size={24} color="#3D6FA8" />
          <div>
            <h1 style={styles.heading}>Guardian Dashboard</h1>
            <p style={styles.sub}>Welcome, {userName}</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconButton} onClick={() => setShowProfileModal(true)}>
            <User size={16} /> Profile
          </button>
          <button style={styles.iconButton} onClick={() => setShowAnnouncementsModal(true)}>
            <Megaphone size={16} /> Announcements
            {announcements.length > 0 && <span style={styles.badge}>{announcements.length}</span>}
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={styles.overlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>My Profile</h3>
              <X size={20} style={styles.closeIcon} onClick={() => setShowProfileModal(false)} />
            </div>
            <form onSubmit={handleProfileSubmit} style={styles.form}>
              <label style={styles.fieldLabel}>Age</label>
              <input
                type="number"
                value={profileForm.age}
                onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                style={styles.input}
              />
              <label style={styles.fieldLabel}>Photo URL</label>
              <input
                placeholder="Link to an image"
                value={profileForm.photo_url}
                onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })}
                style={styles.input}
              />
              <label style={styles.fieldLabel}>Medical Notes</label>
              <textarea
                value={profileForm.medical_notes}
                onChange={(e) => setProfileForm({ ...profileForm, medical_notes: e.target.value })}
                rows={3}
                style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button type="submit" style={styles.button}>Save Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* Announcements Modal */}
      {showAnnouncementsModal && (
        <div style={styles.overlay} onClick={() => setShowAnnouncementsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Announcements</h3>
              <X size={20} style={styles.closeIcon} onClick={() => setShowAnnouncementsModal(false)} />
            </div>
            <ul style={styles.list}>
              {announcements.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No announcements yet.</p>}
              {announcements.map((a) => (
                <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                  <strong style={{ color: '#1B4B43', fontSize: '13px' }}>{a.title}</strong>
                  <p style={{ margin: '4px 0 0', color: '#6B7370', fontSize: '12px' }}>{a.message}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!linkedData.linked ? (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Not Linked Yet</h3>
          <p style={{ color: '#6B7370', fontSize: '13px' }}>
            You're not linked to a resident yet. Ask your resident to add you as a guardian
            (using the same phone number you registered with) and approve you from their dashboard.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <Building2 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Linked Resident
            </h3>
            <p style={{ color: '#1B4B43', fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>
              {linkedData.resident_name}
            </p>
            <p style={{ color: '#6B7370', fontSize: '13px', margin: 0 }}>{linkedData.resident_email}</p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Society & Flat</h3>
            <ul style={styles.list}>
              {linkedData.societies?.map((s) => (
                <li key={s.id} style={styles.listItem}>{s.name}{s.address ? ` — ${s.address}` : ''}</li>
              ))}
              {linkedData.flats?.map((f) => (
                <li key={f.id} style={styles.listItem}>Flat {f.flat_number}</li>
              ))}
              {(!linkedData.societies?.length && !linkedData.flats?.length) && (
                <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No society/flat added yet.</p>
              )}
            </ul>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <Phone size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Emergency Contacts
            </h3>
            <ul style={styles.list}>
              {linkedData.emergency_contacts?.length === 0 && (
                <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No emergency contacts added yet.</p>
              )}
              {linkedData.emergency_contacts?.map((c) => (
                <li key={c.id} style={styles.listItem}>{c.name} ({c.relation}) — {c.phone}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', padding: '30px', background: '#F6F8F7' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  heading: { margin: 0, color: '#1B4B43', fontSize: '22px' },
  sub: { margin: 0, color: '#6B7370', fontSize: '13px' },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fff',
    border: '1.5px solid #E2E5E3',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
    color: '#1B4B43',
    fontSize: '13px',
    fontWeight: 600,
    position: 'relative',
  },
  badge: {
    background: '#3D6FA8',
    color: '#fff',
    borderRadius: '999px',
    fontSize: '10px',
    padding: '1px 6px',
    marginLeft: '2px',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fff',
    border: '1.5px solid #E2E5E3',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
    color: '#C0392B',
    fontSize: '13px',
    fontWeight: 600,
  },
  message: {
    background: '#EAF7EF',
    color: '#2F7D6E',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(27, 75, 67, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: '14px',
    padding: '22px',
    width: '360px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  closeIcon: { cursor: 'pointer', color: '#6B7370' },
  fieldLabel: { fontSize: '12px', color: '#6B7370', marginTop: '4px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardTitle: { margin: '0 0 12px', color: '#1B4B43', fontSize: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
 input: {
    padding: '9px 10px',
    borderRadius: '7px',
    border: '1.5px solid #E2E5E3',
    fontSize: '13px',
    outline: 'none',
    background: '#fff',
    color: '#1B4B43',
  },
  button: {
    marginTop: '4px',
    padding: '9px',
    borderRadius: '7px',
    border: 'none',
    background: '#3D6FA8',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  list: { marginTop: '4px', paddingLeft: '0', listStyle: 'none' },
  listItem: {
    fontSize: '13px',
    color: '#6B7370',
    padding: '6px 0',
    borderTop: '1px solid #F0F2F1',
  },
};
