import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Tag } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import PersonalInformation from './PersonalInformation';
import ProfessionalDetails from './ProfessionalDetails';
import SubscriptionDetails from './SubscriptionDetails';
import { useLookup } from '../../contexts/lookupContext';
import {
  createPersonalDetailRequest,
  createProfessionalDetailRequest,
  createSubscriptionDetailRequest,
  updatePersonalDetailRequest,
  updateProfessionalDetailRequest,
  updateSubscriptionDetailRequest,
} from '../../api/application.api';
import {
  buildPersonalPayload,
  buildProfessionalPayload,
  buildSubscriptionPayload,
  extractApiError,
  extractApplicationId,
} from '../../helpers/applicationPayload.helper';
import {
  isRetiredAssociateCategory,
  isUndergraduateStudentCategory,
} from '../../helpers/applicationCategory.helper';
import { calculateAgeFromDateOfBirth } from '../../helpers/date.helper';
import { isValidMobileE164 } from '../../helpers/phone.helper';
import {
  getFrequencyOptionsForPaymentType,
  isSalaryDeductionPaymentType,
} from '../../helpers/subscriptionPricing.helper';

const steps = [
  { number: 1, title: 'Personal' },
  { number: 2, title: 'Professional' },
  { number: 3, title: 'Subscription' },
];

/** Same seed shape as Portal_App Application.js */
const initialFormData = {
  personalInfo: {
    title: '',
    forename: '',
    surname: '',
    gender: '',
    dob: '',
    personalEmail: '',
    workEmail: '',
    mobileNo: '',
    country: 'Ireland',
    countryPrimaryQualification: 'Ireland',
    consent: true,
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    eircode: '',
    preferredEmail: '',
    preferredAddress: '',
    homeWorkTelNo: '',
  },
  professionalDetails: {
    membershipCategory: '',
    grade: '',
    workLocation: '',
    otherWorkLocation: '',
    retired: false,
    retiredDate: '',
    pensionNo: '',
    discipline: '',
    studyLocation: '',
    startDate: '',
    graduationDate: '',
    nursingAdaptationProgramme: '',
    nurseType: '',
    nmbiNo: '',
  },
  subscriptionDetails: {} as Record<string, any>,
};

/**
 * Branch Officer bulk register — Portal 3-step UX + CRM profile-service saves.
 * Lookups from policy-service (same as CRM ApplicationMgtDrawer).
 */
const ApplicationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);
  const { refreshLookups, loading: lookupsLoading } = useLookup();

  const driveName =
    route.params?.driveName || 'Beaumont ED – Autumn drive';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [showValidation, setShowValidation] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(
    route.params?.applicationId || null,
  );
  const [hasProfessional, setHasProfessional] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  const handleFormDataChange = (
    stepName: keyof typeof initialFormData,
    data: Record<string, any>,
  ) => {
    setFormData(prev => ({
      ...prev,
      [stepName]: {
        ...(initialFormData[stepName] as object),
        ...data,
      },
    }));
  };

  const categoryLabel = formData.professionalDetails?.membershipCategory || '';

  const isUndergraduateStudent = useMemo(
    () => isUndergraduateStudentCategory(categoryLabel),
    [categoryLabel],
  );

  const memberAge = useMemo(
    () => calculateAgeFromDateOfBirth(formData.personalInfo?.dob),
    [formData.personalInfo?.dob],
  );

  const getMissingRequiredFields = () => {
    const missing: string[] = [];
    if (currentStep === 1) {
      const p = formData.personalInfo || {};
      if (!p.preferredEmail) missing.push('Preferred email');
      if (!p.title) missing.push('Title');
      if (!p.forename) missing.push('Forename');
      if (!p.surname) missing.push('Surname');
      if (!p.gender) missing.push('Gender');
      if (!p.dob) missing.push('Date of Birth');
      if (!p.countryPrimaryQualification) {
        missing.push('Country of primary qualification');
      }
      if (p.preferredEmail === 'Personal' && !p.personalEmail) {
        missing.push('Personal email');
      }
      if (p.preferredEmail === 'Work' && !p.workEmail) {
        missing.push('Work email');
      }
      if (!p.mobileNo) missing.push('Mobile number');
      else if (!isValidMobileE164(p.mobileNo)) {
        missing.push('Valid mobile number');
      }
      if (memberAge != null && memberAge < 16) {
        missing.push('Date of Birth (must be 16+)');
      }
      if (!p.addressLine1) missing.push('Address Line 1');
      if (!p.addressLine4) missing.push('Address Line 4');
      if (!p.preferredAddress) missing.push('Preferred address');
    } else if (currentStep === 2) {
      const d = formData.professionalDetails || {};
      if (!d.membershipCategory) missing.push('Membership category');
      if (!d.grade) missing.push('Grade');
      if (d.grade === 'other' && !d.otherGrade) missing.push('Other grade');
      if (!isUndergraduateStudent && !d.workLocation) {
        missing.push('Work location');
      }
      if (d.workLocation === 'other' && !d.otherWorkLocation) {
        missing.push('Other work location');
      }
      if (isUndergraduateStudent) {
        if (!d.discipline) missing.push('Discipline');
        if (!d.studyLocation) missing.push('Study location');
        if (!d.startDate) missing.push('Start date');
        if (!d.graduationDate) missing.push('Graduation date');
      }
      if (
        isRetiredAssociateCategory(categoryLabel) &&
        !String(d.pensionNo || '').trim()
      ) {
        missing.push('Pension number');
      }
      if (d.nursingAdaptationProgramme === 'yes' && !d.nurseType) {
        missing.push('Nurse type');
      }
      if (
        d.nursingAdaptationProgramme === 'no' &&
        !isUndergraduateStudent &&
        !String(d.nmbiNo || '').trim()
      ) {
        missing.push('NMBI number');
      }
    } else if (currentStep === 3) {
      const s = formData.subscriptionDetails || {};
      if (!s.paymentType) missing.push('Payment type');
      const freqOptions = getFrequencyOptionsForPaymentType(s.paymentType);
      if (freqOptions.length > 0 && !s.paymentFrequency) {
        missing.push('Payment frequency');
      }
      if (
        isSalaryDeductionPaymentType(s.paymentType) &&
        !String(s.payrollNo || '').trim()
      ) {
        missing.push('Payroll No');
      }
      if (!s.memberStatus) missing.push('Member status');
      if (
        (s.memberStatus === 'new' || s.memberStatus === 'graduate') &&
        !s.otherIrishTradeUnion
      ) {
        missing.push('Other Trade Union');
      }
      if (
        s.otherIrishTradeUnion === 'yes' &&
        !s.otherIrishTradeUnionName
      ) {
        missing.push('Union name');
      }
      if (
        (s.memberStatus === 'new' || s.memberStatus === 'graduate') &&
        !s.otherScheme
      ) {
        missing.push('Other scheme');
      }
      if (memberAge == null || memberAge < 35) {
        if (!s.joinYouthForum) missing.push('Youth Forum preference');
        if (s.joinYouthForum === 'yes' && !s.youthForum) {
          missing.push('Youth Forum');
        }
      }
      if (!s.primarySection) missing.push('Primary section');
      if (
        String(s.primarySection || '')
          .toLowerCase()
          .includes('other') &&
        !s.otherPrimarySection
      ) {
        missing.push('Other primary section');
      }
      if (!s.termsAndConditions) missing.push('Terms & Conditions');
    }
    return missing;
  };

  const advanceStep = () => {
    setShowValidation(false);
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const finishBulkRegister = () => {
    setIsSubmitted(true);
    const name =
      `${formData.personalInfo.forename} ${formData.personalInfo.surname}`.trim();
    Alert.alert(
      'Application submitted',
      `${name || 'Application'} tagged to “${driveName}” and pending review.`,
      [
        {
          text: 'Register another',
          onPress: () => {
            setFormData(initialFormData);
            setApplicationId(null);
            setHasProfessional(false);
            setHasSubscription(false);
            setIsSubmitted(false);
            setShowValidation(false);
            setCurrentStep(1);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          },
        },
        {
          text: 'Done',
          style: 'cancel',
          onPress: () => navigation.popToTop(),
        },
      ],
    );
  };

  const savePersonalStep = async () => {
    const payload = buildPersonalPayload(formData.personalInfo);
    setStepLoading(true);
    try {
      const res = applicationId
        ? await updatePersonalDetailRequest(applicationId, payload)
        : await createPersonalDetailRequest(payload);

      if (!(res?.status >= 200 && res?.status < 300)) {
        throw new Error(
          extractApiError(res, 'Unable to save personal details'),
        );
      }

      const id = extractApplicationId(res) || applicationId;
      if (id) setApplicationId(id);
      advanceStep();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to save personal details');
    } finally {
      setStepLoading(false);
    }
  };

  const saveProfessionalStep = async () => {
    if (!applicationId) {
      Alert.alert('Error', 'Missing application id. Re-save personal details.');
      return;
    }
    const payload = buildProfessionalPayload(formData.professionalDetails);
    setStepLoading(true);
    try {
      let res = hasProfessional
        ? await updateProfessionalDetailRequest(applicationId, payload)
        : await createProfessionalDetailRequest(applicationId, payload);

      // CRM ApplicationMgtDrawer: PUT then fallback POST (or reverse)
      if (!(res?.status >= 200 && res?.status < 300)) {
        res = hasProfessional
          ? await createProfessionalDetailRequest(applicationId, payload)
          : await updateProfessionalDetailRequest(applicationId, payload);
      }

      if (!(res?.status >= 200 && res?.status < 300)) {
        throw new Error(
          extractApiError(res, 'Unable to save professional details'),
        );
      }

      setHasProfessional(true);
      advanceStep();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to save professional details');
    } finally {
      setStepLoading(false);
    }
  };

  const saveSubscriptionStep = async () => {
    if (!applicationId) {
      Alert.alert('Error', 'Missing application id. Re-save personal details.');
      return;
    }
    const payload = buildSubscriptionPayload(
      formData.subscriptionDetails,
      formData.professionalDetails?.membershipCategory,
    );
    setStepLoading(true);
    try {
      let res = hasSubscription
        ? await updateSubscriptionDetailRequest(applicationId, payload)
        : await createSubscriptionDetailRequest(applicationId, payload);

      if (!(res?.status >= 200 && res?.status < 300)) {
        res = hasSubscription
          ? await createSubscriptionDetailRequest(applicationId, payload)
          : await updateSubscriptionDetailRequest(applicationId, payload);
      }

      if (!(res?.status >= 200 && res?.status < 300)) {
        throw new Error(
          extractApiError(res, 'Unable to save subscription details'),
        );
      }

      setHasSubscription(true);
      // Branch Officer / CRM bulk: no member payment modal
      finishBulkRegister();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to save subscription details');
    } finally {
      setStepLoading(false);
    }
  };

  const handlePrevious = () => {
    setShowValidation(false);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleNext = () => {
    setShowValidation(true);
    const missing = getMissingRequiredFields();
    if (missing.length) {
      Alert.alert(
        'Validation',
        `Please complete: ${missing.slice(0, 5).join(', ')}${
          missing.length > 5 ? '…' : ''
        }`,
      );
      return;
    }

    if (currentStep === 1) {
      savePersonalStep();
      return;
    }
    if (currentStep === 2) {
      saveProfessionalStep();
      return;
    }
    saveSubscriptionStep();
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepLoading) return;
    if (stepNumber === currentStep) return;
    if (stepNumber < currentStep) {
      setShowValidation(false);
      setCurrentStep(stepNumber);
      return;
    }
    if (stepNumber === currentStep + 1) {
      handleNext();
      return;
    }
    Alert.alert(
      'Complete previous steps',
      'Please finish the current step before skipping ahead.',
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInformation
            formData={formData.personalInfo}
            onFormDataChange={data =>
              handleFormDataChange('personalInfo', data)
            }
            showValidation={showValidation}
          />
        );
      case 2:
        return (
          <ProfessionalDetails
            formData={formData.professionalDetails}
            onFormDataChange={data =>
              handleFormDataChange('professionalDetails', data)
            }
            showValidation={showValidation}
          />
        );
      case 3:
        return (
          <SubscriptionDetails
            formData={formData.subscriptionDetails}
            onFormDataChange={data =>
              handleFormDataChange('subscriptionDetails', data)
            }
            showValidation={showValidation}
            dateOfBirth={formData.personalInfo?.dob}
            workLocation={formData.professionalDetails?.workLocation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Application"
        showBack
        onBack={() => {
          if (currentStep > 1) handlePrevious();
          else navigation.goBack();
        }}
      />

      <View style={styles.stepperRow}>
        {steps.map(step => {
          const isCurrent = currentStep === step.number;
          const isCompleted =
            currentStep > step.number || (isSubmitted && step.number === 3);
          const isClickable =
            isCompleted || isCurrent || step.number === currentStep + 1;
          const isDisabled = !isClickable || stepLoading;

          return (
            <TouchableOpacity
              key={step.number}
              style={[styles.stepTab, isCurrent && styles.stepTabActive]}
              onPress={() => !isDisabled && handleStepClick(step.number)}
              disabled={isDisabled}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.stepTabText,
                  isCurrent && styles.stepTabTextActive,
                  isDisabled && !isCurrent && { opacity: 0.55 },
                ]}>
                {step.number} · {step.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.driveTag}>
        <Tag size={14} color={Colors.textSecondary} />
        <Text style={styles.driveTagText} numberOfLines={1}>
          {driveName}
        </Text>
        {lookupsLoading ? (
          <TouchableOpacity onPress={() => refreshLookups()}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {renderStepContent()}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handlePrevious}
              activeOpacity={0.8}
              disabled={stepLoading}>
              <Text style={styles.secondaryBtnText}>
                {currentStep === 1
                  ? 'Save Draft'
                  : steps[currentStep - 2]?.title || 'Previous'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, stepLoading && { opacity: 0.7 }]}
              onPress={handleNext}
              activeOpacity={0.85}
              disabled={stepLoading}>
              {stepLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {currentStep === steps.length
                    ? 'Submit Application'
                    : steps[currentStep]?.title || 'Next Step'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  stepperRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 4,
  },
  stepTab: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  stepTabActive: {
    borderBottomColor: Colors.primary,
  },
  stepTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  stepTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  driveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  driveTagText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  content: { paddingHorizontal: 16, paddingBottom: 36 },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  primaryBtn: {
    flex: 1.3,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 48,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default ApplicationScreen;
