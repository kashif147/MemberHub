import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, Paperclip, Plus } from 'lucide-react-native';
import { Header } from '../../components/Header';
import {
  loadCaseDetail,
  uploadCaseAttachments,
  type CaseActivityItem,
  type CaseAttachmentItem,
  type CaseDetailBundle,
  type CaseHistoryItem,
} from '../../services/issues.services';
import {
  pickCaseAttachmentsFromSource,
  type AttachSource,
} from '../../helpers/documentPicker.helper';
import { chooseAttachSource } from '../../helpers/attachSource.helper';
import { displayValue, formatIssueEnumLabel } from '../../helpers/cases.helper';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import type { CaseStatus } from '../../data/mockCases';
import type { RootState } from '../../store';

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
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
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
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {expanded ? (
        <ChevronUp size={18} color={Colors.textMuted} strokeWidth={2.2} />
      ) : (
        <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2.2} />
      )}
    </TouchableOpacity>
    {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
  </View>
);

const CaseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, typeof STACKS.CASE_DETAIL>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const issueId = route.params?.issueId;

  const [bundle, setBundle] = useState<CaseDetailBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const isClosed = bundle?.issue?.issueStatusUi === 'Closed';

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

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  /** Same as Portal_App CaseDetail upload — ActionSheet, not RN Modal. */
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

  const onUploadPress = () => chooseAttachSource(onAttachSource);

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

  return (
    <View style={styles.screen}>
      <Header
        title={headerTitle}
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.bodyText}>{issue.description}</Text>
        </View>

        <SectionCard
          title="Details"
          subtitle="Type, priority, source, ownership"
          expanded={detailsOpen}
          onToggle={() => setDetailsOpen(v => !v)}>
          <FieldRow label="Issue type" value={issue.issueTypeLabel} />
          <FieldRow label="Complaint type" value={issue.complaintTypeLabel} />
          <FieldRow label="Status" value={formatIssueEnumLabel(issue.issueStatus)} />
          <FieldRow label="Priority" value={issue.priorityLabel} />
          <FieldRow label="Date received" value={issue.dateReceived} />
          <FieldRow label="Origin" value={issue.origin} />
          <FieldRow label="Issue source" value={issue.issueSource} />
          <FieldRow label="Complainant" value={issue.complainant} />
          <FieldRow label="Owner team" value={issue.ownerTeam} />
          <FieldRow label="Created" value={issue.createdOn} />
          <FieldRow label="Last updated" value={issue.updatedAt} last />
        </SectionCard>

        <SectionCard
          title="Attachments"
          subtitle={
            attachments.length
              ? `${attachments.length} file${attachments.length === 1 ? '' : 's'}`
              : 'No files attached'
          }
          expanded={attachmentsOpen}
          onToggle={() => setAttachmentsOpen(v => !v)}>
          {attachments.length === 0 ? (
            <Text style={styles.emptyInline}>No attachments.</Text>
          ) : (
            attachments.map((file: CaseAttachmentItem) => (
              <View key={file.id} style={styles.attachmentRow}>
                <Paperclip size={16} color={Colors.primary} strokeWidth={2} />
                <View style={styles.attachmentText}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.attachmentMeta}>{file.createdAt}</Text>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={[
              styles.uploadZone,
              (isClosed || uploadingAttachment) && styles.uploadZoneDisabled,
            ]}
            onPress={onUploadPress}
            disabled={isClosed || uploadingAttachment}
            activeOpacity={0.75}>
            {uploadingAttachment ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Paperclip size={22} color={Colors.primary} strokeWidth={2} />
            )}
            <Text style={styles.uploadTitle}>
              {uploadingAttachment ? 'Uploading…' : 'Upload files'}
            </Text>
            <Text style={styles.uploadHint}>PDF, PNG, JPEG or DOCX</Text>
          </TouchableOpacity>
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
              <View key={a.id} style={styles.timelineCard}>
                <Text style={styles.timelineType}>
                  {formatIssueEnumLabel(a.activityType)}
                </Text>
                <Text style={styles.timelineBody}>{a.body}</Text>
                <Text style={styles.timelineMeta}>
                  {a.createdBy} · {a.createdAt}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="History"
          subtitle={`${history.length} event${history.length === 1 ? '' : 's'}`}
          expanded={historyOpen}
          onToggle={() => setHistoryOpen(v => !v)}>
          {history.length === 0 ? (
            <Text style={styles.emptyInline}>No history yet.</Text>
          ) : (
            history.map((h: CaseHistoryItem) => (
              <View key={h.id} style={styles.timelineCard}>
                <Text style={styles.timelineBody}>{h.summary}</Text>
                <Text style={styles.timelineMeta}>
                  {h.actor} · {h.createdAt}
                </Text>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>

      {!isClosed ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={onUploadPress}
          disabled={uploadingAttachment}
          activeOpacity={0.85}
          accessibilityLabel="Upload attachment">
          {uploadingAttachment ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Plus size={26} color={Colors.white} strokeWidth={2.4} />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 88, paddingTop: 4 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  centerText: {
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
  retryText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  heroMeta: { fontSize: 12, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
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
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  emptyInline: {
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  attachmentText: { flex: 1 },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  attachmentMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  uploadZone: {
    marginTop: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  uploadZoneDisabled: {
    opacity: 0.55,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineCard: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  timelineType: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  timelineBody: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  timelineMeta: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default CaseDetailScreen;
