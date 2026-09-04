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

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { id, name, role: loggedInRole } = response.data;

      const navParams = { userId: String(id), userName: name };

      if (loggedInRole === 'resident') router.replace({ pathname: '/resident-home', params: navParams });
      else if (loggedInRole === 'guardian') router.replace({ pathname: '/guardian-home', params: navParams });
      else if (loggedInRole === 'volunteer') router.replace({ pathname: '/volunteer-home', params: navParams });
      else if (loggedInRole === 'security') router.replace({ pathname: '/security-home', params: navParams });
      else if (loggedInRole === 'admin') router.replace({ pathname: '/admin-home', params: navParams });
      else setErrorMsg('Unknown role');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <Text style={styles.title}>CareConnect</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <Text style={styles.sectionLabel}>Login As</Text>
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
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
        <Text style={styles.registerLink}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setRole('admin')} style={{ marginTop: 10 }}>
        <Text style={styles.adminLink}>Admin Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexGrow: 1, padding: 24, backgroundColor: '#F6F8F7', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#1B4B43', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7370', textAlign: 'center', marginBottom: 24 },
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
  loginButton: {
    marginTop: 20,
    backgroundColor: '#3D6FA8',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerLink: { color: '#3D6FA8', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  adminLink: { color: '#9AA3A0', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
