import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { NoticeBanner } from '@/components/notice-banner';
import { SettingsButton } from '@/components/settings-button';
import { SplashOverlay } from '@/components/splash-overlay';
import { ModelProvider } from '@/lib/model';
import { SettingsProvider } from '@/lib/settings';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SettingsProvider>
        <ModelProvider>
          <SplashOverlay />
          <AppTabs />
          <SettingsButton />
          <NoticeBanner />
        </ModelProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
