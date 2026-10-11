import { Stack } from 'expo-router'
import { APP_NAME } from '@taim/config'
import { AuthProvider } from '@/lib/auth'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#d97706', headerTitleStyle: { fontWeight: '800' } }}>
          <Stack.Screen name="index" options={{ title: APP_NAME, headerShown: false }} />
          <Stack.Screen name="auth/sign-in" options={{ title: 'Sign in' }} />
          <Stack.Screen name="auth/sign-up" options={{ title: 'Create account' }} />
          <Stack.Screen name="onboarding/language" options={{ title: 'Choose language', headerBackVisible: false }} />
          <Stack.Screen name="onboarding/role" options={{ title: 'How will you use Taim?', headerBackVisible: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tasks/new" options={{ title: 'Post a task', presentation: 'modal' }} />
          <Stack.Screen name="tasks/[id]" options={{ title: 'Task' }} />
          <Stack.Screen name="tasks/[id]/chat" options={{ title: 'Chat' }} />
          <Stack.Screen name="bookings/[id]" options={{ title: 'Booking' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
