import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#f9fafb' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: '新しい記録',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '記録の詳細',
        }}
      />
    </Stack>
  );
}
