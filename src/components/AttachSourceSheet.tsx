import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Camera, Image as ImageIcon, Paperclip } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import type { AttachSource } from '../helpers/documentPicker.helper';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: AttachSource) => void;
};

const OPTIONS: Array<{
  key: AttachSource;
  label: string;
  Icon: typeof Camera;
}> = [
  { key: 'camera', label: 'Camera', Icon: Camera },
  { key: 'photos', label: 'Photos', Icon: ImageIcon },
  { key: 'files', label: 'Files', Icon: Paperclip },
];

/** Figma attach source sheet — Camera / Photos / Files. */
const AttachSourceSheet = ({ visible, onClose, onSelect }: Props) => {
  const [presented, setPresented] = useState(false);
  const closingRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    closingRef.current = false;
    slideAnim.setValue(280);
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
  }, [backdropAnim, slideAnim]);

  const dismiss = useCallback(
    (after?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 280,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPresented(false);
        onClose();
        // Defer picker presentation until Modal is fully unmounted
        setTimeout(() => after?.(), 100);
      });
    },
    [backdropAnim, onClose, slideAnim],
  );

  useEffect(() => {
    if (visible) {
      setPresented(true);
      animateIn();
    } else if (presented) {
      dismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!presented) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => dismiss()}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropAnim }]}
          />
        </Pressable>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={styles.option}
              activeOpacity={0.75}
              onPress={() => dismiss(() => onSelect(opt.key))}>
              <View style={styles.iconCircle}>
                <opt.Icon size={20} color={Colors.textPrimary} strokeWidth={2} />
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});

export default AttachSourceSheet;
