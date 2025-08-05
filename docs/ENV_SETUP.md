# ベジライス予約システム - 環境変数設定ガイド

## 概要
このドキュメントでは、予約システムでLINE通知機能を含む全機能を有効にするために必要な環境変数の設定方法を説明します。

---

## 必須環境変数

### システム基本設定
```bash
# システムのベースURL
NEXT_PUBLIC_BASE_URL=https://vejiraisu.yoyaku.com

# 実行環境
NODE_ENV=production  # 本番環境の場合
```

### Supabase設定
```bash
# Supabaseプロジェクト情報
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### LINE Mini App設定
```bash
# 環境別設定（開発/審査/本番から選択）

# 開発環境
NEXT_PUBLIC_LIFF_ID=2007484444-JDmG6Vvy
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484444
LINE_MINIAPP_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d

# 審査環境
# NEXT_PUBLIC_LIFF_ID=2007484445-Qaxn3MX6
# NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484445
# LINE_MINIAPP_CHANNEL_SECRET=a3f04b86c20ca6146e39857505108d77

# 本番環境
# NEXT_PUBLIC_LIFF_ID=2007484446-ryPBa2bJ
# NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484446
# LINE_MINIAPP_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363

# 互換性維持（既存コードとの互換性）
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484444
LINE_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d
```

### LINE Messaging API設定（通知機能用）
```bash
# Messaging APIチャネル情報
LINE_MESSAGING_CHANNEL_ID=your-messaging-channel-id
LINE_MESSAGING_CHANNEL_SECRET=your-messaging-channel-secret
LINE_MESSAGING_ACCESS_TOKEN=your-long-messaging-access-token
```

---

## 環境別設定例

### 開発環境（.env.local）
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app
NODE_ENV=development

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE Mini App設定（開発用）
NEXT_PUBLIC_LIFF_ID=2007484444-JDmG6Vvy
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484444
LINE_MINIAPP_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d

# LINE Messaging API設定（開発用）
LINE_MESSAGING_CHANNEL_ID=your-dev-messaging-channel-id
LINE_MESSAGING_CHANNEL_SECRET=your-dev-messaging-channel-secret
LINE_MESSAGING_ACCESS_TOKEN=your-dev-messaging-access-token

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484444
LINE_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d
```

### 本番環境（Vercel/Netlifyなど）
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app
NODE_ENV=production

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE Mini App設定（本番用）
NEXT_PUBLIC_LIFF_ID=2007484446-ryPBa2bJ
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484446
LINE_MINIAPP_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363

# LINE Messaging API設定（本番用）
LINE_MESSAGING_CHANNEL_ID=your-prod-messaging-channel-id
LINE_MESSAGING_CHANNEL_SECRET=your-prod-messaging-channel-secret
LINE_MESSAGING_ACCESS_TOKEN=your-prod-messaging-access-token

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484446
LINE_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363
```

---

## 環境変数の取得方法

### LINE Mini App情報
1. [LINE Developers Console](https://developers.line.biz/)にログイン
2. 該当するプロバイダー → チャネルを選択
3. 「チャネル基本設定」から以下を取得：
   - チャネルID → `NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID`
   - チャネルシークレット → `LINE_MINIAPP_CHANNEL_SECRET`
4. 「LIFF」タブからLIFF ID → `NEXT_PUBLIC_LIFF_ID`

### LINE Messaging API情報
1. LINE Developersで新しいMessaging APIチャネルを作成
2. 「チャネル基本設定」から：
   - チャネルID → `LINE_MESSAGING_CHANNEL_ID`
   - チャネルシークレット → `LINE_MESSAGING_CHANNEL_SECRET`
3. 「Messaging API設定」から：
   - チャネルアクセストークンを発行 → `LINE_MESSAGING_ACCESS_TOKEN`

### Supabase情報
1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクト設定 → APIから以下を取得：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

---

## セキュリティ注意事項

### 機密情報の取り扱い
- `LINE_MINIAPP_CHANNEL_SECRET`
- `LINE_MESSAGING_CHANNEL_SECRET`
- `LINE_MESSAGING_ACCESS_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

これらの環境変数は機密情報です：
- Gitリポジトリにコミットしない
- 適切なアクセス制御を設定
- 定期的にローテーション（推奨：6ヶ月ごと）

### 公開可能な環境変数
- `NEXT_PUBLIC_`で始まる環境変数はクライアントサイドで公開されます
- 機密情報を含めないよう注意してください

---

## 動作確認方法

### 1. Mini App動作確認
```bash
# 開発サーバー起動
npm run dev

# ブラウザでアクセス
https://miniapp.line.me/2007484444-JDmG6Vvy
```

### 2. LINE通知機能確認
1. Mini App内で予約フォームを送信
2. LINE公式アカウントに予約確認メッセージが届くことを確認
3. サーバーログでLINE API呼び出しが成功していることを確認

### 3. デバッグ用ログ確認
```bash
# 開発環境
npm run dev

# ログを確認
- 予約送信時: "LINE notification sent successfully"
- エラー時: "Failed to send LINE notification: [エラー内容]"
```

---

## トラブルシューティング

### LINE通知が送信されない場合
1. 環境変数が正しく設定されているか確認
2. LINE Messaging APIのチャネルアクセストークンが有効か確認
3. ユーザーがLINE公式アカウントを友達追加しているか確認
4. サーバーログでエラー内容を確認

### Mini Appが起動しない場合
1. LIFF IDが正しく設定されているか確認
2. エンドポイントURLがHTTPSで設定されているか確認
3. LINE Developersコンソールで設定を再確認

### 予約データが保存されない場合
1. Supabase設定が正しいか確認
2. データベーステーブルが正しく作成されているか確認
3. RLS（Row Level Security）設定を確認

---

このドキュメントに従って環境変数を設定することで、LINEミニアプリでの予約→LINE通知の完全なフローが実現できます。