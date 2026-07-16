import '@/global.css';
import '@/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { useDbMigrations } from '@/db/migrate';
import { seedSupplementsIfEmpty } from '@/db/seed';
import { ThemeProvider, useTheme } from '@/theme';

function Centered({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        backgroundColor: colors.bg,
      }}
    >
      {children}
    </View>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const { name, colors } = useTheme();
  const { success, error } = useDbMigrations();

  useEffect(() => {
    if (success) seedSupplementsIfEmpty(db);
  }, [success]);

  if (error) {
    return (
      <Centered>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{t('errors.dbTitle')}</Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{error.message}</Text>
      </Centered>
    );
  }

  if (!success) {
    return (
      <Centered>
        <ActivityIndicator color={colors.primary} />
      </Centered>
    );
  }

  return (
    <>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dodaj" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="uredi/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="recepti/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
