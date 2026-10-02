import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserPlus, ChevronDown, Search } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';

const DRIVES = ['Beaumont ED – Autumn drive', 'Mater campus – Winter drive'];

const SIGNUPS_TODAY = [
  { id: '1', name: 'Laura Hegarty', type: 'New', time: '16:40' },
  { id: '2', name: 'Mark Dunne', type: 'Rejoin', time: '15:05' },
  { id: '3', name: 'Chloe Byrne', type: 'New', time: '11:20' },
];

/**
 * Membership drive hub — opened from "Register a member".
 * "New member application" starts the 3-step Portal-style form.
 */
const MembershipDriveScreen = () => {
  const navigation = useNavigation<any>();
  const [drive, setDrive] = useState(DRIVES[0]);
  const [driveOpen, setDriveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const openApplication = () => {
    navigation.navigate(STACKS.APPLICATION_FORM, { driveName: drive });
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Membership drive"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>Drive · every application is tagged with it</Text>

        <TouchableOpacity
          style={styles.driveSelect}
          activeOpacity={0.8}
          onPress={() => setDriveOpen(v => !v)}>
          <Text style={styles.driveSelectText} numberOfLines={1}>
            {drive}
          </Text>
          <ChevronDown size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {driveOpen && (
          <View style={styles.driveMenu}>
            {DRIVES.map(d => (
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
        )}

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

        <Text style={styles.sectionLabel}>CHECK FOR AN EXISTING PROFILE FIRST</Text>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name, email or mobile"
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={openApplication}>
          <UserPlus size={18} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>New member application</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>SIGNED UP TODAY</Text>
        <View style={styles.listCard}>
          {SIGNUPS_TODAY.map((item, index) => (
            <View key={item.id}>
              <View style={styles.signupRow}>
                <Text style={styles.signupName}>{item.name}</Text>
                <Text style={styles.signupMeta}>
                  {item.type} · {item.time}
                </Text>
              </View>
              {index < SIGNUPS_TODAY.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
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
    marginBottom: 8,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
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
    marginTop: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 8,
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  signupName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  signupMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});

export default MembershipDriveScreen;
