import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, ActivityIndicator, FlatList, RefreshControl, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL } from '../config';

const categories = [
  { name: 'Medical', icon: '🩺' },
  { name: 'Fire', icon: '🔥' },
  { name: 'Security', icon: '🛡️' },
  { name: 'Other', icon: '⚠️' },
];

export default function ResidentHomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const residentId = params.userId;
  const userName = params.userName || 'Resident';

  // SOS
  const [showSosModal, setShowSosModal] = useState(false);
  const [category, setCategory] = useState('Medical');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const [sent, setSent] = useState(false);
  const countdownRef = useRef(null);
  const sendingRef = useRef(false);

  // alerts
  const [myAlerts, setMyAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineAlert, setTimelineAlert] = useState(null);

  // profile
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ age: '', medical_notes: '' });

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const fetchMyAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/emergency-alerts`);
      setMyAlerts(res.data.filter((a) => String(a.resident_id) === String(residentId)));
    } catch (err) {
      console.log('Could not fetch alerts', err);
    }
  }, [residentId]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/user/${residentId}/profile`);
      setProfileForm({ age: res.data.age ? String(res.data.age) : '', medical_notes: res.data.medical_notes || '' });
    } catch (err) {
      console.log('Could not fetch profile', err);
    }
  }, [residentId]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  }, []);

  useEffect(() => {
    fetchMyAlerts();
    fetchProfile();
    fetchAnnouncements();
  }, [fetchMyAlerts, fetchProfile, fetchAnnouncements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyAlerts();
    setRefreshing(false);
  };

  // ---------- SOS location ----------
  const handleGetLocation = async () => {
    setLocationStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('error');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationStatus('done');
    } catch (err) {
      setLocationStatus('error');
    }
  };

  const openSosModal = () => {
    setShowSosModal(true);
    handleGetLocation(); // auto-request location on open, same as web
  };

  const actuallySendSos = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      await axios.post(`${API_URL}/emergency-alert?resident_id=${residentId}`, {
        category,
        message: message || null,
        latitude: location ? String(location.lat) : null,
        longitude: location ? String(location.lng) : null,
      });
      setSent(true);
      fetchMyAlerts();
      setTimeout(() => {
        setShowSosModal(false);
        setSent(false);
        setMessage('');
        setLocation(null);
        setLocationStatus('idle');
        setCategory('Medical');
        sendingRef.current = false;
      }, 1500);
    } catch (err) {
      alert('Failed to send alert');
      sendingRef.current = false;
    }
  };

  const startCountdown = () => {
    if (countdown !== null) return;
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
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

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
  };

  const closeSosModal = () => {
    cancelCountdown();
    setShowSosModal(false);
  };

  // ---------- Profile ----------
  const handleSaveProfile = async () => {
    try {
      await axios.put(`${API_URL}/user/${residentId}/profile`, {
        age: profileForm.age ? parseInt(profileForm.age) : null,
        medical_notes: profileForm.medical_notes || null,
      });
      setShowProfileModal(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const statusColor = (status) => {
    if (status === 'pending') return '#C0392B';
    if (status === 'acknowledged') return '#C98A2E';
    if (status === 'responding') return '#3D6FA8';
    return '#2F7D6E';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => router.replace('/');

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CareConnect</Text>
          <Text style={styles.headerSub}>Welcome, {userName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.smallIconBtn}
            onPress={() => router.push({ pathname: '/manage-details', params: { userId: residentId } })}
          >
            <Text style={styles.smallIconBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallIconBtn} onPress={() => setShowProfileModal(true)}>
            <Text style={styles.smallIconBtnText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallIconBtn} onPress={() => setShowAnnouncementsModal(true)}>
            <Text style={styles.smallIconBtnText}>📢</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallIconBtn} onPress={handleLogout}>
            <Text style={styles.smallIconBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={myAlerts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.homeTop}>
            <Text style={styles.greeting}>Good day, {userName} 👋</Text>
            <Text style={styles.sub}>Are you in an emergency?</Text>
            <TouchableOpacity style={styles.sosButton} onPress={openSosModal}>
              <Text style={styles.sosText}>🚨</Text>
              <Text style={styles.sosLabel}>SOS</Text>
              <Text style={styles.sosSubLabel}>GET HELP NOW</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No alerts sent yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.alertCard} onPress={() => setTimelineAlert(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.alertCategory}>
                {categories.find((c) => c.name === item.category)?.icon || '🚨'} {item.category || 'Emergency'}
              </Text>
              <Text style={{ color: statusColor(item.status), fontWeight: '700', fontSize: 11 }}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            {item.message ? <Text style={styles.alertMessage}>{item.message}</Text> : null}
            <Text style={styles.alertTime}>{formatDateTime(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      />

      {/* SOS Modal */}
      <Modal visible={showSosModal} transparent animationType="slide" onRequestClose={closeSosModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {sent ? (
              <Text style={{ color: '#2F7D6E', fontSize: 15, fontWeight: '600' }}>
                Alert sent! Security and volunteers have been notified.
              </Text>
            ) : countdown !== null ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#6B7370', fontSize: 13, marginBottom: 10 }}>
                  Sending {category} alert in...
                </Text>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                </View>
                <TouchableOpacity style={styles.cancelSosButton} onPress={cancelCountdown}>
                  <Text style={styles.cancelSosText}>Cancel SOS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Send Emergency Alert</Text>
                  <TouchableOpacity onPress={closeSosModal}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Emergency Type</Text>
                <View style={styles.catGrid}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      style={[styles.catCard, category === c.name && styles.catCardActive]}
                      onPress={() => setCategory(c.name)}
                    >
                      <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                      <Text style={[styles.catCardText, category === c.name && { color: '#C0392B' }]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Message (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="What happened?"
                  multiline
                />

                <Text style={styles.fieldLabel}>Location</Text>
                {locationStatus === 'done' && location ? (
                  <View style={styles.locationDone}>
                    <Text style={{ color: '#2F7D6E', fontWeight: '600' }}>✓ Location captured</Text>
                    <Text style={{ color: '#6B7370', fontSize: 12 }}>
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
                    <Text style={{ color: '#3D6FA8', fontSize: 12, fontWeight: '600' }}>
                      {locationStatus === 'loading' ? 'Getting location...' : locationStatus === 'error' ? 'Could not get location — try again' : 'Share my current location'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.sendButton} onPress={startCountdown}>
                  <Text style={styles.sendButtonText}>🚨 SEND SOS</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>My Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={profileForm.age}
              onChangeText={(v) => setProfileForm({ ...profileForm, age: v })}
              keyboardType="numeric"
            />
            <Text style={styles.fieldLabel}>Medical Notes</Text>
            <TextInput
              style={styles.input}
              value={profileForm.medical_notes}
              onChangeText={(v) => setProfileForm({ ...profileForm, medical_notes: v })}
              multiline
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.sendButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Announcements Modal */}
      <Modal visible={showAnnouncementsModal} transparent animationType="slide" onRequestClose={() => setShowAnnouncementsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Announcements</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementsModal(false)}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={announcements}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={<Text style={styles.emptyText}>No announcements yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.announcementRow}>
                  <Text style={{ fontWeight: '700', color: '#1B4B43', fontSize: 13 }}>{item.title}</Text>
                  <Text style={{ color: '#6B7370', fontSize: 12, marginTop: 2 }}>{item.message}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Timeline Modal */}
      <Modal visible={!!timelineAlert} transparent animationType="slide" onRequestClose={() => setTimelineAlert(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {timelineAlert && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>🚨 Emergency #{timelineAlert.id}</Text>
                  <TouchableOpacity onPress={() => setTimelineAlert(null)}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
                </View>
                <Text style={{ fontWeight: '700', color: '#1B4B43', marginBottom: 4 }}>{timelineAlert.category}</Text>
                {timelineAlert.message ? <Text style={{ color: '#6B7370', marginBottom: 12 }}>"{timelineAlert.message}"</Text> : null}

                <TimelineStep label="SOS Created" done time={formatDateTime(timelineAlert.created_at)} />
                <TimelineStep label="Guardian Notified" done time={formatDateTime(timelineAlert.created_at)} />
                <TimelineStep label="Security Notified" done time={formatDateTime(timelineAlert.created_at)} />
                <TimelineStep label="Volunteer Notified" done time={formatDateTime(timelineAlert.created_at)} />
                {timelineAlert.acknowledged_at ? (
                  <TimelineStep label="Responder Accepted" done time={formatDateTime(timelineAlert.acknowledged_at)} />
                ) : (
                  <TimelineStep label="Waiting for Response" waiting />
                )}
                {timelineAlert.resolved_at ? <TimelineStep label="Resolved" done time={formatDateTime(timelineAlert.resolved_at)} /> : null}

                {timelineAlert.latitude && timelineAlert.longitude && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://www.google.com/maps?q=${timelineAlert.latitude},${timelineAlert.longitude}`)}
                  >
                    <Text style={{ color: '#3D6FA8', fontSize: 12, marginTop: 10 }}>📍 View shared location</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimelineStep({ label, done = false, waiting = false, time }: { label: string; done?: boolean; waiting?: boolean; time?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
      <Text style={{ fontSize: 16, marginRight: 8 }}>{waiting ? '🟡' : '✅'}</Text>
      <View>
        <Text style={{ fontSize: 13, color: '#1B4B43', fontWeight: '600' }}>{label}</Text>
        {time ? <Text style={{ fontSize: 11, color: '#9AA3A0', marginTop: 1 }}>{time}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F6F8F7', paddingTop: 55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B4B43' },
  headerSub: { fontSize: 12, color: '#6B7370' },
  smallIconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E5E3', alignItems: 'center', justifyContent: 'center' },
  smallIconBtnText: { fontSize: 15 },
  homeTop: { alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#1B4B43', marginTop: 10 },
  sub: { fontSize: 13, color: '#6B7370', marginTop: 2, marginBottom: 24 },
  sosButton: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  sosText: { fontSize: 28 },
  sosLabel: { color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 2 },
  sosSubLabel: { color: '#ffffffcc', fontWeight: '600', fontSize: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1B4B43', alignSelf: 'flex-start' },
  emptyText: { fontSize: 13, color: '#9AA3A0', textAlign: 'center', marginTop: 10 },
  alertCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10 },
  alertCategory: { fontWeight: '700', color: '#1B4B43', fontSize: 13 },
  alertMessage: { color: '#6B7370', fontSize: 12, marginTop: 4 },
  alertTime: { color: '#9AA3A0', fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(27,75,67,0.4)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#C0392B' },
  fieldLabel: { fontSize: 12, color: '#6B7370', marginTop: 10, marginBottom: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: { width: '47%', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E5E3', alignItems: 'center' },
  catCardActive: { borderColor: '#C0392B', backgroundColor: '#C0392B15' },
  catCardText: { fontSize: 12, fontWeight: '600', color: '#6B7370', marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#E2E5E3', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 44, textAlignVertical: 'top' },
  locationButton: { padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E5E3', borderStyle: 'dashed' },
  locationDone: { padding: 10, borderRadius: 8, backgroundColor: '#EAF7EF', borderWidth: 1, borderColor: '#2F7D6E33' },
  sendButton: { marginTop: 18, backgroundColor: '#C0392B', borderRadius: 8, padding: 14, alignItems: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  saveButton: { marginTop: 18, backgroundColor: '#2F7D6E', borderRadius: 8, padding: 14, alignItems: 'center' },
  countdownCircle: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  countdownNumber: { fontSize: 32, fontWeight: '800', color: '#C0392B' },
  cancelSosButton: { backgroundColor: '#1B4B43', borderRadius: 8, padding: 12, width: '100%', alignItems: 'center' },
  cancelSosText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  announcementRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F2F1' },
});
