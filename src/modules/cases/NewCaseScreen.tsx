import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Paperclip, X } from 'lucide-react-native';
import { Header } from '../../components/Header';
import {
  FieldLabel,
  SelectField,
  TextField,
} from '../application/formFields';
import DatePicker from '../../common/DatePicker';
import MemberPickerField from './MemberPickerField';
import {
  createNewCase,
  loadCaseLookups,
  type PendingAttachment,
} from '../../services/issues.services';
import { pickCaseAttachments } from '../../helpers/documentPicker.helper';
import { toSelectOptions } from '../../helpers/issuePayload.helper';
import { Colors } from '../../theme/colors';
import type { Member } from '../../data/mockMembers';
import type { RootState } from '../../store';

type ComplainantMode = 'member' | 'myself';

const NewCaseScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((s: RootState) => s.auth.user);

  const [mode, setMode] = useState<ComplainantMode>('member');
  const [member, setMember] = useState<Member | null>(null);
  const [relatedMember, setRelatedMember] = useState<Member | null>(null);
  const [complaintType, setComplaintType] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<PendingAttachment[]>([]);
  const [complaintTypeOptions, setComplaintTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [defaultOrigin, setDefaultOrigin] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const selfLabel = useMemo(() => {
    const name = user?.name || 'Branch Officer';
    const no = user?.memberNo;
    return no ? `${name} (${no})` : name;
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLookups(true);
      try {
        const lookups = await loadCaseLookups();
        if (cancelled) return;
        setComplaintTypeOptions(toSelectOptions(lookups.complaintTypes || []));
        const branchOrigin = (lookups.origins || []).find(o =>
          /branch|rep|officer/i.test(
            `${o.code} ${o.displayName}`,
          ),
        );
        setDefaultOrigin(
          branchOrigin?.code || lookups.origins?.[0]?.code || null,
        );
      } catch (e: any) {
        if (!cancelled) {
          setComplaintTypeOptions([]);
          Alert.alert(
            'Lookups',
            e?.message || 'Could not load complaint types. You can still try later.',
          );
        }
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMember(null);
    setRelatedMember(null);
  }, [mode]);

  const memberRequired = mode === 'member';
  const errMember = showValidation && memberRequired && !member;
  const errType = showValidation && !complaintType;
  const errDesc = showValidation && !description.trim();

  /** Same picker flow as Portal_App CreateCase — PDF, images, DOCX. */
  const onUploadPress = async () => {
    try {
      const next = await pickCaseAttachments();
      if (!next) return;
      if (!next.length) {
        Alert.alert(
          'Attachments',
          'No file was selected. Choose a PDF, PNG, JPEG, or DOCX.',
        );
        return;
      }
      setUploadedFiles(prev => [...prev, ...next]);
    } catch (err: any) {
      Alert.alert(
        'Attachments',
        err?.message || 'Could not open the file picker.',
      );
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    setShowValidation(true);
    if (memberRequired && !member) {
      Alert.alert('Required', 'Please select a member as complainant.');
      return;
    }
    if (!complaintType) {
      Alert.alert('Required', 'Please select a complaint type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    if (!user?.id || user.id === 'bo-demo') {
      Alert.alert(
        'Required',
        'Unable to identify the signed-in user as case owner. Please sign in again.',
      );
      return;
    }

    const memberIds: string[] = [];
    if (mode === 'member' && member?.id) {
      memberIds.push(member.id);
    } else if (mode === 'myself') {
      if (user?.id) {
        memberIds.push(user.id);
      }
      if (relatedMember?.id) {
        memberIds.push(relatedMember.id);
      }
    }

    setSaving(true);
    try {
      const { failedUploads } = await createNewCase(
        {
          description,
          complaintType,
          dateReceived: issueDate || null,
          memberIds,
          origin: defaultOrigin,
          ownerUserId: user.id,
        },
        uploadedFiles,
      );

      if (failedUploads.length > 0) {
        Alert.alert(
          'Partial success',
          `Case created, but failed to upload: ${failedUploads.join(', ')}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      Alert.alert('Case created', 'The new case has been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Could not create case', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="New case"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
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
          <FieldLabel label="Complainant" required />
          <View style={styles.segment}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === 'member' && styles.segmentBtnActive,
              ]}
              onPress={() => setMode('member')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.segmentText,
                  mode === 'member' && styles.segmentTextActive,
                ]}>
                A member
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === 'myself' && styles.segmentBtnActive,
              ]}
              onPress={() => setMode('myself')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.segmentText,
                  mode === 'myself' && styles.segmentTextActive,
                ]}>
                Myself
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            {mode === 'member'
              ? 'The member is recorded as complainant; you are logged as the rep who raised it.'
              : 'You are recorded as the complainant for this case.'}
          </Text>

          {mode === 'member' ? (
            <>
              <FieldLabel
                label="Member (complainant)"
                required
                error={errMember}
              />
              <MemberPickerField
                value={member}
                onSelect={setMember}
                error={errMember}
              />
            </>
          ) : (
            <>
              <TextField
                value={selfLabel}
                onChangeText={() => {}}
                editable={false}
              />
              <FieldLabel label="Related member" />
              <MemberPickerField
                value={relatedMember}
                onSelect={setRelatedMember}
              />
            </>
          )}

          <FieldLabel label="Complaint type" required error={errType} />
          {loadingLookups ? (
            <View style={styles.lookupRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.lookupText}>Loading types…</Text>
            </View>
          ) : (
            <SelectField
              value={complaintType}
              placeholder="Select type"
              options={complaintTypeOptions}
              onSelect={setComplaintType}
              error={errType}
            />
          )}

          <FieldLabel label="Description" required error={errDesc} />
          <View
            style={[
              styles.textAreaWrap,
              errDesc && styles.textAreaError,
            ]}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed description of the complaint..."
              placeholderTextColor={Colors.textPlaceholder}
              multiline
              textAlignVertical="top"
            />
          </View>

          <DatePicker
            label="Issue date"
            name="issueDate"
            value={issueDate}
            disableAgeValidation
            onChange={e => setIssueDate(e.target.value)}
          />

          <FieldLabel label="Attachment" />
          <TouchableOpacity
            style={styles.uploadZone}
            onPress={onUploadPress}
            activeOpacity={0.75}>
            <Paperclip size={22} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.uploadTitle}>Upload files</Text>
            <Text style={styles.uploadHint}>
              PDF, PNG, JPEG or DOCX
            </Text>
            {uploadedFiles.length > 0 ? (
              <Text style={styles.uploadCount}>
                {uploadedFiles.length} file
                {uploadedFiles.length === 1 ? '' : 's'} selected
              </Text>
            ) : null}
          </TouchableOpacity>
          {uploadedFiles.length > 0 ? (
            <View style={styles.fileList}>
              {uploadedFiles.map((file, index) => (
                <View key={`${file.uri}-${index}`} style={styles.fileChip}>
                  <Text
                    style={styles.fileChipText}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {file.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFile(index)}
                    hitSlop={8}
                    accessibilityLabel="Remove file">
                    <X size={14} color={Colors.white} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Create case</Text>
            )}
          </TouchableOpacity>
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
  segment: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  segmentBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 16,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  lookupText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  textAreaWrap: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    marginBottom: 14,
  },
  textAreaError: {
    borderColor: '#C0392B',
  },
  textArea: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 90,
    padding: 0,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadHint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  uploadCount: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  fileList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -12,
    marginBottom: 20,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fileChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    maxWidth: 220,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default NewCaseScreen;
