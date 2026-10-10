import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import {
  ConsentSwitch,
  FieldLabel,
  FormSection,
  SelectField,
  TextField,
} from './formFields';
import DatePicker from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';
import { Colors } from '../../theme/colors';
import {
  DEFAULT_COUNTRY,
  allowedCountryCodes,
  buildMobileE164,
  normalizeMobileToE164,
  splitMobileNumber,
} from '../../helpers/phone.helper';

const GOOGLE_PLACES_API_KEY = 'AIzaSyCJYpj8WV5Rzof7O3jGhW9XabD0J4Yqe1o';
const PREFERRED_ADDRESS = ['Home', 'Work'];
const PREFERRED_EMAIL = ['Personal', 'Work'];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
};

const PersonalInformation = ({
  formData,
  onFormDataChange,
  showValidation,
}: Props) => {
  const { titleOptions, genderOptions, countryOptions, loading } = useLookup();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const lastWrittenMobileRef = useRef<string | null>(null);

  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

  const titles = useMemo(
    () =>
      titleOptions.length
        ? titleOptions
        : ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof'].map(v => ({
            label: v,
            value: v,
          })),
    [titleOptions],
  );

  const genders = useMemo(
    () =>
      genderOptions.length
        ? genderOptions
        : ['Male', 'Female', 'Other', 'Prefer not to say'].map(v => ({
            label: v,
            value: v,
          })),
    [genderOptions],
  );

  const countries = useMemo(
    () =>
      countryOptions.length
        ? countryOptions
        : ['Ireland', 'United Kingdom', 'Other'].map(v => ({
            label: v,
            value: v,
          })),
    [countryOptions],
  );

  const handleCountrySelect = (country: Country) => {
    const nextCountry = {
      cca2: country.cca2 as string,
      callingCode: String(country.callingCode?.[0] || country.callingCode || ''),
    };
    setSelectedCountry(nextCountry);
    const fullNumber = normalizeMobileToE164(
      buildMobileE164(nextCountry.callingCode, phoneNumber),
    );
    lastWrittenMobileRef.current = fullNumber;
    onFormDataChange({ ...formData, mobileNo: fullNumber });
  };

  const handlePhoneNumberChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleanedText);
    const fullNumber = normalizeMobileToE164(
      buildMobileE164(selectedCountry.callingCode, cleanedText),
    );
    lastWrittenMobileRef.current = fullNumber;
    onFormDataChange({ ...formData, mobileNo: fullNumber });
  };

  useEffect(() => {
    const raw = formData?.mobileNo || '';
    if (raw === lastWrittenMobileRef.current) return;
    if (!raw) {
      setPhoneNumber('');
      setSelectedCountry(DEFAULT_COUNTRY);
      return;
    }
    const split = splitMobileNumber(raw);
    setSelectedCountry({
      cca2: split.cca2,
      callingCode: split.callingCode,
    });
    setPhoneNumber(split.nationalNumber);
    const corrected = normalizeMobileToE164(
      buildMobileE164(split.callingCode, split.nationalNumber) || raw,
    );
    if (corrected && corrected !== raw) {
      lastWrittenMobileRef.current = corrected;
      onFormDataChange({ ...formData, mobileNo: corrected });
    } else if (corrected) {
      lastWrittenMobileRef.current = corrected;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.mobileNo]);

  const parsePlaceAddress = (details: any) => {
    const components = details?.address_components || [];
    const getComponent = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.long_name || '';
    const getComponentShortName = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.short_name || '';

    const premise = getComponent('premise');
    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const sublocalityLevel1 = getComponent('sublocality_level_1');
    const sublocality = getComponent('sublocality');
    const locality = getComponent('locality');
    const postalTown = getComponent('postal_town');
    const administrativeAreaLevel1 = getComponent(
      'administrative_area_level_1',
    );
    const postalCode = getComponent('postal_code');
    const countryLongName = getComponent('country');
    const countryShortName = getComponentShortName('country');

    const addressLine1 = (
      (streetNumber ? `${streetNumber} ` : '') + (premise || route || '')
    ).trim();
    const addressLine2 = premise ? route || '' : '';
    const addressLine3 = sublocalityLevel1 || sublocality || locality || '';
    const addressLine4 = (postalTown || administrativeAreaLevel1 || '').trim();
    const eircode = (postalCode || '').trim();

    let countryDisplayName = formData?.country || 'Ireland';
    if (countryLongName || countryShortName) {
      const matched = countryOptions.find(
        c =>
          c.value === countryLongName ||
          c.value === countryShortName ||
          c.label === countryLongName,
      );
      if (matched) countryDisplayName = matched.label;
      else if (countryLongName) countryDisplayName = countryLongName;
    }

    onFormDataChange({
      ...formData,
      addressLine1,
      addressLine2,
      addressLine3,
      addressLine4,
      eircode,
      country: countryDisplayName,
    });
  };

  return (
    <View>
      {loading && !titleOptions.length ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading lookups…</Text>
        </View>
      ) : null}

      <FormSection title="Personal information">
        <FieldLabel label="Title" required error={err('title')} />
        <SelectField
          value={formData?.title || ''}
          placeholder="Select title"
          options={titles}
          onSelect={v => set('title', v)}
          error={err('title')}
        />

        <FieldLabel label="Gender" required error={err('gender')} />
        <SelectField
          value={formData?.gender || ''}
          placeholder="Select gender"
          options={genders}
          onSelect={v => set('gender', v)}
          error={err('gender')}
        />

        <FieldLabel label="Forename" required error={err('forename')} />
        <TextField
          value={formData?.forename || ''}
          onChangeText={t => set('forename', t)}
          error={err('forename')}
        />

        <FieldLabel label="Surname" required error={err('surname')} />
        <TextField
          value={formData?.surname || ''}
          onChangeText={t => set('surname', t)}
          error={err('surname')}
        />

        <DatePicker
          label="Date of birth"
          name="dob"
          required
          value={formData?.dob || ''}
          showValidation={showValidation}
          onChange={e => set('dob', e.target.value)}
        />

        <FieldLabel
          label="Country of primary qualification"
          required
          error={err('countryPrimaryQualification')}
        />
        <SelectField
          value={formData?.countryPrimaryQualification || 'Ireland'}
          placeholder="Select country"
          options={countries}
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

        <FieldLabel label="Search by address or Eircode" />
        <View style={styles.placesWrap}>
          <GooglePlacesAutocomplete
            placeholder="Search for your address"
            fetchDetails
            onPress={(_data, details = null) => parsePlaceAddress(details)}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
              types: ['geocode'],
              components: 'country:ie',
            }}
            styles={{
              textInput: styles.placesInput,
              listView: styles.placesList,
              row: styles.placesRow,
              description: styles.placesDescription,
            }}
            enablePoweredByContainer={false}
            debounce={200}
            minLength={2}
            keyboardShouldPersistTaps="always"
          />
        </View>

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

        <FieldLabel label="Country" />
        <SelectField
          value={formData?.country || 'Ireland'}
          placeholder="Select country"
          options={countries}
          onSelect={v => set('country', v)}
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
        <View
          style={[
            styles.phoneRow,
            err('mobileNo') && { borderColor: '#C0392B' },
          ]}>
          <TouchableOpacity
            style={styles.countryBtn}
            onPress={() => setCountryPickerOpen(true)}
            activeOpacity={0.8}>
            <CountryPicker
              countryCode={selectedCountry.cca2 as CountryCode}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              visible={countryPickerOpen}
              onClose={() => setCountryPickerOpen(false)}
              onSelect={handleCountrySelect}
              countryCodes={allowedCountryCodes as CountryCode[]}
            />
            <Text style={styles.callingCode}>+{selectedCountry.callingCode}</Text>
          </TouchableOpacity>
          <TextField
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder="Mobile number"
            keyboardType="phone-pad"
            style={styles.phoneInput}
            containerStyle={styles.phoneInputWrap}
          />
        </View>

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

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  placesWrap: {
    zIndex: 20,
    marginBottom: 12,
    minHeight: 48,
  },
  placesInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  placesList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 220,
  },
  placesRow: { padding: 12 },
  placesDescription: { fontSize: 14, color: Colors.textPrimary },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 12,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    minHeight: 48,
  },
  callingCode: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  phoneInputWrap: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    minHeight: 48,
  },
  phoneInput: { borderWidth: 0 },
});

export default PersonalInformation;
