import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { LOCALES, LOCALE_LABELS } from '@taim/i18n'
import { supabase } from '@/lib/supabase'

export default function LanguageScreen() {
  const router = useRouter()

  async function selectLocale(locale: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ preferred_locale: locale }).eq('id', user.id)
    }
    router.replace('/onboarding/role')
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Choose your language</Text>
      <Text style={s.sub}>You can change this later in settings.</Text>
      <FlatList
        data={[...LOCALES]}
        keyExtractor={item => item}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tile} onPress={() => selectLocale(item)}>
            <Text style={s.tileText}>{LOCALE_LABELS[item]}</Text>
            <Text style={s.tileCode}>{item.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  tile: { flex: 1, backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, alignItems: 'center' },
  tileText: { fontSize: 15, fontWeight: '700', color: '#111' },
  tileCode: { fontSize: 11, color: '#d97706', marginTop: 4, fontWeight: '600' },
})
