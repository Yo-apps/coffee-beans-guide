# コーヒー豆ガイドアプリケーション

## 概要
このアプリケーションは、ユーザーが自分に合ったコーヒー豆を見つけるためのガイドを提供します。
インタラクティブなクイズを通じて、ユーザーの好みや知識レベルに応じた最適なコーヒー豆を推薦します。

## 主な機能
- コーヒー豆クイズ
- 豆の推薦システム
- 豆の詳細情報表示
- 管理機能

## システム仕様
- [クイズ生成システム仕様書](docs/QUIZ_SYSTEM_SPEC.md)

## 開発環境のセットアップ
1. リポジトリのクローン
```bash
git clone [repository-url]
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定
```

4. 開発サーバーの起動
```bash
npm run dev
```

## 利用可能なスクリプト
- `npm run dev`: 開発サーバーの起動
- `npm run build`: プロダクションビルド
- `npm run start`: プロダクションサーバーの起動
- `npm run lint`: コードの静的解析
- `npm run update-data`: コーヒー豆データの更新
- `npm run crawler`: データ収集クローラーの実行

## クローラーの使用方法
1. URLリストの作成
```bash
npm run crawler create-url-list urls.json
```

2. クローラーの実行
```bash
npm run crawler start -f urls.json
```

3. 状態確認
```bash
npm run crawler status
```

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。
