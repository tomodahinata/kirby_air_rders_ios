# UI Design Guide for Non-Engineers

**このドキュメントは、プログラミング経験がない方がClaude Codeを使ってUIを変更するためのガイドです。**

---

## Claude Code への指示の仕方

Claude Codeに作業を依頼するときは、以下のように **具体的に** 伝えてください。

### 良い指示の例

```
「おすすめ画面の背景色を青から緑に変えてください」
「設定画面のボタンをもっと大きくしてください」
「履歴画面に表示されるカードの角を丸くしてください」
「SuggestionCard の文字サイズを大きくしてください」
```

### 悪い指示の例

```
「いい感じにして」       → どこを何に変えるか不明
「おしゃれにして」       → 具体的な変更内容がない
「全体的に直して」       → 範囲が広すぎる
```

---

## よくある変更パターン

以下の表をコピペして、〇〇の部分を変えるだけで指示できます。

| やりたいこと       | Claude Code への指示例                                           |
| ------------------ | ---------------------------------------------------------------- |
| 色を変えたい       | 「〇〇画面の背景色を `#1a1a2e` に変更してください」              |
| 文字を変えたい     | 「〇〇カードのタイトルを『おすすめスポット』に変更してください」 |
| サイズを変えたい   | 「〇〇ボタンの高さを64pxに変更してください」                     |
| 余白を調整したい   | 「〇〇カードの内側の余白を16pxに変更してください」               |
| 角を丸くしたい     | 「〇〇の角の丸みを12pxに変更してください」                       |
| 要素を消したい     | 「〇〇画面から△△を非表示にしてください」                         |
| アイコンを変えたい | 「〇〇のアイコンをハートマークに変更してください」               |

---

## 色の指定方法

色は以下のどちらかで指定できます：

- **カラーコード**: `#FF5733`, `#1a1a2e` など
- **色の名前**: `赤`, `青`, `緑`, `白`, `黒` など（日本語OK）

### よく使う色の例

| 色の名前       | カラーコード | 用途例           |
| -------------- | ------------ | ---------------- |
| ダークネイビー | `#0f172a`    | 背景色           |
| スレートグレー | `#1e293b`    | カード背景       |
| ブルー         | `#3b82f6`    | アクセントカラー |
| グリーン       | `#22c55e`    | 成功・完了       |
| レッド         | `#ef4444`    | エラー・警告     |
| ホワイト       | `#ffffff`    | 明るい文字       |
| グレー         | `#94a3b8`    | 補足テキスト     |

---

## 画面の呼び方

| タブ名        | 画面の役割           | 指示で使う名前                                |
| ------------- | -------------------- | --------------------------------------------- |
| 🧭 おすすめ   | AIが行き先を提案する | 「おすすめ画面」「ホーム画面」「Copilot画面」 |
| 🔗 データ同期 | 車とデータを同期する | 「同期画面」「Sync画面」                      |
| 📜 履歴       | 過去の行動履歴を見る | 「履歴画面」「History画面」                   |
| ⚙️ 設定       | アプリの設定を変える | 「設定画面」「Settings画面」                  |

---

## 画面とファイルの対応表 (Implementation Map)

「どのファイルを触れば、どの画面が変わるか」の対応表です。
Claude Codeに指示するときにファイル名を伝えると、より正確に作業できます。

### 画面ファイル（ルーティング）

| 画面             | ファイルパス              | 説明                             |
| ---------------- | ------------------------- | -------------------------------- |
| アプリ全体の設定 | `app/_layout.tsx`         | 全画面共通の設定（テーマ色など） |
| タブバーの設定   | `app/(tabs)/_layout.tsx`  | 下のタブの見た目・アイコン       |
| おすすめ画面     | `app/(tabs)/index.tsx`    | CopilotScreenを呼び出している    |
| 同期画面         | `app/(tabs)/sync.tsx`     | データ同期のステップ表示         |
| 履歴画面         | `app/(tabs)/history.tsx`  | 行動履歴の一覧                   |
| 設定画面         | `app/(tabs)/settings.tsx` | 各種設定項目                     |

### UIコンポーネント（部品）

#### おすすめ機能 (Copilot/Suggestion)

| コンポーネント名   | ファイルパス                                                | 説明                         |
| ------------------ | ----------------------------------------------------------- | ---------------------------- |
| CopilotScreen      | `src/features/copilot/components/CopilotScreen.tsx`         | おすすめ画面全体             |
| CurrentContextCard | `src/features/navigation/components/CurrentContextCard.tsx` | 現在の目的地・到着予定表示   |
| AISuggestionCard   | `src/features/suggestion/components/AISuggestionCard.tsx`   | AIからの提案カード           |
| SuggestionCard     | `src/features/suggestion/components/SuggestionCard.tsx`     | 行き先の提案カード           |
| SuggestionList     | `src/features/suggestion/components/SuggestionList.tsx`     | 提案カードのリスト           |
| CategoryBadge      | `src/features/suggestion/components/CategoryBadge.tsx`      | カテゴリ表示（レストラン等） |
| ScoreBadge         | `src/features/suggestion/components/ScoreBadge.tsx`         | スコア表示バッジ             |
| ReasonCard         | `src/features/suggestion/components/ReasonCard.tsx`         | 提案理由の表示               |

#### データ同期機能 (Connection/Extraction)

| コンポーネント名     | ファイルパス                                                  | 説明                 |
| -------------------- | ------------------------------------------------------------- | -------------------- |
| ConnectionStatusCard | `src/features/connection/components/ConnectionStatusCard.tsx` | 接続状態の表示       |
| SyncButton           | `src/features/connection/components/SyncButton.tsx`           | 同期ボタン           |
| DataCollectionCard   | `src/features/extraction/components/DataCollectionCard.tsx`   | 収集データのサマリー |
| ExtractionProgress   | `src/features/extraction/components/ExtractionProgress.tsx`   | 収集進捗バー         |
| DataSourceManager    | `src/features/extraction/components/DataSourceManager.tsx`    | データソース管理     |

#### 共通部品 (Shared)

| コンポーネント名  | ファイルパス                                     | 説明             |
| ----------------- | ------------------------------------------------ | ---------------- |
| Button            | `src/shared/components/ui/Button.tsx`            | ボタン           |
| Card              | `src/shared/components/ui/Card.tsx`              | カード（枠）     |
| Header            | `src/shared/components/layout/Header.tsx`        | ヘッダー         |
| VoiceListeningBar | `src/shared/components/ui/VoiceListeningBar.tsx` | 音声入力バー     |
| StarRating        | `src/shared/components/ui/StarRating.tsx`        | 星評価           |
| Skeleton          | `src/shared/components/ui/Skeleton.tsx`          | ローディング表示 |

---

## 具体的な指示例

### 例1: おすすめカードの色を変えたい

```
「SuggestionCard の背景色を #2d3748 に変更してください」
```

### 例2: タブバーのアイコンを変えたい

```
「タブバーの履歴アイコンを時計マークに変更してください」
```

### 例3: ボタンのテキストを変えたい

```
「SyncButton のテキストを『データを送信』に変更してください」
```

### 例4: 現在地カードを編集したい

```
「CurrentContextCard の到着予定時刻の文字サイズを大きくしてください」
```

---

## 困ったときは

1. **どのファイルか分からない場合**
   → 画面名やコンポーネント名を伝えれば、Claude Codeが探してくれます

2. **思った通りにならない場合**
   → 「元に戻してください」と言えば戻せます

3. **変更を確認したい場合**
   → `npm start` でアプリを起動して確認できます
