import React, { useEffect, useMemo } from 'react';
import { View, Alert } from 'react-native';
import {
  FieldLabel,
  FormCard,
  RadioRow,
  SelectField,
  TextField,
} from './formFields';
import DatePicker from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';
import {
  isReducedRateMembershipCategory,
  isRetiredAssociateCategory,
  isUndergraduateStudentCategory,
} from '../../helpers/applicationCategory.helper';
import { resolveBranchRegionFromStudyLocation } from '../../helpers/lookupHierarchy.helper';
import { getWorkLocationDisplayName } from '../../helpers/applicationPayload.helper';
import {
  findWorkLocationLookupItem,
  getBranchRegionFromLookupItem,
} from '../../helpers/subscriptionPricing.helper';

const NURSE_TYPES = [
  'General Nurse',
  'Public Health Nurse',
  'Mental health nurse',
  'Midwife',
  "Sick Children's Nurse",
  'Registered Nurse for Intellectual Disability',
];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
};

const ProfessionalDetails = ({
  formData,
  onFormDataChange,
  showValidation,
}: Props) => {
  const {
    categoryOptions,
    gradeOptions,
    workLocationOptions,
    workLocationLookups,
    studyLocationOptions,
    disciplineOptions,
    rawLookups,
  } = useLookup();

  const categoryLabel = formData?.membershipCategory || '';
  const student = isUndergraduateStudentCategory(categoryLabel);
  const retired = isRetiredAssociateCategory(categoryLabel);
  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const adaptationNo = formData?.nursingAdaptationProgramme === 'no';

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

  const categories = useMemo(
    () =>
      categoryOptions.length
        ? categoryOptions
        : [
            'Staff Nurse / Midwife',
            'CNM / CMM',
            'Undergraduate Student',
            'Retired Associate',
          ].map(v => ({ label: v, value: v })),
    [categoryOptions],
  );

  const grades = useMemo(
    () =>
      gradeOptions.length
        ? gradeOptions
        : ['Staff Nurse', 'CNM1', 'CNM2', 'Student', 'Other'].map(v => ({
            label: v,
            value: v,
          })),
    [gradeOptions],
  );

  // Portal ProfessionalDetails: names from hierarchy items (lookup.DisplayName…)
  const workLocations = useMemo(() => {
    const fromHierarchy = (workLocationLookups || [])
      .map(getWorkLocationDisplayName)
      .filter(Boolean)
      .map((name: string) => ({ label: name, value: name }));

    const fromOptions = (workLocationOptions || []).filter(
      o => o.value && o.value !== 'other',
    );

    const seen = new Set<string>();
    const merged: { label: string; value: string }[] = [];
    [...fromHierarchy, ...fromOptions].forEach(o => {
      const key = String(o.value).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(o);
    });
    merged.sort((a, b) => a.label.localeCompare(b.label));
    merged.push({ label: 'Other', value: 'other' });
    return merged;
  }, [workLocationLookups, workLocationOptions]);

  const studyLocations = useMemo(
    () => studyLocationOptions,
    [studyLocationOptions],
  );

  const disciplines = useMemo(
    () =>
      disciplineOptions.length
        ? disciplineOptions
        : [
            { label: 'Nursing', value: 'Nursing' },
            { label: 'Midwifery', value: 'Midwifery' },
            { label: 'Other', value: 'other' },
          ],
    [disciplineOptions],
  );

  const getUndergraduateBranchRegion = (draft: Record<string, any>) => {
    if (draft.workLocation === 'other') return { branch: '', region: '' };
    if (draft.workLocation) {
      const selected = findWorkLocationLookupItem(
        draft.workLocation,
        workLocationLookups,
      );
      return getBranchRegionFromLookupItem(selected);
    }
    if (draft.studyLocation) {
      return resolveBranchRegionFromStudyLocation(
        draft.studyLocation,
        studyLocationOptions,
        rawLookups,
        workLocationLookups,
      );
    }
    return { branch: '', region: '' };
  };

  const applyMembershipCategory = (categoryValue: string) => {
    const base: Record<string, any> = {
      ...(formData || {}),
      membershipCategory: categoryValue,
      discipline: '',
      studyLocation: '',
      startDate: '',
      graduationDate: '',
      pensionNo: '',
      retiredDate: '',
    };

    let branch = '';
    let region = '';
    if (isUndergraduateStudentCategory(categoryValue)) {
      const resolved = getUndergraduateBranchRegion(base);
      branch = resolved.branch;
      region = resolved.region;
    } else if (base.workLocation && base.workLocation !== 'other') {
      const resolved = getBranchRegionFromLookupItem(
        findWorkLocationLookupItem(base.workLocation, workLocationLookups),
      );
      branch = resolved.branch;
      region = resolved.region;
    }

    onFormDataChange({
      ...base,
      branch,
      region,
    });
  };

  const handleMembershipCategoryChange = (value: string) => {
    if (!value) {
      applyMembershipCategory('');
      return;
    }
    if (isReducedRateMembershipCategory(value)) {
      Alert.alert(
        'Membership Category Confirmation',
        'You have selected a reduced-rate membership category. Please ensure you meet the eligibility criteria.\n\nAre you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, continue',
            onPress: () => applyMembershipCategory(value),
          },
        ],
      );
      return;
    }
    applyMembershipCategory(value);
  };

  const handleWorkLocationChange = (val: string) => {
    const next: Record<string, any> = {
      ...formData,
      workLocation: val,
    };
    if (val === 'other') {
      next.branch = '';
      next.region = '';
    } else if (val) {
      Object.assign(
        next,
        getBranchRegionFromLookupItem(
          findWorkLocationLookupItem(val, workLocationLookups),
        ),
      );
      next.otherWorkLocation = '';
    } else if (isUndergraduateStudentCategory(next.membershipCategory)) {
      Object.assign(next, getUndergraduateBranchRegion(next));
    } else {
      next.branch = '';
      next.region = '';
    }
    onFormDataChange(next);
  };

  const handleStudyLocationChange = (val: string) => {
    const next: Record<string, any> = {
      ...formData,
      studyLocation: val,
    };
    const hasWorkLocation =
      next.workLocation && next.workLocation !== 'other';
    if (
      isUndergraduateStudentCategory(next.membershipCategory) &&
      !hasWorkLocation
    ) {
      Object.assign(next, getUndergraduateBranchRegion(next));
    }
    onFormDataChange(next);
  };

  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  // Keep branch/region in sync when hierarchy lookups arrive (Portal + CRM)
  useEffect(() => {
    const wl = formData?.workLocation;
    const hasWorkLocation = Boolean(wl && wl !== 'other');
    const studentCat = isUndergraduateStudentCategory(
      formData?.membershipCategory,
    );
    if (!hasWorkLocation && !(studentCat && formData?.studyLocation)) {
      return;
    }
    if (!workLocationLookups?.length && !rawLookups?.length) return;

    let branch = '';
    let region = '';
    if (hasWorkLocation) {
      const resolved = getBranchRegionFromLookupItem(
        findWorkLocationLookupItem(wl, workLocationLookups),
      );
      branch = resolved.branch;
      region = resolved.region;
    } else if (studentCat) {
      const resolved = getUndergraduateBranchRegion(formData);
      branch = resolved.branch;
      region = resolved.region;
    }

    if (!branch && !region) return;
    if (
      branch === (formData?.branch || '') &&
      region === (formData?.region || '')
    ) {
      return;
    }
    onFormDataChange({
      ...formData,
      branch: branch || formData?.branch || '',
      region: region || formData?.region || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData?.workLocation,
    formData?.studyLocation,
    formData?.membershipCategory,
    workLocationLookups,
    rawLookups,
  ]);

  return (
    <View>
      <FormCard title="Membership Information">
        <FieldLabel
          label="Membership category"
          required
          error={err('membershipCategory')}
        />
        <SelectField
          value={formData?.membershipCategory || ''}
          placeholder="Select category"
          options={categories}
          onSelect={handleMembershipCategoryChange}
          error={err('membershipCategory')}
        />

        {student && (
          <>
            <FieldLabel label="Discipline" required error={err('discipline')} />
            <SelectField
              value={formData?.discipline || ''}
              placeholder="Select discipline"
              options={disciplines}
              onSelect={v => set('discipline', v)}
              error={err('discipline')}
            />

            <FieldLabel
              label="Study location"
              required
              error={err('studyLocation')}
            />
            {studyLocations.length ? (
              <SelectField
                value={formData?.studyLocation || ''}
                placeholder="Select study location"
                options={studyLocations}
                onSelect={handleStudyLocationChange}
                error={err('studyLocation')}
              />
            ) : (
              <TextField
                value={formData?.studyLocation || ''}
                onChangeText={t => handleStudyLocationChange(t)}
                error={err('studyLocation')}
              />
            )}

            <DatePicker
              label="Start date"
              name="startDate"
              required
              value={formData?.startDate || ''}
              showValidation={showValidation}
              disableAgeValidation
              onChange={e => set('startDate', e.target.value)}
            />

            <DatePicker
              label="Graduation date"
              name="graduationDate"
              required
              value={formData?.graduationDate || ''}
              showValidation={showValidation}
              disableAgeValidation
              onChange={e => set('graduationDate', e.target.value)}
            />
          </>
        )}

        {retired && (
          <>
            <FieldLabel
              label="Pension number"
              required
              error={err('pensionNo')}
            />
            <TextField
              value={formData?.pensionNo || ''}
              onChangeText={t => set('pensionNo', t)}
              error={err('pensionNo')}
            />
            <DatePicker
              label="Retired date"
              name="retiredDate"
              value={formData?.retiredDate || ''}
              disableAgeValidation
              onChange={e => set('retiredDate', e.target.value)}
            />
          </>
        )}
      </FormCard>

      <FormCard
        title={
          student ? 'Work Location / Placement Details' : 'Employment Details'
        }>
        <FieldLabel
          label="Work location"
          required={!student}
          error={!student && err('workLocation')}
        />
        <SelectField
          value={formData?.workLocation || ''}
          placeholder="Select work location"
          options={workLocations}
          onSelect={handleWorkLocationChange}
          error={!student && err('workLocation')}
        />

        {formData?.workLocation === 'other' && (
          <>
            <FieldLabel
              label="Other work location"
              required
              error={err('otherWorkLocation')}
            />
            <TextField
              value={formData?.otherWorkLocation || ''}
              onChangeText={t => set('otherWorkLocation', t)}
              error={err('otherWorkLocation')}
            />
          </>
        )}

        {/* Always visible like Portal/CRM — auto-filled from work/study location */}
        <FieldLabel label="Branch" />
        <TextField
          value={formData?.branch || ''}
          onChangeText={() => {}}
          editable={false}
          placeholder="Auto-filled from location"
        />

        <FieldLabel label="Region" />
        <TextField
          value={formData?.region || ''}
          onChangeText={() => {}}
          editable={false}
          placeholder="Auto-filled from location"
        />
        <FieldLabel label="Grade" required error={err('grade')} />
        <SelectField
          value={formData?.grade || ''}
          placeholder="Select grade"
          options={grades}
          onSelect={v =>
            onFormDataChange({
              ...formData,
              grade: v,
              otherGrade: v === 'other' ? formData?.otherGrade : '',
            })
          }
          error={err('grade')}
        />
        {formData?.grade === 'other' && (
          <>
            <FieldLabel label="Other grade" required error={err('otherGrade')} />
            <TextField
              value={formData?.otherGrade || ''}
              onChangeText={t => set('otherGrade', t)}
              error={err('otherGrade')}
            />
          </>
        )}
      </FormCard>

      <FormCard title="Professional Credentials">
        <FieldLabel label="Are you currently undertaking a nursing adaptation programme?" />
        <RadioRow
          value={formData?.nursingAdaptationProgramme || ''}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          onChange={v => {
            const next: Record<string, any> = {
              ...formData,
              nursingAdaptationProgramme: v,
            };
            // Portal: clear nurse type when switching to No
            if (v === 'no') {
              next.nurseType = '';
            }
            onFormDataChange(next);
          }}
        />

        {/* Portal: NMBI always visible; editable once Yes/No chosen */}
        <FieldLabel
          label="NMBI No / An Board Altranais Number"
          required={adaptationNo && !student}
          error={adaptationNo && !student && err('nmbiNo')}
        />
        <TextField
          value={formData?.nmbiNo || formData?.nmbiNumber || ''}
          onChangeText={t =>
            onFormDataChange({
              ...formData,
              nmbiNo: t,
              nmbiNumber: t,
            })
          }
          placeholder="12344"
          editable={adaptationYes || adaptationNo}
          error={adaptationNo && !student && err('nmbiNo')}
        />

        {/* Portal: nurse types always visible; enabled only when Yes */}
        <FieldLabel
          label="Please tick one of the following"
          required={adaptationYes}
          error={adaptationYes && err('nurseType')}
        />
        <RadioRow
          value={formData?.nurseType || ''}
          options={NURSE_TYPES}
          onChange={v => set('nurseType', v)}
          error={adaptationYes && err('nurseType')}
          wrap
          disabled={!adaptationYes}
        />
      </FormCard>
    </View>
  );
};

export default ProfessionalDetails;
