import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Car, Shield, HelpCircle, ChevronRight, Smartphone } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface SettingsItemProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function SettingsItem({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
}: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 active:bg-slate-50"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-slate-800">{title}</Text>
        {subtitle && <Text className="text-sm text-slate-400 mt-0.5">{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </Pressable>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </Text>
      <View
        className="bg-white rounded-2xl px-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsTab() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-2xl font-bold text-slate-800">設定</Text>
          <Text className="text-base text-slate-500 mt-1">アプリの設定をカスタマイズ</Text>
        </View>

        {/* Profile Section */}
        <View className="px-5 mb-6">
          <Pressable
            className="bg-white rounded-2xl p-4 flex-row items-center active:bg-slate-50"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-2xl font-bold text-white">T</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-slate-800">Taro</Text>
              <Text className="text-sm text-slate-400">プロフィールを編集</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        {/* General Settings */}
        <View className="px-5">
          <SettingsSection title="一般">
            <SettingsItem
              icon={Bell}
              iconColor="#f59e0b"
              iconBgColor="#fef3c7"
              title="通知"
              subtitle="プッシュ通知の設定"
            />
            <View className="h-px bg-slate-100" />
            <SettingsItem
              icon={Smartphone}
              iconColor="#8b5cf6"
              iconBgColor="#ede9fe"
              title="表示設定"
              subtitle="テーマ、フォントサイズ"
            />
          </SettingsSection>

          <SettingsSection title="車載器連携">
            <SettingsItem
              icon={Car}
              iconColor="#3b82f6"
              iconBgColor="#dbeafe"
              title="車載器設定"
              subtitle="接続先の変更、ペアリング"
            />
          </SettingsSection>

          <SettingsSection title="プライバシーとセキュリティ">
            <SettingsItem
              icon={Shield}
              iconColor="#22c55e"
              iconBgColor="#dcfce7"
              title="プライバシー"
              subtitle="データの管理、位置情報"
            />
          </SettingsSection>

          <SettingsSection title="サポート">
            <SettingsItem
              icon={HelpCircle}
              iconColor="#64748b"
              iconBgColor="#f1f5f9"
              title="ヘルプとサポート"
              subtitle="よくある質問、お問い合わせ"
            />
          </SettingsSection>

          {/* App Info */}
          <View className="items-center mt-4 mb-8">
            <Text className="text-sm text-slate-400">LLM-Navi v1.0.0</Text>
            <Text className="text-xs text-slate-300 mt-1">© 2024 AI Car Team</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
