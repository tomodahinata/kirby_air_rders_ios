# LLM-Navi Project Standards

## Project Overview

LLM-Navi は、ユーザーの行動記録に基づき最適化された行き先を提案する次世代カーナビゲーションアプリです。

---

## 📚 ドキュメント

| ドキュメント                               | 対象者       | 説明                                                    |
| ------------------------------------------ | ------------ | ------------------------------------------------------- |
| [UI Design Guide](docs/UI_DESIGN_GUIDE.md) | 非エンジニア | Claude Codeを使ったUI変更ガイド、画面とファイルの対応表 |
| このファイル (CLAUDE.md)                   | エンジニア   | 技術仕様、コーディング規約、アーキテクチャ              |

---

## Commands

```bash
# Development
npm start                    # Expo development server
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm run web                  # Web browser

# Quality Assurance
npm run lint                 # ESLint check
npm run lint:fix             # ESLint auto-fix
npm run format               # Prettier format
npm run typecheck            # TypeScript type checking
npm test                     # Jest unit tests
npm run test:watch           # Jest watch mode

# Build
npm run build:ios            # iOS production build
npm run build:android        # Android production build
eas build --platform all     # EAS Build (production)
```

## Tech Stack

| Category       | Library             | Version | Rationale                                      |
| -------------- | ------------------- | ------- | ---------------------------------------------- |
| Framework      | Expo                | ~52     | Managed workflow で迅速な開発、OTA更新対応     |
| Language       | TypeScript          | ~5.3    | 厳格な型安全性、IDE支援の最大化                |
| Routing        | expo-router         | ~4      | ファイルベースルーティング、Next.js ライクなDX |
| Styling        | NativeWind          | ~4      | Tailwind CSS の生産性をRNに適用                |
| State          | Zustand             | ~5      | 軽量・シンプル・TypeScript親和性               |
| Async State    | TanStack Query      | ~5      | キャッシュ・リトライ・楽観的更新               |
| Validation     | Zod                 | ~3.23   | ランタイム型検証、TypeScript型推論             |
| Icons          | lucide-react-native | latest  | 軽量・一貫したアイコンセット                   |
| Secure Storage | expo-secure-store   | ~14     | 機密情報の安全な保存                           |

## Architecture: Feature-Sliced Design (FSD)

```
ai_car/
├── app/                          # Expo Router pages (routes)
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Home/Suggestion screen
│   ├── history/
│   │   └── index.tsx             # 行動履歴画面
│   └── settings/
│       └── index.tsx             # 設定画面
│
├── src/
│   ├── features/                 # Feature modules (ドメイン単位)
│   │   ├── suggestion/           # 行き先提案機能
│   │   │   ├── api/              # API hooks (TanStack Query)
│   │   │   ├── components/       # Feature-specific components
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── store/            # Zustand store slice
│   │   │   ├── types/            # TypeScript types & Zod schemas
│   │   │   └── utils/            # Feature utilities
│   │   │
│   │   └── history/              # 行動履歴機能
│   │       └── ...
│   │
│   ├── shared/                   # 共有リソース
│   │   ├── components/           # 再利用可能UIコンポーネント
│   │   │   ├── ui/               # Atomic: Button, Input, Card, etc.
│   │   │   └── layout/           # Layout components
│   │   ├── hooks/                # 汎用カスタムフック
│   │   ├── lib/                  # 外部ライブラリ設定
│   │   │   ├── queryClient.ts    # TanStack Query client
│   │   │   └── api.ts            # API client base
│   │   ├── constants/            # 定数定義
│   │   ├── types/                # 共通型定義
│   │   └── utils/                # ユーティリティ関数
│   │
│   └── mocks/                    # Mock data & handlers
│       ├── handlers/             # MSW handlers (if needed)
│       └── data/                 # Static mock data
│
├── assets/                       # Static assets (images, fonts)
├── .husky/                       # Git hooks
├── CLAUDE.md                     # This file
├── app.json                      # Expo config
├── tailwind.config.js            # NativeWind config
├── tsconfig.json                 # TypeScript config
└── package.json
```

## Coding Standards

### 1. Naming Conventions

| Type                  | Convention                         | Example                               |
| --------------------- | ---------------------------------- | ------------------------------------- |
| Components            | PascalCase                         | `SuggestionCard.tsx`                  |
| Hooks                 | camelCase with `use` prefix        | `useSuggestions.ts`                   |
| Utils/Functions       | camelCase                          | `formatDistance.ts`                   |
| Types/Interfaces      | PascalCase with descriptive suffix | `SuggestionResponse`, `UserActionLog` |
| Zod Schemas           | camelCase with `Schema` suffix     | `suggestionSchema`                    |
| Constants             | SCREAMING_SNAKE_CASE               | `MAX_SUGGESTIONS`                     |
| Files (non-component) | camelCase                          | `queryClient.ts`                      |

### 2. Component Structure

