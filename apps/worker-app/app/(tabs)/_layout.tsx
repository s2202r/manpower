import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
      <Text style={tabIconStyles.emoji}>{emoji}</Text>
      <Text style={[tabIconStyles.label, focused && tabIconStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 4 },
  wrapActive: {},
  emoji: { fontSize: 22 },
  label: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  labelActive: { color: '#1D4ED8', fontWeight: '700' },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: {
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="shifts"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Shifts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📍" label="Check In" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Earnings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
