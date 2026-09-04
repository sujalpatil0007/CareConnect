// import { useState, useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import axios from 'axios';
// import { API_URL } from '../config';

// export default function SecurityHomeScreen() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const userId = params.userId;
//   const userName = params.userName || 'Security';

//   const [alerts, setAlerts] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);

//   const fetchAlerts = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API_URL}/emergency-alerts`);
//       setAlerts(res.data);
//     } catch (err) {
//       console.log('Could not fetch alerts', err);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAlerts();
//     const interval = setInterval(fetchAlerts, 8000); // simple auto-refresh every 8s
//     return () => clearInterval(interval);
//   }, [fetchAlerts]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchAlerts();
//     setRefreshing(false);
//   };

//   const handleAcknowledge = async (id) => {
//     try {
//       await axios.put(`${API_URL}/emergency-alert/${id}/acknowledge?accepted_by=${userId}`);
//       fetchAlerts();
//     } catch (err) {
//       alert('Failed to acknowledge');
//     }
//   };

//   const handleResolve = async (id) => {
//     try {
//       await axios.put(`${API_URL}/emergency-alert/${id}/resolve`);
//       fetchAlerts();
//     } catch (err) {
//       alert('Failed to resolve');
//     }
//   };

//   const statusColor = (status) => {
//     if (status === 'pending') return '#C0392B';
//     if (status === 'acknowledged') return '#C98A2E';
//     return '#2F7D6E';
//   };

//   return (
//     <View style={styles.wrapper}>
//       <View style={styles.headerRow}>
//         <View>
//           <Text style={styles.title}>Security Dashboard</Text>
//           <Text style={styles.sub}>Welcome, {userName}</Text>
//         </View>
//         <TouchableOpacity onPress={() => router.replace('/')}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         style={{ marginTop: 16 }}
//         data={alerts}
//         keyExtractor={(item) => String(item.id)}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//         ListEmptyComponent={<Text style={styles.emptyText}>No emergency alerts right now.</Text>}
//         renderItem={({ item }) => (
//           <View style={styles.alertCard}>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//               <Text style={styles.alertResident}>Resident #{item.resident_id}</Text>
//               <Text style={{ color: statusColor(item.status), fontWeight: '700', fontSize: 11 }}>
//                 {item.status.toUpperCase()}
//               </Text>
//             </View>
//             <Text style={styles.alertCategory}>{item.category || 'Emergency'}</Text>
//             {item.message ? <Text style={styles.alertMessage}>{item.message}</Text> : null}

//             {item.status === 'pending' && (
//               <TouchableOpacity style={styles.ackButton} onPress={() => handleAcknowledge(item.id)}>
//                 <Text style={styles.ackButtonText}>Acknowledge</Text>
//               </TouchableOpacity>
//             )}
//             {item.status === 'acknowledged' && (
//               <TouchableOpacity style={styles.resolveButton} onPress={() => handleResolve(item.id)}>
//                 <Text style={styles.ackButtonText}>Mark Resolved</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { flex: 1, backgroundColor: '#F6F8F7', paddingTop: 60, paddingHorizontal: 20 },
//   headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   title: { fontSize: 22, fontWeight: '700', color: '#8552A1' },
//   sub: { fontSize: 13, color: '#6B7370', marginTop: 2 },
//   logoutText: { color: '#C0392B', fontWeight: '700', fontSize: 13 },
//   emptyText: { fontSize: 13, color: '#9AA3A0', marginTop: 20, textAlign: 'center' },
//   alertCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
//   alertResident: { fontWeight: '700', color: '#1B4B43', fontSize: 14 },
//   alertCategory: { color: '#6B7370', fontSize: 13, marginTop: 4 },
//   alertMessage: { color: '#9AA3A0', fontSize: 12, marginTop: 2 },
//   ackButton: { marginTop: 10, backgroundColor: '#C0392B', borderRadius: 6, padding: 8, alignItems: 'center' },
//   resolveButton: { marginTop: 10, backgroundColor: '#2F7D6E', borderRadius: 6, padding: 8, alignItems: 'center' },
//   ackButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
// });
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config';

