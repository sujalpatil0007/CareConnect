import { useState, useEffect } from 'react';
import axios from 'axios';
import { HandHelping, LogOut, User, Megaphone, X, AlertTriangle, MapPin, Check } from 'lucide-react';

const API = 'http://localhost:8000';

export default function VolunteerDashboard() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const [profileForm, setProfileForm] = useState({ age: '', photo_url: '', medical_notes: '', skills: [] });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const availableSkills = ['First Aid', 'Medical', 'Fire Safety'];

  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const [availability, setAvailability] = useState('Available');
  const [message, setMessage] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [residentInfo, setResidentInfo] = useState({}); // { residentId: { name } }
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/${userId}/profile`);
      setProfileForm({
        age: res.data.age || '',
        photo_url: res.data.photo_url || '',
        medical_notes: res.data.medical_notes || '',
        skills: res.data.skills ? res.data.skills.split(',') : [],
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

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API}/emergency-alerts`);
      setAlerts(res.data);
    } catch (err) {
      console.log('Could not fetch alerts', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchAnnouncements();
      fetchAlerts();
    }
  }, [userId]);

  useEffect(() => {
    const idsToFetch = [...new Set(
      alerts.filter((a) => a.resident_id && !residentInfo[a.resident_id]).map((a) => a.resident_id)
    )];
    idsToFetch.forEach(async (id) => {
      try {
        const res = await axios.get(`${API}/user/${id}/basic-info`);
        setResidentInfo((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.log('Could not fetch resident info', err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

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
        skills: profileForm.skills.length > 0 ? profileForm.skills.join(',') : null,
      });
      showMessage('Profile updated!');
      setShowProfileModal(false);
    } catch (err) {
      showMessage('Failed to update profile');
    }
  };

  const toggleSkill = (skill) => {
    setProfileForm((prev) => {
      const has = prev.skills.includes(skill);
      return {
        ...prev,
        skills: has ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const handleAvailabilityToggle = async (newStatus) => {
    setAvailability(newStatus);
    try {
      await axios.put(`${API}/user/${userId}/availability?availability=${newStatus}`);
      showMessage(`Status set to ${newStatus}`);
    } catch (err) {
      showMessage('Failed to update availability');
    }
  };

  const handleAcceptAlert = async (id) => {
    try {
      await axios.put(`${API}/emergency-alert/${id}/acknowledge?accepted_by=${userId}`);
      showMessage('Request accepted');
      fetchAlerts();
    } catch (err) {
      showMessage('Failed to accept request');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await axios.put(`${API}/emergency-alert/${id}/resolve`);
      showMessage('Marked resolved');
      fetchAlerts();
    } catch (err) {
      showMessage('Failed to resolve');
    }
  };

  const handleStartAssistance = async (id) => {
    try {
      await axios.put(`${API}/emergency-alert/${id}/start-assistance`);
      showMessage('Assistance started');
      fetchAlerts();
    } catch (err) {
      showMessage('Failed to update');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const categoryColor = (cat) => {
    if (cat === 'Medical') return '#C0392B';
    if (cat === 'Fire') return '#E67E22';
    if (cat === 'Security') return '#8552A1';
    return '#6B7370';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const residentName = (id) => residentInfo[id]?.name || `Resident #${id}`;

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const myAcceptedAlerts = alerts.filter((a) => a.status === 'acknowledged' && String(a.accepted_by) === String(userId));
  const myRespondingAlerts = alerts.filter((a) => a.status === 'responding' && String(a.accepted_by) === String(userId));
  const myResolvedAlerts = alerts.filter((a) => a.status === 'resolved' && String(a.accepted_by) === String(userId));

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <HandHelping size={24} color="#C98A2E" />
          <div>
            <h1 style={styles.heading}>Volunteer Dashboard</h1>
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
              <label style={styles.fieldLabel}>Skills</label>
              <div style={styles.skillsRow}>
                {availableSkills.map((skill) => (
                  <label key={skill} style={styles.skillChip(profileForm.skills.includes(skill))}>
                    <input
                      type="checkbox"
                      checked={profileForm.skills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      style={{ marginRight: '5px' }}
                    />
                    {skill}
                  </label>
                ))}
              </div>
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

      <div style={styles.grid}>
        {/* Availability */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Availability Status</h3>
          <p style={{ color: '#6B7370', fontSize: '13px', marginBottom: '14px' }}>
            Let security and residents know if you're available to help right now.
          </p>
          <div style={styles.toggleRow}>
            <button
              style={{
                ...styles.toggleButton,
                ...(availability === 'Available' ? styles.toggleActiveGreen : {}),
              }}
              onClick={() => handleAvailabilityToggle('Available')}
            >
              Available
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(availability === 'Busy' ? styles.toggleActiveRed : {}),
              }}
              onClick={() => handleAvailabilityToggle('Busy')}
            >
              Busy
            </button>
          </div>
          {profileForm.skills.length > 0 && (
            <div style={{ ...styles.skillsRow, marginTop: '14px' }}>
              {profileForm.skills.map((skill) => (
                <span key={skill} style={styles.skillChip(true)}>{skill}</span>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Requests */}
        <div style={styles.card}>
          <h3 style={{ ...styles.cardTitle, color: '#C0392B' }}>
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Emergency Requests
          </h3>
          <ul style={styles.list}>
            {pendingAlerts.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No pending requests right now.</p>}
            {pendingAlerts.map((a) => (
              <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <strong style={{ color: '#1B4B43', fontSize: '13px' }}>{residentName(a.resident_id)}</strong>
                      {a.category && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: '#fff',
                          background: categoryColor(a.category), borderRadius: '999px', padding: '1px 7px',
                        }}>
                          {a.category}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0', color: '#6B7370', fontSize: '12px' }}>{a.message || 'No message'}</p>
                    <p style={{ margin: '0 0 2px', color: '#9AA3A0', fontSize: '11px' }}>{formatDateTime(a.created_at)}</p>
                    {a.latitude && a.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: '#3D6FA8', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <MapPin size={11} /> View location
                      </a>
                    )}
                  </div>
                  <button style={styles.smallActionBtn} onClick={() => handleAcceptAlert(a.id)}>
                    Accept
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {myAcceptedAlerts.length > 0 && (
            <>
              <h3 style={{ ...styles.cardTitle, marginTop: '20px', fontSize: '13px' }}>Accepted by Me</h3>
              <ul style={styles.list}>
                {myAcceptedAlerts.map((a) => (
                  <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#1B4B43' }}>
                        {residentName(a.resident_id)} — {a.category || 'Emergency'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', color: '#9AA3A0', fontSize: '11px' }}>{formatDateTime(a.created_at)}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {a.latitude && a.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.navigateBtn}
                        >
                          <MapPin size={12} /> Navigate
                        </a>
                      )}
                      <button style={styles.smallActionBtnOrange} onClick={() => handleStartAssistance(a.id)}>
                        Mark Assistance Started
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {myRespondingAlerts.length > 0 && (
            <>
              <h3 style={{ ...styles.cardTitle, marginTop: '20px', fontSize: '13px' }}>Currently Responding</h3>
              <ul style={styles.list}>
                {myRespondingAlerts.map((a) => (
                  <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#1B4B43' }}>
                        🟢 {residentName(a.resident_id)} — {a.category || 'Emergency'}
                      </span>
                      <button style={styles.smallActionBtnGreen} onClick={() => handleResolveAlert(a.id)}>
                        <Check size={12} /> Mark Resolved
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={styles.cardTitle}>Task History</h3>
            {myResolvedAlerts.length > 5 && (
              <button style={styles.historyLink} onClick={() => setShowAllHistory(!showAllHistory)}>
                {showAllHistory ? 'Show less' : 'View History'}
              </button>
            )}
          </div>
          {myResolvedAlerts.length === 0 && (
            <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No completed tasks yet.</p>
          )}
          <ul style={styles.list}>
            {(showAllHistory ? myResolvedAlerts : myResolvedAlerts.slice(0, 5)).map((a) => (
              <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{residentName(a.resident_id)} — {a.category || 'Emergency'}</span>
                  <span style={{ color: '#2F7D6E', fontWeight: 600 }}>✓ Resolved</span>
                </div>
                <p style={{ margin: '2px 0 0', color: '#9AA3A0', fontSize: '11px' }}>{formatDateTime(a.resolved_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
    background: '#C98A2E',
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
  historyLink: {
    background: 'none',
    border: 'none',
    color: '#3D6FA8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  skillsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' },
  skillChip: (active) => ({
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '999px',
    border: `1.5px solid ${active ? '#C98A2E' : '#E2E5E3'}`,
    background: active ? '#C98A2E15' : '#fff',
    color: active ? '#C98A2E' : '#6B7370',
    cursor: 'pointer',
  }),
  button: {
    marginTop: '4px',
    padding: '9px',
    borderRadius: '7px',
    border: 'none',
    background: '#C98A2E',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  navigateBtn: {
    fontSize: '11px',
    color: '#3D6FA8',
    background: '#3D6FA812',
    border: '1px solid #3D6FA8',
    borderRadius: '5px',
    padding: '5px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  smallActionBtnOrange: {
    fontSize: '11px',
    color: '#fff',
    background: '#C98A2E',
    border: 'none',
    borderRadius: '5px',
    padding: '5px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  smallActionBtn: {
    fontSize: '11px',
    color: '#fff',
    background: '#C0392B',
    border: 'none',
    borderRadius: '5px',
    padding: '5px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  smallActionBtnGreen: {
    fontSize: '11px',
    color: '#fff',
    background: '#2F7D6E',
    border: 'none',
    borderRadius: '5px',
    padding: '5px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    whiteSpace: 'nowrap',
  },
  toggleRow: { display: 'flex', gap: '10px' },
  toggleButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  toggleActiveGreen: { background: '#2F7D6E12', borderColor: '#2F7D6E', color: '#2F7D6E' },
  toggleActiveRed: { background: '#C0392B12', borderColor: '#C0392B', color: '#C0392B' },
  list: { marginTop: '12px', paddingLeft: '0', listStyle: 'none' },
  listItem: {
    fontSize: '12px',
    color: '#6B7370',
    padding: '6px 0',
    borderTop: '1px solid #F0F2F1',
  },
};
