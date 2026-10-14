import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import {
  FolderPlus,
  UserPlus,
  Megaphone,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface CreateSheetProps {
  visible: boolean;
  onClose: () => void;
  onNewCase?: () => void;
  onRegisterMember?: () => void;
  onNewDrive?: () => void;
  onRejoinMember?: () => void;
}

const CreateOption = ({
  Icon,
  title,
  subtitle,
  onPress,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.option} activeOpacity={0.75} onPress={onPress}>
    <View style={styles.optionIcon}>
      <Icon size={20} color={Colors.primary} strokeWidth={2.1} />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const CreateSheet: React.FC<CreateSheetProps> = ({
  visible,
  onClose,
  onNewCase,
  onRegisterMember,
  onNewDrive,
  onRejoinMember,
}) => {
  const [presented, setPresented] = useState(false);
  const closingRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    closingRef.current = false;
    slideAnim.setValue(320);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const finishClose = useCallback(
    (after?: () => void) => {
      setPresented(false);
      closingRef.current = false;
      onClose();
      after?.();
    },
    [onClose],
  );

  const animateOut = useCallback(
    (after?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 320,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          finishClose(after);
        } else {
          closingRef.current = false;
        }
      });
    },
    [slideAnim, backdropAnim, finishClose],
  );

  useEffect(() => {
    if (visible) {
      setPresented(true);
      animateIn();
      return;
    }
    if (presented && !closingRef.current) {
      animateOut();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = (after?: () => void) => {
    if (!presented) {
      onClose();
      after?.();
      return;
    }
    animateOut(after);
  };

  return (
    <Modal
      transparent
      visible={presented}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss()}>
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={() => dismiss()} hitSlop={8}>
            <View style={styles.handle} />
          </Pressable>

          <Text style={styles.sheetTitle}>Create</Text>

          <View style={styles.optionsList}>
            <CreateOption
              Icon={FolderPlus}
              title="New case"
              subtitle="For a member, or with you as complainant"
              onPress={() => dismiss(onNewCase)}
            />
            <CreateOption
              Icon={UserPlus}
              title="Register a member"
              subtitle="New application, tagged to Beaumont ED – Autumn drive"
              onPress={() => dismiss(onRegisterMember)}
            />
            <CreateOption
              Icon={Megaphone}
              title="New membership drive"
              subtitle="Set up a drive for your work locations"
              onPress={() => dismiss(onNewDrive)}
            />
            <CreateOption
              Icon={RotateCcw}
              title="Rejoin a lapsed member"
              subtitle="Find them first, then prefill"
              onPress={() => dismiss(onRejoinMember)}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.black,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 14,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});

export default CreateSheet;
