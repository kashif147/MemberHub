import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import {
  Search,
  Paperclip,
  User,
  ArrowRight,
  Check,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PAGE_PAD = 20;
const HERO_W = SCREEN_W - PAGE_PAD * 2;

/** Light theme — MemberHub Onboarding HTML */
const C = {
  bg: '#F4F5FA',
  surface: '#FCFCFF',
  text: '#292B31',
  accent: '#6A5DC0',
  accent800: '#E7E5FE',
  accent900: '#F5F4FF',
  accent300: '#D2CEFD',
  neutral300: '#595D6C',
  neutral400: '#75798C',
  neutral700: '#CFD3E5',
  neutral800: '#E4E7F5',
  divider: 'rgba(41,43,49,0.12)',
};

type Slide = {
  key: string;
  title: string;
  body: string;
  cta: string;
  visual: 'members' | 'cases' | 'drives';
};

const SLIDES: Slide[] = [
  {
    key: 'members',
    title: 'Your members, at a glance',
    body: 'Search the members in your region, branch or work locations. See membership and payment status before you talk to them.',
    cta: 'Next',
    visual: 'members',
  },
  {
    key: 'cases',
    title: 'Raise a case on the spot',
    body: 'Log a case for a member, or as the complainant yourself. Add photos and documents, and it goes straight to the CRM.',
    cta: 'Next',
    visual: 'cases',
  },
  {
    key: 'drives',
    title: 'Sign up members anywhere',
    body: 'Run membership drives, register new members or rejoin lapsed ones, and capture their signature on your phone.',
    cta: 'Get started',
    visual: 'drives',
  },
];

const PEOPLE = [
  {
    i: 'AB',
    n: 'Aoife Brennan',
    sub: 'Staff Nurse · Beaumont ED',
    st: 'Active',
    kind: 'accent' as const,
  },
  {
    i: 'CD',
    n: 'Ciarán Doyle',
    sub: 'CNM2 · Beaumont ED',
    st: '€61.40',
    kind: 'outline' as const,
  },
  {
    i: 'SM',
    n: 'Sinéad Murphy',
    sub: 'Staff Midwife · ICU',
    st: 'Lapsed',
    kind: 'neutral' as const,
  },
];

const Tag = ({
  label,
  kind,
}: {
  label: string;
  kind: 'accent' | 'neutral' | 'outline';
}) => (
  <View
    style={[
      styles.tag,
      kind === 'accent' && styles.tagAccent,
      kind === 'neutral' && styles.tagNeutral,
      kind === 'outline' && styles.tagOutline,
    ]}>
    <Text
      style={[
        styles.tagText,
        kind === 'accent' && styles.tagTextAccent,
        kind === 'neutral' && styles.tagTextNeutral,
        kind === 'outline' && styles.tagTextOutline,
      ]}>
      {label}
    </Text>
  </View>
);

/** radial-gradient(100% 80% at 80% 0%, #d2cefd, #e7e5fe 55%, #f5f4ff) */
const HeroGradient = ({ height, gradId }: { height: number; gradId: string }) => (
  <Svg
    width={HERO_W}
    height={Math.max(height, 1)}
    style={StyleSheet.absoluteFill}
    pointerEvents="none">
    <Defs>
      <RadialGradient
        id={gradId}
        cx={HERO_W * 0.8}
        cy={0}
        rx={HERO_W}
        ry={Math.max(height, 1) * 0.8}
        fx={HERO_W * 0.8}
        fy={0}
        gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#D2CEFD" />
        <Stop offset="0.55" stopColor="#E7E5FE" />
        <Stop offset="1" stopColor="#F5F4FF" />
      </RadialGradient>
    </Defs>
    <Rect
      width={HERO_W}
      height={Math.max(height, 1)}
      rx={28}
      ry={28}
      fill={`url(#${gradId})`}
    />
  </Svg>
);

const MembersVisual = () => (
  <View style={styles.visualCol}>
    <View style={styles.searchInput}>
      <Search size={16} color={C.neutral400} strokeWidth={2} />
      <Text style={styles.searchPlaceholder}>Search members</Text>
    </View>
    <View style={styles.tagRow}>
      <Tag label="Beaumont" kind="accent" />
      <Tag label="In arrears" kind="neutral" />
    </View>
    {PEOPLE.map(p => (
      <View key={p.i} style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{p.i}</Text>
        </View>
        <View style={styles.memberMeta}>
          <Text style={styles.memberName} numberOfLines={1}>
            {p.n}
          </Text>
          <Text style={styles.memberSub} numberOfLines={1}>
            {p.sub}
          </Text>
        </View>
        <Tag label={p.st} kind={p.kind} />
      </View>
    ))}
  </View>
);

const CasesVisual = () => (
  <View style={styles.visualCol}>
    <View style={styles.caseCard}>
      <Text style={styles.kicker}>New case</Text>
      <View style={styles.tagRow}>
        <Tag label="A member" kind="accent" />
        <Tag label="Myself" kind="neutral" />
      </View>
      <View style={styles.memberLine}>
        <User size={16} color={C.accent} strokeWidth={2} />
        <Text style={styles.memberLineText}>Ciarán Doyle · B00237</Text>
      </View>
      <Text style={styles.caseSubject}>Pay & conditions</Text>
      <View style={[styles.skeleton, { width: '90%' }]} />
      <View style={[styles.skeleton, { width: '70%' }]} />
      <View style={styles.attachLine}>
        <Paperclip size={14} color={C.neutral400} strokeWidth={2} />
        <Text style={styles.attachText}>roster_aug.pdf</Text>
      </View>
    </View>
    <View style={styles.toastCard}>
      <View style={styles.checkBadge}>
        <Check size={12} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text style={styles.toastText}>CS-24045 sent to CRM</Text>
    </View>
  </View>
);

const DrivesVisual = () => (
  <View style={styles.visualCol}>
    <View style={styles.caseCard}>
      <View style={styles.driveTop}>
        <Text style={styles.kicker}>Drive</Text>
        <Tag label="Live" kind="accent" />
      </View>
      <Text style={styles.driveTitle}>Beaumont ED – Autumn</Text>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
      <Text style={styles.driveMeta}>17 of 30 target · 4 rejoins</Text>
    </View>
    <View style={styles.signCard}>
      <Text style={styles.signLabel}>Applicant signature</Text>
      <View style={styles.signBox}>
        <Text style={styles.signature}>Laura H.</Text>
      </View>
    </View>
  </View>
);

const Visual = ({ kind }: { kind: Slide['visual'] }) => {
  if (kind === 'members') return <MembersVisual />;
  if (kind === 'cases') return <CasesVisual />;
  return <DrivesVisual />;
};

type Props = {
  onFinished: () => void;
};

const OnboardingScreen = ({ onFinished }: Props) => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [heroH, setHeroH] = useState(360);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      onFinished();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 },
      ]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onFinished} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: SCREEN_W }]}>
            <View
              style={styles.hero}
              onLayout={e => setHeroH(e.nativeEvent.layout.height)}>
              <HeroGradient height={heroH} gradId={`hero-${item.key}`} />
              <Visual kind={item.visual} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.cta}
          onPress={goNext}
          activeOpacity={0.85}
          accessibilityRole="button">
          <Text style={styles.ctaText}>{SLIDES[index].cta}</Text>
          <ArrowRight size={16} color={C.accent} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: PAGE_PAD,
    paddingTop: 4,
    paddingBottom: 4,
    minHeight: 36,
  },
  skip: {
    fontSize: 13,
    fontWeight: '500',
    color: C.neutral400,
  },
  list: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: PAGE_PAD,
  },
  hero: {
    flex: 1,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: C.accent900,
  },
  visualCol: {
    width: '100%',
    gap: 8,
    zIndex: 1,
  },
  searchInput: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: C.neutral400,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagAccent: {
    backgroundColor: C.accent800,
  },
  tagNeutral: {
    backgroundColor: C.neutral800,
  },
  tagOutline: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accent,
  },
  tagText: {
    fontSize: 11,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  tagTextAccent: {
    color: '#2B2741',
  },
  tagTextNeutral: {
    color: C.text,
  },
  tagTextOutline: {
    color: C.accent,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.neutral800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
  },
  memberMeta: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  memberSub: {
    fontSize: 11,
    color: C.neutral400,
  },
  caseCard: {
    padding: 16,
    gap: 10,
    borderRadius: 12,
    backgroundColor: C.surface,
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.accent,
    fontWeight: '500',
  },
  memberLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberLineText: {
    fontSize: 13,
    color: C.text,
  },
  caseSubject: {
    fontSize: 13,
    color: C.neutral300,
  },
  skeleton: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.neutral800,
  },
  attachLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachText: {
    fontSize: 12,
    color: C.neutral400,
  },
  toastCard: {
    alignSelf: 'flex-end',
    width: '82%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driveTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.neutral800,
    overflow: 'hidden',
  },
  progressFill: {
    width: '57%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  driveMeta: {
    fontSize: 11,
    color: C.neutral400,
  },
  signCard: {
    padding: 14,
    gap: 8,
    borderRadius: 12,
    backgroundColor: C.surface,
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  signLabel: {
    fontSize: 11,
    color: C.neutral400,
  },
  signBox: {
    height: 56,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.neutral700,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  signature: {
    fontSize: 26,
    fontStyle: 'italic',
    color: C.accent300,
    fontFamily: 'Georgia',
  },
  copy: {
    paddingTop: 28,
    paddingBottom: 4,
    paddingHorizontal: 8,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 32,
    color: C.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: C.neutral300,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: C.accent,
  },
  dotIdle: {
    width: 6,
    backgroundColor: C.neutral700,
  },
  cta: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: C.surface,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.accent,
  },
});

export default OnboardingScreen;
