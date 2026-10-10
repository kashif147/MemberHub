import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Colors } from '../theme/colors';

const parseDdMmYyyy = (value?: string) => {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  const date = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDdMmYyyy = (date?: Date | null) => {
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const parseISODate = (isoString?: string) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getAge = (date?: Date | null) => {
  if (!date) return 0;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

type Props = {
  label?: string;
  name?: string;
  required?: boolean;
  value?: string;
  onChange: (e: {
    target: { name?: string; value: string; displayValue?: string };
  }) => void;
  disableAgeValidation?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  error?: boolean;
};

/** Portal_App DatePicker — DD/MM/YYYY mask + native calendar, ISO value. */
export const DatePicker = ({
  label,
  name,
  required = false,
  value,
  onChange,
  disableAgeValidation = false,
  showValidation = false,
  disabled = false,
  error: externalError,
}: Props) => {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const isEmpty = required && !value && showValidation;

  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    let date: Date | null = null;
    if (typeof value === 'string' && value.includes('T')) {
      date = parseISODate(value);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      date = parseDdMmYyyy(value);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [y, m, d] = value.split(/[-T]/).map(x => parseInt(x, 10));
      date = new Date(y, m - 1, d);
    }
    setDisplayValue(date ? formatDdMmYyyy(date) : '');
  }, [value]);

  const validateAndPropagate = (dateObj: Date | null) => {
    if (!dateObj) {
      setError('');
      onChange({ target: { name, value: '' } });
      return;
    }
    const isoValue = dateObj.toISOString();
    const ddmmyyyy = formatDdMmYyyy(dateObj);
    if (!disableAgeValidation && getAge(dateObj) < 16) {
      setError('You must be 16 years or older to proceed');
    } else {
      setError('');
    }
    setDisplayValue(ddmmyyyy);
    onChange({ target: { name, value: isoValue, displayValue: ddmmyyyy } });
  };

  const handleChangeText = (text: string) => {
    const digits = (text || '').replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i += 1) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }
    setDisplayValue(formatted);
    if (formatted.length === 10) {
      const date = parseDdMmYyyy(formatted);
      if (date) validateAndPropagate(date);
      else setError('Invalid Date');
    } else {
      setError('');
      if (digits.length === 0) onChange({ target: { name, value: '' } });
    }
  };

  const currentDate = useMemo(
    () => parseDdMmYyyy(displayValue) || new Date(1995, 0, 1),
    [displayValue],
  );

  const showErr = Boolean(error || externalError || isEmpty);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, showErr && styles.labelError]}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View>
        <TextInput
          value={displayValue}
          onChangeText={disabled ? undefined : handleChangeText}
          placeholder="DD/MM/YYYY"
          maxLength={10}
          editable={!disabled}
          keyboardType="numeric"
          placeholderTextColor={Colors.textPlaceholder}
          style={[styles.input, showErr && styles.inputError]}
        />
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          style={styles.iconBtn}
          disabled={disabled}
          hitSlop={8}>
          <Calendar size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {open &&
        (Platform.OS === 'android' ? (
          <RNDateTimePicker
            value={currentDate}
            onChange={e => {
              if (e.type === 'dismissed') {
                setOpen(false);
                return;
              }
              const date = new Date((e as any).nativeEvent.timestamp);
              setOpen(false);
              validateAndPropagate(date);
            }}
            mode="date"
            display="spinner"
          />
        ) : (
          <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <RNDateTimePicker
                  value={currentDate}
                  onChange={e => {
                    if (e.type === 'dismissed') return;
                    const date = new Date((e as any).nativeEvent.timestamp);
                    validateAndPropagate(date);
                  }}
                  mode="date"
                  display="spinner"
                />
                <Pressable
                  onPress={() => setOpen(false)}
                  style={styles.doneBtn}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  labelError: { color: '#C0392B' },
  required: { color: '#E74C3C' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingRight: 44,
    minHeight: 48,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: '#C0392B' },
  iconBtn: { position: 'absolute', right: 12, top: 14 },
  errorText: { color: '#C0392B', marginTop: 4, fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    width: '90%',
  },
  doneBtn: { alignSelf: 'flex-end', padding: 8 },
  doneText: { color: Colors.primary, fontWeight: '700' },
});

export default DatePicker;
