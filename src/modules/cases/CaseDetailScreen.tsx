import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Linking,
  Keyboard,
  Platform,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Paperclip,
  Plus,
  Send,
  X,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import {
  FieldLabel,
  SelectField,
  TextField,
} from '../application/formFields';
import DatePicker from '../../common/DatePicker';
import {
  addCaseNote,
  getHistoryActionColor,
  loadCaseDetail,
  loadCaseLookups,
  loadOwnerOptions,
  resolveCaseAttachmentUrl,
  updateCaseGeneral,
  uploadCaseAttachments,
  type CaseActivityAttachment,
  type CaseActivityItem,
  type CaseAttachmentItem,
  type CaseDetailBundle,
  type CaseHistoryItem,
  type PendingAttachment,
  type TeamUserOption,
} from '../../services/issues.services';
import {
  pickCaseAttachmentsFromSource,
  type AttachSource,
} from '../../helpers/documentPicker.helper';
import { chooseAttachSource } from '../../helpers/attachSource.helper';
import { displayValue, formatIssueEnumLabel } from '../../helpers/cases.helper';
import {
  isMemberOnServiceProviderComplaintType,
  toSelectOptions,
} from '../../helpers/issuePayload.helper';
import { Colors, FontFamily, Radii } from '../../theme';
import { STACKS } from '../../enums/ScreenEnums';
import type { CaseStatus } from '../../data/mockCases';
import type { RootState } from '../../store';

const stripHtml = (value: string) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const displayOrDash = (value?: string | null) => {
  const v = String(value || '').trim();
  return v && v !== '—' ? v : '—';
};

type RouteParams = {
  [STACKS.CASE_DETAIL]: { issueId: string; title?: string };
};

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const style =
    status === 'Closed'
      ? { bg: Colors.statusClosedBg, text: Colors.statusClosed, border: false }
      : status === 'In progress'
        ? {
            bg: Colors.statusInProgressBg,
            text: Colors.statusInProgress,
            border: false,
          }
        : { bg: Colors.surface, text: Colors.primary, border: true };

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: style.bg,
          borderWidth: style.border ? 1 : 0,
          borderColor: Colors.border,
        },
      ]}>
      <Text style={[styles.statusBadgeText, { color: style.text }]}>
        {status}
      </Text>
    </View>
  );
};

const FieldRow = ({
  label,
  value,
  last,
  children,
}: {
  label: string;
  value?: string;
  last?: boolean;
  children?: React.ReactNode;
}) => (
  <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children || <Text style={styles.fieldValue}>{displayValue(value)}</Text>}
  </View>
);

const SectionCard = ({
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string | null;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.75}>
      <View style={styles.sectionHeaderText}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle && !expanded ? (
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {expanded ? (
        <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2.2} />
      ) : (
        <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2.2} />
      )}
    </TouchableOpacity>
    {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
  </View>
);

/** Portal CaseDetail AttachmentItem — thumbnail card in a wrap grid. */
const AttachmentItem = ({
  name,
  createdAt,
  busy,
  onView,
  onDownload,
}: {
  name: string;
  createdAt?: string;
  busy?: boolean;
  onView?: () => void;
  onDownload?: () => void;
}) => (
  <View style={styles.attachmentCard}>
    <View style={styles.attachmentPreview}>
      {busy ? (
        <ActivityIndicator size="small" color={Colors.danger} />
      ) : (
        <FileText size={22} color={Colors.danger} strokeWidth={2} />
      )}
    </View>
    <Text style={styles.attachmentCardName} numberOfLines={1}>
      {name || 'Attachment'}
    </Text>
    {createdAt ? (
      <Text style={styles.attachmentCardDate}>{createdAt}</Text>
    ) : null}
    <View style={styles.attachmentCardActions}>
      {onView ? (
        <TouchableOpacity
          onPress={onView}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={busy}
          accessibilityLabel="View attachment">
          <Eye size={16} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      ) : null}
      {onDownload ? (
        <TouchableOpacity
          onPress={onDownload}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: onView ? 14 : 0 }}
          disabled={busy}
          accessibilityLabel="Download attachment">
          <Download size={16} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

/** Portal CaseDetail UploadNewItem. */
const UploadNewItem = ({
  uploading,
  disabled,
  onPress,
}: {
  uploading: boolean;
  disabled?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.uploadNewCard}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}>
    <View style={styles.uploadNewPreview}>
      {uploading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Plus size={28} color={Colors.white} strokeWidth={2.4} />
      )}
    </View>
    <Text style={styles.uploadNewLabel}>
      {uploading ? 'Uploading…' : 'Upload New'}
    </Text>
  </TouchableOpacity>
);

const CaseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, typeof STACKS.CASE_DETAIL>>();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user);
  const issueId = route.params?.issueId;

  const [bundle, setBundle] = useState<CaseDetailBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState<PendingAttachment | null>(
    null,
  );
  const [submittingComment, setSubmittingComment] = useState(false);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(
    null,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [ownerUserId, setOwnerUserId] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<TeamUserOption[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [origin, setOrigin] = useState('');
  const [issueSource, setIssueSource] = useState('');
  const [issueSourceOther, setIssueSourceOther] = useState('');
  const [dateReceived, setDateReceived] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [complaintTypeOptions, setComplaintTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [originOptions, setOriginOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [issueSourceOptions, setIssueSourceOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [priorityOptions, setPriorityOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const isClosed = bundle?.issue?.issueStatusUi === 'Closed';
  const selfId = user?.id && user.id !== 'bo-demo' ? String(user.id) : '';
  /** Creator or assignee can edit open cases (CRM CasesDetails write path). */
  const canEdit = Boolean(
    !isClosed &&
      selfId &&
      bundle?.issue &&
      (String(bundle.issue.createdBy) === selfId ||
        String(bundle.issue.ownerUserId) === selfId),
  );
  const isMosp = useMemo(
    () =>
      isMemberOnServiceProviderComplaintType(
        complaintType,
        complaintTypeOptions,
      ),
    [complaintType, complaintTypeOptions],
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
        return;
      }
      setKeyboardHeight(event?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!issueId) {
        setError('Missing case id');
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await loadCaseDetail(issueId);
        setBundle(data);
        const iss = data.issue;
        const raw = iss?.raw || {};
        setOwnerUserId(String(iss?.ownerUserId || '').trim());
        setDescription(stripHtml(raw.description || iss?.description || ''));
        setAvailability(
          stripHtml(raw.availability || '').replace(/^—$/, '') ||
            (iss?.availability !== '—' ? stripHtml(iss?.availability || '') : ''),
        );
        setPriority(String(raw.priority || iss?.priority || 'MEDIUM'));
        setOrigin(String(raw.origin || iss?.originCode || ''));
        setIssueSource(String(raw.issueSource || iss?.issueSourceCode || ''));
        setIssueSourceOther(String(raw.issueSourceOther || iss?.issueSourceOther || ''));
        setDateReceived(
          iss?.dateReceivedIso ||
            (raw.dateReceived ? new Date(raw.dateReceived).toISOString() : ''),
        );
        setComplaintType(String(raw.complaintType || iss?.complaintType || ''));
        setServiceProvider(
          String(raw.serviceProvider || '').trim() ||
            (iss?.serviceProvider !== '—' ? String(iss?.serviceProvider || '') : ''),
        );
      } catch (e: any) {
        setBundle(null);
        setError(e?.message || 'Failed to load case details');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [issueId],
  );

  // Lookups for editable summary fields (CRM CasesDetails).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lookups = await loadCaseLookups();
        if (cancelled) return;
        setComplaintTypeOptions(toSelectOptions(lookups.complaintTypes || []));
        setOriginOptions(toSelectOptions(lookups.origins || []));
        setIssueSourceOptions(toSelectOptions(lookups.issueSources || []));
        const priorities = toSelectOptions(lookups.priorities || []);
        setPriorityOptions(
          priorities.length
            ? priorities
            : [
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
              ],
        );
      } catch {
        // Keep read-only labels if lookups fail.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Owner options — CRM CasesDetails useTeamUserOptions(issueType resource).
  useEffect(() => {
    const issueType = bundle?.issue?.issueType;
    if (!issueType) return;
    let cancelled = false;
    (async () => {
      setLoadingOwners(true);
      try {
        const options = await loadOwnerOptions({
          issueType,
          currentUserId: selfId || null,
          currentUserLabel: user?.name || role,
        });
        if (cancelled) return;
        setOwnerOptions(options);
        // Keep current assignee visible even if not in the write-permission list.
        const current = String(bundle?.issue?.ownerUserId || '').trim();
        if (current && !options.some(o => o.value === current)) {
          setOwnerOptions(prev => [
            { value: current, label: current },
            ...prev,
          ]);
        }
      } catch {
        if (!cancelled) setOwnerOptions([]);
      } finally {
        if (!cancelled) setLoadingOwners(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    bundle?.issue?.issueType,
    bundle?.issue?.ownerUserId,
    selfId,
    user?.name,
    role,
  ]);

  const onSaveChanges = async () => {
    if (!issueId || !bundle?.issue || !canEdit) return;
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    if (!ownerUserId) {
      Alert.alert('Required', 'Please select an owner.');
      return;
    }
    if (isMosp && !serviceProvider.trim()) {
      Alert.alert('Required', 'Please enter a service provider.');
      return;
    }
    setSaving(true);
    try {
      await updateCaseGeneral(issueId, bundle.issue.issueType, {
        description,
        availability: availability.trim() || null,
        priority,
        origin: origin || null,
        issueSource: issueSource || null,
        issueSourceOther:
          issueSource === 'OTHR-IS' ? issueSourceOther.trim() || null : null,
        dateReceived: dateReceived || null,
        ownerUserId,
        complaintType:
          bundle.issue.issueType === 'COMPLAINT' ? complaintType || null : null,
        serviceProvider: isMosp ? serviceProvider.trim() : null,
      });
      Alert.alert('Saved', 'Case updated.');
      await load(true);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const onAttachSource = async (source: AttachSource) => {
    if (!issueId || uploadingAttachment) return;
    try {
      const next = await pickCaseAttachmentsFromSource(source);
      if (!next?.length) return;
      setUploadingAttachment(true);
      const { failedUploads } = await uploadCaseAttachments(issueId, next);
      await load(true);
      if (failedUploads.length) {
        Alert.alert(
          'Attachments',
          `Some files failed to upload: ${failedUploads.join(', ')}`,
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Attachments',
        err?.message || 'Failed to upload attachment',
      );
    } finally {
      setUploadingAttachment(false);
    }
  };

  const onUploadPress = () => {
    if (isClosed) {
      Alert.alert('Case closed', 'Cannot add attachments to a closed case.');
      return;
    }
    chooseAttachSource(onAttachSource);
  };

  const onCommentAttachSource = async (source: AttachSource) => {
    try {
      const next = await pickCaseAttachmentsFromSource(source);
      if (!next?.[0]) return;
      setCommentFile(next[0]);
    } catch (err: any) {
      Alert.alert(
        'Attachments',
        err?.message || 'Could not open the file picker.',
      );
    }
  };

  const onCommentAttachPress = () => {
    if (isClosed) {
      Alert.alert('Case closed', 'Cannot add a comment to a closed case.');
      return;
    }
    chooseAttachSource(onCommentAttachSource);
  };

  const openAttachment = async (file: {
    id: string;
    url?: string;
    activityId?: string;
    index?: number;
  }) => {
    if (openingAttachmentId) return;
    setOpeningAttachmentId(file.id);
    try {
      const url = await resolveCaseAttachmentUrl(file as CaseAttachmentItem);
      const can = await Linking.canOpenURL(url);
      if (!can) {
        throw new Error('Unable to open this file on this device.');
      }
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert(
        'Attachment',
        err?.message || 'Failed to open attachment',
      );
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  const openActivityAttachment = async (
    activity: CaseActivityItem,
    attachment: CaseActivityAttachment,
  ) => {
    await openAttachment({
      id: attachment.id,
      url: attachment.url,
      activityId: activity.id,
      index: attachment.index,
    });
  };

  /** Portal CaseDetail comment bar — NOTE + optional file. */
  const onSubmitComment = async () => {
    if (!issueId || submittingComment) return;
    if (isClosed) {
      Alert.alert('Case closed', 'Cannot add a comment to a closed case.');
      return;
    }
    const trimmed = commentBody.trim();
    if (!trimmed && !commentFile) {
      Alert.alert('Validation', 'Please enter a comment or attach a file.');
      return;
    }

    setSubmittingComment(true);
    try {
      const result = await addCaseNote(issueId, trimmed, commentFile);
      setCommentBody('');
      setCommentFile(null);
      await load(true);
      if (result.failedUploads?.length) {
        Alert.alert(
          'Partial success',
          `Comment saved, but attachment failed:\n${result.failedUploads.join(
            '\n',
          )}`,
        );
      }
    } catch (err: any) {
      Alert.alert('Comment', err?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header
          title="Case detail"
          role={role}
          branch={branch}
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.centerText}>Loading case…</Text>
        </View>
      </View>
    );
  }

  if (!bundle?.issue) {
    return (
      <View style={styles.screen}>
        <Header
          title="Case detail"
          role={role}
          branch={branch}
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <Text style={styles.centerText}>{error || 'Case not found.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load(false)}
            activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { issue, activities, history, attachments } = bundle;
  const headerTitle =
    issue.internalReferenceNumber !== '—'
      ? issue.internalReferenceNumber
      : 'Case detail';
  const attachmentCount = attachments.length;

  return (
    <View style={styles.screen}>
      <Header
        title={headerTitle}
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
            />
          }>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.category}>
                {(issue.complaintTypeLabel !== '—'
                  ? issue.complaintTypeLabel
                  : issue.issueTypeLabel
                ).toUpperCase()}
              </Text>
              <StatusBadge status={issue.issueStatusUi} />
            </View>
            <Text style={styles.heroTitle}>{issue.caseTitle}</Text>
            <Text style={styles.heroMeta}>
              {issue.internalReferenceNumber} · {issue.complainant} ·{' '}
              {issue.dateReceived}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            {canEdit ? (
              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description of the issue..."
                  placeholderTextColor={Colors.textPlaceholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <Text style={styles.bodyText}>{issue.description}</Text>
            )}
            {canEdit ? (
              <>
                <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>
                  Availability
                </Text>
                <TextField
                  value={availability}
                  onChangeText={setAvailability}
                  placeholder="Availability notes..."
                />
              </>
            ) : issue.availability !== '—' ? (
              <>
                <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>
                  Availability
                </Text>
                <Text style={styles.bodyText}>{issue.availability}</Text>
              </>
            ) : null}
          </View>

          <SectionCard
            title="Details"
            subtitle={
              canEdit
                ? 'Edit priority, source, ownership — then Save'
                : 'Type, priority, source, ownership'
            }
            expanded={detailsOpen}
            onToggle={() => setDetailsOpen(v => !v)}>
            <FieldRow label="Issue type" value={issue.issueTypeLabel} />
            {canEdit && issue.issueType === 'COMPLAINT' ? (
              <View style={styles.editField}>
                <FieldLabel label="Complaint type" />
                <SelectField
                  value={complaintType}
                  placeholder="Select complaint type"
                  options={complaintTypeOptions}
                  onSelect={setComplaintType}
                />
              </View>
            ) : (
              <FieldRow
                label="Complaint type"
                value={issue.complaintTypeLabel}
              />
            )}
            <FieldRow
              label="Status"
              value={formatIssueEnumLabel(issue.issueStatus)}
            />
            {canEdit ? (
              <View style={styles.editField}>
                <FieldLabel label="Priority" />
                <SelectField
                  value={priority}
                  placeholder="Select priority"
                  options={priorityOptions}
                  onSelect={setPriority}
                />
              </View>
            ) : (
              <FieldRow label="Priority" value={issue.priorityLabel} />
            )}
            {canEdit ? (
              <View style={styles.editField}>
                <DatePicker
                  label="Date received"
                  value={dateReceived}
                  onChange={e => setDateReceived(e.target.value)}
                  disableAgeValidation
                />
              </View>
            ) : (
              <FieldRow label="Date received" value={issue.dateReceived} />
            )}
            {canEdit ? (
              <View style={styles.editField}>
                <FieldLabel label="Origin" />
                <SelectField
                  value={origin}
                  placeholder="Select origin"
                  options={originOptions}
                  onSelect={setOrigin}
                />
              </View>
            ) : (
              <FieldRow label="Origin" value={issue.origin} />
            )}
            {canEdit ? (
              <View style={styles.editField}>
                <FieldLabel label="Issue source" />
                <SelectField
                  value={issueSource}
                  placeholder="Select source"
                  options={issueSourceOptions}
                  onSelect={setIssueSource}
                />
              </View>
            ) : (
              <FieldRow label="Issue source" value={issue.issueSource} />
            )}
            {canEdit && issueSource === 'OTHR-IS' ? (
              <View style={styles.editField}>
                <FieldLabel label="Issue source (other)" />
                <TextField
                  value={issueSourceOther}
                  onChangeText={setIssueSourceOther}
                  placeholder="Specify other source"
                />
              </View>
            ) : null}
            {canEdit && isMosp ? (
              <View style={styles.editField}>
                <FieldLabel label="Service provider" required />
                <TextField
                  value={serviceProvider}
                  onChangeText={setServiceProvider}
                  placeholder="Enter service provider"
                />
              </View>
            ) : issue.serviceProvider !== '—' ? (
              <FieldRow
                label="Service provider"
                value={displayOrDash(issue.serviceProvider)}
              />
            ) : null}
            <FieldRow label="Complainant" value={issue.complainant} />
            <FieldRow label="Owner team" value={issue.ownerTeam} />
            <View style={styles.ownerBlock}>
              <FieldLabel label="Owner (User Id)" />
              {canEdit ? (
                loadingOwners ? (
                  <View style={styles.ownerLoading}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text style={styles.ownerLoadingText}>Loading owners…</Text>
                  </View>
                ) : (
                  <SelectField
                    value={ownerUserId}
                    placeholder="Select owner"
                    options={ownerOptions}
                    onSelect={setOwnerUserId}
                  />
                )
              ) : (
                <Text style={styles.fieldValue}>
                  {displayOrDash(issue.ownerUserId)}
                </Text>
              )}
            </View>
            <FieldRow label="Created" value={issue.createdOn} />
            <FieldRow label="Last updated" value={issue.updatedAt} last />
            {canEdit ? (
              <TouchableOpacity
                style={[
                  styles.saveChangesBtn,
                  saving && styles.saveChangesBtnDisabled,
                ]}
                onPress={onSaveChanges}
                disabled={saving}
                activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.saveChangesText}>Save changes</Text>
                )}
              </TouchableOpacity>
            ) : isClosed ? (
              <Text style={styles.ownerClosedHint}>
                Closed cases cannot be edited.
              </Text>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Attachments"
            badge={attachmentCount > 0 ? String(attachmentCount) : null}
            subtitle={
              attachmentCount > 0
                ? `${attachmentCount} file${attachmentCount === 1 ? '' : 's'}`
                : 'No files attached'
            }
            expanded={attachmentsOpen}
            onToggle={() => setAttachmentsOpen(v => !v)}>
            <View style={styles.attachmentGrid}>
              {attachments.map((file: CaseAttachmentItem) => (
                <AttachmentItem
                  key={file.id}
                  name={file.name}
                  createdAt={file.createdAt}
                  busy={openingAttachmentId === file.id}
                  onView={() => openAttachment(file)}
                  onDownload={() => openAttachment(file)}
                />
              ))}
              <UploadNewItem
                uploading={uploadingAttachment}
                disabled={isClosed || uploadingAttachment}
                onPress={onUploadPress}
              />
            </View>
          </SectionCard>

          <SectionCard
            title="Activity"
            subtitle={`${activities.length} update${
              activities.length === 1 ? '' : 's'
            }`}
            expanded={activityOpen}
            onToggle={() => setActivityOpen(v => !v)}>
            {activities.length === 0 ? (
              <Text style={styles.emptyInline}>No activity yet.</Text>
            ) : (
              activities.map((a: CaseActivityItem) => (
                <View key={a.id} style={styles.activityCard}>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityDate}>
                      {a.createdAt || 'Date unavailable'}
                    </Text>
                    <Text style={styles.activityType}>
                      {formatIssueEnumLabel(a.activityType)}
                    </Text>
                  </View>
                  {a.body && a.body !== '—' ? (
                    <Text style={styles.bodyText}>{stripHtml(a.body)}</Text>
                  ) : null}
                  <Text style={styles.activityBy}>
                    {a.createdBy || '—'}
                  </Text>
                  {a.attachments?.length ? (
                    <View style={styles.attachmentGrid}>
                      {a.attachments.map(att => (
                        <AttachmentItem
                          key={`${a.id}-${att.index}`}
                          name={att.name}
                          createdAt={att.createdAt}
                          busy={openingAttachmentId === att.id}
                          onView={() => openActivityAttachment(a, att)}
                          onDownload={() => openActivityAttachment(a, att)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </SectionCard>

          <SectionCard
            title="History"
            subtitle={`${history.length} event${
              history.length === 1 ? '' : 's'
            }`}
            expanded={historyOpen}
            onToggle={() => setHistoryOpen(v => !v)}>
            {history.length === 0 ? (
              <Text style={styles.emptyInline}>No history yet.</Text>
            ) : (
              history.map((h: CaseHistoryItem) => {
                const actionColor = getHistoryActionColor(h.action);
                return (
                  <View key={h.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historySummary}>{h.summary}</Text>
                      {h.action ? (
                        <View
                          style={[
                            styles.historyActionBadge,
                            { backgroundColor: `${actionColor}18` },
                          ]}>
                          <Text
                            style={[
                              styles.historyActionText,
                              { color: actionColor },
                            ]}>
                            {String(h.action).toLowerCase()}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.historyMeta}>
                      {h.actor || 'Unknown actor'}
                      {' · '}
                      {h.createdAt || 'Date unavailable'}
                    </Text>
                    {h.entityType ? (
                      <Text style={styles.historyEntity}>
                        {String(h.entityType).toLowerCase()}
                      </Text>
                    ) : null}
                    {h.changedFields?.length
                      ? h.changedFields.map((field, index) => {
                          const label =
                            field?.field ||
                            field?.name ||
                            field?.key ||
                            `Field ${index + 1}`;
                          const from = field?.from ?? field?.oldValue ?? '—';
                          const to = field?.to ?? field?.newValue ?? '—';
                          return (
                            <Text
                              key={`${h.id}-field-${index}`}
                              style={styles.historyField}>
                              {label}: {String(from)} → {String(to)}
                            </Text>
                          );
                        })
                      : null}
                  </View>
                );
              })
            )}
          </SectionCard>
        </ScrollView>

        {/* Portal CaseDetail comment bar */}
        <View
          style={[
            styles.commentBar,
            {
              marginBottom: keyboardHeight,
              paddingBottom:
                keyboardHeight > 0 ? 10 : Math.max(insets.bottom, 10),
            },
          ]}>
          {commentFile ? (
            <View style={styles.fileChip}>
              <Text style={styles.fileChipText} numberOfLines={1}>
                {commentFile.name}
              </Text>
              <TouchableOpacity
                onPress={() => setCommentFile(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={Colors.textPrimary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          ) : null}

          {isClosed ? (
            <Text style={styles.resolvedHint}>
              Case is closed — comments are disabled.
            </Text>
          ) : null}

          <View style={styles.commentInputRow}>
            <TouchableOpacity
              style={styles.attachIconBtn}
              onPress={onCommentAttachPress}
              disabled={isClosed || submittingComment}
              accessibilityLabel="Attach file">
              <Paperclip
                size={22}
                color={Colors.textMuted}
                strokeWidth={2.1}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.commentInput}
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textMuted}
              multiline
              editable={!isClosed && !submittingComment}
            />
            <TouchableOpacity
              style={[
                styles.sendIconBtn,
                submittingComment && styles.sendIconBtnDisabled,
              ]}
              onPress={onSubmitComment}
              disabled={submittingComment || isClosed}
              accessibilityLabel="Send comment">
              {submittingComment ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={16} color={Colors.white} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  centerText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  category: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  heroMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardLabelSpaced: {
    marginTop: 14,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
  textAreaWrap: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
  },
  textArea: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
    minHeight: 80,
    padding: 0,
  },
  editField: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: 6,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderText: { flex: 1, paddingRight: 8 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  fieldRowLast: { borderBottomWidth: 0 },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
  },
  ownerBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  ownerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  ownerLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  saveChangesBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveChangesBtnDisabled: {
    opacity: 0.55,
  },
  saveChangesText: {
    color: Colors.surface,
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  ownerClosedHint: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  emptyInline: {
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    // 8px between columns → 3 equal cards fill the row
    columnGap: 8,
    rowGap: 10,
    paddingVertical: 2,
  },
  attachmentCard: {
    // (100% - 2×8px gaps) / 3 ≈ 31.5% — three files per row
    width: '31.5%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  attachmentPreview: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  attachmentCardName: {
    width: '100%',
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 12,
  },
  attachmentCardDate: {
    marginTop: 2,
    fontSize: 8,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  attachmentCardActions: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadNewCard: {
    width: '31.5%',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  uploadNewPreview: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentInk,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadNewLabel: {
    width: '100%',
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.accentInk,
    textAlign: 'center',
    lineHeight: 12,
  },
  activityCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  activityDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  activityType: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  activityBy: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  historyCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  historySummary: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  historyActionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyActionText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textTransform: 'capitalize',
  },
  historyMeta: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  historyEntity: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  historyField: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  commentBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  resolvedHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconBtnDisabled: {
    opacity: 0.6,
  },
  fileChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '100%',
    gap: 6,
  },
  fileChipText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    maxWidth: 200,
  },
});

export default CaseDetailScreen;
