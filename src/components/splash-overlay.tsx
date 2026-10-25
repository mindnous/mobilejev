import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

/** Shows the logo over the app while it starts (same as the native splash screen) for 1.5 s, then fades out. */
export function SplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  if (!visible) return null;

  function fadeOut() {
    SplashScreen.hideAsync().finally(() =>
      Animated.timing(opacity, { toValue: 0, duration: 400, delay: 1500, useNativeDriver: true }).start(() =>
        setVisible(false)
      )
    );
  }

  return (
    <Animated.View onLayout={fadeOut} pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.author}>by Folksagent</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    // index.png is 1913x466. The native splash (splash-logo.png) is plain white: Android's round splash mask
    // would cut off a logo this wide.
    width: 240 * 0.62 * 1.2,
    height: (240 * 0.62 * 1.2 * 466) / 1913,
  },
  author: {
    position: 'absolute',
    bottom: 48,
    color: '#000000',
  },
});
