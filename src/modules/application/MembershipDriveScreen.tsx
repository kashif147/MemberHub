import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { UserPlus, ChevronDown, Search } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import {
  DEFAULT_DRIVES,
  getDrivePickerNames,
} from '../../helpers/membershipDrive.helper';
import type { RootState } from '../../store';
import type { HomeStackParamList } from '../../navigation/HomeStack';

const SIGNUPS_TODAY = [
  { id: '1', name: 'Laura Hegarty', type: 'New', time: '16:40' },
  { id: '2', name: 'Mark Dunne', type: 'Rejoin', time: '15:05' },
  { id: '3', name: 'Chloe Byrne', type: 'New', time: '11:20' },
];

/**
 * Membership drive hub — Figma layout.
 * "New member application" opens the 3-step application form.
 */
const MembershipDriveScreen = () => {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<HomeStackParamList, typeof STACKS.MEMBERSHIP_DRIVE>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [drives, setDrives] = useState<string[]>(DEFAULT_DRIVES);
  const [drive, setDrive] = useState(DEFAULT_DRIVES[0]);
  const [driveOpen, setDriveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const names = await getDrivePickerNames();
        if (cancelled) return;
        setDrives(names);
        const preferred = route.params?.driveName;
        if (preferred && names.includes(preferred)) {
          setDrive(preferred);
        } else if (!names.includes(drive)) {
          setDrive(names[0] || DEFAULT_DRIVES[0]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [route.params?.driveName]),
  );

  const openApplication = () => {
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
          onPress={() => setDriveOpen(v => !v)}>
          <Text style={styles.driveSelectText} numberOfLines={1}>
            {drive}
          </Text>
          <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>

        {driveOpen ? (
          <View style={styles.driveMenu}>
            {drives.map(d => (
              <TouchableOpacity
                key={d}
                style={styles.driveOption}
                onPress={() => {
                  setDrive(d);
                  setDriveOpen(false);
                }}>
                <Text
                  style={[
                    styles.driveOptionText,
                    d === drive && styles.driveOptionActive,
                  ]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={openApplication}>
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
    marginBottom: 14,
  },
  driveSelectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  driveMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  driveOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  driveOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  driveOptionActive: {
    color: Colors.primary,
    fontWeight: '700',
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
