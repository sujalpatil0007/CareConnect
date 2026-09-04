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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

export default function GuardianHomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const userId = params.userId;
  const userName = params.userName || 'Guardian';

  const [linkedData, setLinkedData] = useState({ linked: false });
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  // --------------------------------------------------
  // FETCH GUARDIAN DATA
  // --------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/guardian-user/${userId}/linked-resident`
      );

      setLinkedData(res.data);

      const alertsRes = await axios.get(
        `${API_URL}/guardian-user/${userId}/resident-alerts`
      );

      setAlerts(alertsRes.data);
    } catch (err) {
      console.log('Could not fetch guardian data', err);
    }
  }, [userId]);

  // --------------------------------------------------
  // FETCH ANNOUNCEMENTS
  // --------------------------------------------------

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.log('Could not fetch announcements', err);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    fetchData();
    fetchAnnouncements();
  }, [fetchData, fetchAnnouncements]);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const onRefresh = async () => {
    setRefreshing(true);

    await fetchData();
    await fetchAnnouncements();

    setRefreshing(false);
  };

  // --------------------------------------------------
  // RESPOND TO SOS
  // --------------------------------------------------

  const handleRespond = async (id) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${id}/acknowledge?accepted_by=${userId}`
      );

      alert('You are now responding to this emergency.');

      fetchData();
    } catch (err) {
      console.log('Respond error:', err);
      alert('Failed to respond');
    }
  };

  // --------------------------------------------------
  // RESOLVE SOS
  // --------------------------------------------------

  const handleResolve = async (id) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${id}/resolve`
      );

      alert('Emergency resolved.');

      fetchData();
    } catch (err) {
      console.log('Resolve error:', err);
      alert('Failed to resolve emergency');
    }
  };

  // --------------------------------------------------
  // OPEN GOOGLE MAPS
  // --------------------------------------------------

  const handleViewLocation = async (latitude, longitude) => {
    if (!latitude || !longitude) {
      alert('Location was not shared for this emergency.');
      return;
    }

    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      alert('Could not open Google Maps');
    }
  };

  // --------------------------------------------------
  // FORMAT DATE AND TIME
  // --------------------------------------------------

  const formatDateTime = (dateString) => {
    if (!dateString) {
      return 'Date & time unavailable';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Date & time unavailable';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // --------------------------------------------------
  // NOT LINKED SCREEN
  // --------------------------------------------------

  if (!linkedData.linked) {
    return (
      <View style={styles.wrapper}>

        {/* Header */}
        <View style={styles.headerRow}>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Guardian Dashboard
            </Text>

            <Text style={styles.sub}>
              Welcome, {userName}
            </Text>
          </View>

          <View style={styles.headerButtons}>

            {/* Announcements */}
            <TouchableOpacity
              style={styles.smallIconBtn}
              onPress={() => setShowAnnouncementsModal(true)}
            >
              <Text style={styles.smallIconBtnText}>
                📢
              </Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              onPress={() => router.replace('/')}
            >
              <Text style={styles.logoutText}>
                Logout
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* Not Linked */}
        <View style={styles.notLinkedCard}>
          <Text style={styles.notLinkedText}>
            You're not linked to a resident yet. Ask your resident
            to add you as a guardian and approve you from their dashboard.
          </Text>
        </View>

        {/* Announcements Modal */}
        <AnnouncementsModal
          visible={showAnnouncementsModal}
          announcements={announcements}
          onClose={() => setShowAnnouncementsModal(false)}
        />

      </View>
    );
  }

  // --------------------------------------------------
  // MAIN GUARDIAN SCREEN
  // --------------------------------------------------

  return (
    <View style={styles.wrapper}>

      {/* HEADER */}
      <View style={styles.headerRow}>

        <View style={{ flex: 1 }}>

          <Text style={styles.title}>
            Guardian Dashboard
          </Text>

          <Text style={styles.sub}>
            Welcome, {userName} — linked to {linkedData.resident_name}
          </Text>

        </View>

        <View style={styles.headerButtons}>

          {/* Announcements */}
          <TouchableOpacity
            style={styles.smallIconBtn}
            onPress={() => setShowAnnouncementsModal(true)}
          >
            <Text style={styles.smallIconBtnText}>
              📢
            </Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={() => router.replace('/')}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* --------------------------------------------------
          SOS ALERT LIST
      -------------------------------------------------- */}

      <FlatList
        style={{ marginTop: 16 }}

        data={alerts}

        keyExtractor={(item) => String(item.id)}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }

        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No emergency alerts.
          </Text>
        }

        renderItem={({ item }) => (

          <View style={styles.alertCard}>

            {/* ------------------------------------------
                ALERT HEADER
            ------------------------------------------ */}

            <View style={styles.alertHeader}>

              <Text style={styles.alertCategory}>
                {item.category || 'Emergency'}
              </Text>

              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === 'pending'
                        ? '#C0392B'
                        : item.status === 'acknowledged'
                        ? '#C98A2E'
                        : '#2F7D6E',
                  },
                ]}
              >
                {item.status.toUpperCase()}
              </Text>

            </View>

            {/* ------------------------------------------
                SOS MESSAGE
            ------------------------------------------ */}

            {item.message ? (
              <Text style={styles.alertMessage}>
                {item.message}
              </Text>
            ) : null}

            {/* ------------------------------------------
                DATE AND TIME
            ------------------------------------------ */}

            <Text style={styles.alertDateTime}>
              🕒 {formatDateTime(item.created_at)}
            </Text>

            {/* ------------------------------------------
                LOCATION
            ------------------------------------------ */}

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

                <Text style={styles.locationButtonText}>
                  📍 View Resident Location
                </Text>

              </TouchableOpacity>

            ) : (

              <Text style={styles.noLocationText}>
                📍 Location not shared
              </Text>

            )}

            {/* ------------------------------------------
                I'M RESPONDING BUTTON
            ------------------------------------------ */}

            {item.status === 'pending' && (

              <TouchableOpacity
                style={styles.respondButton}
                onPress={() => handleRespond(item.id)}
              >

                <Text style={styles.respondButtonText}>
                  I'M RESPONDING
                </Text>

              </TouchableOpacity>

            )}

            {/* ------------------------------------------
                YOU ARE RESPONDING
            ------------------------------------------ */}

            {item.status === 'acknowledged' &&
              String(item.accepted_by) === String(userId) && (

                <Text style={styles.respondingNote}>
                  🟢 You are responding
                </Text>

            )}

            {/* ------------------------------------------
                RESOLVE BUTTON
                ONLY FOR THE GUARDIAN RESPONDING
            ------------------------------------------ */}

            {item.status === 'acknowledged' &&
              String(item.accepted_by) === String(userId) && (

                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolve(item.id)}
                >

                  <Text style={styles.resolveButtonText}>
                    RESOLVE EMERGENCY
                  </Text>

                </TouchableOpacity>

            )}

            {/* ------------------------------------------
                SOMEONE ELSE RESPONDING
            ------------------------------------------ */}

            {item.status === 'acknowledged' &&
              String(item.accepted_by) !== String(userId) && (

                <Text style={styles.someoneElseNote}>
                  🟢 Someone else is responding
                </Text>

            )}

            {/* ------------------------------------------
                RESOLVED
            ------------------------------------------ */}

            {item.status === 'resolved' && (

              <Text style={styles.resolvedNote}>
                ✓ Emergency Resolved
              </Text>

            )}

          </View>

        )}

      />

      {/* --------------------------------------------------
          ANNOUNCEMENTS MODAL
      -------------------------------------------------- */}

      <AnnouncementsModal
        visible={showAnnouncementsModal}
        announcements={announcements}
        onClose={() => setShowAnnouncementsModal(false)}
      />

    </View>
  );
}