const COLORS = {
  bg: '#F6F8F7',
  card: '#FFFFFF',
  primary: '#1B4B43',
  primaryLight: '#2F7D6E',
  text: '#173E38',
  muted: '#6B7370',
  border: '#E2E8E5',
  danger: '#C0392B',
  warning: '#C98A2E',
  blue: '#3D6FA8',
  purple: '#8552A1',
  success: '#2F7D6E',
  fire: '#E67E22',
};

export default function SecurityHomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const userName = params.userName || 'Security';
  const userId = params.userId || '';

  const [view, setView] = useState('dashboard');

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('resident');
  const [search, setSearch] = useState('');

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  const [emergencyFilter, setEmergencyFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [responderInfo, setResponderInfo] = useState({});

  // ============================================================
  // FETCH ANNOUNCEMENTS
  // ============================================================

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/announcements`
      );

      setAnnouncements(response.data);
    } catch (error) {
      console.log('Announcements error:', error);
    }
  }, []);

  // ============================================================
  // FETCH USERS
  // ============================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/users/by-role/${activeTab}`
      );

      setUsers(response.data);
    } catch (error) {
      console.log('Users error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // ============================================================
  // FETCH EMERGENCY ALERTS
  // ============================================================

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/emergency-alerts`
      );

      setAlerts(response.data);
    } catch (error) {
      console.log('Alerts error:', error);
    }
  }, []);

  // ============================================================
  // FETCH RESPONDER / RESIDENT INFORMATION
  // ============================================================

  const fetchBasicUserInfo = useCallback(async (id) => {
    if (!id || responderInfo[id]) return;

    try {
      const response = await axios.get(
        `${API_URL}/user/${id}/basic-info`
      );

      setResponderInfo((previous) => ({
        ...previous,
        [id]: response.data,
      }));
    } catch (error) {
      console.log('Could not fetch user info:', error);
    }
  }, [responderInfo]);

  // ============================================================
  // INITIAL DATA
  // ============================================================

  useEffect(() => {
    fetchAnnouncements();
    fetchAlerts();
  }, [fetchAnnouncements, fetchAlerts]);

  // ============================================================
  // USERS
  // ============================================================

  useEffect(() => {
    if (view === 'directory') {
      fetchUsers();
    }
  }, [view, activeTab, fetchUsers]);

  // ============================================================
  // RESPONDER INFO
  // ============================================================

  useEffect(() => {
    alerts.forEach((alert) => {
      if (alert.resident_id) {
        fetchBasicUserInfo(alert.resident_id);
      }

      if (alert.accepted_by) {
        fetchBasicUserInfo(alert.accepted_by);
      }
    });
  }, [alerts, fetchBasicUserInfo]);

  // ============================================================
  // REFRESH
  // ============================================================

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchAlerts(),
      fetchAnnouncements(),
      view === 'directory'
        ? fetchUsers()
        : Promise.resolve(),
    ]);
  }, [
    fetchAlerts,
    fetchAnnouncements,
    fetchUsers,
    view,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);

    await refreshAll();

    setRefreshing(false);
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const pendingCount = alerts.filter(
    (alert) => alert.status === 'pending'
  ).length;

  const acknowledgedCount = alerts.filter(
    (alert) => alert.status === 'acknowledged'
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => alert.status === 'resolved'
  ).length;

  // ============================================================
  // USER SEARCH
  // ============================================================

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      return (
        String(user.name || '')
          .toLowerCase()
          .includes(value) ||
        String(user.email || '')
          .toLowerCase()
          .includes(value) ||
        String(user.room_number || '')
          .toLowerCase()
          .includes(value)
      );
    });
  }, [users, search]);

  // ============================================================
  // EMERGENCY FILTER
  // ============================================================

  const filteredAlerts = useMemo(() => {
    if (emergencyFilter === 'all') {
      return alerts;
    }

    if (
      [
        'pending',
        'acknowledged',
        'resolved',
      ].includes(emergencyFilter)
    ) {
      return alerts.filter(
        (alert) =>
          alert.status === emergencyFilter
      );
    }

    return alerts.filter(
      (alert) =>
        alert.category === emergencyFilter
    );
  }, [alerts, emergencyFilter]);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Medical':
        return COLORS.danger;

      case 'Fire':
        return COLORS.fire;

      case 'Security':
        return COLORS.purple;

      default:
        return COLORS.muted;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return COLORS.danger;

      case 'acknowledged':
        return COLORS.warning;

      case 'resolved':
        return COLORS.success;

      default:
        return COLORS.muted;
    }
  };

  const getResidentName = (residentId) => {
    return (
      responderInfo[residentId]?.name ||
      `Resident #${residentId}`
    );
  };

  // ============================================================
  // ANNOUNCEMENT
  // ============================================================

  const createAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      Alert.alert(
        'Missing title',
        'Enter announcement title.'
      );
      return;
    }

    if (!announcementMessage.trim()) {
      Alert.alert(
        'Missing message',
        'Enter announcement message.'
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        'Security ID missing',
        'User ID was not provided.'
      );
      return;
    }

    try {
      await axios.post(
        `${API_URL}/announcement?posted_by=${userId}`,
        {
          title: announcementTitle,
          message: announcementMessage,
        }
      );

      setAnnouncementTitle('');
      setAnnouncementMessage('');

      await fetchAnnouncements();

      Alert.alert(
        'Success',
        'Announcement posted successfully.'
      );
    } catch (error) {
      console.log(
        'Announcement error:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to post announcement.'
      );
    }
  };

  // ============================================================
  // DELETE ANNOUNCEMENT
  // ============================================================

  const deleteAnnouncement = (id) => {
    Alert.alert(
      'Delete announcement',
      'Are you sure you want to delete this announcement?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_URL}/announcement/${id}`
              );

              await fetchAnnouncements();

              Alert.alert(
                'Deleted',
                'Announcement deleted.'
              );
            } catch (error) {
              console.log(
                'Delete announcement error:',
                error
              );

              Alert.alert(
                'Error',
                'Failed to delete announcement.'
              );
            }
          },
        },
      ]
    );
  };

  // ============================================================
  // ACKNOWLEDGE
  // ============================================================

  const acknowledgeAlert = async (alert) => {
    if (!userId) {
      Alert.alert(
        'Security ID missing',
        'User ID was not provided.'
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/emergency-alert/${alert.id}/acknowledge?accepted_by=${userId}`
      );

      await fetchAlerts();

      setSelectedAlert(null);

      Alert.alert(
        'Success',
        'Emergency request acknowledged.'
      );
    } catch (error) {
      console.log(
        'Acknowledge error:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to acknowledge emergency.'
      );
    }
  };

  // ============================================================
  // RESOLVE
  // ============================================================

  const resolveAlert = async (alert) => {
    try {
      await axios.put(
        `${API_URL}/emergency-alert/${alert.id}/resolve`
      );

      await fetchAlerts();

      setSelectedAlert(null);

      Alert.alert(
        'Success',
        'Emergency request marked as resolved.'
      );
    } catch (error) {
      console.log(
        'Resolve error:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to resolve emergency.'
      );
    }
  };

  // ============================================================
  // LOCATION
  // ============================================================

  const openLocation = async (alert) => {
    if (!alert.latitude || !alert.longitude) {
      Alert.alert(
        'Location unavailable',
        'No location information is available for this emergency.'
      );
      return;
    }

    const url =
      `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not open map.'
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ]
    );
  };

  // ============================================================
  // USER DETAILS MODAL
  // ============================================================

  const renderUserDetails = () => {
    if (!selectedUser) {
      return null;
    }

    return (
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedUser(null)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUser.name}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectedUser(null)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <InfoRow
              label="Email"
              value={selectedUser.email}
            />

            <InfoRow
              label="Role"
              value={selectedUser.role}
            />

            {selectedUser.room_number && (
              <InfoRow
                label="Room"
                value={selectedUser.room_number}
              />
            )}

            {selectedUser.phone && (
              <InfoRow
                label="Phone"
                value={selectedUser.phone}
              />
            )}

            {selectedUser.guardian_contact && (
              <InfoRow
                label="Guardian Contact"
                value={selectedUser.guardian_contact}
              />
            )}

            {selectedUser.relationship_to_resident && (
              <InfoRow
                label="Relationship"
                value={
                  selectedUser.relationship_to_resident
                }
              />
            )}

            {selectedUser.resident_name && (
              <InfoRow
                label="Resident"
                value={
                  selectedUser.resident_name
                }
              />
            )}

            {selectedUser.availability && (
              <InfoRow
                label="Availability"
                value={
                  selectedUser.availability
                }
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // EMERGENCY DETAILS MODAL
  // ============================================================

  const renderEmergencyDetails = () => {
    if (!selectedAlert) {
      return null;
    }

    return (
      <Modal
        visible={!!selectedAlert}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedAlert(null)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.emergencyModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Emergency #{selectedAlert.id}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectedAlert(null)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* RESIDENT */}

            <Text style={styles.detailLabel}>
              Resident
            </Text>

            <Text style={styles.detailValue}>
              {getResidentName(
                selectedAlert.resident_id
              )}
            </Text>

            {/* CATEGORY */}

            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    `${getCategoryColor(
                      selectedAlert.category
                    )}18`,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      getCategoryColor(
                        selectedAlert.category
                      ),
                  },
                ]}
              >
                {selectedAlert.category ||
                  'Other'}
              </Text>
            </View>

            {/* MESSAGE */}

            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>
                Emergency Message
              </Text>

              <Text style={styles.emergencyMessage}>
                {selectedAlert.message ||
                  'No message'}
              </Text>
            </View>

            {/* TIME */}

            <InfoRow
              label="Created"
              value={formatDate(
                selectedAlert.created_at
              )}
            />

            {/* STATUS */}

            <View style={styles.statusDetailRow}>
              <Text style={styles.detailLabel}>
                Status
              </Text>

              <StatusBadge
                status={selectedAlert.status}
              />
            </View>

            {/* LOCATION */}

            {selectedAlert.latitude &&
              selectedAlert.longitude && (
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() =>
                    openLocation(selectedAlert)
                  }
                >
                  <Text
                    style={styles.locationButtonText}
                  >
                    📍 View Emergency Location
                  </Text>
                </TouchableOpacity>
              )}

            {/* RESPONDER */}

            {selectedAlert.accepted_by &&
              responderInfo[
                selectedAlert.accepted_by
              ] && (
                <View style={styles.responderBox}>
                  <Text style={styles.responderTitle}>
                    {selectedAlert.status ===
                    'resolved'
                      ? '✓ Resolved by'
                      : '🟢 Responding'}
                  </Text>

                  <Text
                    style={styles.responderName}
                  >
                    {
                      responderInfo[
                        selectedAlert.accepted_by
                      ].name
                    }
                  </Text>

                  <Text
                    style={styles.responderDetails}
                  >
                    Role:{' '}
                    {
                      responderInfo[
                        selectedAlert.accepted_by
                      ].role
                    }
                  </Text>

                  {responderInfo[
                    selectedAlert.accepted_by
                  ].phone && (
                    <Text
                      style={styles.responderDetails}
                    >
                      Phone:{' '}
                      {
                        responderInfo[
                          selectedAlert.accepted_by
                        ].phone
                      }
                    </Text>
                  )}
                </View>
              )}

            {/* ACTIONS */}

            <View style={styles.modalActions}>

              {selectedAlert.status ===
                'pending' && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.ackButton,
                  ]}
                  onPress={() =>
                    acknowledgeAlert(
                      selectedAlert
                    )
                  }
                >
                  <Text
                    style={styles.actionButtonText}
                  >
                    Acknowledge
                  </Text>
                </TouchableOpacity>
              )}

              {selectedAlert.status ===
                'acknowledged' && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.resolveButton,
                  ]}
                  onPress={() =>
                    resolveAlert(
                      selectedAlert
                    )
                  }
                >
                  <Text
                    style={styles.actionButtonText}
                  >
                    Resolve
                  </Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // DASHBOARD
  // ============================================================

  const renderDashboard = () => {
    const cards = [
      {
        label: 'Pending Alerts',
        value: pendingCount,
        color: COLORS.danger,
        icon: '🚨',
      },
      {
        label: 'Acknowledged',
        value: acknowledgedCount,
        color: COLORS.warning,
        icon: '⚠️',
      },
      {
        label: 'Resolved',
        value: resolvedCount,
        color: COLORS.success,
        icon: '✓',
      },
      {
        label: 'Announcements',
        value: announcements.length,
        color: COLORS.purple,
        icon: '📢',
      },
    ];

    return (
      <>
        {/* SUMMARY */}

        <View style={styles.summaryGrid}>
          {cards.map((card) => (
            <View
              key={card.label}
              style={styles.summaryCard}
            >
              <Text style={styles.cardIcon}>
                {card.icon}
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  { color: card.color },
                ]}
              >
                {card.value}
              </Text>

              <Text style={styles.cardLabel}>
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        {/* RECENT EMERGENCIES */}

        <View style={styles.sectionCard}>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Emergency Requests
            </Text>

            <TouchableOpacity
              onPress={() =>
                setView('emergencies')
              }
            >
              <Text style={styles.viewAll}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {alerts
            .slice(0, 8)
            .map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertRow}
                onPress={() =>
                  setSelectedAlert(alert)
                }
              >
                <View style={styles.alertLeft}>

                  <Text style={styles.alertName}>
                    {getResidentName(
                      alert.resident_id
                    )}
                  </Text>

                  <Text style={styles.alertCategory}>
                    {alert.category || 'Other'}
                  </Text>

                </View>

                <View style={styles.alertRight}>

                  <Text style={styles.alertDate}>
                    {formatDate(
                      alert.created_at
                    )}
                  </Text>

                  <StatusBadge
                    status={alert.status}
                  />

                </View>
              </TouchableOpacity>
            ))}

          {alerts.length === 0 && (
            <EmptyState
              text="No emergency requests."
            />
          )}
        </View>
      </>
    );
  };

  // ============================================================
  // EMERGENCIES
  // ============================================================

  const renderEmergencies = () => {
    const filters = [
      ['all', 'All'],
      ['pending', 'Pending'],
      ['acknowledged', 'Acknowledged'],
      ['resolved', 'Resolved'],
      ['Medical', 'Medical'],
      ['Fire', 'Fire'],
      ['Security', 'Security'],
      ['Other', 'Other'],
    ];

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalTabs}
        >
          {filters.map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.filterButton,
                emergencyFilter === value &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setEmergencyFilter(value)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  emergencyFilter === value &&
                    styles.filterTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionCard}>

          {filteredAlerts.length === 0 ? (
            <EmptyState
              text="No emergencies found."
            />
          ) : (
            filteredAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.emergencyRow}
                onPress={() =>
                  setSelectedAlert(alert)
                }
              >

                <View style={styles.emergencyNumber}>
                  <Text style={styles.numberText}>
                    #{alert.id}
                  </Text>
                </View>

                <View style={styles.emergencyInfo}>

                  <Text
                    style={
                      styles.emergencyResident
                    }
                  >
                    {getResidentName(
                      alert.resident_id
                    )}
                  </Text>

                  <Text
                    style={
                      styles.emergencyCategoryText
                    }
                  >
                    {alert.category ||
                      'Other'}
                  </Text>

                  <Text
                    style={styles.emergencySmall}
                  >
                    {formatDate(
                      alert.created_at
                    )}
                  </Text>

                  {alert.message && (
                    <Text
                      style={
                        styles.emergencyMessageSmall
                      }
                      numberOfLines={1}
                    >
                      {alert.message}
                    </Text>
                  )}

                </View>

                <StatusBadge
                  status={alert.status}
                />

              </TouchableOpacity>
            ))
          )}

        </View>
      </>
    );
  };

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  const renderAnnouncements = () => {
    return (
      <>
        <View style={styles.sectionCard}>

          <Text style={styles.sectionTitle}>
            Post Announcement
          </Text>

          <TextInput
            value={announcementTitle}
            onChangeText={
              setAnnouncementTitle
            }
            placeholder="Title"
            placeholderTextColor="#9AA39F"
            style={styles.input}
          />

          <TextInput
            value={announcementMessage}
            onChangeText={
              setAnnouncementMessage
            }
            placeholder="Message"
            placeholderTextColor="#9AA39F"
            multiline
            numberOfLines={5}
            style={[
              styles.input,
              styles.textArea,
            ]}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={createAnnouncement}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Post Announcement
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.sectionCard}>

          <Text style={styles.sectionTitle}>
            Posted Announcements
          </Text>

          {announcements.length === 0 ? (
            <EmptyState
              text="No announcements."
            />
          ) : (
            announcements.map(
              (announcement) => (
                <View
                  key={announcement.id}
                  style={
                    styles.announcementItem
                  }
                >

                  <View
                    style={{
                      flex: 1,
                      paddingRight: 10,
                    }}
                  >

                    <Text
                      style={
                        styles.announcementTitle
                      }
                    >
                      {announcement.title}
                    </Text>

                    <Text
                      style={
                        styles.announcementMessage
                      }
                    >
                      {announcement.message}
                    </Text>

                    <Text
                      style={
                        styles.announcementDate
                      }
                    >
                      {formatDate(
                        announcement.created_at
                      )}
                    </Text>

                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      deleteAnnouncement(
                        announcement.id
                      )
                    }
                  >
                    <Text
                      style={styles.deleteText}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>

                </View>
              )
            )
          )}

        </View>
      </>
    );
  };

  // ============================================================
  // DIRECTORY
  // ============================================================

  const renderDirectory = () => {
    const tabs = [
      ['resident', 'Residents'],
      ['guardian', 'Guardians'],
      ['volunteer', 'Volunteers'],
    ];

    return (
      <>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email or room..."
          placeholderTextColor="#9AA39F"
          style={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalTabs}
        >
          {tabs.map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.tabButton,
                activeTab === value &&
                  styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveTab(value);
                setSearch('');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === value &&
                    styles.tabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionCard}>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primaryLight}
            />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              text={`No ${activeTab}s found.`}
            />
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userRow}
                onPress={() =>
                  setSelectedUser(user)
                }
              >

                <View style={styles.userInfo}>

                  <Text style={styles.userName}>
                    {user.name}
                  </Text>

                  <Text style={styles.userEmail}>
                    {user.email}
                  </Text>

                  <Text
                    style={
                      styles.userSummary
                    }
                  >
                    {activeTab === 'resident'
                      ? `Room ${
                          user.room_number ||
                          '-'
                        } · Guardian: ${
                          user.guardian_contact ||
                          '-'
                        }`
                      : activeTab ===
                        'guardian'
                      ? `${
                          user.relationship_to_resident ||
                          '-'
                        } of ${
                          user.resident_name ||
                          '-'
                        }`
                      : `Availability: ${
                          user.availability ||
                          '-'
                        } · Phone: ${
                          user.phone || '-'
                        }`}
                  </Text>

                </View>

                <Text style={styles.viewText}>
                  View
                </Text>

              </TouchableOpacity>
            ))
          )}

        </View>
      </>
    );
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigationItems = [
    ['dashboard', '▦', 'Dashboard'],
    ['emergencies', '⚠', 'Emergencies'],
    ['announcements', '♢', 'Announcements'],
    ['directory', '♙', 'Directory'],
  ];

  const getPageTitle = () => {
    const item = navigationItems.find(
      ([value]) => value === view
    );

    return item?.[2] || 'Dashboard';
  };

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryLight}
          />
        }
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerText}>

            <Text style={styles.appTitle}>
              CareConnect
            </Text>

            <Text style={styles.securityLabel}>
              SECURITY PANEL
            </Text>

          </View>

          <TouchableOpacity
            style={styles.logoutSmall}
            onPress={logout}
          >
            <Text
              style={styles.logoutSmallText}
            >
              Logout
            </Text>
          </TouchableOpacity>

        </View>

        {/* NAVIGATION */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mainNav}
        >
          {navigationItems.map(
            ([value, icon, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.navButton,
                  view === value &&
                    styles.navButtonActive,
                ]}
                onPress={() =>
                  setView(value)
                }
              >

                <Text style={styles.navIcon}>
                  {icon}
                </Text>

                <Text
                  style={[
                    styles.navText,
                    view === value &&
                      styles.navTextActive,
                  ]}
                >
                  {label}
                </Text>

              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* PAGE HEADER */}

        <View style={styles.pageHeader}>

          <Text style={styles.pageTitle}>
            {getPageTitle()}
          </Text>

          <Text style={styles.welcome}>
            Welcome, {userName}
          </Text>

        </View>

        {/* PAGE */}

        {view === 'dashboard' &&
          renderDashboard()}

        {view === 'emergencies' &&
          renderEmergencies()}

        {view === 'announcements' &&
          renderAnnouncements()}

        {view === 'directory' &&
          renderDirectory()}

      </ScrollView>

      {renderUserDetails()}
      {renderEmergencyDetails()}

    </View>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value || '-'}
      </Text>

    </View>
  );
}

