import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  FieldLabel,
  FormCard,
  RadioRow,
  SelectField,
  TextField,
} from './formFields';
import { Colors } from '../../theme/colors';
import { useLookup } from '../../contexts/lookupContext';
import { calculateAgeFromDateOfBirth } from '../../helpers/date.helper';
import {
  getDefaultFrequencyForPaymentType,
  getFrequencyOptionsForPaymentType,
  isSalaryDeductionPaymentType,
  workLocationAllowsSalaryDeduction,
} from '../../helpers/subscriptionPricing.helper';

/** Portal / CRM membership org label in consent copy */
const ORG_NAME = 'INMO';

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => {});
};

const ConsentBox = ({
  checked,
  onToggle,
  title,
  note,
  important,
  error,
}: {
  checked: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  note?: React.ReactNode;
  important?: React.ReactNode;
  error?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.consentBox, error && styles.consentBoxError]}
    onPress={onToggle}
    activeOpacity={0.75}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}>
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
      {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
    </View>
    <View style={styles.consentTextCol}>
      <Text style={styles.consentTitle}>{title}</Text>
      {note ? <Text style={styles.consentNote}>{note}</Text> : null}
      {important ? <Text style={styles.consentImportant}>{important}</Text> : null}
    </View>
  </TouchableOpacity>
);

const MEMBER_STATUSES = [
  { label: 'New member', value: 'new' },
  { label: 'Newly graduated', value: 'graduate' },
  { label: 'Rejoining (Previous Member)', value: 'rejoin' },
  { label: 'Returning from career break', value: 'careerBreak' },
  { label: 'Returning from nursing abroad', value: 'nursingAbroad' },
];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
  dateOfBirth?: string;
  workLocation?: string;
};

