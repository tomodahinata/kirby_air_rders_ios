import { Tabs } from 'expo-router';
import { Compass, History, Settings, Cable, BookOpen } from 'lucide-react-native';

// Icon size for better visibility in automotive context
const ICON_SIZE = 28;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#60a5fa', // primary-400
        tabBarInactiveTintColor: '#64748b', // text-muted
        tabBarStyle: {
          backgroundColor: '#0f172a', // surface-base
          borderTopColor: '#334155', // slate-700
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 14, // Increased from 12px for better readability
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarAccessibilityLabel: 'ホーム画面に移動',
          tabBarIcon: ({ color }) => <Compass size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'ジャーナル',
          tabBarAccessibilityLabel: 'ジャーナル一覧に移動',
          tabBarIcon: ({ color }) => <BookOpen size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'データ同期',
          tabBarAccessibilityLabel: 'データ同期画面に移動',
          tabBarIcon: ({ color }) => <Cable size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          tabBarAccessibilityLabel: '訪問履歴画面に移動',
          tabBarIcon: ({ color }) => <History size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarAccessibilityLabel: '設定画面に移動',
          tabBarIcon: ({ color }) => <Settings size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
