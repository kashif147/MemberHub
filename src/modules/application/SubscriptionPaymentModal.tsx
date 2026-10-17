import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../../theme/colors';
import { createPaymentIntentRequest } from '../../api/payment.api';
import { fetchCategoryByTypeId } from '../../api/category.api';
import { MEMBERSHIP_CATEGORY_TYPE_ID } from '../../constants/config';
import {
  extractClientSecretFromResponse,
  resolvePaymentIntentOutcome,
} from '../../helpers/paymentIntent.helper';
import {
  findCategoryProductByName,
  resolveMemberEmailFromPersonal,
} from '../../helpers/subscriptionPayment.helper';
import type { RootState } from '../../store';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (paymentData: Record<string, any>) => void;
  onFailure?: (message: string) => void;
  formData: {
    personalInfo?: Record<string, any>;
    subscriptionDetails?: Record<string, any>;
  };
  membershipCategory?: string;
  applicationId?: string | null;
};

/**
 * Portal_App SubscriptionPaymentModal — PaymentIntent + CardField (no useCheckout).
 */
const SubscriptionPaymentModal = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  formData,
  membershipCategory,
  applicationId,
}: Props) => {
  const { confirmPayment } = useStripe();
  const user = useSelector((s: RootState) => s.auth.user);
  const userInfo = useSelector((s: RootState) => s.auth.userDetail);

  const [isLoading, setIsLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const [categoryData, setCategoryData] = useState<any>(null);

  const priceInfo = useMemo(() => {
    const cents = categoryData?.currentPricing?.price;
    if (typeof cents === 'number' && !Number.isNaN(cents)) {
      const full = cents / 100;
      const monthly = full / 4;
      return { full, monthly };
    }
    return { full: 0, monthly: 0 };
  }, [categoryData]);

  const formatCurrency = (value: number) => {
    const currency = (
      categoryData?.currentPricing?.currency || 'EUR'
    ).toUpperCase();
    try {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency,
      }).format(value || 0);
    } catch {
      return `€${(value || 0).toFixed(2)}`;
    }
  };

  const paymentType = formData?.subscriptionDetails?.paymentType;
  const isCardPayment =
    paymentType === 'Card Payment' || paymentType === 'Credit Card';

  const resolvePrefill = () => {
    const personal = formData?.personalInfo || {};
    const userName =
      user?.name ||
      (personal.forename && personal.surname
        ? `${personal.forename} ${personal.surname}`
        : '');
    const userEmail =
      resolveMemberEmailFromPersonal(personal) || user?.email || '';
    return { userName, userEmail };
  };

  useEffect(() => {
    if (visible) {
      const { userName, userEmail } = resolvePrefill();
      setCardholderName(userName);
      setEmail(userEmail);
    } else {
      setClientSecret(null);
      setCardComplete(false);
      setIsLoading(false);
      setError(null);
      setRetryKey(0);
      setCategoryData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, formData]);

  // Load category product (Portal getCategoryData)
  useEffect(() => {
    const loadCategory = async () => {
      if (!visible || !membershipCategory) return;
      setProductLoading(true);
      setError(null);
      try {
        const res = await fetchCategoryByTypeId(MEMBERSHIP_CATEGORY_TYPE_ID);
        if (!(res?.status >= 200 && res?.status < 300)) {
          throw new Error('Unable to load membership category pricing');
        }
        const products =
          res?.data?.data?.products ||
          res?.data?.products ||
          res?.data?.data ||
          [];
        const list = Array.isArray(products) ? products : [];
        const product = findCategoryProductByName(list, membershipCategory);
        if (!product) {
          throw new Error('Membership category pricing not found');
        }
        setCategoryData(product);
      } catch (e: any) {
        setCategoryData(null);
        setError(e?.message || 'Unable to load payment details');
      } finally {
        setProductLoading(false);
      }
    };
    loadCategory();
  }, [visible, membershipCategory, retryKey]);

  // Create PaymentIntent (Portal — no useCheckout)
  useEffect(() => {
    const initPayment = async () => {
      if (!visible || !applicationId || !membershipCategory || !categoryData) {
        return;
      }

      setClientSecret(null);
      setError(null);
      setProductLoading(true);

      try {
        const currentPricing = categoryData?.currentPricing || {};
        const basePrice = currentPricing?.price;
        const currency = currentPricing?.currency || 'eur';
        if (!basePrice) throw new Error('Invalid category price data');

        const pt = formData?.subscriptionDetails?.paymentType;
        const isRetiredAssociate = categoryData?.name === 'Retired Associate';
        const amountInCents = isRetiredAssociate
          ? basePrice
          : pt === 'Credit Card'
            ? basePrice
            : Math.round(basePrice / 4);

        const paymentData = {
          purpose: 'subscriptionFee',
          amount: amountInCents,
          currency,
          metadata: {
            applicationId,
            description:
              pt === 'Credit Card'
                ? 'Annual membership fees'
                : 'Quarterly membership fees',
            tenantId: (userInfo as any)?.tenantId,
            // userId: (userInfo as any)?.id || user?.id,
            membershipCategory,
            paymentType: pt,
          },
        };

        const res = await createPaymentIntentRequest(paymentData);
        if (!(res?.status >= 200 && res?.status < 300)) {
          throw new Error('Unable to create payment intent');
        }
        const secret = extractClientSecretFromResponse(res);
        if (!secret) {
          throw new Error('Missing client secret from response');
        }
        setClientSecret(secret);
        setError(null);
      } catch (e: any) {
        const errorMessage = e?.message || 'Payment initialization failed';
        setClientSecret(null);
        setError(errorMessage);
        // Keep modal open for Retry (do not call onFailure here)
      } finally {
        setProductLoading(false);
      }
    };

    initPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visible,
    membershipCategory,
    applicationId,
    categoryData,
    formData?.subscriptionDetails?.paymentType,
    retryKey,
  ]);

  const getDisplayPrice = () =>
    isCardPayment ? priceInfo.full : priceInfo.monthly;

  const handlePayNow = async () => {
    // Portal: validate inside handler so user always gets feedback (never silent no-op)
    if (!String(cardholderName || '').trim() || !String(email || '').trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    if (!clientSecret) {
      Alert.alert(
        'Error',
        'Payment not initialized. Please close and reopen the payment form.',
      );
      return;
    }
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete all card details');
      return;
    }
    if (typeof confirmPayment !== 'function') {
      Alert.alert(
        'Error',
        'Stripe is not ready. Please restart the app and try again.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: String(cardholderName).trim(),
            email: String(email).trim(),
          },
        },
      });

      const stripeError = result?.error;
      const paymentIntent = result?.paymentIntent;

      if (stripeError) {
        const code = String(stripeError.code || '');
        let errorMessage = stripeError.message || 'Payment failed';
        if (code === 'payment_intent_unexpected_state') {
          errorMessage =
            'This payment session is no longer valid. Please close the form and start a new application payment.';
        } else if (stripeError.message?.includes('No such payment_intent')) {
          errorMessage =
            'Payment session expired. Please close and reopen the payment form.';
        }
        throw new Error(errorMessage);
      }

      const intentStatus = paymentIntent?.status;
      if (!intentStatus) {
        throw new Error(
          'Payment response was incomplete. Please try again or contact support.',
        );
      }

      const outcome = resolvePaymentIntentOutcome(intentStatus, {
        isApplicationPayment: true,
      });

      if (outcome.success) {
        // Portal: hand off to parent (closes modal + shows authorised message)
        onSuccess?.({
          paymentMethod: 'card',
          total: getDisplayPrice(),
          paymentDetails: {
            name: String(cardholderName).trim(),
            email: String(email).trim(),
          },
          paymentIntent,
          paymentOutcome: outcome,
        });
        return;
      }

      throw new Error(outcome.message);
    } catch (err: any) {
      const message = err?.message || 'Payment failed. Please try again.';
      // Keep modal open so the BO can fix card details and retry (Portal alerts here too)
      Alert.alert('Payment Failed', message);
      onFailure?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            <View style={styles.container}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Membership Subscription</Text>
                  <Text style={styles.caption}>
                    Review your membership and complete payment
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {productLoading || (!categoryData && !error) ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textPrimary, marginTop: 12 }}>
                    Loading payment details...
                  </Text>
                </View>
              ) : error ? (
                <View
                  style={{
                    paddingVertical: 40,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                  }}>
                  <Text style={styles.errorTitle}>
                    Payment Initialization Failed
                  </Text>
                  <Text style={styles.errorBody}>{error}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      setError(null);
                      setRetryKey(prev => prev + 1);
                    }}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
                    <Text style={{ color: Colors.primary, fontWeight: '500' }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.categoryCard}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.smallLabel}>MEMBERSHIP CATEGORY</Text>
                      <Text style={styles.categoryText}>
                        {categoryData?.name || membershipCategory}
                      </Text>
                      {categoryData?.description ? (
                        <Text style={styles.categoryDescription}>
                          {categoryData.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.smallLabel}>PRICE</Text>
                      <Text style={styles.priceText}>
                        {formatCurrency(getDisplayPrice())}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.requiredLabel}>Name on Card *</Text>
                    <TextInput
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      placeholder="Full name"
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.input}
                    />
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.requiredLabel}>Email *</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const { userName, userEmail } = resolvePrefill();
                      setCardholderName(userName);
                      setEmail(userEmail);
                    }}
                    style={styles.autofillLink}>
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      ✓ Auto-fill from profile
                    </Text>
                  </TouchableOpacity>

                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.requiredLabel}>Card Details *</Text>
                    <View style={styles.cardFieldWrapper}>
                      <CardField
                        postalCodeEnabled={false}
                        placeholders={{
                          number: '4242 4242 4242 4242',
                          cvc: 'CVC',
                          expiration: 'MM/YY',
                        }}
                        cardStyle={{
                          backgroundColor: '#00000000',
                          textColor: Colors.textPrimary,
                          placeholderColor: Colors.textSecondary,
                          borderWidth: 0,
                          borderColor: '#00000000',
                          borderRadius: 12,
                          fontSize: 15,
                        }}
                        style={{ width: '100%', height: 52 }}
                        onCardChange={details => {
                          setCardComplete(Boolean(details?.complete));
                        }}
                      />
                    </View>
                    {!cardComplete ? (
                      <Text style={styles.cardHint}>
                        Enter a valid card number, expiry and CVC to enable
                        payment.
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.totalBlock}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(getDisplayPrice())}
                      </Text>
                    </View>
                    <Text style={styles.billingHint}>
                      {isCardPayment
                        ? 'Billed once via card'
                        : 'Billed per quarter via payroll deduction'}
                    </Text>

                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={onClose}
                        activeOpacity={0.8}
                        disabled={isLoading}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          styles.payBtn,
                          isLoading && { opacity: 0.7 },
                        ]}
                        onPress={handlePayNow}
                        disabled={isLoading}
                        activeOpacity={0.85}>
                        {isLoading ? (
                          <ActivityIndicator color={Colors.white} />
                        ) : (
                          <Text style={styles.payBtnText}>Pay Now</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingOverlayText}>Processing payment…</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  caption: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  smallLabel: {
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  requiredLabel: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  categoryCard: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryText: {
    fontWeight: '700',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  categoryDescription: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  priceText: {
    fontWeight: '800',
    fontSize: 20,
    color: Colors.primary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  autofillLink: { marginTop: 10, alignSelf: 'flex-start' },
  cardFieldWrapper: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  cardHint: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(248, 249, 251, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalBlock: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  billingHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payBtn: {
    marginLeft: 8,
    backgroundColor: Colors.primary,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  retryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SubscriptionPaymentModal;
