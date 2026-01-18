import { Tabs } from 'expo-router';
import { Compass, History, Settings, Cable, BookOpen } from 'lucide-react-native';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

// Icon size for better visibility in automotive context
const ICON_SIZE = 26;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6', // primary-500
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.92)' : '#ffffff',
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 24,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarAccessibilityLabel: 'ホーム画面に移動',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'ジャーナル',
          tabBarAccessibilityLabel: 'ジャーナル一覧に移動',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'データ同期',
          tabBarAccessibilityLabel: 'データ同期画面に移動',
          tabBarIcon: ({ color, focused }) => (
            <Cable size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          tabBarAccessibilityLabel: '訪問履歴画面に移動',
          tabBarIcon: ({ color, focused }) => (
            <History size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarAccessibilityLabel: '設定画面に移動',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={ICON_SIZE} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
