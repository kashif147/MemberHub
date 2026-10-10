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
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import type { Member } from '../data/mockMembers';
import { STACKS } from '../enums/ScreenEnums';
import { fetchMembersForUser } from '../services/members.services';
import { refreshMeProfile } from '../services/auth.services';
import type { AppDispatch, RootState } from '../store';

const FILTER_TABS = ['Active', 'In arrears', 'Lapsed'];

const AvatarBadge = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStyle = () => {
    switch (status) {
      case 'Active':
        return {
          bg: Colors.statusActiveBg,
          text: Colors.statusActiveText,
          bordered: false,
        };
      case 'Lapsed':
        return { bg: Colors.surface, text: Colors.primary, bordered: true };
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
  };
  const s = getStyle();
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: s.bg,
          borderWidth: s.bordered ? 1 : 0,
          borderColor: Colors.border,
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
    style={styles.memberItem}
    activeOpacity={0.7}
    onPress={onPress}>
    <AvatarBadge initials={item.initials} />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={styles.memberMeta}>
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

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (activeFilter === 'In arrears') {
        if (!m.arrears) return false;
      } else if (activeFilter && m.status !== activeFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.memberNo.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [members, activeFilter, search]);

  const role = user?.role || 'Branch Officer';

  return (
    <View style={styles.screen}>
      <Header title="Members" role={role} branch={scopeLabel} />
      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Name or membership no."
              placeholderTextColor={Colors.textPlaceholder}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            onPress={() => loadMembers(true)}>
            <Text style={styles.filterIcon}>⚙</Text>
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
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadMembers(true)}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members match this filter.</Text>
            }
          />
        )}
      </View>
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
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: { fontSize: 16, color: Colors.primary },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
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
    marginBottom: 10,
  },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  separator: { height: 1, backgroundColor: Colors.borderLight },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  memberMeta: { fontSize: 12, color: Colors.textSecondary },
  memberRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  arrears: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
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
