import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ConsentSwitch,
  FieldLabel,
  FormCard,
  RadioRow,
  SelectField,
  TextField,
} from './formFields';
import { Colors } from '../../theme/colors';

const PAYMENT_TYPES = [
  'Credit Card',
  'Card Payment',
  'Payroll Deduction',
  'Deduction at Source',
  'Direct Debit',
];

const MEMBER_STATUSES = [
  { label: 'New member', value: 'new' },
  { label: 'Newly graduated', value: 'graduate' },
  { label: 'Rejoining (Previous Member)', value: 'rejoin' },
  { label: 'Returning from career break', value: 'careerBreak' },
  { label: 'Returning from nursing abroad', value: 'nursingAbroad' },
];

const YOUTH_FORUMS = ['Dublin', 'Cork', 'Galway', 'Other'];
const SECTIONS = [
  'Emergency',
  'ICU',
  'Maternity',
  'Theatre',
  'Community',
  'Other',
];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
  dateOfBirth?: string;
  workLocation?: string;
};

/** Same section structure as Portal_App SubscriptionDetails */
const SubscriptionDetails = ({
  formData,
  onFormDataChange,
  showValidation,
  workLocation,
}: Props) => {
  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

  const isPayroll =
    formData?.paymentType === 'Payroll Deduction' ||
    formData?.paymentType === 'Deduction at Source';

  const isRejoin =
    formData?.memberStatus === 'rejoin' ||
    formData?.memberStatus === 'careerBreak';

  return (
    <View>
      <FormCard title="Your Subscription Fees">
        <Text style={styles.feeNote}>
          Fees are confirmed from membership category after professional details
          are saved. Work location: {workLocation || '—'}.
        </Text>
      </FormCard>

      <FormCard title="Payment Information">
        <FieldLabel label="Payment type" required error={err('paymentType')} />
        <SelectField
          value={formData?.paymentType || ''}
          placeholder="Select payment type"
          options={PAYMENT_TYPES}
          onSelect={v => set('paymentType', v)}
          error={err('paymentType')}
        />

        {isPayroll && (
          <>
            <FieldLabel label="Payroll number" required error={err('payrollNo')} />
            <TextField
              value={formData?.payrollNo || ''}
              onChangeText={t => set('payrollNo', t)}
              error={err('payrollNo')}
            />
          </>
        )}
      </FormCard>

      <FormCard title="Member Status">
        <FieldLabel
          label="Please select the most appropriate option"
          required
          error={err('memberStatus')}
        />
        <View style={showValidation && !formData?.memberStatus ? styles.errorBox : undefined}>
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
          <ConsentSwitch
            label="Tick here to join Rewards for INMO members"
            hint="By ticking, you agree to Cornmarket Rewards terms."
            value={Boolean(formData?.inmoRewards)}
            onValueChange={v => set('inmoRewards', v)}
          />
        </FormCard>
      )}

      {formData?.memberStatus === 'graduate' &&
        formData?.otherScheme === 'no' && (
          <FormCard title="Additional Options for Newly Graduated Members">
            <ConsentSwitch
              label="Exclusive discounts and offers for INMO members"
              value={Boolean(formData?.exclusiveDiscountsAndOffers)}
              onValueChange={v => set('exclusiveDiscountsAndOffers', v)}
            />
            <View style={{ height: 12 }} />
            <ConsentSwitch
              label="I consent to INMO Income Protection Scheme"
              value={Boolean(formData?.incomeProtectionScheme)}
              onValueChange={v => set('incomeProtectionScheme', v)}
            />
          </FormCard>
        )}

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
            <FieldLabel label="Youth Forum" required error={err('youthForum')} />
            <SelectField
              value={formData?.youthForum || ''}
              placeholder="Select Youth Forum"
              options={YOUTH_FORUMS}
              onSelect={v => set('youthForum', v)}
              error={err('youthForum')}
            />
          </>
        )}
      </FormCard>

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
        <FieldLabel label="Primary section" required error={err('primarySection')} />
        <SelectField
          value={formData?.primarySection || ''}
          placeholder="Select primary section"
          options={SECTIONS}
          onSelect={v => set('primarySection', v)}
          error={err('primarySection')}
        />
        {formData?.primarySection === 'Other' && (
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
          options={SECTIONS}
          onSelect={v => set('secondarySection', v)}
        />
      </FormCard>

      <FormCard title="Additional Services & Terms">
        <ConsentSwitch
          label="Value added services"
          value={Boolean(formData?.valueAddedServices)}
          onValueChange={v => set('valueAddedServices', v)}
        />
        <View style={{ height: 12 }} />
        <ConsentSwitch
          label="I agree to the Terms & Conditions *"
          value={Boolean(formData?.termsAndConditions)}
          onValueChange={v => set('termsAndConditions', v)}
        />
        {showValidation && !formData?.termsAndConditions ? (
          <Text style={styles.errorText}>Terms & Conditions are required</Text>
        ) : null}
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
  errorText: {
    marginTop: 8,
    color: '#C0392B',
    fontSize: 12,
  },
});

export default SubscriptionDetails;
