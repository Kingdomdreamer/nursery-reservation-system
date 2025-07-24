# LINE予約システム - ベジライス

LINE LIFF（LINE Front-end Framework）を活用した顧客向け予約フォームアプリケーションです。ユーザーはLINE上で商品を選択して予約を行い、管理者は予約を管理できます。

## 🚀 機能概要

### ユーザー機能
- **LINE LIFF認証**: LINEアカウントで自動ログイン
- **商品選択**: カテゴリ別商品から数量を選択
- **引き取り日選択**: 商品カテゴリに応じた日付選択
- **予約確認**: 入力内容の確認と利用規約への同意
- **LINE通知**: 予約確認・リマインダー・キャンセル通知

### 管理機能
- **予約管理**: 日別・週別・月別の予約確認
- **商品管理**: 商品マスタの管理
- **フォーム設定**: 表示項目の動的設定
- **通知管理**: LINE通知の送信と履歴確認

## 🛠 技術スタック

### フロントエンド
- **Next.js 15.4.3** (App Router)
- **TypeScript 5**
- **React 19.1.0**
- **Tailwind CSS 4**
- **React Hook Form 7.61.0** + **Zod 4.0.8**
- **Framer Motion 12.23.7**

### バックエンド
- **Supabase** (PostgreSQL + Auth)
- **LINE LIFF SDK 2.27.1**
- **LINE Messaging API**

### 外部サービス
- **Vercel** (ホスティング)
- **LINE Developers** (LIFF + Messaging API)

## 📁 プロジェクト構造

```
nursery-reservation-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── form/          # フォーム設定API
│   │   │   ├── line/          # LINE通知API
│   │   │   └── reservations/  # 予約API
│   │   ├── form/[presetId]/   # 予約フォーム
│   │   ├── confirm/[presetId]/ # 確認画面
│   │   ├── complete/[presetId]/ # 完了画面
│   │   └── admin/             # 管理画面
│   ├── components/            # Reactコンポーネント
│   │   ├── forms/            # フォーム関連
│   │   ├── line/             # LIFF関連
│   │   ├── admin/            # 管理画面
│   │   └── ui/               # 共通UI
│   ├── lib/                   # ユーティリティ
│   │   ├── services/         # データベース操作
│   │   ├── utils/            # ヘルパー関数
│   │   └── validations/      # バリデーション
│   └── types/                 # TypeScript型定義
├── database/                  # データベース関連
│   └── setup.sql             # データベース初期化
└── docs/                     # ドキュメント
```

## 🗄 データベース設計

### 主要テーブル
1. **product_presets** - 商品プリセット
2. **products** - 商品マスタ  
3. **form_settings** - フォーム設定
4. **pickup_windows** - 引き取り可能期間
5. **reservations** - 予約情報
6. **notification_logs** - 通知ログ

### リレーション
```
product_presets 1:N form_settings
product_presets 1:N pickup_windows
products 1:N pickup_windows
product_presets 1:N reservations
```

## 🔧 セットアップ

### 1. 環境変数設定
`.env.local`ファイルを作成し、以下を設定：

```env
# Next.js
NEXT_PUBLIC_BASE_URL=https://vejiraisu.yoyaku.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your-liff-id

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# LINE Login
LINE_LOGIN_CHANNEL_ID=your-login-channel-id
LINE_LOGIN_CHANNEL_SECRET=your-login-channel-secret
```

### 2. データベース初期化
Supabase SQLエディタで `database/setup.sql` を実行

### 3. 依存関係インストール
```bash
npm install
```

### 4. 開発サーバー起動
```bash
npm run dev
```

## 📱 LINE設定

### LIFF App設定
1. LINE Developers Console でLIFFアプリを作成
2. エンドポイントURL: `https://vejiraisu.yoyaku.com`
3. スコープ: `profile`, `openid`

### Messaging API設定
1. Messaging APIチャンネルを作成
2. Webhook URLを設定（必要に応じて）
3. アクセストークンを取得

## 🎯 主要機能の実装状況

### ✅ 完了済み
1. **プロジェクト構造セットアップ** - Next.js + TypeScript環境
2. **データベース設計** - Supabase PostgreSQL構成
3. **LINE LIFF認証** - ユーザーID取得とセッション管理
4. **予約フォーム** - 顧客情報入力（動的項目制御）
5. **商品選択インターフェース** - 数量制御とカテゴリ分類
6. **引き取り日カレンダー** - カテゴリ別日付選択
7. **確認画面** - 予約内容確認と利用規約同意
8. **完了画面** - 予約完了メッセージとLINE復帰
9. **LINE通知システム** - 確認・リマインダー・キャンセル通知

### 🔄 一部実装/今後の改善点
10. **管理ダッシュボード** - 基本的な予約一覧（拡張可能）
11. **商品管理インターフェース** - CRUD操作（管理画面として実装可能）
12. **フォーム設定システム** - 動的設定変更（API実装済み）

## 🔄 ユーザーフロー

1. **LINE → LIFF起動** - ユーザーがLINEからアプリにアクセス
2. **認証確認** - LIFF認証とプロフィール取得
3. **フォーム入力** - 顧客情報 → 商品選択 → 引き取り日選択
4. **予約確認** - 入力内容確認と利用規約同意
5. **予約完了** - データベース保存とLINE通知送信
6. **LINE復帰** - 自動でLINEアプリに戻る

## 📧 LINE通知テンプレート

### 予約確認通知
```
【予約完了のお知らせ】

○○様、ご予約ありがとうございます。
以下の内容で予約を承りました。

■ご予約内容
・商品名（数量）：価格

■お引き取り日
・カテゴリ：日付（曜日）

■合計金額
○○円

予約内容の確認・変更は以下のリンクから
https://example.com/reservation/id
```

### リマインダー通知
```
【明日の引き取りのお知らせ】

○○様

明日は以下商品の引き取り日です。
・商品名

■引き取り日時
○月○日（○）10:00～18:00
```

## 🚀 デプロイ

### Vercel デプロイ
```bash
# Vercel CLI使用
npm i -g vercel
vercel

# 環境変数設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# その他の環境変数も同様に設定
```

## 🛡 セキュリティ対策

- **RLS (Row Level Security)** - Supabaseデータアクセス制限
- **入力バリデーション** - Zodによるスキーマ検証
- **CSRF対策** - Next.jsの標準対策
- **環境変数管理** - 機密情報の適切な分離

## 📊 パフォーマンス

- **SSR/SSG** - Next.js App Routerによる最適化
- **画像最適化** - Next.js Image コンポーネント
- **バンドル最適化** - Tree shakingとコード分割
- **キャッシュ戦略** - Supabaseクエリキャッシュ

## 🤝 サポート

- **GitHub Issues**: [プロジェクトリポジトリ](https://github.com/your-repo)
- **メール**: dev@vejiraisu.com
- **LINE**: @vejiraisu

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

---

**開発者**: Claude AI Assistant  
**最終更新**: 2025年7月24日  
**バージョン**: 1.0.0