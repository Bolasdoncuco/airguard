import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';

function MainLayout() {
  const { userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!userId && !inAuthGroup) {
      router.replace('/login');
    } else if (userId && inAuthGroup) {
      router.replace('/');
    }
  }, [userId, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <MainLayout />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
