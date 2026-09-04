import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

const roles = [
  { id: 'resident', label: 'Resident', color: '#2F7D6E' },
  { id: 'guardian', label: 'Guardian', color: '#3D6FA8' },
  { id: 'volunteer', label: 'Volunteer', color: '#C98A2E' },
  { id: 'security', label: 'Security', color: '#8552A1' },
];

// same idea as roleFields in your web RegisterForm.jsx
const roleFields = {
  resident: [
    { name: 'roomNumber', label: 'Room / Unit Number' },
    { name: 'guardianContact', label: "Guardian's Phone Number" },
  ],
  guardian: [
    { name: 'phone', label: 'Your Phone Number' },
    { name: 'relationship', label: 'Relationship to Resident' },
    { name: 'residentName', label: "Resident's Name" },
  ],
  volunteer: [
    { name: 'phone', label: 'Your Phone Number' },
    { name: 'availability', label: 'Availability (e.g. weekends)' },
  ],
  security: [
    { name: 'staffId', label: 'Staff ID' },
    { name: 'shift', label: 'Shift Timing' },
  ],
};

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        room_number: formData.roomNumber || null,
        guardian_contact: formData.guardianContact || null,
        relationship_to_resident: formData.relationship || null,
        resident_name: formData.residentName || null,
        availability: formData.availability || null,
        staff_id: formData.staffId || null,
        shift: formData.shift || null,
        phone: formData.phone || null,
      });
      setSuccessMsg(`Account created for ${response.data.name}! You can now log in.`);
      setFormData({});
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const extraFields = role ? roleFields[role] || [] : [];

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Register to connect and get help in emergencies</Text>

      <Text style={styles.sectionLabel}>Register As</Text>
      <View style={styles.roleGrid}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.roleCard,
              role === r.id && { borderColor: r.color, backgroundColor: `${r.color}15` },
            ]}
            onPress={() => setRole(r.id)}
          >
            <Text style={[styles.roleLabel, role === r.id && { color: r.color }]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {role && (
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name || ''}
            onChangeText={(v) => updateField('name', v)}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email || ''}
            onChangeText={(v) => updateField('email', v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {extraFields.map((field) => (
            <View key={field.name}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={formData[field.name] || ''}
                onChangeText={(v) => updateField(field.name, v)}
              />
            </View>
          ))}

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={formData.password || ''}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword || ''}
            onChangeText={(v) => updateField('confirmPassword', v)}
            secureTextEntry
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Register</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => router.push('/')} style={{ marginTop: 20 }}>
        <Text style={styles.loginLink}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexGrow: 1, padding: 24, backgroundColor: '#F6F8F7' },
  title: { fontSize: 24, fontWeight: '700', color: '#1B4B43', textAlign: 'center', marginTop: 30 },
  subtitle: { fontSize: 13, color: '#6B7370', textAlign: 'center', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#1B4B43', marginBottom: 10 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  roleCard: {
    width: '47%',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    backgroundColor: '#fff',
  },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#1B4B43' },
  form: { marginTop: 8 },
  fieldLabel: { fontSize: 13, color: '#6B7370', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#1B4B43',
  },
  error: { color: '#C0392B', fontSize: 13, marginTop: 10 },
  success: { color: '#2F7D6E', fontSize: 13, marginTop: 10 },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#3D6FA8',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loginLink: { color: '#3D6FA8', fontSize: 13, textAlign: 'center', fontWeight: '600' },
});
