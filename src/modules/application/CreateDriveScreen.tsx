import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Check } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { FieldLabel, TextField, RadioRow } from './formFields';
import DatePicker from '../../common/DatePicker';
import { Colors } from '../../theme/colors';
import { refreshMeProfile } from '../../services/auth.services';
import {
  DRIVE_TYPE_OPTIONS,
  toIsoDaysFromNow,
  toIsoStartOfDay,
} from '../../helpers/membershipDrive.helper';
import { createAndStartMembershipDrive } from '../../services/membershipDrive.services';
import { STACKS } from '../../enums/ScreenEnums';
import type { RootState, AppDispatch } from '../../store';

const CreateDriveScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [name, setName] = useState('');
  const [driveType, setDriveType] = useState<string>(DRIVE_TYPE_OPTIONS[0]);
  /** Selected work-location lookup ids (not display names). */
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toIsoStartOfDay());
  const [endDate, setEndDate] = useState(toIsoDaysFromNow(18));
  const [signUpTarget, setSignUpTarget] = useState('25');
  const [notes, setNotes] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';

  const workLocationOptions = useMemo(
    () =>
      (user?.workLocationRows || []).filter(
        row => row.id && row.name,
      ),
    [user?.workLocationRows],
  );

  const ensureLocations = useCallback(async () => {
    if (user?.workLocationRows?.some(r => r.id)) return;
    setLoadingLocations(true);
    try {
      await dispatch(refreshMeProfile());
    } finally {
      setLoadingLocations(false);
    }
  }, [dispatch, user?.workLocationRows]);

  useFocusEffect(
    useCallback(() => {
      ensureLocations();
    }, [ensureLocations]),
  );

  useEffect(() => {
    // Drop selections that are no longer in scope after /me refresh
    const allowed = new Set(workLocationOptions.map(r => r.id));
    setSelectedLocationIds(prev => prev.filter(id => allowed.has(id)));
  }, [workLocationOptions]);

  const errName = showValidation && !name.trim();
  const errType = showValidation && !driveType;
  const errLocations = showValidation && selectedLocationIds.length === 0;
  const errStart = showValidation && !startDate;
  const errEnd = showValidation && !endDate;

  const toggleLocation = (lookupId: string) => {
    setSelectedLocationIds(prev =>
      prev.includes(lookupId)
        ? prev.filter(id => id !== lookupId)
        : [...prev, lookupId],
    );
  };

  const onCancel = () => navigation.goBack();

  const onCreate = async () => {
    setShowValidation(true);
    if (
      !name.trim() ||
      !driveType ||
      selectedLocationIds.length === 0 ||
      !startDate ||
      !endDate
    ) {
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Create drive', 'End date must be on or after the start date.');
      return;
    }
    setSaving(true);
    try {
      const target = Number.parseInt(signUpTarget.trim(), 10);
      const drive = await createAndStartMembershipDrive({
        name: name.trim(),
        driveType,
        // API expects work-location lookup ids, not display names.
        workLocations: selectedLocationIds,
        startDate,
        endDate,
        signUpTarget: Number.isFinite(target) && target >= 0 ? target : 0,
        notes: notes.trim() || null,
      });
      navigation.replace(STACKS.MEMBERSHIP_DRIVE, {
        driveId: drive._id,
        driveName: drive.name,
      });
    } catch (e: any) {
      Alert.alert('Create drive', e?.message || 'Could not save this drive.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="New membership drive"
        role={role}
        branch={branch}
        showBack
        onBack={onCancel}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Applications registered during the drive are tagged to it, so
            sign-ups and rejoins are tracked against the target.
          </Text>

          <FieldLabel label="Drive name" required error={errName} />
          <TextField
            value={name}
            onChangeText={setName}
            placeholder="e.g. Beaumont ICU – November walkabout"
            error={errName}
            autoCapitalize="sentences"
          />

          <FieldLabel label="Drive type" required error={errType} />
          <RadioRow
            value={driveType}
            options={[...DRIVE_TYPE_OPTIONS]}
            onChange={setDriveType}
            stacked
            error={errType}
          />

          <Text style={[styles.scopeLabel, errLocations && styles.labelError]}>
            Work locations
            <Text style={styles.required}> *</Text>
            <Text style={styles.scopeSuffix}> · within your scope</Text>
          </Text>

          {loadingLocations ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.helper}>Loading locations from your profile…</Text>
            </View>
          ) : workLocationOptions.length === 0 ? (
            <Text style={styles.emptyLocations}>
              No work locations on your profile. Locations come from /me
              assignedLocations.
            </Text>
          ) : (
            <View style={styles.chipWrap}>
              {workLocationOptions.map(loc => {
                const selected = selectedLocationIds.includes(loc.id);
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleLocation(loc.id)}
                    activeOpacity={0.75}>
                    {selected ? (
                      <Check
                        size={14}
                        color={Colors.primary}
                        strokeWidth={2.4}
                      />
                    ) : (
                      <Plus
                        size={14}
                        color={Colors.textSecondary}
                        strokeWidth={2.2}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}>
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <Text style={styles.helper}>
            Pick locations to see who the drive reaches
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <DatePicker
                label="Start date"
                name="startDate"
                required
                value={startDate}
                disableAgeValidation
                showValidation={errStart}
                onChange={e => setStartDate(e.target.value)}
              />
            </View>
            <View style={styles.dateCol}>
              <DatePicker
                label="End date"
                name="endDate"
                required
                value={endDate}
                disableAgeValidation
                showValidation={errEnd}
                onChange={e => setEndDate(e.target.value)}
              />
            </View>
          </View>

          <FieldLabel label="Sign-up target" />
          <TextField
            value={signUpTarget}
            onChangeText={setSignUpTarget}
            keyboardType="number-pad"
            placeholder="25"
          />

          <FieldLabel label="Notes for reps" />
          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Where you'll be set up, who's helping, materials..."
              placeholderTextColor={Colors.textPlaceholder}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.8}
              disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, saving && styles.createBtnDisabled]}
              onPress={onCreate}
              activeOpacity={0.85}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.createText}>Create drive</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  intro: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 18,
  },
  scopeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scopeSuffix: {
    fontWeight: '400',
    color: Colors.textMuted,
  },
  required: { color: '#E74C3C' },
  labelError: { color: '#C0392B' },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  helper: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  emptyLocations: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  textAreaWrap: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 90,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  createBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default CreateDriveScreen;