// ======================================================
// ANNOUNCEMENTS MODAL
// ======================================================

function AnnouncementsModal({
  visible,
  announcements,
  onClose,
}) {

  return (

    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >

      <View style={styles.modalOverlay}>

        <View style={styles.modalBox}>

          {/* Modal Header */}
          <View style={styles.modalHeaderRow}>

            <Text style={styles.modalTitle}>
              Announcements
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18 }}>
                ✕
              </Text>
            </TouchableOpacity>

          </View>

          {/* Announcement List */}
          <FlatList
            data={announcements}

            keyExtractor={(item) => String(item.id)}

            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No announcements yet.
              </Text>
            }

            renderItem={({ item }) => (

              <View style={styles.announcementRow}>

                <Text style={styles.announcementTitle}>
                  {item.title}
                </Text>

                <Text style={styles.announcementMessage}>
                  {item.message}
                </Text>

              </View>

            )}

          />

        </View>

      </View>

    </Modal>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  wrapper: {
    flex: 1,
    backgroundColor: '#F6F8F7',
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3D6FA8',
  },

  sub: {
    fontSize: 13,
    color: '#6B7370',
    marginTop: 2,
  },

  logoutText: {
    color: '#C0392B',
    fontWeight: '700',
    fontSize: 13,
  },

  smallIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E5E3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallIconBtnText: {
    fontSize: 15,
  },

  // --------------------------------------------------
  // NOT LINKED
  // --------------------------------------------------

  notLinkedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },

  notLinkedText: {
    color: '#6B7370',
    fontSize: 13,
  },

  // --------------------------------------------------
  // EMPTY
  // --------------------------------------------------

  emptyText: {
    fontSize: 13,
    color: '#9AA3A0',
    marginTop: 20,
    textAlign: 'center',
  },

  // --------------------------------------------------
  // SOS CARD
  // --------------------------------------------------

  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,

    // Small shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,

    elevation: 1,
  },

  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  alertCategory: {
    fontWeight: '700',
    color: '#1B4B43',
    fontSize: 14,
  },

  statusText: {
    fontWeight: '700',
    fontSize: 11,
  },

  alertMessage: {
    color: '#6B7370',
    fontSize: 13,
    marginTop: 4,
  },

  // --------------------------------------------------
  // DATE & TIME
  // --------------------------------------------------

  alertDateTime: {
    color: '#8A918E',
    fontSize: 11,
    marginTop: 6,
  },

  // --------------------------------------------------
  // LOCATION
  // --------------------------------------------------

  locationButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3D6FA8',
    borderRadius: 7,
    padding: 9,
    alignItems: 'center',
  },

  locationButtonText: {
    color: '#3D6FA8',
    fontWeight: '700',
    fontSize: 12,
  },

  noLocationText: {
    color: '#9AA3A0',
    fontSize: 11,
    marginTop: 10,
  },

  // --------------------------------------------------
  // RESPOND BUTTON
  // --------------------------------------------------

  respondButton: {
    marginTop: 10,
    backgroundColor: '#C0392B',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },

  respondButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // --------------------------------------------------
  // RESPONDING
  // --------------------------------------------------

  respondingNote: {
    marginTop: 8,
    color: '#2F7D6E',
    fontWeight: '600',
    fontSize: 12,
  },

  someoneElseNote: {
    marginTop: 8,
    color: '#C98A2E',
    fontWeight: '600',
    fontSize: 12,
  },

  // --------------------------------------------------
  // RESOLVE BUTTON
  // --------------------------------------------------

  resolveButton: {
    marginTop: 10,
    backgroundColor: '#2F7D6E',
    borderRadius: 6,
    padding: 9,
    alignItems: 'center',
  },

  resolveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // --------------------------------------------------
  // RESOLVED
  // --------------------------------------------------

  resolvedNote: {
    marginTop: 8,
    color: '#6B7370',
    fontWeight: '600',
    fontSize: 12,
  },

  // --------------------------------------------------
  // ANNOUNCEMENTS MODAL
  // --------------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27,75,67,0.4)',
    justifyContent: 'center',
    padding: 24,
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '85%',
  },

  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D6FA8',
  },

  announcementRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F1',
  },

  announcementTitle: {
    fontWeight: '700',
    color: '#1B4B43',
    fontSize: 13,
  },

  announcementMessage: {
    color: '#6B7370',
    fontSize: 12,
    marginTop: 2,
  },

});