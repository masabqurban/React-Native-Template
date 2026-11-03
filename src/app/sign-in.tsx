import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { SignInForm } from '@/features/auth';
import { radius, space, useTheme } from '@/theme';

export default function SignInScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Text weight="700" style={styles.logoText} maxFontSizeMultiplier={1}>
                A
              </Text>
            </View>
            <Text variant="heading" accessibilityRole="header">
              Sign in
            </Text>
            <Text color="muted">Welcome back to Acme.</Text>
          </View>
          <SignInForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xxl },
  brand: { alignItems: 'center', gap: space.sm },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  logoText: { color: '#FFFFFF', fontSize: 28 },
});
