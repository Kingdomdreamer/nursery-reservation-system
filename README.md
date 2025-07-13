<<<<<<< HEAD
# 種苗店予約システム

肥料や農薬、苗を販売する種苗店の商品予約システムです。

## 概要

このシステムは種苗店向けの商品予約システムで、以下の機能を提供します：

- **商品予約**: 肥料、農薬、苗などの種苗店商品の予約
- **複数商品対応**: 一度の予約で複数の商品を選択可能
- **引き取り日指定**: 商品ごとに個別の引き取り日を設定
- **合計金額計算**: 選択した商品の合計金額を自動計算
- **個人情報入力**: 予約者の連絡先情報の管理
- **LINE LIFF連携**: LINEアプリ内での利用に対応

## 技術スタック

- **フロントエンド**: Next.js 14 (React 18)
- **スタイリング**: Tailwind CSS
- **バリデーション**: Zod + React Hook Form
- **外部連携**: 
  - LINE LIFF (LINE Front-end Framework)
  - Supabase
- **言語**: TypeScript

## 主要コンポーネント

### 予約フォーム関連
- `ReservationForm`: メイン予約フォーム
- `ProductSelectionForm`: 商品選択・数量・引き取り日入力
- `PersonalInfoForm`: 個人情報入力フォーム
- `ConfirmationScreen`: 予約内容確認画面
- `CompletionScreen`: 予約完了画面
- `ManageScreen`: 予約管理画面

### ユーティリティ
- `addressSearch.ts`: 住所検索機能

## 開発・実行

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での起動
npm start

# リント
npm run lint
```

## 環境変数

```env
NEXT_PUBLIC_LIFF_ID=your_liff_id_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## ディレクトリ構造

```
app/
├── components/          # Reactコンポーネント
│   ├── CompletionScreen.tsx
│   ├── ConfirmationScreen.tsx
│   ├── ManageScreen.tsx
│   ├── PersonalInfoForm.tsx
│   ├── ProductSelectionForm.tsx
│   └── ReservationForm.tsx
├── utils/              # ユーティリティ関数
│   └── addressSearch.ts
├── globals.css         # グローバルスタイル
├── layout.tsx          # アプリケーションレイアウト
└── page.tsx           # トップページ
```

## 予約フロー

1. **商品選択**: 種苗店の商品（肥料・農薬・苗など）を選択
2. **数量・日付指定**: 各商品の数量と引き取り日を入力
3. **個人情報入力**: 予約者の連絡先情報を入力
4. **内容確認**: 予約内容と合計金額を確認
5. **予約完了**: 予約が確定され、完了画面を表示

---

**注意**: このシステムは種苗店（肥料・農薬・苗の販売店）専用の予約システムです。
=======
# nursery-reservation-system
>>>>>>> origin/main
