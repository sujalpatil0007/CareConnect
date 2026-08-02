import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, LogOut, Trash2, Users, AlertTriangle, Check } from 'lucide-react';

const API = 'http://localhost:8000';

export default function SecurityDashboard() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [message, setMessage] = useState('');

  const [activeTab, setActiveTab] = useState('resident');
  const [userList, setUserList] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  };

  const fetchUsersByRole = async (role) => {
    try {
      const res = await axios.get(`${API}/users/by-role/${role}`);
      setUserList(res.data);
    } catch (err) {
      console.log('Could not fetch users', err);
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
    fetchAnnouncements();
    fetchAlerts();
  }, []);

  useEffect(() => {
    fetchUsersByRole(activeTab);
  }, [activeTab]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/announcement?posted_by=${userId}`, form);
      setForm({ title: '', message: '' });
      showMessage('Announcement posted!');
      fetchAnnouncements();
    } catch (err) {
      showMessage('Failed to post announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API}/announcement/${id}`);
      showMessage('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      showMessage('Failed to delete announcement');
    }
  };

  const handleAcknowledgeAlert = async (id) => {
    try {
      await axios.put(`${API}/emergency-alert/${id}/acknowledge?accepted_by=${userId}`);
      showMessage('Alert acknowledged');
      fetchAlerts();
    } catch (err) {
      showMessage('Failed to acknowledge alert');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await axios.put(`${API}/emergency-alert/${id}/resolve`);
      showMessage('Alert marked resolved');
      fetchAlerts();
    } catch (err) {
      showMessage('Failed to resolve alert');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const renderUserDetails = (u) => {
    if (activeTab === 'resident') {
      return `Room ${u.room_number || '-'} · Guardian contact: ${u.guardian_contact || '-'}`;
    }
    if (activeTab === 'guardian') {
      return `${u.relationship_to_resident || '-'} of ${u.resident_name || '-'}`;
    }
    if (activeTab === 'volunteer') {
      return `Availability: ${u.availability || '-'} · Phone: ${u.phone || '-'}`;
    }
    return '';
  };

  const filteredUsers = userList.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.room_number && u.room_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <ShieldCheck size={24} color="#8552A1" />
          <div>
            <h1 style={styles.heading}>Security Dashboard</h1>
            <p style={styles.sub}>Welcome, {userName}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryNumber}>{alerts.filter(a => a.status === 'pending').length}</span>
          <span style={styles.summaryLabel}>Pending Alerts</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryNumber}>{announcements.length}</span>
          <span style={styles.summaryLabel}>Announcements</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryNumber}>{activeTab === 'resident' ? userList.length : '-'}</span>
          <span style={styles.summaryLabel}>Residents</span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Emergency Alerts */}
        <div style={styles.card}>
          <h3 style={{ ...styles.cardTitle, color: '#C0392B' }}>
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Emergency Requests
          </h3>
          <ul style={styles.list}>
            {alerts.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No alerts right now.</p>}
            {alerts.map((a) => (
              <li key={a.id} style={{ ...styles.listItem, display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ color: '#1B4B43', fontSize: '13px' }}>Resident #{a.resident_id}</strong>
                    <p style={{ margin: '2px 0', color: '#6B7370', fontSize: '12px' }}>{a.message || 'No message'}</p>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: a.status === 'pending' ? '#C0392B' : a.status === 'acknowledged' ? '#C98A2E' : '#2F7D6E',
                    }}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {a.status === 'pending' && (
                      <button style={styles.smallActionBtn} onClick={() => handleAcknowledgeAlert(a.id)}>
                        Acknowledge
                      </button>
                    )}
                    {a.status === 'acknowledged' && (
                      <button style={styles.smallActionBtnGreen} onClick={() => handleResolveAlert(a.id)}>
                        <Check size={12} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Announcements */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Post Announcement</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={styles.input}
            />
            <textarea
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={3}
              style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <button type="submit" style={styles.button}>Post Announcement</button>
          </form>

          <h3 style={{ ...styles.cardTitle, marginTop: '24px' }}>Posted Announcements</h3>
          <ul style={styles.list}>
            {announcements.map((a) => (
              <li key={a.id} style={styles.listItem}>
                <div>
                  <strong style={{ color: '#1B4B43' }}>{a.title}</strong>
                  <p style={{ margin: '4px 0', color: '#6B7370', fontSize: '13px' }}>{a.message}</p>
                </div>
                <Trash2 size={16} style={styles.iconBtnDelete} onClick={() => handleDelete(a.id)} />
              </li>
            ))}
          </ul>
        </div>

        {/* User Directory */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Directory
          </h3>

          <input
            placeholder="Search by name or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...styles.input, marginBottom: '10px' }}
          />

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'resident' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('resident')}
            >
              Residents
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'guardian' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('guardian')}
            >
              Guardians
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'volunteer' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('volunteer')}
            >
              Volunteers
            </button>
          </div>

          <ul style={styles.list}>
            {filteredUsers.length === 0 && (
              <p style={{ color: '#9AA3A0', fontSize: '13px', marginTop: '10px' }}>No {activeTab}s found.</p>
            )}
            {filteredUsers.map((u) => (
              <li key={u.id} style={{ ...styles.listItem, display: 'block' }}>
                <strong style={{ color: '#1B4B43', fontSize: '13px' }}>{u.name}</strong>
                <p style={{ margin: '2px 0 0', color: '#6B7370', fontSize: '12px' }}>{u.email}</p>
                <p style={{ margin: '2px 0 0', color: '#6B7370', fontSize: '12px' }}>{renderUserDetails(u)}</p>
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
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  heading: { margin: 0, color: '#1B4B43', fontSize: '22px' },
  sub: { margin: 0, color: '#6B7370', fontSize: '13px' },
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
  summaryRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '14px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '120px',
  },
  summaryNumber: { fontSize: '22px', fontWeight: 700, color: '#8552A1' },
  summaryLabel: { fontSize: '12px', color: '#6B7370', marginTop: '2px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
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
    background: '#8552A1',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
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
  tabRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  tab: {
    flex: 1,
    padding: '8px',
    borderRadius: '7px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabActive: {
    background: '#8552A112',
    borderColor: '#8552A1',
    color: '#8552A1',
  },
  list: { paddingLeft: '0', listStyle: 'none' },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderTop: '1px solid #F0F2F1',
  },
  iconBtnDelete: { cursor: 'pointer', color: '#C0392B', flexShrink: 0, marginLeft: '10px' },
};
