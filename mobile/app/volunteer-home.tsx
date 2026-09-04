import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

const availableSkills = ['First Aid', 'Medical', 'Fire Safety'];

export default function VolunteerHomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const userId = params.userId;
  const userName = params.userName || 'Volunteer';

  const [availability, setAvailability] = useState('Available');
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Profile
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    age: '',
    photo_url: '',
    medical_notes: '',
    skills: [],
  });

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] =
    useState(false);

  // Task History
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Resident information
  const [residentInfo, setResidentInfo] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/user/${userId}/profile`
      );

      setProfileForm({
        age: res.data.age ? String(res.data.age) : '',
        photo_url: res.data.photo_url || '',
        medical_notes: res.data.medical_notes || '',
        skills: res.data.skills
          ? res.data.skills.split(',').map((s) => s.trim())
          : [],
      });
    } catch (err) {
      console.log('Could not fetch profile', err);
    }
  }, [userId]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/emergency-alerts`
      );

      setAlerts(res.data);
    } catch (err) {
      console.log('Could not fetch alerts', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    await Promise.all([
      fetchProfile(),
      fetchAnnouncements(),
      fetchAlerts(),
    ]);
  }, [fetchProfile, fetchAnnouncements, fetchAlerts]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  // Get resident names
  useEffect(() => {
    const ids = [
      ...new Set(
        alerts
          .filter((a) => a.resident_id)
          .map((a) => a.resident_id)
      ),
    ];

    ids.forEach(async (id) => {
      if (residentInfo[id]) return;

      try {
        const res = await axios.get(
          `${API_URL}/user/${id}/basic-info`
        );

        setResidentInfo((prev) => ({
          ...prev,
          [id]: res.data,
        }));
      } catch (err) {
        console.log('Could not fetch resident info', err);
      }
    });
  }, [alerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ----------------------------
  // Availability
  // ----------------------------

  const toggleAvailability = async (status) => {
    setAvailability(status);

    try {
      await axios.put(
        `${API_URL}/user/${userId}/availability?availability=${status}`
      );
    } catch (err) {
      console.log('Failed to update availability', err);
    }
  };

  // ----------------------------
  // Profile
  // ----------------------------

  const toggleSkill = (skill) => {
    setProfileForm((prev) => {
      const exists = prev.skills.includes(skill);

      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put(
        `${API_URL}/user/${userId}/profile`,
        {
          age: profileForm.age
            ? parseInt(profileForm.age)
            : null,

          photo_url: profileForm.photo_url || null,

          medical_notes:
            profileForm.medical_notes || null,

          skills:
            profileForm.skills.length > 0
              ? profileForm.skills.join(',')
              : null,
        }
      );

      setShowProfileModal(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  // ----------------------------
  // Emergency Actions
  // ----------------------------

  const handleAccept = async (id) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${id}/acknowledge?accepted_by=${userId}`
      );

      await fetchAlerts();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleStartAssistance = async (id) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${id}/start-assistance`
      );

      await fetchAlerts();
    } catch (err) {
      alert('Failed to start assistance');
    }
  };

  // ONLY IMPORTANT FUNCTION FOR RESOLVE
  const handleResolve = async (id) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${id}/resolve`
      );

      // Fetch updated alerts so the status becomes RESOLVED
      // on the Volunteer screen immediately.
      await fetchAlerts();
    } catch (err) {
      console.log('Resolve error:', err);
      alert('Failed to resolve');
    }
  };

  // ----------------------------
  // Location
  // ----------------------------

  const handleViewLocation = async (
    latitude,
    longitude
  ) => {
    if (!latitude || !longitude) {
      alert('Location was not shared.');
      return;
    }

    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      alert('Could not open Google Maps');
    }
  };

  // ----------------------------
  // Helpers
  // ----------------------------

  const residentName = (id) =>
    residentInfo[id]?.name || `Resident #${id}`;

  const formatDateTime = (isoString) => {
    if (!isoString) return '';

    const d = new Date(isoString);

    return d.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryIcon = (category) => {
    if (category === 'Medical') return '🩺';
    if (category === 'Fire') return '🔥';
    if (category === 'Security') return '🛡️';
    return '⚠️';
  };

  // ----------------------------
  // Alert Groups
  // ----------------------------

  const pendingAlerts = alerts.filter(
    (a) => a.status === 'pending'
  );

  const myAcceptedAlerts = alerts.filter(
    (a) =>
      a.status === 'acknowledged' &&
      String(a.accepted_by) === String(userId)
  );

  const myRespondingAlerts = alerts.filter(
    (a) =>
      a.status === 'responding' &&
      String(a.accepted_by) === String(userId)
  );

  // RESOLVED ALERTS
  const myResolvedAlerts = alerts.filter(
    (a) =>
      a.status === 'resolved' &&
      String(a.accepted_by) === String(userId)
  );

  // ----------------------------
  // Logout
  // ----------------------------

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <View style={styles.wrapper}>

      {/* ================= HEADER ================= */}

      <View style={styles.header}>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerIcon}>🤝</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Volunteer Dashboard
            </Text>

            <Text style={styles.sub}>
              Welcome, {userName}
            </Text>
          </View>
        </View>

        <View style={styles.headerButtons}>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.headerButtonText}>
              👤 Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAnnouncementsModal(true)}
          >
            <Text style={styles.headerButtonText}>
              📢 Announcements
            </Text>

            {announcements.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {announcements.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              🚪 Logout
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* ================= MAIN LIST ================= */}

      <FlatList
        data={[
          ...pendingAlerts,
          ...myAcceptedAlerts,
          ...myRespondingAlerts,

          // IMPORTANT:
          // Resolved requests are also displayed here
          ...myResolvedAlerts,
        ]}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}

        ListHeaderComponent={
          <View>

            {/* Availability */}

            <View style={styles.card}>

              <Text style={styles.cardTitle}>
                Availability Status
              </Text>

              <Text style={styles.description}>
                Let security and residents know if you're
                available to help right now.
              </Text>

              <View style={styles.toggleRow}>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    availability === 'Available' &&
                      styles.toggleActiveGreen,
                  ]}
                  onPress={() =>
                    toggleAvailability('Available')
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      availability === 'Available' &&
                        styles.greenText,
                    ]}
                  >
                    Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    availability === 'Busy' &&
                      styles.toggleActiveRed,
                  ]}
                  onPress={() =>
                    toggleAvailability('Busy')
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      availability === 'Busy' &&
                        styles.redText,
                    ]}
                  >
                    Busy
                  </Text>
                </TouchableOpacity>

              </View>

              {/* Skills */}

              {profileForm.skills.length > 0 && (
                <View style={styles.skillsContainer}>

                  <Text style={styles.skillsTitle}>
                    My Skills
                  </Text>

                  <View style={styles.skillsRow}>
                    {profileForm.skills.map((skill) => (
                      <View
                        key={skill}
                        style={styles.skillChip}
                      >
                        <Text style={styles.skillText}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>

                </View>
              )}

            </View>

            <Text style={styles.sectionTitle}>
              🚨 Emergency Requests
            </Text>

          </View>
        }

        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No emergency requests right now.
          </Text>
        }

        renderItem={({ item }) => (

          <View style={styles.alertCard}>

            {/* Alert Header */}

            <View style={styles.alertHeader}>

              <View style={{ flex: 1 }}>

                <Text style={styles.residentName}>
                  {residentName(item.resident_id)}
                </Text>

                <Text style={styles.category}>
                  {categoryIcon(item.category)}{' '}
                  {item.category || 'Emergency'}
                </Text>

              </View>

              {/* STATUS */}

              <View
                style={[
                  styles.statusBadge,

                  item.status === 'pending'
                    ? styles.pendingBadge

                    : item.status === 'acknowledged'
                    ? styles.acceptedBadge

                    : item.status === 'responding'
                    ? styles.respondingBadge

                    : styles.resolvedBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status.toUpperCase()}
                </Text>
              </View>

            </View>

            {/* Message */}

            {item.message ? (
              <Text style={styles.alertMessage}>
                {item.message}
              </Text>
            ) : null}

            {/* Date */}

            <Text style={styles.alertTime}>
              {formatDateTime(item.created_at)}
            </Text>

            {/* Location */}

            {item.latitude && item.longitude ? (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() =>
                  handleViewLocation(
                    item.latitude,
                    item.longitude
                  )
                }
              >
                <Text style={styles.locationText}>
                  📍 View Resident Location
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noLocationText}>
                📍 Location not shared
              </Text>
            )}

            {/* Accept */}

            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() =>
                  handleAccept(item.id)
                }
              >
                <Text style={styles.actionText}>
                  Accept Request
                </Text>
              </TouchableOpacity>
            )}

            {/* Accepted */}

            {item.status === 'acknowledged' &&
              String(item.accepted_by) ===
                String(userId) && (

              <TouchableOpacity
                style={styles.assistanceButton}
                onPress={() =>
                  handleStartAssistance(item.id)
                }
              >
                <Text style={styles.actionText}>
                  Mark Assistance Started
                </Text>
              </TouchableOpacity>

            )}

            {/* Responding */}

            {item.status === 'responding' &&
              String(item.accepted_by) ===
                String(userId) && (

              <>
                <Text style={styles.respondingText}>
                  🟢 You are currently responding
                </Text>

                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() =>
                    handleResolve(item.id)
                  }
                >
                  <Text style={styles.actionText}>
                    ✓ Mark Resolved
                  </Text>
                </TouchableOpacity>
              </>

            )}

            {/* RESOLVED */}

            {item.status === 'resolved' &&
              String(item.accepted_by) ===
                String(userId) && (

              <View style={styles.resolvedContainer}>
                <Text style={styles.resolvedMessage}>
                  ✓ Emergency request resolved
                </Text>
              </View>

            )}

          </View>
        )}

        ListFooterComponent={
          <View>

            {/* ================= TASK HISTORY ================= */}

            <View style={styles.card}>

              <View style={styles.historyHeader}>

                <Text style={styles.cardTitle}>
                  Task History
                </Text>

                {myResolvedAlerts.length > 5 && (
                  <TouchableOpacity
                    onPress={() =>
                      setShowAllHistory(
                        !showAllHistory
                      )
                    }
                  >
                    <Text style={styles.historyLink}>
                      {showAllHistory
                        ? 'Show Less'
                        : 'View History'}
                    </Text>
                  </TouchableOpacity>
                )}

              </View>

              {myResolvedAlerts.length === 0 ? (

                <Text style={styles.emptyHistory}>
                  No completed tasks yet.
                </Text>

              ) : (

                (
                  showAllHistory
                    ? myResolvedAlerts
                    : myResolvedAlerts.slice(0, 5)
                ).map((item) => (

                  <View
                    key={item.id}
                    style={styles.historyItem}
                  >

                    <View style={{ flex: 1 }}>

                      <Text style={styles.historyResident}>
                        {residentName(
                          item.resident_id
                        )}
                      </Text>

                      <Text style={styles.historyCategory}>
                        {item.category ||
                          'Emergency'}
                      </Text>

                      <Text style={styles.historyDate}>
                        {formatDateTime(
                          item.resolved_at
                        )}
                      </Text>

                    </View>

                    <Text style={styles.resolvedText}>
                      ✓ Resolved
                    </Text>

                  </View>

                ))
              )}

            </View>

          </View>
        }
      />

      {/* ================= PROFILE MODAL ================= */}

      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowProfileModal(false)
        }
      >
        <View style={styles.modalOverlay}>

          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                My Profile
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowProfileModal(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </TouchableOpacity>

            </View>

            <ScrollView>

              <Text style={styles.fieldLabel}>
                Age
              </Text>

              <View style={styles.fakeInput}>
                <Text style={styles.inputText}>
                  {profileForm.age || 'Not provided'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>
                Medical Notes
              </Text>

              <View style={styles.notesBox}>
                <Text style={styles.inputText}>
                  {profileForm.medical_notes ||
                    'No medical notes'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>
                Skills
              </Text>

              <View style={styles.skillsRow}>

                {availableSkills.map((skill) => (

                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.skillSelect,
                      profileForm.skills.includes(
                        skill
                      ) &&
                        styles.skillSelectActive,
                    ]}
                    onPress={() =>
                      toggleSkill(skill)
                    }
                  >

                    <Text
                      style={[
                        styles.skillSelectText,
                        profileForm.skills.includes(
                          skill
                        ) &&
                          styles.skillSelectTextActive,
                      ]}
                    >
                      {profileForm.skills.includes(
                        skill
                      )
                        ? '✓ '
                        : ''}
                      {skill}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.actionText}>
                  Save Profile
                </Text>
              </TouchableOpacity>

            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* ================= ANNOUNCEMENTS MODAL ================= */}

      <Modal
        visible={showAnnouncementsModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowAnnouncementsModal(false)
        }
      >
        <View style={styles.modalOverlay}>

          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Announcements
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowAnnouncementsModal(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </TouchableOpacity>

            </View>

            <FlatList
              data={announcements}
              keyExtractor={(item) =>
                String(item.id)
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No announcements yet.
                </Text>
              }
              renderItem={({ item }) => (

                <View style={styles.announcementItem}>

                  <Text
                    style={
                      styles.announcementTitle
                    }
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={
                      styles.announcementMessage
                    }
                  >
                    {item.message}
                  </Text>

                </View>

              )}
            />

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  wrapper: {
    flex: 1,
    backgroundColor: '#F6F8F7',
    paddingTop: 50,
  },

  /* ================= HEADER ================= */

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    fontSize: 24,
    marginRight: 9,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4B43',
  },

  sub: {
    fontSize: 12,
    color: '#6B7370',
    marginTop: 2,
  },

  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  headerButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  headerButtonText: {
    color: '#1B4B43',
    fontSize: 12,
    fontWeight: '700',
  },

  logoutButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '700',
  },

  badge: {
    marginLeft: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C98A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ================= CARDS ================= */

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 16,
    marginTop: 10,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4B43',
    marginBottom: 7,
  },

  description: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 12,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C0392B',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },

  /* ================= AVAILABILITY ================= */

  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },

  toggleButton: {
    flex: 1,
    padding: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  toggleActiveGreen: {
    borderColor: '#2F7D6E',
    backgroundColor: '#2F7D6E15',
  },

  toggleActiveRed: {
    borderColor: '#C0392B',
    backgroundColor: '#C0392B15',
  },

  toggleText: {
    color: '#6B7370',
    fontSize: 12,
    fontWeight: '700',
  },

  greenText: {
    color: '#2F7D6E',
  },

  redText: {
    color: '#C0392B',
  },

  /* ================= SKILLS ================= */

  skillsContainer: {
    marginTop: 14,
  },

  skillsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B4B43',
    marginBottom: 7,
  },

  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  skillChip: {
    borderWidth: 1.5,
    borderColor: '#C98A2E',
    backgroundColor: '#C98A2E15',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  skillText: {
    color: '#C98A2E',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ================= ALERT ================= */

  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },

  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  residentName: {
    color: '#1B4B43',
    fontSize: 14,
    fontWeight: '700',
  },

  category: {
    color: '#6B7370',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },

  pendingBadge: {
    backgroundColor: '#C0392B20',
  },

  acceptedBadge: {
    backgroundColor: '#C98A2E20',
  },

  respondingBadge: {
    backgroundColor: '#2F7D6E20',
  },

  /* NEW: RESOLVED STATUS */

  resolvedBadge: {
    backgroundColor: '#2F7D6E30',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B4B43',
  },

  alertMessage: {
    fontSize: 12,
    color: '#6B7370',
    marginTop: 8,
  },

  alertTime: {
    fontSize: 10,
    color: '#9AA3A0',
    marginTop: 5,
  },

  locationButton: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#3D6FA8',
    borderRadius: 7,
    padding: 9,
    alignItems: 'center',
  },

  locationText: {
    color: '#3D6FA8',
    fontSize: 11,
    fontWeight: '700',
  },

  noLocationText: {
    color: '#9AA3A0',
    fontSize: 10,
    marginTop: 9,
  },

  acceptButton: {
    marginTop: 9,
    backgroundColor: '#C0392B',
    borderRadius: 7,
    padding: 10,
    alignItems: 'center',
  },

  assistanceButton: {
    marginTop: 9,
    backgroundColor: '#C98A2E',
    borderRadius: 7,
    padding: 10,
    alignItems: 'center',
  },

  resolveButton: {
    marginTop: 9,
    backgroundColor: '#2F7D6E',
    borderRadius: 7,
    padding: 10,
    alignItems: 'center',
  },

  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  respondingText: {
    marginTop: 9,
    color: '#2F7D6E',
    fontSize: 11,
    fontWeight: '700',
  },

  /* NEW: RESOLVED MESSAGE */

  resolvedContainer: {
    marginTop: 9,
    padding: 9,
    borderRadius: 7,
    backgroundColor: '#2F7D6E15',
  },

  resolvedMessage: {
    color: '#2F7D6E',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyText: {
    color: '#9AA3A0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
  },

  /* ================= HISTORY ================= */

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyLink: {
    color: '#3D6FA8',
    fontSize: 11,
    fontWeight: '700',
  },

  emptyHistory: {
    color: '#9AA3A0',
    fontSize: 12,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F1',
    paddingVertical: 9,
  },

  historyResident: {
    color: '#1B4B43',
    fontSize: 12,
    fontWeight: '700',
  },

  historyCategory: {
    color: '#6B7370',
    fontSize: 11,
    marginTop: 2,
  },

  historyDate: {
    color: '#9AA3A0',
    fontSize: 10,
    marginTop: 2,
  },

  resolvedText: {
    color: '#2F7D6E',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ================= MODALS ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27,75,67,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4B43',
  },

  closeText: {
    fontSize: 20,
    color: '#6B7370',
  },

  fieldLabel: {
    fontSize: 12,
    color: '#6B7370',
    marginTop: 10,
    marginBottom: 5,
  },

  fakeInput: {
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    borderRadius: 8,
    padding: 11,
  },

  notesBox: {
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    borderRadius: 8,
    padding: 11,
    minHeight: 60,
  },

  inputText: {
    fontSize: 12,
    color: '#1B4B43',
  },

  skillSelect: {
    borderWidth: 1.5,
    borderColor: '#E2E5E3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  skillSelectActive: {
    borderColor: '#C98A2E',
    backgroundColor: '#C98A2E15',
  },

  skillSelectText: {
    color: '#6B7370',
    fontSize: 11,
    fontWeight: '600',
  },

  skillSelectTextActive: {
    color: '#C98A2E',
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: '#C98A2E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  announcementItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F2F1',
    paddingVertical: 10,
  },

  announcementTitle: {
    color: '#1B4B43',
    fontSize: 13,
    fontWeight: '700',
  },

  announcementMessage: {
    color: '#6B7370',
    fontSize: 12,
    marginTop: 3,
  },
});