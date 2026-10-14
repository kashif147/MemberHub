import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react-native';
import { TextField } from '../application/formFields';
import { fetchMembersForUser } from '../../services/members.services';
import { Colors } from '../../theme/colors';
import type { Member } from '../../data/mockMembers';
import type { RootState } from '../../store';

type Props = {
  value: Member | null;
  onSelect: (member: Member | null) => void;
  placeholder?: string;
  error?: boolean;
};

/**
 * Typeahead over the officer's scoped members list (same source as Members tab).
 */
const MemberPickerField = ({
  value,
  onSelect,
  placeholder = 'Enter member name or number',
  error,
}: Props) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchMembersForUser(user);
        if (!cancelled) setMembers(result.members);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (value) {
      setQuery(`${value.name}${value.memberNo ? ` (${value.memberNo})` : ''}`);
    }
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || value) return [];
    return members
      .filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.memberNo.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [members, query, value]);

  if (value) {
    return (
      <View style={[styles.selected, error && styles.selectedError]}>
        <Text style={styles.selectedText} numberOfLines={1}>
          {value.name}
          {value.memberNo ? ` (${value.memberNo})` : ''}
        </Text>
        <TouchableOpacity
          onPress={() => {
            onSelect(null);
            setQuery('');
            setOpen(false);
          }}
          hitSlop={8}
          accessibilityLabel="Clear member">
          <X size={16} color={Colors.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TextField
        value={query}
        onChangeText={t => {
          setQuery(t);
          setOpen(true);
        }}
        placeholder={placeholder}
        error={error}
        onFocus={() => setOpen(true)}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : null}
      {open && filtered.length > 0 ? (
        <View style={styles.menu}>
          {filtered.map(m => (
            <TouchableOpacity
              key={m.id}
              style={styles.menuItem}
              onPress={() => {
                onSelect(m);
                setOpen(false);
              }}>
              <Text style={styles.menuName}>{m.name}</Text>
              <Text style={styles.menuMeta}>
                {m.memberNo}
                {m.branch ? ` · ${m.branch}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  selectedError: {
    borderColor: '#C0392B',
  },
  selectedText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginRight: 8,
  },
  loadingRow: {
    marginTop: -8,
    marginBottom: 8,
  },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -8,
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  menuName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default MemberPickerField;
