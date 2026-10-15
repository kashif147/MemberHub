import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, ChevronDown, Search } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import { refreshMeProfile } from '../../services/auth.services';
import type { AppDispatch, RootState } from '../../store';
import type { HomeStackParamList } from '../../navigation/HomeStack';

const SIGNUPS_TODAY = [
  { id: '1', name: 'Laura Hegarty', type: 'New', time: '16:40' },
  { id: '2', name: 'Mark Dunne', type: 'Rejoin', time: '15:05' },
  { id: '3', name: 'Chloe Byrne', type: 'New', time: '11:20' },
];

/**
 * Membership drive hub — Figma layout.
 * Drive picker lists work locations from /me assignedLocations.
 */
const MembershipDriveScreen = () => {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<HomeStackParamList, typeof STACKS.MEMBERSHIP_DRIVE>>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [drive, setDrive] = useState('');
  const [driveOpen, setDriveOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';

  const locations = useMemo(
    () => user?.workLocations || [],
    [user?.workLocations],
  );

  const ensureLocations = useCallback(async () => {
    if (user?.workLocations?.length) return;
    setLoadingLocations(true);
    try {
      await dispatch(refreshMeProfile());
    } finally {
      setLoadingLocations(false);
    }
  }, [dispatch, user?.workLocations?.length]);

  useFocusEffect(
    useCallback(() => {
      ensureLocations();
    }, [ensureLocations]),
  );

  useEffect(() => {
    if (!locations.length) {
      setDrive('');
      return;
    }
    const preferred = route.params?.driveName;
    if (preferred && locations.includes(preferred)) {
      setDrive(preferred);
      return;
    }
    setDrive(prev => (prev && locations.includes(prev) ? prev : locations[0]));
  }, [locations, route.params?.driveName]);

  const openApplication = () => {
    if (!drive) return;
    navigation.navigate(STACKS.APPLICATION_FORM, { driveName: drive });
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Membership drive"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Drive · every application is tagged with it
        </Text>

        <TouchableOpacity
          style={styles.driveSelect}
          activeOpacity={0.8}
          disabled={!locations.length}
          onPress={() => {
            if (locations.length) setDriveOpen(v => !v);
          }}>
          <Text
            style={[
              styles.driveSelectText,
              !drive && styles.driveSelectPlaceholder,
            ]}
            numberOfLines={1}>
            {drive ||
              (loadingLocations
                ? 'Loading locations…'
                : 'Select a work location')}
          </Text>
          {loadingLocations ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {driveOpen && locations.length > 0 ? (
          <View style={styles.driveMenu}>
            {locations.map(loc => (
              <TouchableOpacity
                key={loc}
                style={styles.driveOption}
                onPress={() => {
                  setDrive(loc);
                  setDriveOpen(false);
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.driveOptionText,
                    loc === drive && styles.driveOptionActive,
                  ]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {!loadingLocations && locations.length === 0 ? (
          <Text style={styles.emptyLocations}>
            No work locations on your profile. Locations come from /me
            assignedLocations.
          </Text>
        ) : null}

        {/* Stats — Figma */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>17</Text>
            <Text style={styles.statLabel}>This drive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Rejoins</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          CHECK FOR AN EXISTING PROFILE FIRST
        </Text>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name, email or mobile"
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !drive && styles.primaryBtnDisabled]}
          activeOpacity={0.85}
          onPress={openApplication}
          disabled={!drive}>
          <UserPlus size={18} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>New member application</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          SIGNED UP TODAY
        </Text>
        <View style={styles.listCard}>
          {SIGNUPS_TODAY.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.signupRow,
                index === SIGNUPS_TODAY.length - 1 && styles.signupRowLast,
              ]}>
              <Text style={styles.signupName}>{item.name}</Text>
              <Text style={styles.signupMeta}>
                {item.type} · {item.time}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  driveSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  driveSelectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  driveSelectPlaceholder: {
    fontWeight: '500',
    color: Colors.textMuted,
  },
  driveMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  driveOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  driveOptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  driveOptionActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyLocations: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  signupRowLast: {
    borderBottomWidth: 0,
  },
  signupName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  signupMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default MembershipDriveScreen;
