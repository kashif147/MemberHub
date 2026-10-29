import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  User,
  IdCard,
  Fingerprint,
  Lock,
  Folder,
  Megaphone,
  CircleAlert,
  CloudDownload,
  Rocket,
  FileText,
  CircleHelp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { fetchMyMembershipDrives } from '../services/membershipDrive.services';
import type { RootState } from '../store';

const SETTINGS_KEY = '@memberhub/settings_prefs';

type SettingsPrefs = {
  faceId: boolean;
  caseUpdates: boolean;
  driveReminders: boolean;
  arrearsAlerts: boolean;
  offlineDriveMode: boolean;
  openToActiveDrive: boolean;
  defaultDriveId: string | null;
  defaultDriveName: string | null;
};

const DEFAULT_PREFS: SettingsPrefs = {
  faceId: true,
  caseUpdates: true,
  driveReminders: true,
  arrearsAlerts: false,
  offlineDriveMode: true,
  openToActiveDrive: false,
  defaultDriveId: null,
  defaultDriveName: null,
};

type IconComp = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const MicrosoftGlyph = () => (
  <View style={styles.msGrid}>
    <View style={[styles.msCell, { backgroundColor: '#F25022' }]} />
    <View style={[styles.msCell, { backgroundColor: '#7FBA00' }]} />
    <View style={[styles.msCell, { backgroundColor: '#00A4EF' }]} />
    <View style={[styles.msCell, { backgroundColor: '#FFB900' }]} />
  </View>
);

const SectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const ToggleRow = ({
  Icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  Icon: IconComp;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: () => void;
}) => (
  <View style={styles.row}>
    <Icon size={20} color={Colors.primary} strokeWidth={2} />
    <View style={styles.rowBody}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{
        false: Colors.borderMuted,
        true: Colors.primary,
      }}
      thumbColor={Colors.white}
      ios_backgroundColor={Colors.borderMuted}
    />
  </View>
);

