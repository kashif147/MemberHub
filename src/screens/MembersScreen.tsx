import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import type { Member } from '../data/mockMembers';
import { STACKS } from '../enums/ScreenEnums';
import { fetchMembersForUser } from '../services/members.services';
import { refreshMeProfile } from '../services/auth.services';
import MembersFiltersSheet, {
  EMPTY_ADVANCED_FILTERS,
  type MembersAdvancedFilters,
} from '../modules/members/MembersFiltersSheet';
import type { AppDispatch, RootState } from '../store';

const FILTER_TABS = ['Active', 'In arrears', 'Lapsed'] as const;

const uniqueSorted = (values: Array<string | null | undefined>) =>
  [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );

const matchesAdvanced = (m: Member, f: MembersAdvancedFilters) => {
  if (f.status !== 'Any' && m.status !== f.status) return false;
  if (f.payment !== 'Any' && (m.paymentMethod || '') !== f.payment) return false;
  if (f.grade !== 'Any' && (m.grade || m.role || '') !== f.grade) return false;
  if (f.workLocation !== 'Any' && (m.branch || '') !== f.workLocation) {
    return false;
  }
  if (f.branch !== 'Any' && (m.branch || '') !== f.branch) return false;
  // Region not on Member row yet — keep filter UI; no-op until API returns it
  if (f.region !== 'Any') {
    const region = (m as any).region || '';
    if (region && region !== f.region) return false;
  }
  return true;
};

const AvatarBadge = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const s = (() => {
    switch (status) {
      case 'Active':
        return {
          bg: Colors.statusActiveBg,
          text: Colors.statusActiveText,
          bordered: false,
        };
      case 'Lapsed':
        return {
          bg: Colors.surface,
          text: Colors.primary,
          bordered: true,
        };
      case 'Resigned':
        return {
          bg: Colors.statusClosedBg,
          text: Colors.statusClosed,
          bordered: false,
        };
      default:
        return {
          bg: Colors.statusActiveBg,
          text: Colors.statusActiveText,
          bordered: false,
        };
    }
  })();

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: s.bg,
          borderWidth: s.bordered ? 1 : 0,
          borderColor: Colors.primary,
        },
      ]}>
      <Text style={[styles.statusBadgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

const MemberItem = ({
  item,
  onPress,
}: {
  item: Member;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.memberCard}
    activeOpacity={0.75}
    onPress={onPress}>
    <AvatarBadge initials={item.initials} />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.memberMeta} numberOfLines={2}>
        {item.memberNo} · {item.role} · {item.branch}
      </Text>
    </View>
    <View style={styles.memberRight}>
      <StatusBadge status={item.status} />
      {item.arrears ? <Text style={styles.arrears}>{item.arrears}</Text> : null}
    </View>
  </TouchableOpacity>
);

const MembersScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [activeFilter, setActiveFilter] = useState<string | null>('Active');
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState<MembersAdvancedFilters>(
    EMPTY_ADVANCED_FILTERS,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [scopeLabel, setScopeLabel] = useState(
    user?.branches || 'Assigned locations',
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        let activeUser = user;
        const missingScope =
          !activeUser?.workLocations?.length &&
          !activeUser?.branchFilters?.length &&
          !activeUser?.regionFilters?.length;
        if (missingScope || isRefresh) {
          const me = await dispatch(refreshMeProfile());
          if (me) activeUser = me;
        }

        const result = await fetchMembersForUser(activeUser);
        setMembers(result.members);
        setTotalCount(result.totalCount);
        setScopeLabel(
          result.scopeLabel || activeUser?.branches || 'Assigned locations',
        );
        if (
          !result.filters.workLocation &&
          !result.filters.branch &&
          !result.filters.region
        ) {
          setError(
            'No work location on your profile. Members are filtered by your /me assignedLocations.',
          );
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to load members');
        setMembers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, dispatch],
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const applyClientFilters = useCallback(
    (list: Member[], tab: string | null, q: string, adv: MembersAdvancedFilters) =>
      list.filter(m => {
        if (tab === 'In arrears') {
          if (!m.arrears) return false;
        } else if (tab && m.status !== tab) {
          return false;
        }
        if (q) {
          const query = q.toLowerCase();
          if (
            !m.name.toLowerCase().includes(query) &&
            !m.memberNo.toLowerCase().includes(query)
          ) {
            return false;
          }
        }
        return matchesAdvanced(m, adv);
      }),
    [],
  );

  const filtered = useMemo(
    () => applyClientFilters(members, activeFilter, search, advanced),
    [members, activeFilter, search, advanced, applyClientFilters],
  );

  const filterOptions = useMemo(
    () => ({
      status: uniqueSorted(members.map(m => m.status)),
      payment: uniqueSorted(members.map(m => m.paymentMethod)),
      grade: uniqueSorted(members.map(m => m.grade || m.role)),
      workLocation: uniqueSorted(members.map(m => m.branch)),
      branch: uniqueSorted([
        ...members.map(m => m.branch),
        ...(user?.branchFilters || []),
      ]),
      region: uniqueSorted(user?.regionFilters || []),
    }),
    [members, user?.branchFilters, user?.regionFilters],
  );

  const previewCountFor = useCallback(
    (draft: MembersAdvancedFilters) =>
      applyClientFilters(members, activeFilter, search, draft).length,
    [members, activeFilter, search, applyClientFilters],
  );

  const role = user?.role || 'Branch Officer';

  return (
    <View style={styles.screen}>
      <Header title="Members" role={role} branch={scopeLabel} />
      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Name or membership no."
              placeholderTextColor={Colors.textPlaceholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filtersOpen && styles.filterBtnActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setFiltersOpen(true)}>
            <SlidersHorizontal
              size={18}
              color={Colors.primary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.chip, activeFilter === tab && styles.chipActive]}
              onPress={() =>
                setActiveFilter(activeFilter === tab ? null : tab)
              }
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.chipText,
                  activeFilter === tab && styles.chipTextActive,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.countText}>
          {filtered.length} of {totalCount || members.length} members in{' '}
          {scopeLabel}
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.hint}>Loading members…</Text>
          </View>
        ) : error && members.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadMembers()}
              activeOpacity={0.7}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MemberItem
                item={item}
                onPress={() =>
                  navigation.navigate(STACKS.MEMBER_DETAIL, {
                    memberId: item.id,
                    member: item,
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadMembers(true)}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No members match this filter.
              </Text>
            }
          />
        )}
      </View>

      <MembersFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={advanced}
        onApply={setAdvanced}
        getResultCount={previewCountFor}
        options={filterOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  countText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  listContent: { paddingBottom: 40, gap: 10, flexGrow: 1 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  memberMeta: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  memberRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  arrears: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  hint: { fontSize: 13, color: Colors.textSecondary },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: { color: Colors.primary, fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});

export default MembersScreen;
