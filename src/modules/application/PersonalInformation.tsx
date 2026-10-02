import React from 'react';
import { View } from 'react-native';
import {
  ConsentSwitch,
  DateField,
  FieldCol,
  FieldLabel,
  FieldRow,
  FormSection,
  SelectField,
  TextField,
} from './formFields';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const PREFERRED_ADDRESS = ['Home', 'Work'];
const PREFERRED_EMAIL = ['Personal', 'Work'];
const COUNTRIES = ['Ireland', 'United Kingdom', 'Other'];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
};

/**
 * Layout matches MemberHub Application mockup:
 * Title | Gender, Forename | Surname, DOB, Country, Consent, Correspondence…
 */
const PersonalInformation = ({
  formData,
  onFormDataChange,
  showValidation,
}: Props) => {
  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

  return (
    <View>
      <FormSection title="Personal information">
        <FieldRow>
          <FieldCol>
            <FieldLabel label="Title" required error={err('title')} />
            <SelectField
              value={formData?.title || ''}
              placeholder="Select title"
              options={TITLES}
              onSelect={v => set('title', v)}
              error={err('title')}
            />
          </FieldCol>
          <FieldCol>
            <FieldLabel label="Gender" required error={err('gender')} />
            <SelectField
              value={formData?.gender || ''}
              placeholder="Select..."
              options={GENDERS}
              onSelect={v => set('gender', v)}
              error={err('gender')}
            />
          </FieldCol>
        </FieldRow>

        <FieldRow>
          <FieldCol>
            <FieldLabel label="Forename" required error={err('forename')} />
            <TextField
              value={formData?.forename || ''}
              onChangeText={t => set('forename', t)}
              error={err('forename')}
            />
          </FieldCol>
          <FieldCol>
            <FieldLabel label="Surname" required error={err('surname')} />
            <TextField
              value={formData?.surname || ''}
              onChangeText={t => set('surname', t)}
              error={err('surname')}
            />
          </FieldCol>
        </FieldRow>

        <FieldLabel label="Date of birth" required error={err('dob')} />
        <DateField
          value={formData?.dob || ''}
          onChangeText={t => set('dob', t)}
          error={err('dob')}
        />

        <FieldLabel
          label="Country of primary qualification"
          required
          error={err('countryPrimaryQualification')}
        />
        <SelectField
          value={formData?.countryPrimaryQualification || 'Ireland'}
          placeholder="Select country"
          options={COUNTRIES}
          onSelect={v => set('countryPrimaryQualification', v)}
          error={err('countryPrimaryQualification')}
        />
      </FormSection>

      <FormSection title="Consent">
        <ConsentSwitch
          label="Consent to receive correspondence"
          hint="Switch off if the applicant would not like to receive correspondence via email or phone."
          value={formData?.consent !== false}
          onValueChange={v => set('consent', v)}
        />
      </FormSection>

      <FormSection title="Correspondence details">
        <FieldLabel
          label="Preferred address"
          required
          error={err('preferredAddress')}
        />
        <SelectField
          value={formData?.preferredAddress || ''}
          placeholder="Select preferred address"
          options={PREFERRED_ADDRESS}
          onSelect={v => set('preferredAddress', v)}
          error={err('preferredAddress')}
        />

        <FieldLabel label="Address line 1" required error={err('addressLine1')} />
        <TextField
          value={formData?.addressLine1 || ''}
          onChangeText={t => set('addressLine1', t)}
          placeholder="Building / house"
          error={err('addressLine1')}
        />

        <FieldLabel label="Address line 2" />
        <TextField
          value={formData?.addressLine2 || ''}
          onChangeText={t => set('addressLine2', t)}
          placeholder="Street / road"
        />

        <FieldLabel label="Address line 3" />
        <TextField
          value={formData?.addressLine3 || ''}
          onChangeText={t => set('addressLine3', t)}
          placeholder="Area / town"
        />

        <FieldLabel label="Address line 4" required error={err('addressLine4')} />
        <TextField
          value={formData?.addressLine4 || ''}
          onChangeText={t => set('addressLine4', t)}
          placeholder="County / city / postcode"
          error={err('addressLine4')}
        />

        <FieldLabel label="Eircode" />
        <TextField
          value={formData?.eircode || ''}
          onChangeText={t => set('eircode', t)}
          autoCapitalize="characters"
        />
      </FormSection>

      <FormSection title="Contact details">
        <FieldLabel
          label="Preferred email"
          required
          error={err('preferredEmail')}
        />
        <SelectField
          value={formData?.preferredEmail || ''}
          placeholder="Select preferred email"
          options={PREFERRED_EMAIL}
          onSelect={v => set('preferredEmail', v)}
          error={err('preferredEmail')}
        />

        <FieldLabel
          label="Personal email"
          required={formData?.preferredEmail === 'Personal'}
          error={
            showValidation &&
            formData?.preferredEmail === 'Personal' &&
            !formData?.personalEmail
          }
        />
        <TextField
          value={formData?.personalEmail || ''}
          onChangeText={t => set('personalEmail', t)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={
            showValidation &&
            formData?.preferredEmail === 'Personal' &&
            !formData?.personalEmail
          }
        />

        <FieldLabel
          label="Work email"
          required={formData?.preferredEmail === 'Work'}
          error={
            showValidation &&
            formData?.preferredEmail === 'Work' &&
            !formData?.workEmail
          }
        />
        <TextField
          value={formData?.workEmail || ''}
          onChangeText={t => set('workEmail', t)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={
            showValidation &&
            formData?.preferredEmail === 'Work' &&
            !formData?.workEmail
          }
        />

        <FieldLabel label="Mobile number" required error={err('mobileNo')} />
        <TextField
          value={formData?.mobileNo || ''}
          onChangeText={t => set('mobileNo', t)}
          placeholder="+353..."
          keyboardType="phone-pad"
          error={err('mobileNo')}
        />

        <FieldLabel label="Home / work telephone" />
        <TextField
          value={formData?.homeWorkTelNo || ''}
          onChangeText={t => set('homeWorkTelNo', t)}
          keyboardType="phone-pad"
        />
      </FormSection>
    </View>
  );
};

export default PersonalInformation;