const LinkRow = ({
  Icon,
  title,
  subtitle,
  meta,
  onPress,
  iconNode,
}: {
  Icon?: IconComp;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  iconNode?: React.ReactNode;
}) => {
  const content = (
    <View style={styles.row}>
      {iconNode ||
        (Icon ? (
          <Icon size={20} color={Colors.primary} strokeWidth={2} />
        ) : null)}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      {onPress && !meta ? (
        <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [prefs, setPrefs] = useState<SettingsPrefs>(DEFAULT_PREFS);
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const [drives, setDrives] = useState<{ id: string; name: string }[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branches = user?.branches || 'Beaumont & Mater branches';
  const name = user?.name || 'Kashif Rehman';
  const email = user?.email || 'k.rehman@inmo.ie';
  const memberNo = user?.memberNo || 'B00002';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw);
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadDrives = useCallback(async () => {
    setLoadingDrives(true);
    try {
      const { drives: rows } = await fetchMyMembershipDrives({
        includeStats: false,
        limit: 50,
      });
      const mapped = rows.map(d => ({ id: d._id, name: d.name }));
      setDrives(mapped);
      setPrefs(prev => {
        if (
          prev.defaultDriveId &&
          mapped.some(d => d.id === prev.defaultDriveId)
        ) {
          return prev;
        }
        const live = rows.find(d => d.status === 'IN_PROGRESS');
        const pick = live || rows[0];
        if (!pick) return prev;
        const next = {
          ...prev,
          defaultDriveId: pick._id,
          defaultDriveName: pick.name,
        };
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(
          () => {},
        );
        return next;
      });
    } catch {
      setDrives([]);
    } finally {
      setLoadingDrives(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrives();
    }, [loadDrives]),
  );

  const persist = useCallback(async (next: SettingsPrefs) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const toggle = (key: keyof SettingsPrefs) => {
    if (typeof prefs[key] !== 'boolean') return;
    persist({ ...prefs, [key]: !prefs[key] });
  };

  const selectDrive = (id: string, name: string) => {
    persist({
      ...prefs,
      defaultDriveId: id,
      defaultDriveName: name,
    });
    setDriveMenuOpen(false);
  };

  const defaultDriveLabel =
    prefs.defaultDriveName ||
    drives[0]?.name ||
    (loadingDrives ? 'Loading drives…' : 'Select a drive');

  return (
    <View style={styles.screen}>
      <Header
        title="Settings"
        role={role}
        branch={branches}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* ACCOUNT */}
        <SectionLabel>ACCOUNT</SectionLabel>
        <LinkRow
          Icon={User}
          title={name}
          subtitle={email}
          meta={memberNo}
        />
        <LinkRow
          Icon={IdCard}
          title="Role"
          subtitle={branches}
          meta={role}
        />
        <LinkRow
          title="Signed in with Microsoft"
          subtitle="Manage account"
          iconNode={<MicrosoftGlyph />}
          onPress={() =>
            Alert.alert(
              'Microsoft account',
              'Account management opens in your organisation’s Microsoft portal.',
            )
          }
        />

        {/* SECURITY */}
        <SectionLabel>SECURITY</SectionLabel>
        <ToggleRow
          Icon={Fingerprint}
          title="Unlock with Face ID"
          subtitle="Required after 5 minutes away"
          value={prefs.faceId}
          onChange={() => toggle('faceId')}
        />
        <LinkRow
          Icon={Lock}
          title="Auto-lock"
          subtitle="After 5 minutes"
          onPress={() =>
            Alert.alert('Auto-lock', 'Auto-lock is set to after 5 minutes.')
          }
        />

        {/* NOTIFICATIONS */}
        <SectionLabel>NOTIFICATIONS</SectionLabel>
        <ToggleRow
          Icon={Folder}
          title="Case updates"
          subtitle="When a case you raised changes status"
          value={prefs.caseUpdates}
          onChange={() => toggle('caseUpdates')}
        />
        <ToggleRow
          Icon={Megaphone}
          title="Drive reminders"
          subtitle="Start, end and target reached"
          value={prefs.driveReminders}
          onChange={() => toggle('driveReminders')}
        />
        <ToggleRow
          Icon={CircleAlert}
          title="Arrears alerts"
          subtitle="When a member in your scope falls into arrears"
          value={prefs.arrearsAlerts}
          onChange={() => toggle('arrearsAlerts')}
        />

        {/* APP */}
        <SectionLabel>APP</SectionLabel>
        <ToggleRow
          Icon={CloudDownload}
          title="Offline drive mode"
          subtitle="Save applications on the device and sync when back online"
          value={prefs.offlineDriveMode}
          onChange={() => toggle('offlineDriveMode')}
        />
        <ToggleRow
          Icon={Rocket}
          title="Open to active drive"
          subtitle="Start on the drive screen while a drive is live"
          value={prefs.openToActiveDrive}
          onChange={() => toggle('openToActiveDrive')}
        />
        <LinkRow
          Icon={FileText}
          title="Privacy statement"
          onPress={() =>
            Alert.alert(
              'Privacy statement',
              'Your organisation’s privacy statement will open here.',
            )
          }
        />
        <LinkRow
          Icon={CircleHelp}
          title="Help & support"
          onPress={() =>
            Alert.alert(
              'Help & support',
              'Contact your branch office or CRM support for help with MemberHub.',
            )
          }
        />

        <Text style={styles.defaultDriveLabel}>
          Default drive for new applications
        </Text>
        <TouchableOpacity
          style={styles.driveSelect}
          activeOpacity={0.8}
          disabled={loadingDrives || drives.length === 0}
          onPress={() => setDriveMenuOpen(v => !v)}>
          <Text style={styles.driveSelectText} numberOfLines={1}>
            {defaultDriveLabel}
          </Text>
          {loadingDrives ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {driveMenuOpen && drives.length > 0 ? (
          <View style={styles.driveMenu}>
            {drives.map((d, index) => {
              const selected = d.id === prefs.defaultDriveId;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.driveOption,
                    index === drives.length - 1 && styles.driveOptionLast,
                  ]}
                  onPress={() => selectDrive(d.id, d.name)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.driveOptionText,
                      selected && styles.driveOptionActive,
                    ]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.footer}>
          MemberHub 1.0.0 (build 42) · Synced with CRM 2 min ago
        </Text>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  rowSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rowMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  defaultDriveLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 22,
    marginBottom: 10,
  },
  driveSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  driveSelectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  driveMenu: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  driveOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  driveOptionLast: {
    borderBottomWidth: 0,
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
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 16,
  },
  msGrid: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  msCell: {
    width: 8,
    height: 8,
  },
});

export default SettingsScreen;
