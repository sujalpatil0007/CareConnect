import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
};

export default function AdminHomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const userName = params.userName || 'Admin';
  const userId = params.userId || '';

  const [view, setView] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [counts, setCounts] = useState({
    resident: 0,
    guardian: 0,
    volunteer: 0,
    security: 0,
  });

  const [alerts, setAlerts] = useState([]);

  const [residentUsers, setResidentUsers] = useState([]);

  // ALL USERS
  // Used to find names of accepted_by / resolved_by users
  const [allUsers, setAllUsers] = useState([]);

  const [users, setUsers] = useState([]);
  const [userTab, setUserTab] = useState('resident');
  const [search, setSearch] = useState('');

  const [societies, setSocieties] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [announcementTitle, setAnnouncementTitle] =
    useState('');

  const [announcementMessage, setAnnouncementMessage] =
    useState('');

  const [emergencyFilter, setEmergencyFilter] =
    useState('all');

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [selectedAlert, setSelectedAlert] =
    useState(null);

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [updatingPassword, setUpdatingPassword] =
    useState(false);

  const [expandedSocieties, setExpandedSocieties] =
    useState({});

  const [expandedBlocks, setExpandedBlocks] =
    useState({});

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================

  const fetchDashboard = useCallback(async () => {
    try {
      const roles = [
        'resident',
        'guardian',
        'volunteer',
        'security',
        'admin',
      ];

      const results = await Promise.all(
        roles.map((role) =>
          axios.get(
            `${API_URL}/users/by-role/${role}`
          ).catch(() => ({ data: [] }))
        )
      );

      const residents = results[0].data;
      const guardians = results[1].data;
      const volunteers = results[2].data;
      const security = results[3].data;
      const admins = results[4].data;

      // Save residents
      setResidentUsers(residents);

      // Save all users
      // This is important for showing accepted/resolved names.
      setAllUsers([
        ...residents,
        ...guardians,
        ...volunteers,
        ...security,
        ...admins,
      ]);

      setCounts({
        resident: residents.length,
        guardian: guardians.length,
        volunteer: volunteers.length,
        security: security.length,
      });

      const alertsRes = await axios.get(
        `${API_URL}/emergency-alerts`
      );

      setAlerts(alertsRes.data);
    } catch (error) {
      console.log(
        'Dashboard error:',
        error
      );
    }
  }, []);

  // ============================================================
  // FETCH USERS
  // ============================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/users/by-role/${userTab}`
      );

      setUsers(response.data);
    } catch (error) {
      console.log(
        'Users error:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [userTab]);

  // ============================================================
  // FETCH SOCIETIES
  // ============================================================

  const fetchSocieties = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/societies-overview`
      );

      setSocieties(response.data);
    } catch (error) {
      console.log(
        'Societies error:',
        error
      );
    }
  }, []);

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
      console.log(
        'Announcements error:',
        error
      );
    }
  }, []);

  // ============================================================
  // REFRESH ALL
  // ============================================================

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchUsers(),
      fetchSocieties(),
      fetchAnnouncements(),
    ]);
  }, [
    fetchDashboard,
    fetchUsers,
    fetchSocieties,
    fetchAnnouncements,
  ]);

  // ============================================================
  // USE EFFECTS
  // ============================================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (view === 'users') {
      fetchUsers();
    }
  }, [
    view,
    userTab,
    fetchUsers,
  ]);

  useEffect(() => {
    if (view === 'societies') {
      fetchSocieties();
    }
  }, [
    view,
    fetchSocieties,
  ]);

  useEffect(() => {
    if (view === 'announcements') {
      fetchAnnouncements();
    }
  }, [
    view,
    fetchAnnouncements,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = async () => {
    setRefreshing(true);

    await refreshAll();

    setRefreshing(false);
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const activeCount = alerts.filter(
    (a) => a.status !== 'resolved'
  ).length;

  const resolvedCount = alerts.filter(
    (a) => a.status === 'resolved'
  ).length;

  const pendingCount = alerts.filter(
    (a) => a.status === 'pending'
  ).length;

  const acknowledgedCount = alerts.filter(
    (a) => a.status === 'acknowledged'
  ).length;

  const respondingCount = alerts.filter(
    (a) => a.status === 'responding'
  ).length;

  // ============================================================
  // USER SEARCH
  // ============================================================

  const filteredUsers = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) return users;

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
        'responding',
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
  }, [
    alerts,
    emergencyFilter,
  ]);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    return date.toLocaleString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  // ============================================================
  // GET RESIDENT NAME
  // ============================================================

  const getResidentName = (
    residentId
  ) => {
    const resident =
      residentUsers.find(
        (user) =>
          Number(user.id) ===
          Number(residentId)
      );

    return (
      resident?.name ||
      `Resident #${residentId}`
    );
  };

  // ============================================================
  // GET USER NAME
  // ============================================================

  const getUserName = (
    userIdValue
  ) => {
    if (
      userIdValue === null ||
      userIdValue === undefined ||
      userIdValue === ''
    ) {
      return null;
    }

    const user = allUsers.find(
      (u) =>
        Number(u.id) ===
        Number(userIdValue)
    );

    return user?.name || null;
  };

  // ============================================================
  // GET ACCEPTED BY NAME
  // ============================================================

  const getAcceptedByName = (
    alert
  ) => {
    // If backend already sends name
    if (alert.accepted_by_name) {
      return alert.accepted_by_name;
    }

    if (alert.responder_name) {
      return alert.responder_name;
    }

    if (alert.accepted_by_user_name) {
      return alert.accepted_by_user_name;
    }

    // Otherwise find user using ID
    const name = getUserName(
      alert.accepted_by
    );

    return name;
  };

  // ============================================================
  // GET RESOLVED BY NAME
  // ============================================================

  const getResolvedByName = (
    alert
  ) => {
    // If backend already sends name
    if (alert.resolved_by_name) {
      return alert.resolved_by_name;
    }

    if (alert.resolver_name) {
      return alert.resolver_name;
    }

    if (alert.resolved_by_user_name) {
      return alert.resolved_by_user_name;
    }

    // Otherwise find user using ID
    const name = getUserName(
      alert.resolved_by
    );

    return name;
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
        'Announcement published successfully.'
      );
    } catch (error) {
      console.log(
        'Announcement error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not publish announcement.'
      );
    }
  };

  const deleteAnnouncement = (
    id
  ) => {
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
            } catch (error) {
              console.log(
                'Delete announcement error:',
                error
              );
            }
          },
        },
      ]
    );
  };

  // ============================================================
  // EMERGENCY ACTIONS
  // ============================================================

  const acknowledgeEmergency = async (
    alert
  ) => {
    if (!userId) {
      Alert.alert(
        'Admin ID missing',
        'User ID was not provided.'
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/emergency-alert/${alert.id}/acknowledge?accepted_by=${userId}`
      );

      await fetchDashboard();

      setSelectedAlert(null);
    } catch (error) {
      console.log(
        'Acknowledge error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not acknowledge emergency.'
      );
    }
  };

  // ============================================================
  // RESOLVE EMERGENCY
  // ============================================================

  const resolveEmergency = async (
    alert
  ) => {
    if (!userId) {
      Alert.alert(
        'Admin ID missing',
        'User ID was not provided.'
      );
      return;
    }

    try {
      // IMPORTANT:
      // Send the admin/responder ID who resolved it
      await axios.put(
        `${API_URL}/emergency-alert/${alert.id}/resolve?resolved_by=${userId}`
      );

      await fetchDashboard();

      setSelectedAlert(null);
    } catch (error) {
      console.log(
        'Resolve error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not resolve emergency.'
      );
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const updatePassword = async () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        'Missing fields',
        'Please fill all password fields.'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Invalid password',
        'New password must be at least 6 characters.'
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      Alert.alert(
        'Password mismatch',
        'New password and confirm password do not match.'
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        'Admin ID missing',
        'User ID was not provided.'
      );
      return;
    }

    try {
      setUpdatingPassword(true);

      await axios.put(
        `${API_URL}/admin/change-password`,
        {
          user_id: Number(userId),
          current_password:
            currentPassword,
          new_password:
            newPassword,
        }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Success',
        'Password updated successfully.'
      );
    } catch (error) {
      console.log(
        'Change password error:',
        error
      );

      const message =
        error?.response?.data?.detail ||
        'Could not update password.';

      Alert.alert(
        'Error',
        String(message)
      );
    } finally {
      setUpdatingPassword(false);
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
  // USER DETAILS
  // ============================================================

  const renderUserDetails = () => {
    if (!selectedUser) return null;

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
                <Text
                  style={
                    styles.closeButton
                  }
                >
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
                value={
                  selectedUser.room_number
                }
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
                value={
                  selectedUser.guardian_contact
                }
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

            {selectedUser.staff_id && (
              <InfoRow
                label="Staff ID"
                value={
                  selectedUser.staff_id
                }
              />
            )}

            {selectedUser.shift && (
              <InfoRow
                label="Shift"
                value={
                  selectedUser.shift
                }
              />
            )}

          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // EMERGENCY DETAILS
  // ============================================================

  const renderEmergencyDetails = () => {
    if (!selectedAlert) return null;

    const acceptedByName =
      getAcceptedByName(
        selectedAlert
      );

    const resolvedByName =
      getResolvedByName(
        selectedAlert
      );

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

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >

              {/* HEADER */}

              <View
                style={
                  styles.modalHeader
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  🚨 Emergency #
                  {selectedAlert.id}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setSelectedAlert(
                      null
                    )
                  }
                >
                  <Text
                    style={
                      styles.closeButton
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* RESIDENT */}

              <View
                style={
                  styles.residentEmergencyBox
                }
              >
                <Text
                  style={
                    styles.residentEmergencyLabel
                  }
                >
                  SOS Created By
                </Text>

                <Text
                  style={
                    styles.residentEmergencyName
                  }
                >
                  {getResidentName(
                    selectedAlert.resident_id
                  )}
                </Text>

                <Text
                  style={
                    styles.createdTime
                  }
                >
                  {formatDate(
                    selectedAlert.created_at
                  )}
                </Text>
              </View>

              {/* CATEGORY */}

              <View
                style={
                  styles.emergencyCategory
                }
              >
                <Text
                  style={
                    styles.categoryText
                  }
                >
                  {selectedAlert.category ||
                    'Other'}
                </Text>
              </View>

              {/* MESSAGE */}

              <Text
                style={
                  styles.emergencyMessage
                }
              >
                "
                {selectedAlert.message ||
                  'No message'}
                "
              </Text>

              {/* ==================================================
                  EMERGENCY TIMELINE
                  ================================================== */}

              <View
                style={styles.timeline}
              >

                {/* SOS CREATED */}

                <TimelineItem
                  title="SOS Created"
                  subtitle={`By ${getResidentName(
                    selectedAlert.resident_id
                  )}`}
                  time={
                    selectedAlert.created_at
                  }
                  active
                />

                {/* NOTIFICATIONS */}

                <TimelineItem
                  title="Responders Notified"
                  subtitle="Guardian • Security • Volunteer"
                  time={
                    selectedAlert.acknowledged_at
                  }
                  active={
                    !!selectedAlert.acknowledged_at
                  }
                />

                {/* ACCEPTED */}

                <TimelineItem
                  title="Emergency Accepted"
                  subtitle={
                    acceptedByName
                      ? `Accepted by ${acceptedByName}`
                      : 'No responder has accepted yet'
                  }
                  time={
                    selectedAlert.assistance_started_at ||
                    selectedAlert.accepted_at
                  }
                  active={
                    !!(
                      selectedAlert.assistance_started_at ||
                      selectedAlert.accepted_at ||
                      selectedAlert.accepted_by
                    )
                  }
                />

                {/* RESOLVED */}

                <TimelineItem
                  title="Emergency Resolved"
                  subtitle={
                    resolvedByName
                      ? `Resolved by ${resolvedByName}`
                      : 'Not resolved yet'
                  }
                  time={
                    selectedAlert.resolved_at
                  }
                  active={
                    !!selectedAlert.resolved_at
                  }
                />

              </View>

              {/* ==================================================
                  WHO ACCEPTED / RESOLVED
                  ================================================== */}

              <View
                style={
                  styles.responderInfoCard
                }
              >

                <Text
                  style={
                    styles.responderInfoTitle
                  }
                >
                  Emergency Response
                </Text>

                {/* ACCEPTED BY */}

                <View
                  style={
                    styles.responderRow
                  }
                >
                  <View
                    style={[
                      styles.responderIcon,
                      {
                        backgroundColor:
                          '#EAF3F0',
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.responderIconText
                      }
                    >
                      ✓
                    </Text>
                  </View>

                  <View
                    style={
                      styles.responderDetails
                    }
                  >
                    <Text
                      style={
                        styles.responderLabel
                      }
                    >
                      Accepted By
                    </Text>

                    <Text
                      style={
                        styles.responderName
                      }
                    >
                      {acceptedByName ||
                        'Not accepted yet'}
                    </Text>

                    {selectedAlert.accepted_by &&
                      !acceptedByName && (
                        <Text
                          style={
                            styles.responderId
                          }
                        >
                          User ID:{' '}
                          {
                            selectedAlert.accepted_by
                          }
                        </Text>
                      )}

                    {(selectedAlert.assistance_started_at ||
                      selectedAlert.accepted_at) && (
                      <Text
                        style={
                          styles.responderTime
                        }
                      >
                        {formatDate(
                          selectedAlert.assistance_started_at ||
                            selectedAlert.accepted_at
                        )}
                      </Text>
                    )}
                  </View>
                </View>

                {/* RESOLVED BY */}

                <View
                  style={
                    styles.responderRow
                  }
                >
                  <View
                    style={[
                      styles.responderIcon,
                      {
                        backgroundColor:
                          '#EAF3F0',
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.responderIconText
                      }
                    >
                      ✓
                    </Text>
                  </View>

                  <View
                    style={
                      styles.responderDetails
                    }
                  >
                    <Text
                      style={
                        styles.responderLabel
                      }
                    >
                      Resolved By
                    </Text>

                    <Text
                      style={
                        styles.responderName
                      }
                    >
                      {resolvedByName ||
                        'Not resolved yet'}
                    </Text>

                    {selectedAlert.resolved_by &&
                      !resolvedByName && (
                        <Text
                          style={
                            styles.responderId
                          }
                        >
                          User ID:{' '}
                          {
                            selectedAlert.resolved_by
                          }
                        </Text>
                      )}

                    {selectedAlert.resolved_at && (
                      <Text
                        style={
                          styles.responderTime
                        }
                      >
                        {formatDate(
                          selectedAlert.resolved_at
                        )}
                      </Text>
                    )}
                  </View>
                </View>

              </View>

              {/* ACTION BUTTONS */}

              <View
                style={
                  styles.modalActions
                }
              >

                {selectedAlert.status ===
                  'pending' && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.ackButton,
                    ]}
                    onPress={() =>
                      acknowledgeEmergency(
                        selectedAlert
                      )
                    }
                  >
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Acknowledge
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedAlert.status !==
                  'resolved' && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.resolveButton,
                    ]}
                    onPress={() =>
                      resolveEmergency(
                        selectedAlert
                      )
                    }
                  >
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      Resolve
                    </Text>
                  </TouchableOpacity>
                )}

              </View>

            </ScrollView>

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
        label: 'Residents',
        value: counts.resident,
        color: COLORS.primaryLight,
        icon: '👥',
      },
      {
        label: 'Guardians',
        value: counts.guardian,
        color: COLORS.blue,
        icon: '👤',
      },
      {
        label: 'Volunteers',
        value: counts.volunteer,
        color: COLORS.warning,
        icon: '🤝',
      },
      {
        label: 'Security',
        value: counts.security,
        color: COLORS.purple,
        icon: '🛡️',
      },
      {
        label: 'Active SOS',
        value: activeCount,
        color: COLORS.danger,
        icon: '🚨',
      },
      {
        label: 'Resolved SOS',
        value: resolvedCount,
        color: COLORS.success,
        icon: '✓',
      },
    ];

    return (
      <>
        <View
          style={
            styles.summaryGrid
          }
        >
          {cards.map((card) => (
            <View
              key={card.label}
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.cardIcon
                }
              >
                {card.icon}
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  {
                    color:
                      card.color,
                  },
                ]}
              >
                {card.value}
              </Text>

              <Text
                style={
                  styles.cardLabel
                }
              >
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={
            styles.sectionCard
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Recent Emergency Alerts
            </Text>

            <TouchableOpacity
              onPress={() =>
                setView(
                  'emergencies'
                )
              }
            >
              <Text
                style={
                  styles.viewAll
                }
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {alerts
            .slice(0, 8)
            .map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={
                  styles.alertRow
                }
                onPress={() =>
                  setSelectedAlert(
                    alert
                  )
                }
              >
                <View
                  style={
                    styles.alertLeft
                  }
                >
                  <Text
                    style={
                      styles.alertName
                    }
                  >
                    {getResidentName(
                      alert.resident_id
                    )}
                  </Text>

                  <Text
                    style={
                      styles.alertCategory
                    }
                  >
                    {alert.category ||
                      'Other'}
                  </Text>
                </View>

                <View
                  style={
                    styles.alertRight
                  }
                >
                  <Text
                    style={
                      styles.alertDate
                    }
                  >
                    {formatDate(
                      alert.created_at
                    )}
                  </Text>

                  <StatusBadge
                    status={
                      alert.status
                    }
                  />
                </View>
              </TouchableOpacity>
            ))}

          {alerts.length === 0 && (
            <EmptyState
              text="No emergency alerts."
            />
          )}
        </View>
      </>
    );
  };

  // ============================================================
  // USERS
  // ============================================================

  const renderUsers = () => {
    const tabs = [
      ['resident', 'Residents'],
      ['guardian', 'Guardians'],
      ['volunteer', 'Volunteers'],
      ['security', 'Security'],
    ];

    return (
      <>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email or room..."
          placeholderTextColor="#9AA39F"
          style={
            styles.searchInput
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.horizontalTabs
          }
        >
          {tabs.map(
            ([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.tabButton,
                  userTab ===
                    value &&
                    styles.tabButtonActive,
                ]}
                onPress={() => {
                  setUserTab(value);
                  setSearch('');
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    userTab ===
                      value &&
                      styles.tabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <View
          style={
            styles.sectionCard
          }
        >
          {loading ? (
            <ActivityIndicator
              size="large"
              color={
                COLORS.primaryLight
              }
            />
          ) : filteredUsers.length ===
            0 ? (
            <EmptyState
              text="No users found."
            />
          ) : (
            filteredUsers.map(
              (user) => (
                <TouchableOpacity
                  key={user.id}
                  style={
                    styles.userRow
                  }
                  onPress={() =>
                    setSelectedUser(
                      user
                    )
                  }
                >
                  <View
                    style={
                      styles.userInfo
                    }
                  >
                    <Text
                      style={
                        styles.userName
                      }
                    >
                      {user.name}
                    </Text>

                    <Text
                      style={
                        styles.userEmail
                      }
                    >
                      {user.email}
                    </Text>

                    <Text
                      style={
                        styles.userSummary
                      }
                    >
                      {userTab ===
                      'resident'
                        ? `Room ${
                            user.room_number ||
                            '-'
                          }`
                        : userTab ===
                          'guardian'
                        ? `${
                            user.relationship_to_resident ||
                            '-'
                          } of ${
                            user.resident_name ||
                            '-'
                          }`
                        : userTab ===
                          'volunteer'
                        ? `Availability: ${
                            user.availability ||
                            '-'
                          }`
                        : `Staff ID: ${
                            user.staff_id ||
                            '-'
                          }`}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.viewText
                    }
                  >
                    View
                  </Text>
                </TouchableOpacity>
              )
            )
          )}
        </View>
      </>
    );
  };

  // ============================================================
  // SOCIETIES
  // ============================================================

  const toggleSociety = (
    id
  ) => {
    setExpandedSocieties(
      (prev) => ({
        ...prev,
        [id]: !prev[id],
      })
    );
  };

  const toggleBlock = (
    id
  ) => {
    setExpandedBlocks(
      (prev) => ({
        ...prev,
        [id]: !prev[id],
      })
    );
  };

  const renderSocieties = () => {
    return (
      <View
        style={
          styles.sectionCard
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Societies
        </Text>

        {societies.map(
          (society) => (
            <View
              key={society.id}
              style={
                styles.societyItem
              }
            >
              <TouchableOpacity
                style={
                  styles.societyHeader
                }
                onPress={() =>
                  toggleSociety(
                    society.id
                  )
                }
              >
                <Text
                  style={
                    styles.expandIcon
                  }
                >
                  {expandedSocieties[
                    society.id
                  ]
                    ? '⌄'
                    : '›'}
                </Text>

                <View
                  style={
                    styles.societyInfo
                  }
                >
                  <Text
                    style={
                      styles.societyName
                    }
                  >
                    {society.name}
                  </Text>

                  <Text
                    style={
                      styles.societyAddress
                    }
                  >
                    {society.address ||
                      'No address'}
                  </Text>

                  <Text
                    style={
                      styles.societyMeta
                    }
                  >
                    Added by{' '}
                    {society.resident_name ||
                      '-'}{' '}
                    ·{' '}
                    {society.blocks
                      ?.length ||
                      0}{' '}
                    block(s)
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedSocieties[
                society.id
              ] && (
                <View
                  style={
                    styles.blocksContainer
                  }
                >
                  {society.blocks?.map(
                    (block) => (
                      <View
                        key={block.id}
                      >
                        <TouchableOpacity
                          style={
                            styles.blockRow
                          }
                          onPress={() =>
                            toggleBlock(
                              block.id
                            )
                          }
                        >
                          <Text
                            style={
                              styles.expandIcon
                            }
                          >
                            {expandedBlocks[
                              block.id
                            ]
                              ? '⌄'
                              : '›'}
                          </Text>

                          <Text
                            style={
                              styles.blockName
                            }
                          >
                            {block.name}
                          </Text>

                          <Text
                            style={
                              styles.flatCount
                            }
                          >
                            {block.flats
                              ?.length ||
                              0}{' '}
                            flats
                          </Text>
                        </TouchableOpacity>

                        {expandedBlocks[
                          block.id
                        ] &&
                          block.flats?.map(
                            (flat) => (
                              <View
                                key={
                                  flat.id
                                }
                                style={
                                  styles.flatRow
                                }
                              >
                                <Text
                                  style={
                                    styles.flatNumber
                                  }
                                >
                                  Flat{' '}
                                  {
                                    flat.flat_number
                                  }
                                </Text>

                                <Text
                                  style={
                                    styles.flatResident
                                  }
                                >
                                  {flat.resident_name ||
                                    'No resident'}
                                </Text>
                              </View>
                            )
                          )}
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          )
        )}

        {societies.length === 0 && (
          <EmptyState
            text="No societies found."
          />
        )}
      </View>
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
      ['responding', 'Responding'],
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
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.horizontalTabs
          }
        >
          {filters.map(
            ([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterButton,
                  emergencyFilter ===
                    value &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setEmergencyFilter(
                    value
                  )
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    emergencyFilter ===
                      value &&
                      styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <View
          style={
            styles.sectionCard
          }
        >
          {filteredAlerts.length ===
          0 ? (
            <EmptyState
              text="No emergencies found."
            />
          ) : (
            filteredAlerts.map(
              (alert) => (
                <TouchableOpacity
                  key={alert.id}
                  style={
                    styles.emergencyRow
                  }
                  onPress={() =>
                    setSelectedAlert(
                      alert
                    )
                  }
                >
                  <View
                    style={
                      styles.emergencyNumber
                    }
                  >
                    <Text
                      style={
                        styles.numberText
                      }
                    >
                      #{alert.id}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.emergencyInfo
                    }
                  >
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
                      style={
                        styles.emergencySmall
                      }
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

                    {/* SHOW ACCEPTED BY IN LIST */}

                    {getAcceptedByName(
                      alert
                    ) && (
                      <Text
                        style={
                          styles.responderListText
                        }
                      >
                        ✓ Accepted by{' '}
                        {getAcceptedByName(
                          alert
                        )}
                      </Text>
                    )}

                    {/* SHOW RESOLVED BY IN LIST */}

                    {getResolvedByName(
                      alert
                    ) && (
                      <Text
                        style={
                          styles.resolvedListText
                        }
                      >
                        ✓ Resolved by{' '}
                        {getResolvedByName(
                          alert
                        )}
                      </Text>
                    )}
                  </View>

                  <StatusBadge
                    status={
                      alert.status
                    }
                  />
                </TouchableOpacity>
              )
            )
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
        <View
          style={
            styles.sectionCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Create Announcement
          </Text>

          <TextInput
            value={
              announcementTitle
            }
            onChangeText={
              setAnnouncementTitle
            }
            placeholder="Title"
            placeholderTextColor="#9AA39F"
            style={
              styles.input
            }
          />

          <TextInput
            value={
              announcementMessage
            }
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
            style={
              styles.primaryButton
            }
            onPress={
              createAnnouncement
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Publish Announcement
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.sectionCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Posted Announcements
          </Text>

          {announcements.length ===
          0 ? (
            <EmptyState
              text="No announcements."
            />
          ) : (
            announcements.map(
              (announcement) => (
                <View
                  key={
                    announcement.id
                  }
                  style={
                    styles.announcementItem
                  }
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.announcementTitle
                      }
                    >
                      {
                        announcement.title
                      }
                    </Text>

                    <Text
                      style={
                        styles.announcementMessage
                      }
                    >
                      {
                        announcement.message
                      }
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
                      style={
                        styles.deleteText
                      }
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
  // REPORTS
  // ============================================================

  const renderReports = () => {
    const medical = alerts.filter(
      (a) =>
        a.category ===
        'Medical'
    ).length;

    const fire = alerts.filter(
      (a) =>
        a.category === 'Fire'
    ).length;

    const security = alerts.filter(
      (a) =>
        a.category ===
        'Security'
    ).length;

    const other = alerts.filter(
      (a) =>
        a.category === 'Other'
    ).length;

    return (
      <>
        <View
          style={
            styles.reportGrid
          }
        >
          <ReportCard
            title="Total Emergencies"
            value={alerts.length}
            color={
              COLORS.primaryLight
            }
          />

          <ReportCard
            title="Pending"
            value={pendingCount}
            color={
              COLORS.danger
            }
          />

          <ReportCard
            title="Acknowledged"
            value={
              acknowledgedCount
            }
            color={
              COLORS.warning
            }
          />

          <ReportCard
            title="Responding"
            value={respondingCount}
            color={COLORS.blue}
          />

          <ReportCard
            title="Resolved"
            value={resolvedCount}
            color={
              COLORS.success
            }
          />
        </View>

        <View
          style={
            styles.sectionCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Emergency Categories
          </Text>

          <ReportRow
            label="Medical"
            value={medical}
            color={
              COLORS.danger
            }
          />

          <ReportRow
            label="Fire"
            value={fire}
            color="#E67E22"
          />

          <ReportRow
            label="Security"
            value={security}
            color={
              COLORS.purple
            }
          />

          <ReportRow
            label="Other"
            value={other}
            color={
              COLORS.muted
            }
          />
        </View>
      </>
    );
  };

  // ============================================================
  // SETTINGS
  // ============================================================

  const renderSettings = () => {
    return (
      <View
        style={
          styles.sectionCard
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Admin Settings
        </Text>

        <View
          style={
            styles.settingRow
          }
        >
          <Text
            style={
              styles.settingTitle
            }
          >
            Admin Email
          </Text>

          <Text
            style={
              styles.settingValue
            }
          >
            {params.email ||
              params.userEmail ||
              '-'}
          </Text>
        </View>

        <View
          style={
            styles.settingRow
          }
        >
          <Text
            style={
              styles.settingTitle
            }
          >
            Role
          </Text>

          <Text
            style={
              styles.settingValue
            }
          >
            Administrator
          </Text>
        </View>

        <View
          style={
            styles.passwordSection
          }
        >
          <Text
            style={
              styles.passwordSectionTitle
            }
          >
            Change Password
          </Text>

          <TextInput
            value={
              currentPassword
            }
            onChangeText={
              setCurrentPassword
            }
            placeholder="Current Password"
            placeholderTextColor="#9AA39F"
            secureTextEntry
            style={
              styles.passwordInput
            }
          />

          <TextInput
            value={
              newPassword
            }
            onChangeText={
              setNewPassword
            }
            placeholder="New Password"
            placeholderTextColor="#9AA39F"
            secureTextEntry
            style={
              styles.passwordInput
            }
          />

          <TextInput
            value={
              confirmPassword
            }
            onChangeText={
              setConfirmPassword
            }
            placeholder="Confirm Password"
            placeholderTextColor="#9AA39F"
            secureTextEntry
            style={
              styles.passwordInput
            }
          />

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={
              updatePassword
            }
            disabled={
              updatingPassword
            }
          >
            {updatingPassword ? (
              <ActivityIndicator
                color="#FFF"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={logout}
        >
          <Text
            style={
              styles.logoutButtonText
            }
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigationItems = [
    ['dashboard', '▦', 'Dashboard'],
    ['users', '♙', 'Users'],
    ['societies', '⌂', 'Societies'],
    ['emergencies', '⚠', 'Emergencies'],
    ['announcements', '♢', 'Announcements'],
    ['reports', '▥', 'Reports'],
    ['settings', '⚙', 'Settings'],
  ];

  const getPageTitle = () => {
    const item =
      navigationItems.find(
        ([value]) =>
          value === view
      );

    return (
      item?.[2] ||
      'Dashboard'
    );
  };

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        style={
          styles.wrapper
        }
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
            tintColor={
              COLORS.primaryLight
            }
          />
        }
      >

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.appTitle
              }
            >
              CareConnect
            </Text>

            <Text
              style={
                styles.adminLabel
              }
            >
              ADMIN PANEL
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.logoutSmall
            }
            onPress={logout}
          >
            <Text
              style={
                styles.logoutSmallText
              }
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* NAVIGATION */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.mainNav
          }
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
                <Text
                  style={
                    styles.navIcon
                  }
                >
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

        <View
          style={
            styles.pageHeader
          }
        >
          <Text
            style={
              styles.pageTitle
            }
          >
            {getPageTitle()}
          </Text>

          <Text
            style={
              styles.welcome
            }
          >
            Welcome, {userName}
          </Text>
        </View>

        {/* PAGE */}

        {view === 'dashboard' &&
          renderDashboard()}

        {view === 'users' &&
          renderUsers()}

        {view === 'societies' &&
          renderSocieties()}

        {view === 'emergencies' &&
          renderEmergencies()}

        {view === 'announcements' &&
          renderAnnouncements()}

        {view === 'reports' &&
          renderReports()}

        {view === 'settings' &&
          renderSettings()}

      </ScrollView>

      {renderUserDetails()}
      {renderEmergencyDetails()}
    </View>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function InfoRow({
  label,
  value,
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value || '-'}
      </Text>
    </View>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const color =
    status === 'pending'
      ? COLORS.danger
      : status ===
        'acknowledged'
      ? COLORS.warning
      : status ===
        'responding'
      ? COLORS.blue
      : COLORS.success;

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
        {status?.toUpperCase()}
      </Text>
    </View>
  );
}

// ============================================================
// TIMELINE
// ============================================================

function TimelineItem({
  title,
  subtitle,
  time,
  active,
}) {
  return (
    <View
      style={
        styles.timelineItem
      }
    >
      <View
        style={[
          styles.timelineCircle,
          active
            ? styles.timelineActive
            : styles.timelineInactive,
        ]}
      >
        <Text
          style={
            styles.timelineCheck
          }
        >
          {active ? '✓' : ''}
        </Text>
      </View>

      <View
        style={
          styles.timelineContent
        }
      >
        <Text
          style={[
            styles.timelineTitle,
            !active &&
              styles.timelineInactiveText,
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={
              styles.timelineSubtitle
            }
          >
            {subtitle}
          </Text>
        )}

        <Text
          style={
            styles.timelineTime
          }
        >
          {time
            ? formatDateStatic(
                time
              )
            : 'Pending'}
        </Text>
      </View>
    </View>
  );
}

function formatDateStatic(
  value
) {
  if (!value) return '-';

  return new Date(
    value
  ).toLocaleString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

// ============================================================
// EMPTY
// ============================================================

function EmptyState({
  text,
}) {
  return (
    <View
      style={
        styles.empty
      }
    >
      <Text
        style={
          styles.emptyText
        }
      >
        {text}
      </Text>
    </View>
  );
}

// ============================================================
// REPORT CARD
// ============================================================

function ReportCard({
  title,
  value,
  color,
}) {
  return (
    <View
      style={
        styles.reportCard
      }
    >
      <Text
        style={[
          styles.reportValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.reportLabel
        }
      >
        {title}
      </Text>
    </View>
  );
}

// ============================================================
// REPORT ROW
// ============================================================

function ReportRow({
  label,
  value,
  color,
}) {
  return (
    <View
      style={
        styles.reportRow
      }
    >
      <View
        style={
          styles.reportLabelContainer
        }
      >
        <View
          style={[
            styles.reportDot,
            {
              backgroundColor:
                color,
            },
          ]}
        />

        <Text
          style={
            styles.reportRowLabel
          }
        >
          {label}
        </Text>
      </View>

      <Text
        style={
          styles.reportRowValue
        }
      >
        {value}
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
    backgroundColor:
      COLORS.bg,
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
    justifyContent:
      'space-between',
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

  adminLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.muted,
    marginTop: 2,
  },

  logoutSmall: {
    borderWidth: 1,
    borderColor:
      '#E5D3D0',
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
    borderColor:
      COLORS.border,
    backgroundColor: '#FFF',
  },

  navButtonActive: {
    backgroundColor:
      COLORS.primary,
    borderColor:
      COLORS.primary,
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

  // DASHBOARD

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginBottom: 15,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor:
      COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor:
      '#EDF0EF',
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
    backgroundColor:
      COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      '#EDF0EF',
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
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
    justifyContent:
      'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF1EF',
  },

  alertLeft: {
    flex: 1,
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
    alignItems:
      'flex-end',
  },

  alertDate: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 5,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // SEARCH

  searchInput: {
    backgroundColor:
      '#FFF',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 10,
  },

  horizontalTabs: {
    marginBottom: 12,
  },

  tabButton: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      '#FFF',
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: 7,
  },

  tabButtonActive: {
    borderColor:
      COLORS.primary,
    backgroundColor:
      '#EAF3F0',
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

  // USERS

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF1EF',
  },

  userInfo: {
    flex: 1,
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
  },

  viewText: {
    color: COLORS.blue,
    fontWeight: '700',
    fontSize: 12,
  },

  // SOCIETY

  societyItem: {
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  societyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  expandIcon: {
    width: 25,
    fontSize: 22,
    color: '#84908C',
  },

  societyInfo: {
    flex: 1,
  },

  societyName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  societyAddress: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },

  societyMeta: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
  },

  blocksContainer: {
    paddingLeft: 25,
    paddingBottom: 5,
  },

  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  blockName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  flatCount: {
    fontSize: 10,
    color: COLORS.muted,
  },

  flatRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    paddingLeft: 25,
    paddingVertical: 8,
    backgroundColor:
      '#F8FAF9',
    borderRadius: 7,
    marginBottom: 4,
    paddingRight: 10,
  },

  flatNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  flatResident: {
    fontSize: 11,
    color: COLORS.muted,
  },

  // EMERGENCIES

  filterButton: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      '#FFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 7,
  },

  filterButtonActive: {
    borderColor:
      COLORS.primary,
    backgroundColor:
      '#EAF3F0',
  },

  filterText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
  },

  filterTextActive: {
    color: COLORS.primary,
  },

  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
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

  responderListText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 4,
  },

  resolvedListText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 3,
  },

  // RESIDENT

  residentEmergencyBox: {
    backgroundColor:
      '#F4F8F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor:
      '#E1EAE6',
  },

  residentEmergencyLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 3,
  },

  residentEmergencyName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  createdTime: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 5,
  },

  // RESPONSE INFO

  responderInfoCard: {
    marginTop: 8,
    backgroundColor:
      '#F8FAF9',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  responderInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },

  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor:
      '#E7ECE9',
  },

  responderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent:
      'center',
    marginRight: 10,
  },

  responderIconText: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '900',
  },

  responderDetails: {
    flex: 1,
  },

  responderLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },

  responderName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },

  responderId: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },

  responderTime: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  },

  // ANNOUNCEMENTS

  input: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    backgroundColor:
      '#FFF',
    marginTop: 10,
    color: COLORS.text,
  },

  textArea: {
    minHeight: 110,
    textAlignVertical:
      'top',
  },

  primaryButton: {
    backgroundColor:
      COLORS.primary,
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
    borderBottomColor:
      COLORS.border,
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

  // REPORTS

  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginBottom: 14,
  },

  reportCard: {
    width: '48.5%',
    backgroundColor:
      '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  reportValue: {
    fontSize: 25,
    fontWeight: '800',
  },

  reportLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },

  reportRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  reportLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reportDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },

  reportRowLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },

  reportRowValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  // SETTINGS

  settingRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  settingTitle: {
    fontSize: 12,
    color: COLORS.muted,
  },

  settingValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 4,
  },

  passwordSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  passwordSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },

  passwordInput: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    backgroundColor:
      '#FFF',
    marginTop: 10,
    color: COLORS.text,
  },

  logoutButton: {
    backgroundColor:
      '#FFF1EF',
    borderWidth: 1,
    borderColor:
      '#F0D3CF',
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },

  logoutButtonText: {
    color: COLORS.danger,
    fontWeight: '800',
  },

  // MODALS

  modalBackground: {
    flex: 1,
    backgroundColor:
      'rgba(15, 45, 40, 0.38)',
    justifyContent:
      'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor:
      '#FFF',
    borderRadius: 16,
    padding: 20,
  },

  emergencyModal: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor:
      '#FFF',
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
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
    borderBottomColor:
      COLORS.border,
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

  emergencyCategory: {
    alignSelf: 'center',
    backgroundColor:
      '#EAF3F0',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
  },

  categoryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  emergencyMessage: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 18,
  },

  timeline: {
    marginTop: 5,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 72,
  },

  timelineCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent:
      'center',
    marginRight: 12,
  },

  timelineActive: {
    backgroundColor:
      COLORS.success,
  },

  timelineInactive: {
    backgroundColor:
      '#E2E8E5',
  },

  timelineCheck: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  timelineContent: {
    flex: 1,
  },

  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  timelineSubtitle: {
    fontSize: 11,
    color: COLORS.blue,
    marginTop: 3,
  },

  timelineInactiveText: {
    color: '#9AA39F',
  },

  timelineTime: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },

  actionButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
  },

  ackButton: {
    backgroundColor:
      COLORS.warning,
  },

  resolveButton: {
    backgroundColor:
      COLORS.success,
  },

  actionButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  empty: {
    paddingVertical: 25,
    alignItems: 'center',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});