const SubscriptionDetails = ({
  formData,
  onFormDataChange,
  showValidation,
  dateOfBirth,
  workLocation,
}: Props) => {
  const {
    paymentTypeOptions,
    youthForumOptions,
    primarySectionOptions,
    secondarySectionOptions,
    workLocationLookups,
  } = useLookup();

  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

  const memberAge = calculateAgeFromDateOfBirth(dateOfBirth);
  const showYouthForum = memberAge == null || memberAge < 35;

  const allowSalaryDeduction = workLocationAllowsSalaryDeduction(
    workLocation,
    workLocationLookups,
  );

  const paymentTypes = useMemo(() => {
    const base = paymentTypeOptions.length
      ? paymentTypeOptions
      : [
          'Credit Card',
          'Payroll Deduction',
          'Deduction at Source',
          'Direct Debit',
        ].map(v => ({ label: v, value: v }));

    if (allowSalaryDeduction) return base;
    return base.filter(o => !isSalaryDeductionPaymentType(o.label || o.value));
  }, [paymentTypeOptions, allowSalaryDeduction]);

  // Clear invalid salary deduction payment when work location disallows it
  useEffect(() => {
    if (!formData?.paymentType) return;
    if (
      !allowSalaryDeduction &&
      isSalaryDeductionPaymentType(formData.paymentType)
    ) {
      onFormDataChange({
        ...formData,
        paymentType: '',
        payrollNo: '',
        paymentFrequency: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSalaryDeduction, workLocation]);

  const frequencyOptions = useMemo(
    () => getFrequencyOptionsForPaymentType(formData?.paymentType),
    [formData?.paymentType],
  );

  /** Portal / CRM: payroll required for salary-deduction payment types */
  const requiresPayrollNo = (paymentType?: string) =>
    isSalaryDeductionPaymentType(paymentType);

  const handlePaymentTypeChange = (v: string) => {
    const oldPaymentType = formData?.paymentType;
    const defaultFreq = getDefaultFrequencyForPaymentType(v);
    onFormDataChange({
      ...formData,
      paymentType: v,
      paymentFrequency: defaultFreq || formData?.paymentFrequency || '',
      // Portal: clear payroll only when leaving a salary-deduction type
      payrollNo:
        requiresPayrollNo(oldPaymentType) && !requiresPayrollNo(v)
          ? ''
          : formData?.payrollNo || '',
    });
  };

  const youthForums = useMemo(
    () =>
      youthForumOptions.length
        ? youthForumOptions
        : ['Dublin', 'Cork', 'Galway', 'Other'].map(v => ({
            label: v,
            value: v,
          })),
    [youthForumOptions],
  );

  const primarySections = useMemo(
    () =>
      primarySectionOptions.length
        ? primarySectionOptions
        : ['Emergency', 'ICU', 'Maternity', 'Other'].map(v => ({
            label: v,
            value: v,
          })),
    [primarySectionOptions],
  );

  const secondarySections = useMemo(
    () =>
      secondarySectionOptions.length
        ? [...secondarySectionOptions, { label: 'Other', value: 'other' }]
        : [...primarySections, { label: 'Other', value: 'other' }],
    [secondarySectionOptions, primarySections],
  );

  const payrollRequired = requiresPayrollNo(formData?.paymentType);

  const isRejoin =
    formData?.memberStatus === 'rejoin' ||
    formData?.memberStatus === 'careerBreak';

  const primaryIsOther = String(formData?.primarySection || '')
    .toLowerCase()
    .includes('other');

  const secondaryIsOther =
    formData?.secondarySection === 'other' ||
    String(formData?.secondarySection || '')
      .toLowerCase()
      .includes('other');

  return (
    <View>
      <FormCard title="Your Subscription Fees">
        <Text style={styles.feeNote}>
          Fees follow membership category from professional details. Work
          location: {workLocation || '—'}.
          {!allowSalaryDeduction
            ? ' Salary deduction payment types are unavailable for this location.'
            : ''}
        </Text>
      </FormCard>

      <FormCard title="Payment Information">
        <FieldLabel label="Payment type" required error={err('paymentType')} />
        <SelectField
          value={formData?.paymentType || ''}
          placeholder="Select payment type"
          options={paymentTypes}
          onSelect={handlePaymentTypeChange}
          error={err('paymentType')}
        />

        {frequencyOptions.length > 0 && (
          <>
            <FieldLabel
              label="Payment frequency"
              required
              error={err('paymentFrequency')}
            />
            <SelectField
              value={formData?.paymentFrequency || ''}
              placeholder="Select frequency"
              options={frequencyOptions}
              onSelect={v => set('paymentFrequency', v)}
              error={err('paymentFrequency')}
            />
          </>
        )}

        {/* CRM: show when salary-deduction payment; always editable when shown */}
        {payrollRequired ? (
          <>
            <FieldLabel
              label="Payroll No"
              required
              error={err('payrollNo')}
            />
            <TextField
              value={formData?.payrollNo || ''}
              onChangeText={t => set('payrollNo', t)}
              placeholder="Enter your payroll number"
              editable
              error={err('payrollNo')}
            />
          </>
        ) : null}
      </FormCard>

      <FormCard title="Member Status">
        <FieldLabel
          label="Please select the most appropriate option"
          required
          error={err('memberStatus')}
        />
        <View
          style={
            showValidation && !formData?.memberStatus
              ? styles.errorBox
              : undefined
          }>
          {MEMBER_STATUSES.map(status => {
            const selected = formData?.memberStatus === status.value;
            return (
              <TouchableOpacity
                key={status.value}
                style={styles.statusRow}
                onPress={() =>
                  onFormDataChange({
                    ...formData,
                    memberStatus: status.value,
                    inmoRewards: false,
                    exclusiveDiscountsAndOffers: false,
                    incomeProtectionScheme: false,
                  })
                }
                activeOpacity={0.7}>
                <View
                  style={[styles.radioOuter, selected && styles.radioOuterOn]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.statusLabel}>{status.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isRejoin && (
          <>
            <FieldLabel label="Previous membership number" />
            <TextField
              value={formData?.previousMembershipNumber || ''}
              onChangeText={t => set('previousMembershipNumber', t)}
              placeholder="Optional"
            />
          </>
        )}
      </FormCard>

      {(formData?.memberStatus === 'new' ||
        formData?.memberStatus === 'graduate') && (
        <FormCard title="Additional Memberships">
          <FieldLabel
            label="Are you a member of another Trade Union? If yes, which Union?"
            required
            error={err('otherIrishTradeUnion')}
          />
          <RadioRow
            value={formData?.otherIrishTradeUnion || ''}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onChange={v =>
              onFormDataChange({
                ...formData,
                otherIrishTradeUnion: v,
                otherIrishTradeUnionName:
                  v === 'no' ? '' : formData?.otherIrishTradeUnionName,
              })
            }
            error={err('otherIrishTradeUnion')}
          />
          {formData?.otherIrishTradeUnion === 'yes' && (
            <>
              <FieldLabel
                label="If yes, which Union?"
                required
                error={err('otherIrishTradeUnionName')}
              />
              <TextField
                value={formData?.otherIrishTradeUnionName || ''}
                onChangeText={t => set('otherIrishTradeUnionName', t)}
                error={err('otherIrishTradeUnionName')}
              />
            </>
          )}

          <FieldLabel
            label="Are you or were you a member of another Irish trade Union salary or Income Protection Scheme?"
            required
            error={err('otherScheme')}
          />
          <RadioRow
            value={formData?.otherScheme || ''}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onChange={v =>
              onFormDataChange({
                ...formData,
                otherScheme: v,
                inmoRewards: v === 'yes' ? false : formData?.inmoRewards,
                exclusiveDiscountsAndOffers:
                  v === 'yes' ? false : formData?.exclusiveDiscountsAndOffers,
                incomeProtectionScheme:
                  v === 'yes' ? false : formData?.incomeProtectionScheme,
              })
            }
            error={err('otherScheme')}
          />
        </FormCard>
      )}

      {formData?.memberStatus === 'new' && formData?.otherScheme === 'no' && (
        <FormCard title="Additional Options for New Members">
          <ConsentBox
            checked={Boolean(formData?.inmoRewards)}
            onToggle={() => set('inmoRewards', !formData?.inmoRewards)}
            title={
              <>
                Tick here to join{' '}
                <Text
                  style={styles.link}
                  onPress={() => openUrl('https://cornmarket.ie/rewards')}>
                  Rewards
                </Text>{' '}
                for {ORG_NAME} members
              </>
            }
            note={
              <>
                By ticking here, you confirm that you agree to the Terms &
                Conditions available on{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    openUrl('https://cornmarket.ie/rewards-club-terms')
                  }>
                  Cornmarket.ie/rewards-club-terms
                </Text>{' '}
                and the Data Protection Statement available on{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    openUrl('https://cornmarket.ie/rewards-dps')
                  }>
                  Cornmarket.ie/rewards-dps
                </Text>
                . Cornmarket will contact you about your Rewards Benefits. You
                can opt out at any time.
              </>
            }
          />
        </FormCard>
      )}

      {formData?.memberStatus === 'graduate' &&
        formData?.otherScheme === 'no' && (
          <FormCard title="Additional Options for Newly Graduated Members">
            <ConsentBox
              checked={Boolean(formData?.exclusiveDiscountsAndOffers)}
              onToggle={() =>
                set(
                  'exclusiveDiscountsAndOffers',
                  !formData?.exclusiveDiscountsAndOffers,
                )
              }
              title={`Would you like to hear about exclusive discounts and offers for ${ORG_NAME} members?`}
            />
            <View style={{ height: 12 }} />
            <ConsentBox
              checked={Boolean(formData?.incomeProtectionScheme)}
              onToggle={() =>
                set(
                  'incomeProtectionScheme',
                  !formData?.incomeProtectionScheme,
                )
              }
              title={
                <>
                  I consent to{' '}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      openUrl('https://cornmarket.ie/income-protection')
                    }>
                    {ORG_NAME} Income Protection Scheme
                  </Text>
                  .
                </>
              }
              note={`By selecting 'I consent' below, you are agreeing to the ${ORG_NAME}, sharing your Trade Union membership details with Cornmarket. Cornmarket as Scheme Administrator will process and retain details of your Trade Union membership for the purposes of assessing eligibility and admitting eligible members (automatically) to the Income Protection Scheme (with 9 Months' Free Cover), and for the ongoing administration of the Scheme. Where you have also opted in to receiving marketing communications, Cornmarket will provide you with information on discounts and offers they have for ${ORG_NAME} members. This consent can be withdrawn at any time by emailing Cornmarket at dataprotection@cornmarket.ie. Please note, if you do consent below, your data will be shared with Cornmarket, and you will be assessed for eligibility for automatic Income Protection Scheme membership. If you do not consent, your data will not be shared with Cornmarket for this purpose, you will not be assessed for automatic Scheme membership (including 9 Months' Free Cover) and you will have to contact Cornmarket separately should you wish to apply for Scheme membership. This offer will run on a pilot basis. Terms and conditions apply and are subject to change.`}
              important="Important: If you do not give your consent, your Trade union membership data will not be shared with Cornmarket for this purpose. This means you will not be assessed for Automatic Access to the Scheme."
            />
          </FormCard>
        )}

      {showYouthForum && (
        <FormCard title="Youth Forum">
          <FieldLabel
            label="Would you like to join Youth Forum?"
            required
            error={err('joinYouthForum')}
          />
          <RadioRow
            value={formData?.joinYouthForum || ''}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onChange={v => set('joinYouthForum', v)}
            error={err('joinYouthForum')}
          />
          {formData?.joinYouthForum === 'yes' && (
            <>
              <FieldLabel
                label="Youth Forum"
                required
                error={err('youthForum')}
              />
              <SelectField
                value={formData?.youthForum || ''}
                placeholder="Select Youth Forum"
                options={youthForums}
                onSelect={v => set('youthForum', v)}
                error={err('youthForum')}
              />
            </>
          )}
        </FormCard>
      )}

      <FormCard title="Recruitment Details">
        <FieldLabel label="Recruited by (name)" />
        <TextField
          value={formData?.recuritedBy || ''}
          onChangeText={t => set('recuritedBy', t)}
        />
        <FieldLabel label="Recruited by membership no." />
        <TextField
          value={formData?.recuritedByMembershipNo || ''}
          onChangeText={t => set('recuritedByMembershipNo', t)}
        />
      </FormCard>

      <FormCard title="Section Details">
        <FieldLabel
          label="Primary section"
          required
          error={err('primarySection')}
        />
        <SelectField
          value={formData?.primarySection || ''}
          placeholder="Select primary section"
          options={primarySections}
          onSelect={v => set('primarySection', v)}
          error={err('primarySection')}
        />
        {primaryIsOther && (
          <>
            <FieldLabel
              label="Other primary section"
              required
              error={err('otherPrimarySection')}
            />
            <TextField
              value={formData?.otherPrimarySection || ''}
              onChangeText={t => set('otherPrimarySection', t)}
              error={err('otherPrimarySection')}
            />
          </>
        )}

        <FieldLabel label="Secondary section" />
        <SelectField
          value={formData?.secondarySection || ''}
          placeholder="Select secondary section"
          options={secondarySections}
          onSelect={v =>
            onFormDataChange({
              ...formData,
              secondarySection: v,
              otherSecondarySection:
                v === 'other' || String(v).toLowerCase().includes('other')
                  ? formData?.otherSecondarySection
                  : '',
            })
          }
        />
        {secondaryIsOther && (
          <>
            <FieldLabel label="Other secondary section" />
            <TextField
              value={formData?.otherSecondarySection || ''}
              onChangeText={t => set('otherSecondarySection', t)}
            />
          </>
        )}
      </FormCard>

      <FormCard title="Additional Services & Terms">
        <ConsentBox
          checked={Boolean(formData?.valueAddedServices)}
          onToggle={() =>
            set('valueAddedServices', !formData?.valueAddedServices)
          }
          title="Tick here to allow our partners to contact you about Value added Services by Email and SMS"
        />
        <View style={{ height: 12 }} />
        <ConsentBox
          checked={Boolean(formData?.termsAndConditions)}
          onToggle={() =>
            set('termsAndConditions', !formData?.termsAndConditions)
          }
          error={Boolean(showValidation && !formData?.termsAndConditions)}
          title={
            <>
              I have read and agree to the {ORG_NAME}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  openUrl('https://www.inmo.ie/DataProtection')
                }>
                Data Protection Statement
              </Text>
              , the {ORG_NAME}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  openUrl('https://www.inmo.ie/PrivacyStatement')
                }>
                Privacy Statement
              </Text>{' '}
              and the {ORG_NAME}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  openUrl('https://www.inmo.ie/ConditionsOfMembership')
                }>
                Conditions of Membership
              </Text>
              {showValidation && !formData?.termsAndConditions ? (
                <Text style={styles.requiredInline}> (Required)</Text>
              ) : null}
            </>
          }
        />
      </FormCard>
    </View>
  );
};

const styles = StyleSheet.create({
  feeNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  statusLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { borderColor: Colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  consentBoxError: {
    borderColor: '#C0392B',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  consentTextCol: { flex: 1 },
  consentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  consentNote: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  consentImportant: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  link: {
    color: '#B45309',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  requiredInline: {
    color: '#C0392B',
    fontWeight: '700',
  },
});

export default SubscriptionDetails;
