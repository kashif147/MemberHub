import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export type MembersAdvancedFilters = {
  status: string;
  payment: string;
  grade: string;
  workLocation: string;
  branch: string;
  region: string;
};

export const EMPTY_ADVANCED_FILTERS: MembersAdvancedFilters = {
  status: 'Any',
  payment: 'Any',
  grade: 'Any',
  workLocation: 'Any',
  branch: 'Any',
  region: 'Any',
};

type FilterKey = keyof MembersAdvancedFilters;

type Props = {
  visible: boolean;
  onClose: () => void;
  value: MembersAdvancedFilters;
  onApply: (next: MembersAdvancedFilters) => void;
  /** Live count for current draft filters */
  getResultCount: (draft: MembersAdvancedFilters) => number;
  options: {
    status: string[];
    payment: string[];
    grade: string[];
    workLocation: string[];
    branch: string[];
    region: string[];
  };
};

const ROWS: { key: FilterKey; label: string }[] = [
  { key: 'status', label: 'Status' },
  { key: 'payment', label: 'Payment' },
  { key: 'grade', label: 'Grade' },
  { key: 'workLocation', label: 'Work location' },
  { key: 'branch', label: 'Branch' },
  { key: 'region', label: 'Region' },
];

const FilterDropdown = ({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.dropdownCol}>
      <TouchableOpacity
        style={styles.dropdown}
        activeOpacity={0.8}
        onPress={onToggle}>
        <Text style={styles.dropdownText} numberOfLines={1}>
          {value}
        </Text>
        <ChevronDown size={16} color={Colors.textMuted} strokeWidth={2} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.menu}>
          <ScrollView style={styles.menuScroll} nestedScrollEnabled>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={styles.menuItem}
                onPress={() => onSelect(opt)}>
                <Text
                  style={[
                    styles.menuItemText,
                    opt === value && styles.menuItemActive,
                  ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  </View>
);

const MembersFiltersSheet = ({
  visible,
  onClose,
  value,
  onApply,
  getResultCount,
  options,
}: Props) => {
  const [draft, setDraft] = useState(value);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setOpenKey(null);
    }
  }, [visible, value]);

  const resultCount = getResultCount(draft);

  const optionMap = useMemo(
    () => ({
      status: ['Any', ...options.status.filter(v => v && v !== 'Any')],
      payment: ['Any', ...options.payment.filter(v => v && v !== 'Any')],
      grade: ['Any', ...options.grade.filter(v => v && v !== 'Any')],
      workLocation: [
        'Any',
        ...options.workLocation.filter(v => v && v !== 'Any'),
      ],
      branch: ['Any', ...options.branch.filter(v => v && v !== 'Any')],
      region: ['Any', ...options.region.filter(v => v && v !== 'Any')],
    }),
    [options],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <TouchableOpacity
            onPress={() => {
              setDraft(EMPTY_ADVANCED_FILTERS);
              setOpenKey(null);
            }}
            hitSlop={8}>
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}>
          {ROWS.map(row => (
            <FilterDropdown
              key={row.key}
              label={row.label}
              value={draft[row.key]}
              options={optionMap[row.key]}
              open={openKey === row.key}
              onToggle={() =>
                setOpenKey(prev => (prev === row.key ? null : row.key))
              }
              onSelect={v => {
                setDraft(prev => ({ ...prev, [row.key]: v }));
                setOpenKey(null);
              }}
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.applyBtn}
          activeOpacity={0.85}
          onPress={() => {
            onApply(draft);
            onClose();
          }}>
          <Text style={styles.applyBtnText}>
            Show {resultCount} member{resultCount === 1 ? '' : 's'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.35)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: 10,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  clearAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sheetBody: {
    paddingBottom: 12,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    width: 110,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    paddingTop: 14,
  },
  dropdownCol: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  menu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: 160,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuItemActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  applyBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default MembersFiltersSheet;
