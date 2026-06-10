import { Tabs, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C0392B',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee' },
        headerStyle: { backgroundColor: '#C0392B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="turno"
        options={{ title: 'Mi Turno', tabBarLabel: 'Turno' }}
      />
      <Tabs.Screen
        name="bitacora"
        options={{ title: 'Bitácora', tabBarLabel: 'Bitácora' }}
      />
      <Tabs.Screen
        name="grafico"
        options={{ title: 'Gráfico Mensual', tabBarLabel: 'Gráfico' }}
      />
      <Tabs.Screen
        name="gps"
        options={{ title: 'GPS', tabBarLabel: 'GPS' }}
      />
      <Tabs.Screen
        name="sync"
        options={{ title: 'Sincronización', tabBarLabel: 'Sync' }}
      />
    </Tabs>
  );
}
