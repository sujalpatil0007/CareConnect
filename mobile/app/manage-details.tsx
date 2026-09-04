import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

export default function ManageDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const residentId = params.userId;

  const [details, setDetails] = useState({
    societies: [], blocks: [], flats: [], guardians: [], emergency_contacts: [],
  });
  const [message, setMessage] = useState('');

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

  const fetchDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/resident/${residentId}/details`);
      setDetails(res.data);
    } catch (err) {
      console.log('Could not fetch details', err);
    }
  }, [residentId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const showMsg = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  // ---------- SOCIETY ----------
  const submitSociety = async () => {
    if (!societyForm.name) return;
    try {
      if (editingSocietyId) {
        await axios.put(`${API_URL}/society/${editingSocietyId}`, societyForm);
        setEditingSocietyId(null);
        showMsg('Society updated!');
      } else {
        await axios.post(`${API_URL}/society?resident_id=${residentId}`, societyForm);
        showMsg('Society added!');
      }
      setSocietyForm({ name: '', address: '' });
      fetchDetails();
    } catch (err) {
      showMsg('Failed to save society');
    }
  };
  const editSociety = (s) => {
    setEditingSocietyId(s.id);
    setSocietyForm({ name: s.name, address: s.address || '' });
  };
  const deleteSociety = async (id) => {
    try {
      await axios.delete(`${API_URL}/society/${id}`);
      showMsg('Society deleted');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to delete');
    }
  };

  // ---------- BLOCK ----------
  const submitBlock = async () => {
    if (!blockForm.name || !blockForm.society_id) return;
    try {
      const payload = { name: blockForm.name, society_id: parseInt(blockForm.society_id) };
      if (editingBlockId) {
        await axios.put(`${API_URL}/block/${editingBlockId}`, payload);
        setEditingBlockId(null);
        showMsg('Block updated!');
      } else {
        await axios.post(`${API_URL}/block`, payload);
        showMsg('Block added!');
      }
      setBlockForm({ name: '', society_id: '' });
      fetchDetails();
    } catch (err) {
      showMsg('Failed to save block');
    }
  };
  const editBlock = (b) => {
    setEditingBlockId(b.id);
    setBlockForm({ name: b.name, society_id: String(b.society_id) });
  };
  const deleteBlock = async (id) => {
    try {
      await axios.delete(`${API_URL}/block/${id}`);
      showMsg('Block deleted');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to delete');
    }
  };

  // ---------- FLAT ----------
  const submitFlat = async () => {
    if (!flatForm.flat_number || !flatForm.block_id) return;
    try {
      const payload = { flat_number: flatForm.flat_number, block_id: parseInt(flatForm.block_id) };
      if (editingFlatId) {
        await axios.put(`${API_URL}/flat/${editingFlatId}`, payload);
        setEditingFlatId(null);
        showMsg('Flat updated!');
      } else {
        await axios.post(`${API_URL}/flat?resident_id=${residentId}`, payload);
        showMsg('Flat added!');
      }
      setFlatForm({ flat_number: '', block_id: '' });
      fetchDetails();
    } catch (err) {
      showMsg('Failed to save flat');
    }
  };
  const editFlat = (f) => {
    setEditingFlatId(f.id);
    setFlatForm({ flat_number: f.flat_number, block_id: String(f.block_id) });
  };
  const deleteFlat = async (id) => {
    try {
      await axios.delete(`${API_URL}/flat/${id}`);
      showMsg('Flat deleted');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to delete');
    }
  };

  // ---------- GUARDIAN ----------
  const submitGuardian = async () => {
    if (!guardianForm.name || !guardianForm.phone) return;
    try {
      if (editingGuardianId) {
        await axios.put(`${API_URL}/guardian/${editingGuardianId}`, guardianForm);
        setEditingGuardianId(null);
        showMsg('Guardian updated!');
      } else {
        await axios.post(`${API_URL}/guardian?resident_id=${residentId}`, guardianForm);
        showMsg('Guardian added!');
      }
      setGuardianForm({ name: '', phone: '', guardian_type: 'primary' });
      fetchDetails();
    } catch (err) {
      showMsg('Failed to save guardian');
    }
  };
  const editGuardian = (g) => {
    setEditingGuardianId(g.id);
    setGuardianForm({ name: g.name, phone: g.phone, guardian_type: g.guardian_type });
  };
  const approveGuardian = async (id) => {
    try {
      await axios.put(`${API_URL}/guardian/${id}/approve`);
      showMsg('Guardian approved!');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to approve');
    }
  };
  const deleteGuardian = async (id) => {
    try {
      await axios.delete(`${API_URL}/guardian/${id}`);
      showMsg('Guardian deleted');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to delete');
    }
  };

  // ---------- EMERGENCY CONTACT ----------
  const submitContact = async () => {
    if (!contactForm.name || !contactForm.phone) return;
    try {
      if (editingContactId) {
        await axios.put(`${API_URL}/emergency-contact/${editingContactId}`, contactForm);
        setEditingContactId(null);
        showMsg('Contact updated!');
      } else {
        await axios.post(`${API_URL}/emergency-contact?resident_id=${residentId}`, contactForm);
        showMsg('Contact added!');
      }
      setContactForm({ name: '', phone: '', relation: '' });
      fetchDetails();
    } catch (err) {
      showMsg('Failed to save contact');
    }
  };
  const editContact = (c) => {
    setEditingContactId(c.id);
    setContactForm({ name: c.name, phone: c.phone, relation: c.relation || '' });
  };
  const deleteContact = async (id) => {
    try {
      await axios.delete(`${API_URL}/emergency-contact/${id}`);
      showMsg('Contact deleted');
      fetchDetails();
    } catch (err) {
      showMsg('Failed to delete');
    }
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ padding: 20, paddingTop: 55 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Manage Details</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* SOCIETY */}
      <Section title={editingSocietyId ? 'Edit Society' : 'Add Society'}>
        <TextInput style={styles.input} placeholder="Society name" value={societyForm.name}
          onChangeText={(v) => setSocietyForm({ ...societyForm, name: v })} />
        <TextInput style={styles.input} placeholder="Address (optional)" value={societyForm.address}
          onChangeText={(v) => setSocietyForm({ ...societyForm, address: v })} />
        <ButtonRow
          onSubmit={submitSociety}
          submitLabel={editingSocietyId ? 'Update Society' : 'Add Society'}
          onCancel={editingSocietyId ? () => { setEditingSocietyId(null); setSocietyForm({ name: '', address: '' }); } : null}
        />
        {details.societies.map((s) => (
          <Row key={s.id} text={`#${s.id} — ${s.name}`} onEdit={() => editSociety(s)} onDelete={() => deleteSociety(s.id)} />
        ))}
      </Section>

      {/* BLOCK */}
      <Section title={editingBlockId ? 'Edit Block / Tower' : 'Add Block / Tower'}>
        <SimplePicker
          selected={blockForm.society_id}
          onSelect={(v) => setBlockForm({ ...blockForm, society_id: v })}
          options={details.societies.map((s) => ({ label: s.name, value: String(s.id) }))}
          placeholder="Select society"
        />
        <TextInput style={styles.input} placeholder="Block/Tower name" value={blockForm.name}
          onChangeText={(v) => setBlockForm({ ...blockForm, name: v })} />
        <ButtonRow
          onSubmit={submitBlock}
          submitLabel={editingBlockId ? 'Update Block' : 'Add Block'}
          onCancel={editingBlockId ? () => { setEditingBlockId(null); setBlockForm({ name: '', society_id: '' }); } : null}
        />
        {details.blocks.map((b) => (
          <Row key={b.id} text={`#${b.id} — ${b.name}`} onEdit={() => editBlock(b)} onDelete={() => deleteBlock(b.id)} />
        ))}
      </Section>

      {/* FLAT */}
      <Section title={editingFlatId ? 'Edit Flat' : 'Select / Add Flat'}>
        <SimplePicker
          selected={flatForm.block_id}
          onSelect={(v) => setFlatForm({ ...flatForm, block_id: v })}
          options={details.blocks.map((b) => ({ label: b.name, value: String(b.id) }))}
          placeholder="Select block"
        />
        <TextInput style={styles.input} placeholder="Flat number" value={flatForm.flat_number}
          onChangeText={(v) => setFlatForm({ ...flatForm, flat_number: v })} />
        <ButtonRow
          onSubmit={submitFlat}
          submitLabel={editingFlatId ? 'Update Flat' : 'Add Flat'}
          onCancel={editingFlatId ? () => { setEditingFlatId(null); setFlatForm({ flat_number: '', block_id: '' }); } : null}
        />
        {details.flats.map((f) => (
          <Row key={f.id} text={`#${f.id} — Flat ${f.flat_number}`} onEdit={() => editFlat(f)} onDelete={() => deleteFlat(f.id)} />
        ))}
      </Section>

      {/* GUARDIAN */}
      <Section title={editingGuardianId ? 'Edit Guardian' : 'Add Guardian'}>
        <TextInput style={styles.input} placeholder="Guardian name" value={guardianForm.name}
          onChangeText={(v) => setGuardianForm({ ...guardianForm, name: v })} />
        <TextInput style={styles.input} placeholder="Phone number" value={guardianForm.phone}
          onChangeText={(v) => setGuardianForm({ ...guardianForm, phone: v })} keyboardType="phone-pad" />
        <SimplePicker
          selected={guardianForm.guardian_type}
          onSelect={(v) => setGuardianForm({ ...guardianForm, guardian_type: v })}
          options={[{ label: 'Primary Guardian', value: 'primary' }, { label: 'Secondary Guardian', value: 'secondary' }]}
        />
        <ButtonRow
          onSubmit={submitGuardian}
          submitLabel={editingGuardianId ? 'Update Guardian' : 'Add Guardian'}
          onCancel={editingGuardianId ? () => { setEditingGuardianId(null); setGuardianForm({ name: '', phone: '', guardian_type: 'primary' }); } : null}
        />
        {details.guardians.map((g) => (
          <View key={g.id} style={styles.rowBox}>
            <Text style={styles.rowText}>
              {g.name} ({g.guardian_type}) — {g.phone}
              {g.status === 'pending' && <Text style={{ color: '#C98A2E' }}> (pending)</Text>}
              {g.status === 'approved' && <Text style={{ color: '#2F7D6E' }}> (linked)</Text>}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {g.status === 'pending' && (
                <TouchableOpacity onPress={() => approveGuardian(g.id)}>
                  <Text style={{ color: '#2F7D6E', fontWeight: '700', fontSize: 12 }}>Approve</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => editGuardian(g)}>
                <Text style={{ color: '#3D6FA8', fontWeight: '700', fontSize: 12 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteGuardian(g.id)}>
                <Text style={{ color: '#C0392B', fontWeight: '700', fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Section>

      {/* EMERGENCY CONTACT */}
      <Section title={editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}>
        <TextInput style={styles.input} placeholder="Contact name" value={contactForm.name}
          onChangeText={(v) => setContactForm({ ...contactForm, name: v })} />
        <TextInput style={styles.input} placeholder="Phone number" value={contactForm.phone}
          onChangeText={(v) => setContactForm({ ...contactForm, phone: v })} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Relation (e.g. brother, doctor)" value={contactForm.relation}
          onChangeText={(v) => setContactForm({ ...contactForm, relation: v })} />
        <ButtonRow
          onSubmit={submitContact}
          submitLabel={editingContactId ? 'Update Contact' : 'Add Contact'}
          onCancel={editingContactId ? () => { setEditingContactId(null); setContactForm({ name: '', phone: '', relation: '' }); } : null}
        />
        {details.emergency_contacts.map((c) => (
          <Row key={c.id} text={`${c.name} (${c.relation}) — ${c.phone}`} onEdit={() => editContact(c)} onDelete={() => deleteContact(c.id)} />
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ButtonRow({ onSubmit, submitLabel, onCancel }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
      <TouchableOpacity style={styles.addButton} onPress={onSubmit}>
        <Text style={styles.addButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Row({ text, onEdit, onDelete }) {
  return (
    <View style={styles.rowBox}>
      <Text style={styles.rowText}>{text}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={onEdit}>
          <Text style={{ color: '#3D6FA8', fontWeight: '700', fontSize: 12 }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Text style={{ color: '#C0392B', fontWeight: '700', fontSize: 12 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SimplePicker({ selected, onSelect, options, placeholder }) {
  if (options.length === 0) {
    return <Text style={styles.pickerEmpty}>{placeholder ? `${placeholder} — none added yet` : 'No options yet'}</Text>;
  }
  return (
    <View style={styles.pickerRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.pickerChip, selected === opt.value && styles.pickerChipActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.pickerChipText, selected === opt.value && { color: '#2F7D6E' }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F6F8F7' },
  backText: { color: '#3D6FA8', fontWeight: '600', fontSize: 14, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1B4B43', marginBottom: 10 },
  message: { color: '#2F7D6E', fontSize: 13, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1B4B43', marginBottom: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E5E3', borderRadius: 8, padding: 10,
    fontSize: 13, marginBottom: 8, backgroundColor: '#fff', color: '#1B4B43',
  },
  addButton: { flex: 1, backgroundColor: '#2F7D6E', borderRadius: 8, padding: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelButton: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E5E3', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelButtonText: { color: '#6B7370', fontWeight: '700', fontSize: 13 },
  rowBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F2F1', marginTop: 8,
  },
  rowText: { fontSize: 12, color: '#6B7370', flex: 1, marginRight: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pickerChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E5E3' },
  pickerChipActive: { borderColor: '#2F7D6E', backgroundColor: '#2F7D6E15' },
  pickerChipText: { fontSize: 11, color: '#6B7370', fontWeight: '600' },
  pickerEmpty: { fontSize: 11, color: '#9AA3A0', marginBottom: 8, fontStyle: 'italic' },
});
