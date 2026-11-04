import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, FontFamily, Radii } from '../../theme';
import { resolveMemberEmailFromPersonal } from '../../helpers/subscriptionPayment.helper';
import {
  fetchApplicationPayment,
  isActivePaymentLink,
  isAuthorisedOrLater,
  paymentStatusLabel,
  requestApplicationPaymentLink,
  waitForPaymentLinkIssued,
  type ApplicationPaymentView,
} from '../../services/applicationPaymentLink.services';

type Props = {
  visible: boolean;
  applicationId: string | null;
  personalInfo?: Record<string, any>;
  /** Credit Card applications can still collect card on-device. */
  allowCardCheckout?: boolean;
  onClose: () => void;
  onDone: (payment?: ApplicationPaymentView) => void;
  onCollectCard?: () => void;
};

/**
 * MemberHub deferred payment — ISSUE / RESEND / REPLACE via
 * POST /applications/:id/payment-link (x-client-channel: MEMBERSHUB).
 */
const PaymentLinkModal = ({
  visible,
  applicationId,
  personalInfo,
  allowCardCheckout = false,
  onClose,
  onDone,
  onCollectCard,
}: Props) => {
  const [payment, setPayment] = useState<ApplicationPaymentView | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberEmail = resolveMemberEmailFromPersonal(personalInfo || {});
  const status = String(payment?.status || 'NONE').toUpperCase();
  const active = isActivePaymentLink(status);
  const authorised = isAuthorisedOrLater(status);

  const refresh = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const view = await fetchApplicationPayment(applicationId);
      setPayment(view);
    } catch (e: any) {
      setError(e?.message || 'Could not load payment status');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (visible && applicationId) {
      refresh();
    } else if (!visible) {
      setPayment(null);
      setError(null);
      setBusy(false);
    }
  }, [visible, applicationId, refresh]);

  const runAction = async (action: 'ISSUE' | 'RESEND' | 'REPLACE') => {
    if (!applicationId || busy) return;
    if (!memberEmail && action !== 'ISSUE') {
      Alert.alert(
        'Payment link',
        'This application has no email address. Update personal details before resending.',
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestApplicationPaymentLink(applicationId, action);
      const view = await waitForPaymentLinkIssued(applicationId);
      setPayment(view);
      if (String(view.status).toUpperCase() === 'LINK_ISSUED') {
        Alert.alert(
          'Payment link',
          action === 'RESEND'
            ? `Payment link resent to ${memberEmail || 'the member'}.`
            : `Payment link sent${memberEmail ? ` to ${memberEmail}` : ''}.`,
        );
      } else if (String(view.status).toUpperCase() === 'LINK_REQUESTED') {
        Alert.alert(
          'Payment link',
          'Link requested. It will be emailed once the payment service issues it.',
        );
      }
    } catch (e: any) {
      const msg = e?.message || `Could not ${action.toLowerCase()} payment link`;
      setError(msg);
      Alert.alert('Payment link', msg);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const onSend = () => {
    if (active) {
      Alert.alert(
        'Payment link already active',
        'Resend the current link, or replace it with a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resend', onPress: () => runAction('RESEND') },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => runAction('REPLACE'),
          },
        ],
      );
      return;
    }
    runAction('ISSUE');
  };

  const formatAmount = () => {
    if (payment?.amount == null) return null;
    const currency = String(payment.currency || 'EUR').toUpperCase();
    const value = Number(payment.amount) / 100;
    try {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency,
      }).format(value);
    } catch {
      return `€${value.toFixed(2)}`;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Payment link</Text>
              <Text style={styles.caption}>
                Email a secure checkout link to the member (MembersHub).
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Member email</Text>
            <Text style={styles.value}>
              {memberEmail || 'No email on application'}
            </Text>
            <Text style={[styles.label, styles.labelSpaced]}>Status</Text>
            {loading && !payment ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.statusText}>
                {paymentStatusLabel(status)}
                {payment?.linkVersion
                  ? ` · v${payment.linkVersion}`
                  : ''}
              </Text>
            )}
            {formatAmount() ? (
              <>
                <Text style={[styles.label, styles.labelSpaced]}>Amount</Text>
                <Text style={styles.value}>
                  {formatAmount()}
                  {payment?.paymentOption
                    ? ` · ${payment.paymentOption === 'FULL' ? 'Full year' : 'First instalment'}`
                    : ''}
                </Text>
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={onSend}
            disabled={busy || authorised}
            activeOpacity={0.85}>
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {authorised
                  ? 'Payment already authorised'
                  : active
                    ? 'Resend or replace link'
                    : 'Send payment link'}
              </Text>
            )}
          </TouchableOpacity>

          {active ? (
            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.secondaryBtn, busy && styles.btnDisabled]}
                onPress={() => runAction('RESEND')}
                disabled={busy}
                activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Resend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, busy && styles.btnDisabled]}
                onPress={() =>
                  Alert.alert(
                    'Replace payment link?',
                    'This voids the current link and issues a new one.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Replace',
                        style: 'destructive',
                        onPress: () => runAction('REPLACE'),
                      },
                    ],
                  )
                }
                disabled={busy}
                activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Replace</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refresh}
            disabled={loading || busy}
            activeOpacity={0.8}>
            <Text style={styles.refreshText}>
              {loading ? 'Refreshing…' : 'Refresh status'}
            </Text>
          </TouchableOpacity>

          {allowCardCheckout && onCollectCard && !authorised ? (
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={onCollectCard}
              activeOpacity={0.8}
              disabled={busy}>
              <Text style={styles.linkBtnText}>Collect card payment now</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => onDone(payment || undefined)}
            activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>
              {authorised || active ? 'Done' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 4,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSpaced: { marginTop: 12 },
  value: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  statusText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.primary,
  },
  error: {
    marginTop: 10,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.danger,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  rowBtns: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  refreshBtn: { alignItems: 'center', paddingVertical: 8 },
  refreshText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  doneBtn: {
    marginTop: 4,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  doneBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  btnDisabled: { opacity: 0.55 },
});

export default PaymentLinkModal;
