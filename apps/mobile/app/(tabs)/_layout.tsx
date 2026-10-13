import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { ActivityIndicator, Text, View } from 'react-native'

export default function TabsLayout() {
  const { session, loading } = useAuth()
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#d97706" /></View>
  if (!session) return <Redirect href="/auth/sign-in" />

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#d97706',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { borderTopColor: '#f3f4f6' },
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: '#d97706',
      headerTitleStyle: { fontWeight: '800' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarLabel: 'Browse' }} />
      <Tabs.Screen name="post" options={{ title: 'Post', tabBarLabel: 'Post', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '700' }}>+</Text> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarLabel: 'Activity' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarLabel: 'Alerts', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔔</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  )
}
