import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, ShieldCheck, Users, UserCheck, HandHelping, Shield, AlertTriangle, CheckCircle2, LayoutDashboard, Search, MapPin, X, BarChart3, Settings, Building2, ChevronDown, ChevronRight, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = 'http://localhost:8000';

export default function AdminDashboard() {
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  const [counts, setCounts] = useState({ resident: 0, guardian: 0, volunteer: 0, security: 0 });
  const [alerts, setAlerts] = useState([]);
  const [residentInfo, setResidentInfo] = useState({});

  const [view, setView] = useState('dashboard'); // 'dashboard' | 'users' | 'emergencies' | 'reports' | 'settings' | 'societies'
  const [activeUserTab, setActiveUserTab] = useState('resident');
  const [userList, setUserList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [responderInfo, setResponderInfo] = useState({}); // { userId: { name, role, phone } }
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [emergencyFilter, setEmergencyFilter] = useState('all');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [settingsMessage, setSettingsMessage] = useState('');
  const userId = localStorage.getItem('userId');
  const [adminInfo, setAdminInfo] = useState({ email: '' });
  const [societies, setSocieties] = useState([]);
  const [expandedSocieties, setExpandedSocieties] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  const fetchUsersByRole = async (role) => {
    try {
      const res = await axios.get(`${API}/users/by-role/${role}`);
      setUserList(res.data);
    } catch (err) {
      console.log('Could not fetch users', err);
    }
  };

  const fetchCounts = async () => {
    try {
      const roles = ['resident', 'guardian', 'volunteer', 'security'];
      const results = await Promise.all(
        roles.map((role) => axios.get(`${API}/users/by-role/${role}`))
      );
      setCounts({
        resident: results[0].data.length,
        guardian: results[1].data.length,
        volunteer: results[2].data.length,
        security: results[3].data.length,
      });
    } catch (err) {
      console.log('Could not fetch counts', err);
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
    fetchCounts();
    fetchAlerts();
    if (userId) {
      axios.get(`${API}/user/${userId}/basic-info`)
        .then((res) => setAdminInfo(res.data))
        .catch((err) => console.log('Could not fetch admin info', err));
    }
  }, []);

  useEffect(() => {
    if (view === 'users') fetchUsersByRole(activeUserTab);
  }, [activeUserTab, view]);

  useEffect(() => {
    if (view === 'societies') {
      axios.get(`${API}/admin/societies-overview`)
        .then((res) => setSocieties(res.data))
        .catch((err) => console.log('Could not fetch societies overview', err));
    }
  }, [view]);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  };

  useEffect(() => {
    if (view === 'announcements') fetchAnnouncements();
  }, [view]);

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

  useEffect(() => {
    const idsToFetch = [...new Set(
      alerts.filter((a) => a.accepted_by && !responderInfo[a.accepted_by]).map((a) => a.accepted_by)
    )];
    idsToFetch.forEach(async (id) => {
      try {
        const res = await axios.get(`${API}/user/${id}/basic-info`);
        setResponderInfo((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.log('Could not fetch responder info', err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncementId) {
        await axios.put(`${API}/announcement/${editingAnnouncementId}`, announcementForm);
        setEditingAnnouncementId(null);
      } else {
        await axios.post(`${API}/announcement?posted_by=${userId}`, announcementForm);
      }
      setAnnouncementForm({ title: '', message: '' });
      fetchAnnouncements();
    } catch (err) {
      console.log('Failed to save announcement', err);
    }
  };

  const handleEditAnnouncement = (a) => {
    setEditingAnnouncementId(a.id);
    setAnnouncementForm({ title: a.title, message: a.message });
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API}/announcement/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.log('Failed to delete announcement', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsMessage('');
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setSettingsMessage('New passwords do not match');
      return;
    }
    try {
      await axios.put(`${API}/user/${userId}/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setSettingsMessage('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setSettingsMessage(err.response?.data?.detail || 'Failed to update password');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (userRole !== 'admin') {
    window.location.href = '/login';
    return null;
  }

  const activeCount = alerts.filter((a) => a.status !== 'resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const residentName = (id) => residentInfo[id]?.name || `Resident #${id}`;

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const statusColor = (status) => {
    if (status === 'pending') return '#C0392B';
    if (status === 'acknowledged') return '#C98A2E';
    if (status === 'responding') return '#3D6FA8';
    return '#2F7D6E';
  };

  const recentAlerts = alerts.slice(0, 8);

  const renderUserSummary = (u) => {
    if (activeUserTab === 'resident') return `Room ${u.room_number || '-'}`;
    if (activeUserTab === 'guardian') return `${u.relationship_to_resident || '-'} of ${u.resident_name || '-'}`;
    if (activeUserTab === 'volunteer') return `Availability: ${u.availability || '-'}`;
    if (activeUserTab === 'security') return `Staff ID: ${u.staff_id || '-'}`;
    return '';
  };

  const filteredUsers = userList.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.room_number && u.room_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAlerts = alerts.filter((a) => {
    if (emergencyFilter === 'all') return true;
    if (['pending', 'acknowledged', 'responding', 'resolved'].includes(emergencyFilter)) {
      return a.status === emergencyFilter;
    }
    return a.category === emergencyFilter;
  });

  // Reports: category breakdown
  const categoryCounts = ['Medical', 'Fire', 'Security', 'Other'].map((cat) => ({
    name: cat,
    value: alerts.filter((a) => a.category === cat).length,
  }));
  const CATEGORY_COLORS = { Medical: '#C0392B', Fire: '#E67E22', Security: '#8552A1', Other: '#6B7370' };

  // Reports: resolved vs active
  const resolvedVsActive = [
    { name: 'Active', value: alerts.filter((a) => a.status !== 'resolved').length },
    { name: 'Resolved', value: alerts.filter((a) => a.status === 'resolved').length },
  ];

  // Reports: by day
  const dayCounts = {};
  alerts.forEach((a) => {
    if (!a.created_at) return;
    const dayLabel = new Date(a.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short' });
    dayCounts[dayLabel] = (dayCounts[dayLabel] || 0) + 1;
  });
  const byDay = Object.entries(dayCounts)
    .map(([name, value]) => ({ name, value, sortKey: new Date(name + ' ' + new Date().getFullYear()) }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ name, value }) => ({ name, value }));

  const totalEmergencies = alerts.length;
  const pendingCount = alerts.filter((a) => a.status === 'pending').length;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <ShieldCheck size={22} color="#fff" />
          <div>
            <p style={styles.sidebarTitle}>CareConnect</p>
            <p style={styles.sidebarSubtitle}>ADMIN PANEL</p>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'dashboard' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'users' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('users')}
          >
            <Users size={16} /> Users
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'societies' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('societies')}
          >
            <Building2 size={16} /> Societies
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'emergencies' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('emergencies')}
          >
            <AlertTriangle size={16} /> Emergencies
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'announcements' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('announcements')}
          >
            <Megaphone size={16} /> Announcements
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'reports' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('reports')}
          >
            <BarChart3 size={16} /> Reports
          </button>
          <button
            style={{ ...styles.sidebarLink, ...(view === 'settings' ? styles.sidebarLinkActive : {}) }}
            onClick={() => setView('settings')}
          >
            <Settings size={16} /> Settings
          </button>
        </nav>

        <button onClick={handleLogout} style={styles.sidebarLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentHeader}>
          <h1 style={styles.heading}>
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </h1>
          <p style={styles.sub}>Welcome, {userName}</p>
        </div>

      {view === 'dashboard' && (
        <>
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <Users size={20} color="#2F7D6E" />
          <span style={styles.summaryNumber}>{counts.resident}</span>
          <span style={styles.summaryLabel}>Residents</span>
        </div>
        <div style={styles.summaryCard}>
          <UserCheck size={20} color="#3D6FA8" />
          <span style={styles.summaryNumber}>{counts.guardian}</span>
          <span style={styles.summaryLabel}>Guardians</span>
        </div>
        <div style={styles.summaryCard}>
          <HandHelping size={20} color="#C98A2E" />
          <span style={styles.summaryNumber}>{counts.volunteer}</span>
          <span style={styles.summaryLabel}>Volunteers</span>
        </div>
        <div style={styles.summaryCard}>
          <Shield size={20} color="#8552A1" />
          <span style={styles.summaryNumber}>{counts.security}</span>
          <span style={styles.summaryLabel}>Security</span>
        </div>
        <div style={styles.summaryCard}>
          <AlertTriangle size={20} color="#C0392B" />
          <span style={{ ...styles.summaryNumber, color: '#C0392B' }}>{activeCount}</span>
          <span style={styles.summaryLabel}>Active SOS</span>
        </div>
        <div style={styles.summaryCard}>
          <CheckCircle2 size={20} color="#2F7D6E" />
          <span style={{ ...styles.summaryNumber, color: '#2F7D6E' }}>{resolvedCount}</span>
          <span style={styles.summaryLabel}>Resolved SOS</span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Emergency Alerts</h3>
        {recentAlerts.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No alerts yet.</p>}
        <div style={styles.tableWrap}>
          {recentAlerts.map((a) => (
            <div key={a.id} style={styles.tableRow}>
              <span style={styles.tableCellName}>{residentName(a.resident_id)}</span>
              <span style={styles.tableCellCategory}>{a.category || '-'}</span>
              <span style={styles.tableCellTime}>{formatDateTime(a.created_at)}</span>
              <span style={{ ...styles.statusPill, background: `${statusColor(a.status)}15`, color: statusColor(a.status) }}>
                {a.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {view === 'users' && (
        <div style={styles.card}>
          <input
            placeholder="Search by name or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <div style={styles.tabRow}>
            {['resident', 'guardian', 'volunteer', 'security'].map((role) => (
              <button
                key={role}
                style={{ ...styles.tab, ...(activeUserTab === role ? styles.tabActive : {}) }}
                onClick={() => setActiveUserTab(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}s
              </button>
            ))}
          </div>
          <div style={styles.tableWrap}>
            {filteredUsers.length === 0 && (
              <p style={{ color: '#9AA3A0', fontSize: '13px', marginTop: '10px' }}>No {activeUserTab}s found.</p>
            )}
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                style={{ ...styles.tableRow, gridTemplateColumns: '2fr 2fr 2fr 1fr', cursor: 'pointer' }}
                onClick={() => setSelectedUser(u)}
              >
                <span style={styles.tableCellName}>{u.name}</span>
                <span style={styles.tableCellCategory}>{u.email}</span>
                <span style={styles.tableCellTime}>{renderUserSummary(u)}</span>
                <span style={styles.viewLink}>View</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'emergencies' && (
        <div style={styles.card}>
          <div style={styles.filterRow}>
            {['all', 'pending', 'acknowledged', 'responding', 'resolved', 'Medical', 'Fire', 'Security', 'Other'].map((f) => (
              <button
                key={f}
                style={{ ...styles.filterChip, ...(emergencyFilter === f ? styles.filterChipActive : {}) }}
                onClick={() => setEmergencyFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.tableWrap}>
            {filteredAlerts.length === 0 && (
              <p style={{ color: '#9AA3A0', fontSize: '13px', marginTop: '10px' }}>No emergencies match this filter.</p>
            )}
            {filteredAlerts.map((a) => (
              <div
                key={a.id}
                style={{ ...styles.tableRow, gridTemplateColumns: '0.6fr 1.5fr 1fr 1.5fr 1fr 0.7fr', cursor: 'pointer' }}
                onClick={() => setSelectedAlert(a)}
              >
                <span style={styles.tableCellCategory}>#{a.id}</span>
                <span style={styles.tableCellName}>{residentName(a.resident_id)}</span>
                <span style={styles.tableCellCategory}>{a.category || '-'}</span>
                <span style={styles.tableCellTime}>{formatDateTime(a.created_at)}</span>
                <span style={{ ...styles.statusPill, background: `${statusColor(a.status)}15`, color: statusColor(a.status) }}>
                  {a.status.toUpperCase()}
                </span>
                <span style={styles.viewLink}>View</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'reports' && (
        <>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <span style={styles.summaryNumber}>{totalEmergencies}</span>
              <span style={styles.summaryLabel}>Total Emergencies</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={{ ...styles.summaryNumber, color: '#C0392B' }}>{alerts.filter(a => a.category === 'Medical').length}</span>
              <span style={styles.summaryLabel}>Medical</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={{ ...styles.summaryNumber, color: '#E67E22' }}>{alerts.filter(a => a.category === 'Fire').length}</span>
              <span style={styles.summaryLabel}>Fire</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={{ ...styles.summaryNumber, color: '#8552A1' }}>{alerts.filter(a => a.category === 'Security').length}</span>
              <span style={styles.summaryLabel}>Security</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={{ ...styles.summaryNumber, color: '#C98A2E' }}>{pendingCount}</span>
              <span style={styles.summaryLabel}>Pending</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={{ ...styles.summaryNumber, color: '#2F7D6E' }}>{resolvedVsActive[1].value}</span>
              <span style={styles.summaryLabel}>Resolved</span>
            </div>
          </div>

          <div style={styles.reportsGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Emergencies by Category</h3>
              {totalEmergencies === 0 ? (
                <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={4} label>
                      {categoryCounts.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Resolved vs Active</h3>
              {totalEmergencies === 0 ? (
                <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={resolvedVsActive} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={4} label>
                      <Cell fill="#C0392B" />
                      <Cell fill="#2F7D6E" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
              <h3 style={styles.cardTitle}>Emergencies by Day</h3>
              {byDay.length === 0 ? (
                <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byDay}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" name="Emergencies" fill="#1B4B43" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'societies' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Societies</h3>
          {societies.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No societies added yet.</p>}
          {societies.map((s) => (
            <div key={s.id} style={styles.societyBlock}>
              <div
                style={styles.societyHeader}
                onClick={() => setExpandedSocieties((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
              >
                {expandedSocieties[s.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <div style={{ flex: 1 }}>
                  <p style={styles.societyName}>{s.name}{s.address ? ` — ${s.address}` : ''}</p>
                  <p style={styles.societyMeta}>
                    Added by {s.resident_name || 'Unknown'} · {s.blocks.length} block{s.blocks.length !== 1 ? 's' : ''} ·{' '}
                    {s.blocks.reduce((sum, b) => sum + b.flats.length, 0)} flats
                  </p>
                </div>
              </div>

              {expandedSocieties[s.id] && (
                <div style={styles.blockList}>
                  {s.blocks.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '12px', paddingLeft: '24px' }}>No blocks added yet.</p>}
                  {s.blocks.map((b) => {
                    const blockKey = `${s.id}-${b.id}`;
                    return (
                      <div key={b.id} style={styles.blockItem}>
                        <div
                          style={styles.blockHeader}
                          onClick={() => setExpandedBlocks((prev) => ({ ...prev, [blockKey]: !prev[blockKey] }))}
                        >
                          {expandedBlocks[blockKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span style={styles.blockName}>{b.name}</span>
                          <span style={styles.blockMeta}>{b.flats.length} flat{b.flats.length !== 1 ? 's' : ''}</span>
                        </div>
                        {expandedBlocks[blockKey] && (
                          <div style={styles.flatList}>
                            {b.flats.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '12px' }}>No flats added yet.</p>}
                            {b.flats.map((f) => (
                              <p key={f.id} style={styles.flatLine}>
                                Flat {f.flat_number} — {f.resident_name || 'Unassigned'}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'announcements' && (
        <div style={styles.reportsGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingAnnouncementId ? 'Edit Announcement' : 'Create Announcement'}</h3>
            <form onSubmit={handleAnnouncementSubmit} style={styles.form}>
              <label style={styles.fieldLabel}>Title</label>
              <input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                required
                style={styles.searchInput}
              />
              <label style={styles.fieldLabel}>Message</label>
              <textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                required
                rows={4}
                style={{ ...styles.searchInput, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <label style={styles.fieldLabel}>Audience</label>
              <select disabled style={{ ...styles.searchInput, color: '#9AA3A0' }}>
                <option>All Users (targeting coming later)</option>
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={styles.saveButton}>
                  {editingAnnouncementId ? 'Update' : 'Publish'}
                </button>
                {editingAnnouncementId && (
                  <button
                    type="button"
                    style={styles.cancelBtn}
                    onClick={() => {
                      setEditingAnnouncementId(null);
                      setAnnouncementForm({ title: '', message: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Posted Announcements</h3>
            {announcements.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No announcements yet.</p>}
            <ul style={styles.list}>
              {announcements.map((a) => (
                <li key={a.id} style={styles.announcementRow}>
                  <div>
                    <strong style={{ color: '#1B4B43', fontSize: '13px' }}>{a.title}</strong>
                    <p style={{ margin: '4px 0 0', color: '#6B7370', fontSize: '13px' }}>{a.message}</p>
                    <p style={{ margin: '4px 0 0', color: '#9AA3A0', fontSize: '11px' }}>{formatDateTime(a.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditAnnouncement(a)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteAnnouncement(a.id)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div style={{ ...styles.card, maxWidth: '420px' }}>
          <h3 style={styles.cardTitle}>Admin Profile</h3>
          <p style={styles.detailLine}><strong>Name:</strong> {userName}</p>
          <p style={styles.detailLine}><strong>Email:</strong> {adminInfo.email || '-'}</p>
          <p style={styles.detailLine}><strong>Role:</strong> Admin</p>

          <h3 style={{ ...styles.cardTitle, marginTop: '20px' }}>Change Password</h3>
          {settingsMessage && (
            <p style={{
              fontSize: '13px',
              color: settingsMessage.includes('success') ? '#2F7D6E' : '#C0392B',
              marginBottom: '10px',
            }}>
              {settingsMessage}
            </p>
          )}
          <form onSubmit={handleChangePassword} style={styles.form}>
            <label style={styles.fieldLabel}>Current Password</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
              style={styles.searchInput}
            />
            <label style={styles.fieldLabel}>New Password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
              style={styles.searchInput}
            />
            <label style={styles.fieldLabel}>Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              required
              style={styles.searchInput}
            />
            <button type="submit" style={styles.saveButton}>Update Password</button>
          </form>
        </div>
      )}

      {/* Emergency Detail Modal */}
      {selectedAlert && (
        <div style={styles.overlay} onClick={() => setSelectedAlert(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Emergency #{selectedAlert.id}</h3>
              <X size={18} style={styles.closeIcon} onClick={() => setSelectedAlert(null)} />
            </div>
            <p style={styles.detailLine}><strong>Resident:</strong> {residentName(selectedAlert.resident_id)}</p>
            <p style={styles.detailLine}><strong>Type:</strong> {selectedAlert.category || '-'}</p>
            {selectedAlert.message && <p style={styles.detailLine}><strong>Message:</strong> {selectedAlert.message}</p>}
            <p style={styles.detailLine}><strong>Created:</strong> {formatDateTime(selectedAlert.created_at)}</p>
            {selectedAlert.latitude && selectedAlert.longitude && (
              <a
                href={`https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={styles.mapLink}
              >
                <MapPin size={12} /> View location
              </a>
            )}
            <p style={{ ...styles.detailLine, marginTop: '10px' }}>
              <strong>Status:</strong>{' '}
              <span style={{ color: statusColor(selectedAlert.status), fontWeight: 700 }}>
                {selectedAlert.status.toUpperCase()}
              </span>
            </p>
            <div style={styles.notifyBlock}>
              <p style={styles.notifyLine}>Guardian &nbsp; ✓ Notified</p>
              <p style={styles.notifyLine}>Security &nbsp; ✓ Notified</p>
              <p style={styles.notifyLine}>Volunteer &nbsp; ✓ Notified</p>
            </div>
            {selectedAlert.accepted_by && responderInfo[selectedAlert.accepted_by] && (
              <p style={styles.detailLine}>
                <strong>Responder:</strong> {responderInfo[selectedAlert.accepted_by].name} ({responderInfo[selectedAlert.accepted_by].role})
              </p>
            )}
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={styles.overlay} onClick={() => setSelectedUser(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>{selectedUser.name}</h3>
              <span style={styles.closeIcon} onClick={() => setSelectedUser(null)}>✕</span>
            </div>
            <p style={styles.detailLine}><strong>Email:</strong> {selectedUser.email}</p>
            <p style={styles.detailLine}><strong>Role:</strong> {selectedUser.role}</p>
            {selectedUser.phone && <p style={styles.detailLine}><strong>Phone:</strong> {selectedUser.phone}</p>}
            {activeUserTab === 'resident' && (
              <>
                <p style={styles.detailLine}><strong>Room:</strong> {selectedUser.room_number || '-'}</p>
                <p style={styles.detailLine}><strong>Guardian contact:</strong> {selectedUser.guardian_contact || '-'}</p>
              </>
            )}
            {activeUserTab === 'guardian' && (
              <>
                <p style={styles.detailLine}><strong>Relationship:</strong> {selectedUser.relationship_to_resident || '-'}</p>
                <p style={styles.detailLine}><strong>Resident:</strong> {selectedUser.resident_name || '-'}</p>
              </>
            )}
            {activeUserTab === 'volunteer' && (
              <>
                <p style={styles.detailLine}><strong>Availability:</strong> {selectedUser.availability || '-'}</p>
                <p style={styles.detailLine}><strong>Skills:</strong> {selectedUser.skills || '-'}</p>
              </>
            )}
            {activeUserTab === 'security' && (
              <>
                <p style={styles.detailLine}><strong>Staff ID:</strong> {selectedUser.staff_id || '-'}</p>
                <p style={styles.detailLine}><strong>Shift:</strong> {selectedUser.shift || '-'}</p>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const styles = {
  navRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  navTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  navTabActive: {
    background: '#1B4B4312',
    borderColor: '#1B4B43',
    color: '#1B4B43',
  },
  societyBlock: { borderTop: '1px solid #F0F2F1', padding: '10px 0' },
  societyHeader: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  societyName: { margin: 0, fontSize: '14px', fontWeight: 700, color: '#1B4B43' },
  societyMeta: { margin: '2px 0 0', fontSize: '12px', color: '#6B7370' },
  blockList: { marginLeft: '24px', marginTop: '8px' },
  blockItem: { marginBottom: '6px' },
  blockHeader: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  blockName: { fontSize: '13px', fontWeight: 600, color: '#1B4B43' },
  blockMeta: { fontSize: '11px', color: '#9AA3A0' },
  flatList: { marginLeft: '20px', marginTop: '4px' },
  flatLine: { fontSize: '12px', color: '#6B7370', margin: '3px 0' },
  list: { marginTop: '4px', paddingLeft: '0', listStyle: 'none' },
  announcementRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderTop: '1px solid #F0F2F1',
  },
  iconBtn: { cursor: 'pointer', color: '#3D6FA8' },
  iconBtnDelete: { cursor: 'pointer', color: '#C0392B' },
  cancelBtn: {
    marginTop: '10px',
    padding: '10px',
    borderRadius: '7px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '12px', color: '#6B7370', marginTop: '4px' },
  saveButton: {
    marginTop: '10px',
    padding: '10px',
    borderRadius: '7px',
    border: 'none',
    background: '#1B4B43',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '7px',
    border: '1.5px solid #E2E5E3',
    fontSize: '13px',
    outline: 'none',
    background: '#fff',
    color: '#1B4B43',
    marginBottom: '10px',
    boxSizing: 'border-box',
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
    background: '#1B4B4312',
    borderColor: '#1B4B43',
    color: '#1B4B43',
  },
  viewLink: { color: '#3D6FA8', fontWeight: 600, fontSize: '12px' },
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
    width: '340px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  closeIcon: { cursor: 'pointer', color: '#6B7370', fontSize: '16px' },
  detailLine: { fontSize: '13px', color: '#1B4B43', margin: '6px 0' },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' },
  filterChip: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  filterChipActive: {
    background: '#1B4B4312',
    borderColor: '#1B4B43',
    color: '#1B4B43',
  },
  mapLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '12px',
    color: '#3D6FA8',
    marginTop: '4px',
  },
  notifyBlock: {
    background: '#F6F8F7',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '10px',
  },
  notifyLine: { fontSize: '12px', color: '#2F7D6E', margin: '3px 0', fontWeight: 600 },
  pageWrapper: { display: 'flex', minHeight: '100vh', background: '#F6F8F7' },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    background: '#1B4B43',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '26px', paddingLeft: '6px' },
  sidebarTitle: { margin: 0, color: '#fff', fontSize: '15px', fontWeight: 700 },
  sidebarSubtitle: { margin: 0, color: '#ffffffaa', fontSize: '10px', letterSpacing: '0.5px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#ffffffcc',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  sidebarLinkActive: {
    background: '#ffffff18',
    color: '#fff',
  },
  sidebarLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#F5B7B1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  mainContent: { flex: 1, padding: '30px', minWidth: 0 },
  contentHeader: { marginBottom: '20px' },
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryNumber: { fontSize: '24px', fontWeight: 700, color: '#1B4B43' },
  summaryLabel: { fontSize: '12px', color: '#6B7370' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardTitle: { margin: '0 0 14px', color: '#1B4B43', fontSize: '15px' },
  tableWrap: { display: 'flex', flexDirection: 'column' },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1fr',
    alignItems: 'center',
    padding: '10px 0',
    borderTop: '1px solid #F0F2F1',
    fontSize: '13px',
    gap: '8px',
  },
  tableCellName: { color: '#1B4B43', fontWeight: 600 },
  tableCellCategory: { color: '#6B7370' },
  tableCellTime: { color: '#9AA3A0', fontSize: '12px' },
  statusPill: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '999px',
    textAlign: 'center',
  },
};
