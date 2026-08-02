import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, LogOut, Pencil, Trash2, User, Megaphone, X } from 'lucide-react';

const API = 'http://localhost:8000';

export default function ResidentDashboard() {
  const residentId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

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

  useEffect(() => {
    if (residentId) {
      fetchDetails();
      fetchProfile();
      fetchAnnouncements();
    }
  }, [residentId]);

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

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Building2 size={24} color="#2F7D6E" />
          <div>
            <h1 style={styles.heading}>Resident Dashboard</h1>
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
