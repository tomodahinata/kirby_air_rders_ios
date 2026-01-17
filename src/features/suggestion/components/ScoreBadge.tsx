import { memo } from 'react';
import { View, Text } from 'react-native';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-yellow-600';
  if (score >= 40) return 'bg-orange-600';
  return 'bg-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '最適';
  if (score >= 80) return 'おすすめ';
  if (score >= 60) return '良好';
  return '';
}

const sizeStyles = {
  sm: { container: 'px-2 py-1', text: 'text-sm' },
  md: { container: 'px-3 py-1.5', text: 'text-base' },
  lg: { container: 'px-4 py-2', text: 'text-lg' },
};

function ScoreBadgeComponent({ score, size = 'md' }: ScoreBadgeProps) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);
  const styles = sizeStyles[size];

  return (
    <View className="flex-row items-center gap-2">
      <View className={`${colorClass} rounded-full ${styles.container}`}>
        <Text className={`font-bold text-white ${styles.text}`}>{score}</Text>
      </View>
      {label && <Text className={`text-gray-400 ${styles.text}`}>{label}</Text>}
    </View>
  );
}

export const ScoreBadge = memo(ScoreBadgeComponent);
