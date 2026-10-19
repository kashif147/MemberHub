import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

type Props = {
  size?: number;
  style?: ViewStyle;
  /** Corner radius as a fraction of size (iOS app-icon feel). */
  radiusRatio?: number;
  /** Soft drop shadow around the mark. */
  shadowed?: boolean;
};

/**
 * Exact MemberHub mark from onboarding HTML (#mhIcon):
 * purple gradient · pearl shield · person · verified check.
 */
const MemberHubIcon = ({
  size = 72,
  style,
  radiusRatio = 0.227,
  shadowed = true,
}: Props) => {
  const radius = Math.round(size * radiusRatio);
  const uid = React.useId().replace(/:/g, '');

  return (
    <View
      style={[
        styles.wrap,
        shadowed && styles.shadow,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style,
      ]}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id={`bgA-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#9a8ef0" />
            <Stop offset="1" stopColor="#3d3470" />
          </LinearGradient>
          <RadialGradient id={`glow-${uid}`} cx="0.72" cy="0.18" r="0.75">
            <Stop offset="0" stopColor="#e7e5fe" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#e7e5fe" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`gloss2-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`pearl-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="0.6" stopColor="#e7e5fe" />
            <Stop offset="1" stopColor="#b5abfc" />
          </LinearGradient>
          <LinearGradient id={`ink-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#796cbf" />
            <Stop offset="1" stopColor="#2b2741" />
          </LinearGradient>
        </Defs>

        <Rect width="512" height="512" fill={`url(#bgA-${uid})`} />
        <Rect width="512" height="512" fill={`url(#glow-${uid})`} />

        <Path
          d="M256 84 L398 134 V250 C398 342 334 398 256 428 C178 398 114 342 114 250 V134 Z"
          fill={`url(#pearl-${uid})`}
        />
        <Circle cx="256" cy="218" r="42" fill={`url(#ink-${uid})`} />
        <Path
          d="M176 346 C184 294 218 274 256 274 C294 274 328 294 336 346 Z"
          fill={`url(#ink-${uid})`}
        />
        <Path
          d="M256 84 L398 134 V214 C330 234 182 234 114 214 V134 Z"
          fill={`url(#gloss2-${uid})`}
          opacity={0.75}
        />

        <Circle
          cx="360"
          cy="364"
          r="58"
          fill={`url(#ink-${uid})`}
          stroke="#f5f4ff"
          strokeWidth="12"
        />
        <Path
          d="M332 364 L352 384 L390 344"
          fill="none"
          stroke="#fff"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path
          d="M0 0H512V200C372 246 140 246 0 200Z"
          fill={`url(#gloss-${uid})`}
          opacity={0.7}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#1B1730',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
});

export default MemberHubIcon;
