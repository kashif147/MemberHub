import React from 'react';
import { View } from 'react-native';
import {
  FieldLabel,
  FormCard,
  RadioRow,
  SelectField,
  TextField,
} from './formFields';

const CATEGORIES = [
  'Staff Nurse / Midwife',
  'CNM / CMM',
  'Clinical Nurse Specialist',
  'Undergraduate Student',
  'Retired Associate',
];

const GRADES = [
  'Staff Nurse',
  'Staff Midwife',
  'CNM1',
  'CNM2',
  'CNM3',
  'CNS',
  'Student',
  'Other',
];

const NURSE_TYPES = ['General', 'Psychiatric', 'Intellectual Disability', 'Midwife'];
const DISCIPLINES = ['Nursing', 'Midwifery'];

type Props = {
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  showValidation?: boolean;
};

const isUndergraduate = (category?: string) =>
  String(category || '')
    .toLowerCase()
    .includes('undergraduate') ||
  String(category || '')
    .toLowerCase()
    .includes('student');

const isRetiredAssociate = (category?: string) =>
  String(category || '')
    .toLowerCase()
    .includes('retired');

/** Same section structure as Portal_App ProfessionalDetails */
const ProfessionalDetails = ({
  formData,
  onFormDataChange,
  showValidation,
}: Props) => {
  const set = (key: string, value: any) =>
    onFormDataChange({ ...formData, [key]: value });

  const student = isUndergraduate(formData?.membershipCategory);
  const retired = isRetiredAssociate(formData?.membershipCategory);

  const err = (key: string, required = true) =>
    Boolean(showValidation && required && !formData?.[key]);

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
          options={CATEGORIES}
          onSelect={v =>
            onFormDataChange({
              ...formData,
              membershipCategory: v,
              // clear student/retired extras when category changes
              discipline: '',
              studyLocation: '',
              startDate: '',
              graduationDate: '',
              pensionNo: '',
            })
          }
          error={err('membershipCategory')}
        />

        <FieldLabel label="Grade" required error={err('grade')} />
        <SelectField
          value={formData?.grade || ''}
          placeholder="Select grade"
          options={GRADES}
          onSelect={v => set('grade', v)}
          error={err('grade')}
        />

        {student && (
          <>
            <FieldLabel label="Discipline" required error={err('discipline')} />
            <SelectField
              value={formData?.discipline || ''}
              placeholder="Select discipline"
              options={DISCIPLINES}
              onSelect={v => set('discipline', v)}
              error={err('discipline')}
            />

            <FieldLabel
              label="Study location"
              required
              error={err('studyLocation')}
            />
            <TextField
              value={formData?.studyLocation || ''}
              onChangeText={t => set('studyLocation', t)}
              error={err('studyLocation')}
            />

            <FieldLabel label="Start date" required error={err('startDate')} />
            <TextField
              value={formData?.startDate || ''}
              onChangeText={t => set('startDate', t)}
              placeholder="dd/mm/yyyy"
              error={err('startDate')}
            />

            <FieldLabel
              label="Graduation date"
              required
              error={err('graduationDate')}
            />
            <TextField
              value={formData?.graduationDate || ''}
              onChangeText={t => set('graduationDate', t)}
              placeholder="dd/mm/yyyy"
              error={err('graduationDate')}
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
          </>
        )}
      </FormCard>

      <FormCard
        title={
          student
            ? 'Work Location / Placement Details'
            : 'Employment Details'
        }>
        <FieldLabel
          label="Work location"
          required={!student}
          error={!student && err('workLocation')}
        />
        <TextField
          value={formData?.workLocation || ''}
          onChangeText={t => set('workLocation', t)}
          placeholder="e.g. Beaumont ED"
          error={!student && err('workLocation')}
        />

        <FieldLabel label="Other work location" />
        <TextField
          value={formData?.otherWorkLocation || ''}
          onChangeText={t => set('otherWorkLocation', t)}
        />
      </FormCard>

      <FormCard title="Professional Credentials">
        <FieldLabel label="Nursing adaptation programme?" />
        <RadioRow
          value={formData?.nursingAdaptationProgramme || ''}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          onChange={v => set('nursingAdaptationProgramme', v)}
        />

        {formData?.nursingAdaptationProgramme === 'yes' && (
          <>
            <FieldLabel label="Nurse type" required error={err('nurseType')} />
            <SelectField
              value={formData?.nurseType || ''}
              placeholder="Select nurse type"
              options={NURSE_TYPES}
              onSelect={v => set('nurseType', v)}
              error={err('nurseType')}
            />
          </>
        )}

        {formData?.nursingAdaptationProgramme === 'no' && !student && (
          <>
            <FieldLabel label="NMBI number" required error={err('nmbiNo')} />
            <TextField
              value={formData?.nmbiNo || ''}
              onChangeText={t => set('nmbiNo', t)}
              error={err('nmbiNo')}
            />
          </>
        )}
      </FormCard>
    </View>
  );
};

export default ProfessionalDetails;