```tsx
// 1. Imports (grouped: react, external, internal, types, styles)
import { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/shared/components/ui/Card';
import type { Suggestion } from '../types/suggestion';

// 2. Types (if component-specific)
interface SuggestionCardProps {
  suggestion: Suggestion;
  onPress: (id: string) => void;
}

// 3. Component (export at bottom, use memo for optimization)
function SuggestionCardComponent({ suggestion, onPress }: SuggestionCardProps) {
  const handlePress = useCallback(() => {
    onPress(suggestion.id);
  }, [suggestion.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <Card>
        <Text className="text-xl font-bold">{suggestion.destination}</Text>
        <Text className="text-gray-600">{suggestion.reason}</Text>
      </Card>
    </Pressable>
  );
}

// 4. Export with memo
export const SuggestionCard = memo(SuggestionCardComponent);
```

### 3. Type Safety Rules (CRITICAL)

```typescript
// PROHIBITED: any type
const data: any = response; // NEVER DO THIS

// REQUIRED: Use unknown + type guard
const data: unknown = response;
if (isSuggestionResponse(data)) {
  // Now safely typed
}

// REQUIRED: Zod for runtime validation
import { z } from 'zod';

export const suggestionSchema = z.object({
  id: z.string().uuid(),
  destination: z.string().min(1),
  reason: z.string(),
  score: z.number().min(0).max(100),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

// Validate API response
const result = suggestionSchema.safeParse(apiResponse);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### 4. Async Data Handling (TanStack Query)

```typescript
// src/features/suggestion/api/useSuggestions.ts
import { useQuery } from '@tanstack/react-query';
import { suggestionSchema } from '../types/suggestion';

const QUERY_KEYS = {
  suggestions: ['suggestions'] as const,
  suggestionById: (id: string) => ['suggestions', id] as const,
};

export function useSuggestions() {
  return useQuery({
    queryKey: QUERY_KEYS.suggestions,
    queryFn: async () => {
      const response = await fetchSuggestions();
      // Always validate with Zod
      return z.array(suggestionSchema).parse(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```

### 5. State Management (Zustand)

```typescript
// src/features/suggestion/store/suggestionStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SuggestionState {
  selectedId: string | null;
  selectSuggestion: (id: string) => void;
  clearSelection: () => void;
}

export const useSuggestionStore = create<SuggestionState>()(
  devtools(
    persist(
      (set) => ({
        selectedId: null,
        selectSuggestion: (id) => set({ selectedId: id }),
        clearSelection: () => set({ selectedId: null }),
      }),
      { name: 'suggestion-store' }
    )
  )
);
```

### 6. Error Handling

```typescript
// Always wrap async operations
try {
  const data = await fetchData();
  return data;
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network errors (retry logic in TanStack Query)
  }
  if (error instanceof ValidationError) {
    // Log and report invalid API responses
    reportError(error);
  }
  throw error; // Re-throw for ErrorBoundary
}

// Use ErrorBoundary for component-level errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <SuggestionList />
</ErrorBoundary>
```

### 7. Performance Optimization

```typescript
// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={suggestions}
  renderItem={renderSuggestionItem}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>

// Memoize callbacks and expensive computations
const handlePress = useCallback((id: string) => {
  navigation.navigate('detail', { id });
}, [navigation]);

const sortedSuggestions = useMemo(
  () => suggestions.sort((a, b) => b.score - a.score),
  [suggestions]
);
```

### 8. Styling (NativeWind / Tailwind)

```tsx
// Use className for styling (NativeWind)
<View className="flex-1 bg-gray-900 p-4">
  <Text className="text-2xl font-bold text-white">
    {title}
  </Text>
</View>

// For car display: prioritize visibility
// - Large touch targets (min 48x48)
// - High contrast colors
// - Large typography (base 18px+)
<Pressable className="min-h-[64px] bg-blue-600 rounded-xl px-6 py-4 active:bg-blue-700">
  <Text className="text-xl font-semibold text-white text-center">
    ナビを開始
  </Text>
</Pressable>
```

## Import Aliases

```json
// tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/app/*": ["app/*"]
    }
  }
}
```

## Git Commit Convention

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
style: フォーマット変更（コードの動作に影響なし）
docs: ドキュメント更新
test: テスト追加・修正
chore: ビルド・設定変更
perf: パフォーマンス改善
```

## Security Checklist

- [ ] API keys are stored in environment variables (`.env`)
- [ ] Sensitive data uses `expo-secure-store`
- [ ] User input is validated with Zod before processing
- [ ] No secrets committed to git (check `.gitignore`)

## Testing Strategy

```bash
# Unit tests for utils and hooks
src/features/suggestion/utils/__tests__/formatters.test.ts

# Component tests
src/features/suggestion/components/__tests__/SuggestionCard.test.tsx

# Integration tests for API hooks
src/features/suggestion/api/__tests__/useSuggestions.test.ts
```
