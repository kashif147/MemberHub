import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { ChevronDown, Calendar } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export const FieldLabel = ({
  label,
  required,
  error,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
}) => (
  <Text style={[styles.label, error && styles.labelError]}>
    {label}
    {required ? <Text style={styles.required}> *</Text> : null}
  </Text>
);

/** Mockup section heading — no card chrome */
export const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export const FormCard = FormSection;

export const TextField = ({
  value,
  onChangeText,
  placeholder,
  error,
  rightIcon,
  containerStyle,
  style,
  ...rest
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: boolean;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  style?: any;
  [key: string]: any;
}) => (
  <View style={[styles.inputWrap, error && styles.inputError, containerStyle]}>
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textPlaceholder}
      {...rest}
    />
    {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
  </View>
);

export const SelectField = ({
  value,
  placeholder,
  options,
  onSelect,
  error,
}: {
  value: string;
  placeholder: string;
  options: Array<string | { label: string; value: string }>;
  onSelect: (v: string) => void;
  error?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const normalized = (options || []).map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
  const selectedLabel =
    normalized.find(o => o.value === value || o.label === value)?.label ||
    value;

  return (
    <View>
      <TouchableOpacity
        style={[styles.inputWrap, styles.select, error && styles.inputError]}
        activeOpacity={0.8}
        onPress={() => setOpen(v => !v)}>
        <Text
          style={[styles.selectText, !value && styles.placeholder]}
          numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.menu}>
          {normalized.map(opt => (
            <TouchableOpacity
              key={`${opt.value}-${opt.label}`}
              style={styles.menuItem}
              onPress={() => {
                onSelect(opt.value);
                setOpen(false);
              }}>
              <Text
                style={[
                  styles.menuItemText,
                  (opt.value === value || opt.label === value) &&
                    styles.menuItemActive,
                ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export const DateField = ({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  error?: boolean;
}) => (
  <TextField
    value={value}
    onChangeText={onChangeText}
    placeholder="dd/mm/yyyy"
    keyboardType="numbers-and-punctuation"
    error={error}
    rightIcon={<Calendar size={16} color={Colors.textMuted} />}
  />
);

export const ConsentSwitch = ({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <View style={styles.consentRow}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={styles.consentTitle}>{label}</Text>
      {hint ? <Text style={styles.consentHint}>{hint}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
      thumbColor={value ? Colors.primary : Colors.surface}
    />
  </View>
);

export const RadioRow = ({
  value,
  options,
  onChange,
  error,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  error?: boolean;
}) => (
  <View style={[styles.radioRow, error && styles.inputError]}>
    {options.map(opt => {
      const selected = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={styles.radioOption}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}>
          <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>
            {selected ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.fieldRow}>{children}</View>
);

export const FieldCol = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.fieldCol}>{children}</View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  labelError: { color: '#C0392B' },
  required: { color: '#E74C3C' },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fieldCol: {
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: '#C0392B',
  },
  rightIcon: {
    marginLeft: 8,
  },
  select: {
    justifyContent: 'space-between',
  },
  selectText: { flex: 1, fontSize: 15, color: Colors.textPrimary, marginRight: 8 },
  placeholder: { color: Colors.textPlaceholder },
  menu: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: -6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 12 },
  menuItemText: { fontSize: 14, color: Colors.textSecondary },
  menuItemActive: { color: Colors.primary, fontWeight: '700' },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  consentHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 12,
  },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  radioLabel: { fontSize: 14, color: Colors.textPrimary },
});
