import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Building2, LogOut, Pencil, Trash2, User, Megaphone, X,
  AlertTriangle, MapPin, Home as HomeIcon, ListChecks, Bell,
} from 'lucide-react';

const API = 'http://localhost:8000';

export default function ResidentDashboard() {
  const residentId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const [view, setView] = useState('home'); // 'home' | 'manage'
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [timelineAlert, setTimelineAlert] = useState(null);

  const [details, setDetails] = useState({
    societies: [],
    blocks: [],
    flats: [],
    guardians: [],
    emergency_contacts: [],
  });

  const [societyForm, setSocietyForm] = useState({ name: '', address: '' });
  const [blockForm, setBlockForm] = useState({ name: '', society_id: '' });
  const [flatForm, setFlatForm] = useState({ flat_number: '', block_id: '' });
  const [guardianForm, setGuardianForm] = useState({ name: '', phone: '', guardian_type: 'primary' });
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: '' });

  const [editingSocietyId, setEditingSocietyId] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingFlatId, setEditingFlatId] = useState(null);
  const [editingGuardianId, setEditingGuardianId] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);

  // profile
  const [profileForm, setProfileForm] = useState({ age: '', photo_url: '', medical_notes: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(
    parseInt(localStorage.getItem(`notificationsSeenCount_${residentId}`) || '0', 10)
  );

  // emergency SOS
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCategory, setSosCategory] = useState('Medical');
  const [sosMessage, setSosMessage] = useState('');
  const [sosLocation, setSosLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [sosSent, setSosSent] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null); // null = not counting, otherwise seconds left
  const countdownRef = useRef(null);
  const sosSendingRef = useRef(false);
  const [myAlerts, setMyAlerts] = useState([]);

  const sosCategories = [
    { name: 'Medical', icon: '🩺' },
    { name: 'Fire', icon: '🔥' },
    { name: 'Security', icon: '🛡️' },
    { name: 'Other', icon: '⚠️' },
  ];

  const [message, setMessage] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await axios.get(`${API}/resident/${residentId}/details`);
      setDetails(res.data);
    } catch (err) {
      console.log('Could not fetch details', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/${residentId}/profile`);
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

  const fetchMyAlerts = async () => {
    try {
      const res = await axios.get(`${API}/emergency-alerts`);
      const mine = res.data.filter((a) => String(a.resident_id) === String(residentId));
      setMyAlerts(mine);
    } catch (err) {
      console.log('Could not fetch alerts', err);
    }
  };

  useEffect(() => {
    if (residentId) {
      fetchDetails();
      fetchProfile();
      fetchAnnouncements();
      fetchMyAlerts();
    }
  }, [residentId]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (showSosModal) {
      handleGetLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSosModal]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  // ---------- PROFILE ----------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/user/${residentId}/profile`, {
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

  // ---------- SOS ----------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSosLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('done');
      },
      () => {
        setLocationStatus('error');
      }
    );
  };

  const actuallySendSos = async () => {
    if (sosSendingRef.current) return; // extra safety: never send twice for one countdown
    sosSendingRef.current = true;
    try {
      await axios.post(`${API}/emergency-alert?resident_id=${residentId}`, {
        category: sosCategory,
        message: sosMessage || null,
        latitude: sosLocation ? String(sosLocation.lat) : null,
        longitude: sosLocation ? String(sosLocation.lng) : null,
      });
      setSosSent(true);
      showMessage('Emergency alert sent!');
      fetchMyAlerts();
      setTimeout(() => {
        setShowSosModal(false);
        setSosSent(false);
        setSosMessage('');
        setSosLocation(null);
        setLocationStatus('idle');
        setSosCategory('Medical');
        sosSendingRef.current = false;
      }, 1500);
    } catch (err) {
      showMessage('Failed to send alert');
      sosSendingRef.current = false;
    }
  };

  const handleStartCountdown = (e) => {
    e.preventDefault();
    if (sosCountdown !== null) return; // already counting down, ignore duplicate clicks
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSosCountdown(5);
    countdownRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          actuallySendSos();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelCountdown = () => {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
    setSosCountdown(null);
  };

  // ---------- SOCIETY ----------
  const handleSocietySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSocietyId) {
        await axios.put(`${API}/society/${editingSocietyId}`, societyForm);
        showMessage('Society updated!');
        setEditingSocietyId(null);
      } else {
        await axios.post(`${API}/society?resident_id=${residentId}`, societyForm);
        showMessage('Society added!');
      }
      setSocietyForm({ name: '', address: '' });
      fetchDetails();
    } catch (err) {
      showMessage('Failed to save society');
    }
  };

  const handleEditSociety = (s) => {
    setEditingSocietyId(s.id);
    setSocietyForm({ name: s.name, address: s.address || '' });
  };

  const handleDeleteSociety = async (id) => {
    if (!window.confirm('Delete this society? This may affect linked blocks/flats.')) return;
    try {
      await axios.delete(`${API}/society/${id}`);
      showMessage('Society deleted');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to delete society');
    }
  };

  // ---------- BLOCK ----------
  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: blockForm.name, society_id: parseInt(blockForm.society_id) };
      if (editingBlockId) {
        await axios.put(`${API}/block/${editingBlockId}`, payload);
        showMessage('Block updated!');
        setEditingBlockId(null);
      } else {
        await axios.post(`${API}/block`, payload);
        showMessage('Block added!');
      }
      setBlockForm({ name: '', society_id: '' });
      fetchDetails();
    } catch (err) {
      showMessage('Failed to save block');
    }
  };

  const handleEditBlock = (b) => {
    setEditingBlockId(b.id);
    setBlockForm({ name: b.name, society_id: String(b.society_id) });
  };

  const handleDeleteBlock = async (id) => {
    if (!window.confirm('Delete this block? This may affect linked flats.')) return;
    try {
      await axios.delete(`${API}/block/${id}`);
      showMessage('Block deleted');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to delete block');
    }
  };

  // ---------- FLAT ----------
  const handleFlatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { flat_number: flatForm.flat_number, block_id: parseInt(flatForm.block_id) };
      if (editingFlatId) {
        await axios.put(`${API}/flat/${editingFlatId}`, payload);
        showMessage('Flat updated!');
        setEditingFlatId(null);
      } else {
        await axios.post(`${API}/flat?resident_id=${residentId}`, payload);
        showMessage('Flat added!');
      }
      setFlatForm({ flat_number: '', block_id: '' });
      fetchDetails();
    } catch (err) {
      showMessage('Failed to save flat');
    }
  };

  const handleEditFlat = (f) => {
    setEditingFlatId(f.id);
    setFlatForm({ flat_number: f.flat_number, block_id: String(f.block_id) });
  };

  const handleDeleteFlat = async (id) => {
    if (!window.confirm('Delete this flat?')) return;
    try {
      await axios.delete(`${API}/flat/${id}`);
      showMessage('Flat deleted');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to delete flat');
    }
  };

  // ---------- GUARDIAN ----------
  const handleGuardianSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuardianId) {
        await axios.put(`${API}/guardian/${editingGuardianId}`, guardianForm);
        showMessage('Guardian updated!');
        setEditingGuardianId(null);
      } else {
        await axios.post(`${API}/guardian?resident_id=${residentId}`, guardianForm);
        showMessage('Guardian added!');
      }
      setGuardianForm({ name: '', phone: '', guardian_type: 'primary' });
      fetchDetails();
    } catch (err) {
      showMessage('Failed to save guardian');
    }
  };

  const handleEditGuardian = (g) => {
    setEditingGuardianId(g.id);
    setGuardianForm({ name: g.name, phone: g.phone, guardian_type: g.guardian_type });
  };

  const handleDeleteGuardian = async (id) => {
    if (!window.confirm('Delete this guardian?')) return;
    try {
      await axios.delete(`${API}/guardian/${id}`);
      showMessage('Guardian deleted');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to delete guardian');
    }
  };
  const handleApproveGuardian = async (id) => {
    try {
      await axios.put(`${API}/guardian/${id}/approve`);
      showMessage('Guardian approved!');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to approve guardian');
    }
  };

  // ---------- EMERGENCY CONTACT ----------
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContactId) {
        await axios.put(`${API}/emergency-contact/${editingContactId}`, contactForm);
        showMessage('Contact updated!');
        setEditingContactId(null);
      } else {
        await axios.post(`${API}/emergency-contact?resident_id=${residentId}`, contactForm);
        showMessage('Emergency contact added!');
      }
      setContactForm({ name: '', phone: '', relation: '' });
      fetchDetails();
    } catch (err) {
      showMessage('Failed to save contact');
    }
  };

  const handleEditContact = (c) => {
    setEditingContactId(c.id);
    setContactForm({ name: c.name, phone: c.phone, relation: c.relation || '' });
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    try {
      await axios.delete(`${API}/emergency-contact/${id}`);
      showMessage('Contact deleted');
      fetchDetails();
    } catch (err) {
      showMessage('Failed to delete contact');
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

  const statusDot = (status) => {
    if (status === 'pending') return '🟡';
    if (status === 'acknowledged') return '🔵';
    return '🟢';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const visibleAlerts = showAllAlerts ? myAlerts : myAlerts.slice(0, 3);

  // combined notification feed: announcements + this resident's own alert status updates
  const notifications = [
    ...announcements.map((a) => ({
      type: 'announcement',
      icon: '📢',
      title: a.title,
      subtitle: a.message,
      time: null, // announcements don't carry a timestamp from the API yet
    })),
    ...myAlerts
      .filter((a) => a.status !== 'pending')
      .map((a) => ({
        type: 'alert',
        icon: a.status === 'resolved' ? '✓' : '🚨',
        title: a.status === 'resolved' ? `Emergency #${a.id} resolved` : `Your ${a.category || 'emergency'} alert was accepted`,
        subtitle: a.status === 'resolved' ? formatDateTime(a.resolved_at) : formatDateTime(a.acknowledged_at),
        time: a.status === 'resolved' ? a.resolved_at : a.acknowledged_at,
      })),
  ].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  const notificationCount = notifications.length;
  const unseenCount = Math.max(0, notificationCount - lastSeenCount);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Building2 size={24} color="#2F7D6E" />
          <div>
            <h1 style={styles.heading}>CareConnect</h1>
            <p style={styles.sub}>Welcome, {userName}</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.iconButton}
            onClick={() => {
              setShowNotificationsModal(true);
              setLastSeenCount(notificationCount);
              localStorage.setItem(`notificationsSeenCount_${residentId}`, String(notificationCount));
            }}
          >
            <Bell size={16} /> Notifications
            {notificationCount > 0 && (
              <span style={{ ...styles.badge, background: unseenCount > 0 ? '#C0392B' : '#9AA3A0' }}>
                {notificationCount}
              </span>
            )}
          </button>
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

      {/* Nav tabs */}
      <div style={styles.navRow}>
        <button
          style={{ ...styles.navTab, ...(view === 'home' ? styles.navTabActive : {}) }}
          onClick={() => setView('home')}
        >
          <HomeIcon size={15} /> Home
        </button>
        <button
          style={{ ...styles.navTab, ...(view === 'manage' ? styles.navTabActive : {}) }}
          onClick={() => setView('manage')}
        >
          <ListChecks size={15} /> Manage Details
        </button>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      {/* SOS Modal */}
      {showSosModal && (
        <div style={styles.overlay} onClick={() => { handleCancelCountdown(); setShowSosModal(false); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.cardTitle, color: '#C0392B' }}>Send Emergency Alert</h3>
              <X size={20} style={styles.closeIcon} onClick={() => { handleCancelCountdown(); setShowSosModal(false); }} />
            </div>
            {sosSent ? (
              <p style={{ color: '#2F7D6E', fontSize: '14px' }}>Alert sent! Security and volunteers have been notified.</p>
            ) : sosCountdown !== null ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6B7370', fontSize: '13px', marginTop: 0 }}>
                  Sending {sosCategory} alert in...
                </p>
                <div style={styles.countdownCircle}>{sosCountdown}</div>
                <button type="button" style={styles.cancelSosButton} onClick={handleCancelCountdown}>
                  Cancel SOS
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartCountdown} style={styles.form}>
                <p style={{ color: '#6B7370', fontSize: '13px', marginTop: 0 }}>
                  This will notify security and available volunteers immediately.
                </p>

                <label style={styles.fieldLabel}>Emergency Type</label>
                <div style={styles.categoryGrid}>
                  {sosCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.name}
                      onClick={() => setSosCategory(cat.name)}
                      style={{
                        ...styles.categoryCard,
                        ...(sosCategory === cat.name ? styles.categoryCardActive : {}),
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                <label style={styles.fieldLabel}>Message (optional)</label>
                <textarea
                  placeholder="What happened?"
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  rows={3}
                  style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
                />

                <label style={styles.fieldLabel}>Location</label>
                {locationStatus === 'done' && sosLocation ? (
                  <div style={styles.locationDone}>
                    <span style={{ color: '#2F7D6E', fontWeight: 600 }}>✓ Location captured</span>
                    <span style={{ color: '#6B7370' }}>{sosLocation.lat.toFixed(4)}, {sosLocation.lng.toFixed(4)}</span>
                    <a
                      href={`https://www.google.com/maps?q=${sosLocation.lat},${sosLocation.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#3D6FA8', fontSize: '12px' }}
                    >
                      View on Map
                    </a>
                  </div>
                ) : (
                  <button type="button" onClick={handleGetLocation} style={styles.locationButton}>
                    <MapPin size={14} />
                    {locationStatus === 'idle' && 'Share my current location'}
                    {locationStatus === 'loading' && 'Getting location...'}
                    {locationStatus === 'error' && 'Could not get location — try again'}
                  </button>
                )}

                <button type="submit" style={styles.sosSubmitButton}>🚨 SEND SOS</button>
              </form>
            )}
          </div>
        </div>
      )}

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

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div style={styles.overlay} onClick={() => setShowNotificationsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Notifications</h3>
              <X size={20} style={styles.closeIcon} onClick={() => setShowNotificationsModal(false)} />
            </div>
            <ul style={styles.list}>
              {notifications.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No notifications yet.</p>}
              {notifications.map((n, idx) => (
                <li key={idx} style={{ ...styles.listItem, display: 'block' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '15px' }}>{n.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#1B4B43', fontWeight: 600 }}>{n.title}</p>
                      {n.subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9AA3A0' }}>{n.subtitle}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {timelineAlert && (
        <div style={styles.overlay} onClick={() => setTimelineAlert(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>
                🚨 Emergency #{timelineAlert.id}
              </h3>
              <X size={20} style={styles.closeIcon} onClick={() => setTimelineAlert(null)} />
            </div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#1B4B43', fontSize: '14px' }}>
              {timelineAlert.category || 'Emergency'}
            </p>
            {timelineAlert.message && (
              <p style={{ margin: '0 0 16px', color: '#6B7370', fontSize: '13px' }}>"{timelineAlert.message}"</p>
            )}

            <div style={styles.timelineList}>
              <div style={styles.timelineStep}>
                <span style={styles.timelineCheck}>✓</span>
                <div>
                  <p style={styles.timelineStepTitle}>SOS Created</p>
                  <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.created_at)}</p>
                </div>
              </div>
              <div style={styles.timelineStep}>
                <span style={styles.timelineCheck}>✓</span>
                <div>
                  <p style={styles.timelineStepTitle}>Guardian Notified</p>
                  <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.created_at)}</p>
                </div>
              </div>
              <div style={styles.timelineStep}>
                <span style={styles.timelineCheck}>✓</span>
                <div>
                  <p style={styles.timelineStepTitle}>Security Notified</p>
                  <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.created_at)}</p>
                </div>
              </div>
              <div style={styles.timelineStep}>
                <span style={styles.timelineCheck}>✓</span>
                <div>
                  <p style={styles.timelineStepTitle}>Volunteer Notified</p>
                  <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.created_at)}</p>
                </div>
              </div>

              {timelineAlert.acknowledged_at ? (
                <div style={styles.timelineStep}>
                  <span style={styles.timelineCheck}>✓</span>
                  <div>
                    <p style={styles.timelineStepTitle}>Responder Accepted</p>
                    <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.acknowledged_at)}</p>
                  </div>
                </div>
              ) : (
                <div style={styles.timelineStep}>
                  <span style={styles.timelineWaiting}>🟡</span>
                  <div>
                    <p style={styles.timelineStepTitle}>Waiting for Response</p>
                  </div>
                </div>
              )}

              {timelineAlert.resolved_at && (
                <div style={styles.timelineStep}>
                  <span style={styles.timelineCheck}>✓</span>
                  <div>
                    <p style={styles.timelineStepTitle}>Resolved</p>
                    <p style={styles.timelineStepTime}>{formatDateTime(timelineAlert.resolved_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'home' ? (
        <div style={styles.homeWrapper}>
          <h2 style={styles.greeting}>Good day, {userName} 👋</h2>
          <p style={styles.greetingSub}>Are you in an emergency?</p>

          <button style={styles.bigSosButton} onClick={() => setShowSosModal(true)}>
            <AlertTriangle size={32} />
            <span style={{ fontSize: '16px', fontWeight: 800, marginTop: '6px' }}>SOS</span>
            <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.9 }}>GET HELP NOW</span>
          </button>

          <div style={styles.recentAlertsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={styles.cardTitle}>Recent Alerts</h3>
              {myAlerts.length > 3 && (
                <button style={styles.linkButton} onClick={() => setShowAllAlerts(!showAllAlerts)}>
                  {showAllAlerts ? 'Show less' : 'View All Alerts'}
                </button>
              )}
            </div>
            {myAlerts.length === 0 && <p style={{ color: '#9AA3A0', fontSize: '13px' }}>No alerts sent yet.</p>}
            <ul style={styles.list}>
              {visibleAlerts.map((a) => (
                <li
                  key={a.id}
                  style={{ ...styles.listItem, display: 'block', cursor: 'pointer' }}
                  onClick={() => setTimelineAlert(a)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#1B4B43', fontWeight: 600 }}>
                      {a.category === 'Medical' && '🩺 '}
                      {a.category === 'Fire' && '🔥 '}
                      {a.category === 'Security' && '🛡️ '}
                      {a.category === 'Other' && '⚠️ '}
                      {a.category || 'Emergency'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>
                      {statusDot(a.status)} {a.status.toUpperCase()}
                    </span>
                  </div>
                  {a.message && <p style={{ margin: '2px 0 0', color: '#6B7370', fontSize: '12px' }}>{a.message}</p>}
                  <p style={{ margin: '2px 0 0', color: '#9AA3A0', fontSize: '11px' }}>{formatDateTime(a.created_at)}</p>
                  {a.latitude && a.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '12px', color: '#3D6FA8' }}
                    >
                      View shared location
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Add / Edit Society */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingSocietyId ? 'Edit Society' : 'Add Society'}</h3>
            <form onSubmit={handleSocietySubmit} style={styles.form}>
              <input
                placeholder="Society name"
                value={societyForm.name}
                onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                required
                style={styles.input}
              />
              <input
                placeholder="Address (optional)"
                value={societyForm.address}
                onChange={(e) => setSocietyForm({ ...societyForm, address: e.target.value })}
                style={styles.input}
              />
              <div style={styles.buttonRow}>
                <button type="submit" style={styles.button}>
                  {editingSocietyId ? 'Update Society' : 'Add Society'}
                </button>
                {editingSocietyId && (
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditingSocietyId(null);
                      setSocietyForm({ name: '', address: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul style={styles.list}>
              {details.societies.map((s) => (
                <li key={s.id} style={styles.listItem}>
                  <span>#{s.id} — {s.name}</span>
                  <span style={styles.iconRow}>
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditSociety(s)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteSociety(s.id)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add / Edit Block */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingBlockId ? 'Edit Block / Tower' : 'Add Block / Tower'}</h3>
            <form onSubmit={handleBlockSubmit} style={styles.form}>
              <select
                value={blockForm.society_id}
                onChange={(e) => setBlockForm({ ...blockForm, society_id: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Select society</option>
                {details.societies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input
                placeholder="Block/Tower name"
                value={blockForm.name}
                onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                required
                style={styles.input}
              />
              <div style={styles.buttonRow}>
                <button type="submit" style={styles.button}>
                  {editingBlockId ? 'Update Block' : 'Add Block'}
                </button>
                {editingBlockId && (
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditingBlockId(null);
                      setBlockForm({ name: '', society_id: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul style={styles.list}>
              {details.blocks.map((b) => (
                <li key={b.id} style={styles.listItem}>
                  <span>#{b.id} — {b.name}</span>
                  <span style={styles.iconRow}>
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditBlock(b)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteBlock(b.id)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add / Edit Flat */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingFlatId ? 'Edit Flat' : 'Select / Add Flat'}</h3>
            <form onSubmit={handleFlatSubmit} style={styles.form}>
              <select
                value={flatForm.block_id}
                onChange={(e) => setFlatForm({ ...flatForm, block_id: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Select block</option>
                {details.blocks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                placeholder="Flat number"
                value={flatForm.flat_number}
                onChange={(e) => setFlatForm({ ...flatForm, flat_number: e.target.value })}
                required
                style={styles.input}
              />
              <div style={styles.buttonRow}>
                <button type="submit" style={styles.button}>
                  {editingFlatId ? 'Update Flat' : 'Add Flat'}
                </button>
                {editingFlatId && (
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditingFlatId(null);
                      setFlatForm({ flat_number: '', block_id: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul style={styles.list}>
              {details.flats.map((f) => (
                <li key={f.id} style={styles.listItem}>
                  <span>#{f.id} — Flat {f.flat_number}</span>
                  <span style={styles.iconRow}>
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditFlat(f)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteFlat(f.id)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add / Edit Guardian */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingGuardianId ? 'Edit Guardian' : 'Add Guardian'}</h3>
            <form onSubmit={handleGuardianSubmit} style={styles.form}>
              <input
                placeholder="Guardian name"
                value={guardianForm.name}
                onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
                required
                style={styles.input}
              />
              <input
                placeholder="Phone number"
                value={guardianForm.phone}
                onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                required
                style={styles.input}
              />
              <select
                value={guardianForm.guardian_type}
                onChange={(e) => setGuardianForm({ ...guardianForm, guardian_type: e.target.value })}
                style={styles.input}
              >
                <option value="primary">Primary Guardian</option>
                <option value="secondary">Secondary Guardian</option>
              </select>
              <div style={styles.buttonRow}>
                <button type="submit" style={styles.button}>
                  {editingGuardianId ? 'Update Guardian' : 'Add Guardian'}
                </button>
                {editingGuardianId && (
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditingGuardianId(null);
                      setGuardianForm({ name: '', phone: '', guardian_type: 'primary' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul style={styles.list}>
              {details.guardians.map((g) => (
                <li key={g.id} style={styles.listItem}>
                  <span>
                    {g.name} ({g.guardian_type}) — {g.phone}
                    {g.status === 'pending' && <span style={{ color: '#C98A2E', fontSize: '11px', marginLeft: '6px' }}>(pending)</span>}
                    {g.status === 'approved' && <span style={{ color: '#2F7D6E', fontSize: '11px', marginLeft: '6px' }}>(linked)</span>}
                  </span>
                  <span style={styles.iconRow}>
                    {g.status === 'pending' && (
                      <button
                        style={{ fontSize: '11px', color: '#2F7D6E', background: 'none', border: '1px solid #2F7D6E', borderRadius: '5px', padding: '2px 6px', cursor: 'pointer' }}
                        onClick={() => handleApproveGuardian(g.id)}
                      >
                        Approve
                      </button>
                    )}
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditGuardian(g)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteGuardian(g.id)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add / Edit Emergency Contact */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>{editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</h3>
            <form onSubmit={handleContactSubmit} style={styles.form}>
              <input
                placeholder="Contact name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                style={styles.input}
              />
              <input
                placeholder="Phone number"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                required
                style={styles.input}
              />
              <input
                placeholder="Relation (e.g. brother, doctor)"
                value={contactForm.relation}
                onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                style={styles.input}
              />
              <div style={styles.buttonRow}>
                <button type="submit" style={styles.button}>
                  {editingContactId ? 'Update Contact' : 'Add Contact'}
                </button>
                {editingContactId && (
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => {
                      setEditingContactId(null);
                      setContactForm({ name: '', phone: '', relation: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul style={styles.list}>
              {details.emergency_contacts.map((c) => (
                <li key={c.id} style={styles.listItem}>
                  <span>{c.name} ({c.relation}) — {c.phone}</span>
                  <span style={styles.iconRow}>
                    <Pencil size={14} style={styles.iconBtn} onClick={() => handleEditContact(c)} />
                    <Trash2 size={14} style={styles.iconBtnDelete} onClick={() => handleDeleteContact(c.id)} />
                  </span>
                </li>
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
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  heading: { margin: 0, color: '#1B4B43', fontSize: '20px' },
  sub: { margin: 0, color: '#6B7370', fontSize: '13px' },
  navRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
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
    background: '#2F7D6E12',
    borderColor: '#2F7D6E',
    color: '#2F7D6E',
  },
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
    background: '#8552A1',
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
  categoryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px',
    borderRadius: '10px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  categoryCardActive: {
    background: '#C0392B12',
    borderColor: '#C0392B',
    color: '#C0392B',
  },
  locationButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 10px',
    borderRadius: '7px',
    border: '1.5px dashed #E2E5E3',
    background: '#fff',
    color: '#3D6FA8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  locationDone: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '9px 10px',
    borderRadius: '7px',
    border: '1.5px solid #2F7D6E33',
    background: '#EAF7EF',
    fontSize: '12px',
  },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  timelineStep: { display: 'flex', gap: '10px', paddingBottom: '14px', position: 'relative' },
  timelineCheck: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#2F7D6E',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timelineWaiting: { fontSize: '16px', flexShrink: 0 },
  timelineStepTitle: { margin: 0, fontSize: '13px', color: '#1B4B43', fontWeight: 600 },
  timelineStepTime: { margin: '2px 0 0', fontSize: '11px', color: '#9AA3A0' },
  countdownCircle: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: '#C0392B12',
    border: '3px solid #C0392B',
    color: '#C0392B',
    fontSize: '36px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px auto',
  },
  cancelSosButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#1B4B43',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
  },
  sosSubmitButton: {
    marginTop: '4px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#C0392B',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
  },
  homeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingTop: '20px',
  },
  greeting: { color: '#1B4B43', fontSize: '22px', margin: '0 0 4px' },
  greetingSub: { color: '#6B7370', fontSize: '14px', margin: '0 0 24px' },
  bigSosButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    border: 'none',
    background: 'radial-gradient(circle at 30% 30%, #E74C3C, #C0392B)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(192,57,43,0.4)',
    marginBottom: '32px',
  },
  recentAlertsCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'left',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#3D6FA8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
  buttonRow: { display: 'flex', gap: '8px', marginTop: '4px' },
  button: {
    flex: 1,
    padding: '9px',
    borderRadius: '7px',
    border: 'none',
    background: '#2F7D6E',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '9px',
    borderRadius: '7px',
    border: '1.5px solid #E2E5E3',
    background: '#fff',
    color: '#6B7370',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  list: { marginTop: '12px', paddingLeft: '0', listStyle: 'none' },
  listItem: {
    fontSize: '12px',
    color: '#6B7370',
    padding: '6px 0',
    borderTop: '1px solid #F0F2F1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconRow: { display: 'flex', gap: '10px' },
  iconBtn: { cursor: 'pointer', color: '#3D6FA8' },
  iconBtnDelete: { cursor: 'pointer', color: '#C0392B' },
};
