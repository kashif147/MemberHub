import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import MemberHubIcon from '../../components/MemberHubIcon';

const { width: W, height: H } = Dimensions.get('window');

/**
 * Splash 1a — radial-gradient(90% 60% at 70% 10%, #968ae0, #5d5294 55%, #2b2741)
 */
const SplashScreen = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bar, {
          toValue: 0.72,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(bar, {
          toValue: 0.38,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [opacity, bar]);

  return (
    <View style={styles.container}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="splashBg"
            cx={W * 0.7}
            cy={H * 0.1}
            rx={W * 0.9}
            ry={H * 0.6}
            fx={W * 0.7}
            fy={H * 0.1}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#968AE0" />
            <Stop offset="0.55" stopColor="#5D5294" />
            <Stop offset="1" stopColor="#2B2741" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#splashBg)" />
      </Svg>

      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.iconRing}>
          <MemberHubIcon size={132} radiusRatio={0.227} shadowed />
        </View>
        <View style={styles.brand}>
          <Text style={styles.title}>MemberHub</Text>
          <Text style={styles.subtitle}>For representatives</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.footerText}>Securely connecting to CRM</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2741',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 22,
    zIndex: 1,
    marginTop: -24,
  },
  iconRing: {
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  brand: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.32,
    color: '#F5F4FF',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#D2CEFD',
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
  },
  track: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(245,244,255,0.2)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F5F4FF',
  },
  footerText: {
    fontSize: 11,
    color: '#B5ABFC',
  },
});

export default SplashScreen;
