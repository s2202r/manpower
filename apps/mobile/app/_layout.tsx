import { Stack } from 'expo-router'
import { APP_NAME } from '@taim/config'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: APP_NAME }} />
      <Stack.Screen name="auth/sign-in" options={{ title: 'Sign in' }} />
      <Stack.Screen name="auth/sign-up" options={{ title: 'Create account' }} />
    </Stack>
  )
}
