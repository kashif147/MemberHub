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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import {
  pickCaseAttachmentsFromSource,
  type AttachSource,
} from '../../helpers/documentPicker.helper';
import { chooseAttachSource } from '../../helpers/attachSource.helper';
import {
  buildOrderedMemberIds,
  isMemberOnMemberComplaintType,
  isMemberOnServiceProviderComplaintType,
  toSelectOptions,
} from '../../helpers/issuePayload.helper';
import { Colors, FontFamily, Radii } from '../../theme';
import { STACKS } from '../../enums/ScreenEnums';
import type { CasesStackParamList } from '../../navigation/CasesStack';
import type { Member } from '../../data/mockMembers';
import type { RootState } from '../../store';

type ComplainantMode = 'member' | 'myself';

/**
 * New case — CRM CreateCasesDrawer / ComplaintFields people model:
 * 1. Owner (creator)     → owner.userId
 * 2. Complaint type      → drives MOM / MOSP related fields
 * 3. Complainant         → memberIds[0]
 * 4. Related member      → memberIds[1]
 * 5. Service provider    → when MOSP
 */
const NewCaseScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasesStackParamList>>();
  const user = useSelector((s: RootState) => s.auth.user);

  const goToCasesList = () => {
    navigation.navigate(STACKS.CASES_LIST);
  };

  const [mode, setMode] = useState<ComplainantMode>('member');
  const [member, setMember] = useState<Member | null>(null);
  const [relatedMember, setRelatedMember] = useState<Member | null>(null);
  const [complaintType, setComplaintType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString());
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

  const ownerLabel = useMemo(() => {
    const name = user?.name || role;
    return `${name} · case owner`;
  }, [user?.name, role]);

  const isMom = useMemo(
    () => isMemberOnMemberComplaintType(complaintType, complaintTypeOptions),
    [complaintType, complaintTypeOptions],
  );

  const isMosp = useMemo(
    () =>
      isMemberOnServiceProviderComplaintType(
        complaintType,
        complaintTypeOptions,
      ),
    [complaintType, complaintTypeOptions],
  );

  /** Related member required for Member On Member (CRM ComplaintFields). */
  const relatedRequired = isMom;
  const serviceProviderRequired = isMosp;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLookups(true);
      try {
        const lookups = await loadCaseLookups();
        if (cancelled) return;
        setComplaintTypeOptions(toSelectOptions(lookups.complaintTypes || []));
        const branchOrigin = (lookups.origins || []).find(o =>
          /branch|rep|officer/i.test(`${o.code} ${o.displayName}`),
        );
        setDefaultOrigin(
          branchOrigin?.code || lookups.origins?.[0]?.code || null,
        );
      } catch (e: any) {
        if (!cancelled) {
          setComplaintTypeOptions([]);
          Alert.alert(
            'Lookups',
            e?.message ||
            'Could not load complaint types. You can still try later.',
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
    if (mode === 'myself') {
      // keep related; complainant is self
    }
  }, [mode]);

  useEffect(() => {
    if (!isMosp) {
      setServiceProvider('');
    }
  }, [isMosp]);

  const memberRequired = mode === 'member';
  const errMember = showValidation && memberRequired && !member;
  const errRelated = showValidation && relatedRequired && !relatedMember;
  const errServiceProvider =
    showValidation && serviceProviderRequired && !serviceProvider.trim();
  const errType = showValidation && !complaintType;
  const errDesc = showValidation && !description.trim();
  const errDate = showValidation && !issueDate;

  const onAttachSource = async (source: AttachSource) => {
    try {
      const next = await pickCaseAttachmentsFromSource(source);
      if (!next) return;
      if (!next.length) {
        Alert.alert(
          'Attachments',
          'No file was selected. Choose a PDF, PNG, JPEG, or DOCX (not legacy .doc).',
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

  const onUploadPress = () => chooseAttachSource(onAttachSource);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onComplaintTypeSelect = (value: string) => {
    setComplaintType(value);
  };

  const resolveComplainantId = (): string | null => {
    if (mode === 'member') return member?.id || null;
    return user?.id || null;
  };

  const onSave = async () => {
    setShowValidation(true);
    if (!complaintType) {
      Alert.alert('Required', 'Please select a complaint type.');
      return;
    }
    if (memberRequired && !member) {
      Alert.alert('Required', 'Please select a member as complainant.');
      return;
    }
    if (relatedRequired && !relatedMember) {
      Alert.alert(
        'Required',
        'Member On Member requires a related member (the person the complaint is about).',
      );
      return;
    }
    if (serviceProviderRequired && !serviceProvider.trim()) {
      Alert.alert('Required', 'Please enter a service provider.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    if (!issueDate) {
      Alert.alert('Required', 'Please select the date received.');
      return;
    }
    if (!defaultOrigin) {
      Alert.alert(
        'Required',
        'Origin could not be loaded. Please try again in a moment.',
      );
      return;
    }
    if (!user?.id || user.id === 'bo-demo') {
      Alert.alert(
        'Required',
        'Unable to identify the signed-in user as case owner. Please sign in again.',
      );
      return;
    }

    const complainantId = resolveComplainantId();
    if (!complainantId) {
      Alert.alert('Required', 'Please select a complainant.');
      return;
    }

    const memberIds = buildOrderedMemberIds({
      complainantId,
      relatedMemberId: relatedMember?.id || null,
    });

    setSaving(true);
    try {
      const { failedUploads } = await createNewCase(
        {
          description,
          complaintType,
          dateReceived: issueDate,
          memberIds,
          origin: defaultOrigin,
          ownerUserId: user.id,
          serviceProvider: isMosp ? serviceProvider.trim() : null,
        },
        uploadedFiles,
      );

      if (failedUploads.length > 0) {
        Alert.alert(
          'Partial success',
          `Case created, but some attachments failed:\n${failedUploads.join(
            '\n',
          )}\n\nAllowed: PDF, PNG, JPEG, DOCX.`,
          [{ text: 'OK', onPress: goToCasesList }],
        );
        return;
      }

      Alert.alert('Case created', 'The new case has been saved.', [
        { text: 'OK', onPress: goToCasesList },
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
        onBack={goToCasesList}
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
          {/* Owner / creator */}
          {/* <FieldLabel label="Raised by (owner)" />
          <TextField
            value={ownerLabel}
            onChangeText={() => {}}
            editable={false}
          />
          <Text style={styles.hint}>
            You are the case owner in CRM. Complainant and related member are
            selected below.
          </Text> */}

          {/* Complaint type — drives MOM / MOSP fields like CRM ComplaintFields */}
          {/* <FieldLabel label="Complaint type" required error={errType} />
          {loadingLookups ? (
            <View style={styles.lookupRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.lookupText}>Loading types…</Text>
            </View>
          ) : (
            <SelectField
              value={complaintType}
              placeholder="Select complaint type"
              options={complaintTypeOptions}
              onSelect={onComplaintTypeSelect}
              error={errType}
            />
          )}
          {isMom ? (
            <View style={styles.typeBanner}>
              <Text style={styles.typeBannerText}>
                Member On Member — select complainant and the related member
                (person the complaint is about).
              </Text>
            </View>
          ) : null}
          {isMosp ? (
            <View style={styles.typeBanner}>
              <Text style={styles.typeBannerText}>
                Member On Service Provider — enter the service provider below.
              </Text>
            </View>
          ) : null} */}

          {/* Complainant — memberIds[0] */}
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
              ? 'The member is recorded as complainant; you remain the case owner.'
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
            <TextField
              value={selfLabel}
              onChangeText={() => { }}
              editable={false}
            />
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
              placeholder="Select complaint type"
              options={complaintTypeOptions}
              onSelect={onComplaintTypeSelect}
              error={errType}
            />
          )}
          {isMom ? (
            <View style={styles.typeBanner}>
              <Text style={styles.typeBannerText}>
                Member On Member — select complainant and the related member
                (person the complaint is about).
              </Text>
            </View>
          ) : null}
          {isMosp ? (
            <View style={styles.typeBanner}>
              <Text style={styles.typeBannerText}>
                Member On Service Provider — enter the service provider below.
              </Text>
            </View>
          ) : null}

          {/* Related member — always available; required for MOM */}
          <FieldLabel
            label="Related member"
            required={relatedRequired}
            error={errRelated}
          />
          <Text style={styles.hint}>
            {relatedRequired
              ? 'Required for Member On Member — the person the complaint is about.'
              : 'Optional — add a member this case is related to (linked as CRM related member).'}
          </Text>
          <MemberPickerField
            value={relatedMember}
            onSelect={setRelatedMember}
            error={errRelated}
          />

          {/* MOSP — Service Provider (CRM ComplaintFields) */}
          {isMosp ? (
            <>
              <FieldLabel
                label="Service provider"
                required
                error={errServiceProvider}
              />
              <TextField
                value={serviceProvider}
                onChangeText={setServiceProvider}
                placeholder="Enter service provider"
                error={errServiceProvider}
              />
            </>
          ) : null}

          <FieldLabel label="Description" required error={errDesc} />
          <View
            style={[styles.textAreaWrap, errDesc && styles.textAreaError]}>
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
            label="Date received"
            name="dateReceived"
            value={issueDate}
            required
            showValidation={showValidation}
            error={errDate}
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
            <Text style={styles.uploadHint}>PDF, PNG, JPEG or DOCX</Text>
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
    borderRadius: Radii.md,
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
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 16,
  },
  typeBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    marginTop: -4,
  },
  typeBannerText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.accentInk,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  lookupText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  textAreaWrap: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    marginBottom: 14,
  },
  textAreaError: {
    borderColor: '#C0392B',
  },
  textArea: {
    fontFamily: FontFamily.regular,
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
    borderRadius: Radii.lg,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    marginTop: 10,
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.primary,
  },
  uploadHint: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  uploadCount: {
    marginTop: 10,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
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
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fileChipText: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.white,
    maxWidth: 220,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    fontSize: 16,
  },
});

export default NewCaseScreen;
