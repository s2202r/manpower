import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#6B7280',
      headerShown: false,
    }}>
      <Tabs.Screen name="shifts" options={{ title: 'Shifts', tabBarIcon: () => null }} />
      <Tabs.Screen name="checkin" options={{ title: 'Check In', tabBarIcon: () => null }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => null }} />
    </Tabs>
  );
}
