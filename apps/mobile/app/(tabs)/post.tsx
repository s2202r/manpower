import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'

export default function PostTab() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tasks/new')
  }, [router])
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#f59e0b" />
    </View>
  )
}