function StatusBadge({ status }) {
  const color =
    status === 'pending'
      ? COLORS.danger
      : status === 'acknowledged'
      ? COLORS.warning
      : status === 'resolved'
      ? COLORS.success
      : COLORS.muted;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            `${color}18`,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          { color },
        ]}
      >
        {status
          ? status.toUpperCase()
          : 'UNKNOWN'}
      </Text>
    </View>
  );
}

function EmptyState({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  wrapper: {
    flex: 1,
  },

  content: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
  },

  appTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.primary,
  },

  securityLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.muted,
    marginTop: 2,
  },

  logoutSmall: {
    borderWidth: 1,
    borderColor: '#E5D3D0',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: '#FFF',
  },

  logoutSmallText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
  },

  // NAV

  mainNav: {
    marginBottom: 18,
  },

  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginRight: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },

  navButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  navIcon: {
    fontSize: 14,
    marginRight: 6,
    color: COLORS.primary,
  },

  navText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  navTextActive: {
    color: '#FFF',
  },

  // PAGE HEADER

  pageHeader: {
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },

  welcome: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  // SUMMARY

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF0EF',
    elevation: 1,
  },

  cardIcon: {
    fontSize: 18,
    marginBottom: 7,
  },

  cardValue: {
    fontSize: 28,
    fontWeight: '800',
  },

  cardLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  // SECTION

  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDF0EF',
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },

  // ALERT

  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EF',
  },

  alertLeft: {
    flex: 1,
    paddingRight: 8,
  },

  alertName: {
    fontWeight: '700',
    fontSize: 13,
    color: COLORS.text,
  },

  alertCategory: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  alertRight: {
    alignItems: 'flex-end',
  },

  alertDate: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 5,
  },

  // STATUS

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // FILTERS

  horizontalTabs: {
    marginBottom: 12,
  },

  filterButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 7,
  },

  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EAF3F0',
  },

  filterText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
  },

  filterTextActive: {
    color: COLORS.primary,
  },

  // EMERGENCIES

  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  emergencyNumber: {
    width: 42,
  },

  numberText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  emergencyInfo: {
    flex: 1,
    paddingRight: 8,
  },

  emergencyResident: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  emergencyCategoryText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },

  emergencySmall: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
  },

  emergencyMessageSmall: {
    fontSize: 10,
    color: COLORS.blue,
    marginTop: 3,
  },

  // ANNOUNCEMENTS

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    backgroundColor: '#FFF',
    marginTop: 10,
    color: COLORS.text,
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },

  primaryButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },

  announcementItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  announcementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  announcementMessage: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 18,
  },

  announcementDate: {
    fontSize: 10,
    color: '#9AA39F',
    marginTop: 7,
  },

  deleteText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 10,
  },

  // DIRECTORY

  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 10,
    color: COLORS.text,
  },

  tabButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: 7,
  },

  tabButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EAF3F0',
  },

  tabText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },

  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EF',
  },

  userInfo: {
    flex: 1,
    paddingRight: 8,
  },

  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  userEmail: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  userSummary: {
    fontSize: 11,
    color: COLORS.blue,
    marginTop: 4,
    lineHeight: 16,
  },

  viewText: {
    color: COLORS.blue,
    fontWeight: '700',
    fontSize: 12,
  },

  // MODALS

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(15, 45, 40, 0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },

  emergencyModal: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  closeButton: {
    fontSize: 28,
    color: '#78827E',
    lineHeight: 28,
  },

  infoRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 3,
  },

  // EMERGENCY MODAL

  detailLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: '800',
  },

  messageBox: {
    backgroundColor: '#F7F9F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  messageLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 5,
  },

  emergencyMessage: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },

  statusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  locationButton: {
    backgroundColor: '#EAF3F0',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },

  locationButtonText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '800',
  },

  responderBox: {
    backgroundColor: '#EAF7EF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },

  responderTitle: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '800',
  },

  responderName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  responderDetails: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 15,
  },

  actionButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
  },

  ackButton: {
    backgroundColor: COLORS.warning,
  },

  resolveButton: {
    backgroundColor: COLORS.success,
  },

  actionButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // EMPTY

  empty: {
    paddingVertical: 25,
    alignItems: 'center',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});