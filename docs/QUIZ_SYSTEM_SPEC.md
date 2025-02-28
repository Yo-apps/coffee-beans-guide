# コーヒー豆クイズシステム仕様書

## 1. システム概要

### 1.1 目的
- ユーザーのコーヒーに関する知識を対話的に深める
- クイズを通じた楽しい学習体験の提供
- コーヒーの多様な側面への理解促進
- ユーザーの知識レベルに応じた適切な学習パスの提供

### 1.2 対象ユーザー
- コーヒー初心者からエキスパートまで
- コーヒーについて体系的に学びたい人
- コーヒーショップのスタッフ
- バリスタ志望の学習者

## 2. システムアーキテクチャ

### 2.1 フォルダ構造
```
src/
├── components/
│   ├── Quiz/
│   │   ├── QuizCard.tsx
│   │   └── QuizFilters.tsx
├── pages/
│   └── quiz/
│       └── page.tsx
├── scripts/
│   ├── quizGenerator.ts
│   └── coffeeKnowledgeBase.ts
├── services/
│   └── dataCrawlerService.ts
└── types/
    └── types.ts
```

### 2.2 主要コンポーネント
1. QuizCard
   - クイズの表示と回答機能
   - 解説の表示
   - 進捗管理

2. QuizFilters
   - 言語選択
   - カテゴリーフィルター
   - 難易度フィルター

3. QuizGenerator
   - GEMINIを使用したクイズ生成
   - コンテンツ分析
   - 質問・選択肢の生成

## 3. 機能要件

### 3.1 クイズ生成機能
- GEMINIによる自然な質問文生成
- 3つの選択肢と詳細な解説
- 難易度の自動判定
- カテゴリー分類
- 多言語対応（日本語・英語）

### 3.2 ユーザーインターフェース
- レスポンシブデザイン
- アニメーション効果
- プログレスバー
- フィルター機能
- 履歴管理

### 3.3 データ管理
- LocalStorageによる進捗保存
- 統計データの記録
- クイズ履歴の管理
- 正答率の追跡

### 3.4 フィルタリング機能
- 言語選択（ja/en）
- カテゴリー選択
  - basic（基礎知識）
  - beans（豆の特徴）
  - roast（焙煎）
  - origin（産地）
  - brewing（抽出）
  - storage（保存）
- 難易度選択
  - beginner
  - intermediate
  - advanced

## 4. データ構造

### 4.1 クイズデータ型
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  source: string;
  language: string;
}
```

### 4.2 統計データ型
```typescript
interface QuizStats {
  total: number;
  correct: number;
  streak: number;
  categories: {
    [key: string]: number;
  };
}
```

## 5. API仕様

### 5.1 クイズ生成API
```typescript
POST /api/quiz
Request:
{
  language?: string;
  category?: string;
  difficulty?: string;
}
Response:
{
  success: boolean;
  data?: QuizQuestion;
  error?: string;
}
```

### 5.2 統計API
```typescript
GET /api/stats
Response:
{
  success: boolean;
  data?: QuizStats;
  error?: string;
}
```

## 6. エラーハンドリング

### 6.1 再試行メカニズム
- 最大3回の再試行
- エラーメッセージの表示
- フォールバックオプション

### 6.2 バリデーション
- 質問文の存在確認
- 選択肢の数の検証
- 正解の一意性確認
- 必須フィールドの検証

## 7. パフォーマンス要件

### 7.1 レスポンス時間
- クイズ生成：3秒以内
- 画面遷移：300ms以内
- アニメーション：60fps

### 7.2 同時リクエスト
- 最大10件の同時リクエスト処理
- キューイングシステム
- レート制限

## 8. セキュリティ

### 8.1 API保護
- レート制限の実装
- APIキーの保護
- XSS対策
- CSRF対策

### 8.2 データ保護
- ユーザーデータの暗号化
- セッション管理
- アクセス制御

## 9. 拡張性

### 9.1 将来の機能追加
- ユーザーランキング
- ソーシャル機能
- カスタムクイズ作成
- チャレンジモード

### 9.2 インテグレーション
- SNS共有
- 学習管理システム
- 分析ツール
- チャットボット 