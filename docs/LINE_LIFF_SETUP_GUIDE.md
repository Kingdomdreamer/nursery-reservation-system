# LINE LIFF設定ガイド

## 概要
このガイドでは、現在のテスト環境から本番のベジライスLINEアカウントへLIFF設定を移行する手順を説明します。

## 1. 事前準備

### 必要なアカウント・権限
- ベジライスのLINE公式アカウント管理者権限
- LINE Developersアカウントアクセス権
- アプリケーションのデプロイ権限

### 現在の設定確認
現在の環境変数（`.env.local`）を確認してください：

```env
# 現在のテスト設定
NEXT_PUBLIC_LIFF_ID_DEV=テスト用LIFF_ID
NEXT_PUBLIC_LIFF_ID_STAGING=ステージング用LIFF_ID（未設定）
NEXT_PUBLIC_LIFF_ID_PROD=本番用LIFF_ID（未設定）
```

## 2. LINE Developersでの設定手順

### Step 1: LINE Developersにログイン
1. https://developers.line.biz/ にアクセス
2. ベジライス関連のLINEアカウントでログイン

### Step 2: プロバイダーとチャネルの確認
1. 「ベジライス」プロバイダーが存在するか確認
2. 存在しない場合は新規作成：
   - プロバイダー名：「ベジライス」
   - 会社・組織名：「ベジライス」

### Step 3: LINE Messaging APIチャネルの設定
1. 新しいチャネルを作成 → 「Messaging API」を選択
2. 基本情報を入力：
   - チャネル名：「ベジライス種苗店予約システム」
   - チャネル説明：「種苗の予約・注文システム」
   - 大業種：「食品」
   - 小業種：「農業・園芸」
   - メールアドレス：担当者のメールアドレス

### Step 4: LIFF アプリの作成
1. 作成したMessaging APIチャネル → 「LIFF」タブを開く
2. 「追加」をクリック
3. LIFF設定：
   - **LIFFアプリ名**：「種苗予約フォーム」
   - **サイズ**：`Full`
   - **エンドポイントURL**：
     - 開発環境：`https://your-dev-domain.vercel.app/form/[formId]`
     - ステージング環境：`https://your-staging-domain.vercel.app/form/[formId]`
     - 本番環境：`https://your-production-domain.vercel.app/form/[formId]`
   - **Scope**：
     - ☑ `profile`（ユーザープロフィール取得用）
     - ☑ `openid`（OpenID Connect用）
   - **ボットリンク機能**：`Off`（通常はOff）
   - **Scan QR**：`Off`

### Step 5: 各環境用LIFF IDの取得
作成完了後、以下のLIFF IDが生成されます：
- 開発環境：`123456789-xxxxxxxx`（例）
- ステージング環境：`123456789-yyyyyyyy`（例）
- 本番環境：`123456789-zzzzzzzz`（例）

## 3. アプリケーション設定の更新

### Step 1: 環境変数の更新
`.env.local`（開発）、`.env.staging`、`.env.production`を更新：

```env
# 本番環境用
NEXT_PUBLIC_LIFF_ID_DEV=123456789-xxxxxxxx
NEXT_PUBLIC_LIFF_ID_STAGING=123456789-yyyyyyyy  
NEXT_PUBLIC_LIFF_ID_PROD=123456789-zzzzzzzz

# その他の環境変数
NEXT_PUBLIC_SUPABASE_URL=本番用SupabaseURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=本番用Supabaseキー
```

### Step 2: Vercelでの環境変数設定
1. Vercel ダッシュボードにログイン
2. プロジェクト → Settings → Environment Variables
3. 以下の環境変数を追加：
   - `NEXT_PUBLIC_LIFF_ID_PROD`：本番用LIFF ID
   - `NEXT_PUBLIC_LIFF_ID_STAGING`：ステージング用LIFF ID
   - 各環境に適切なSupabase設定

### Step 3: デプロイとテスト
1. 設定を本番環境にデプロイ
2. LIFF URLでアクセステスト
3. プロフィール情報の取得テスト

## 4. LINE公式アカウントとの連携

### Step 1: 友だち追加設定
1. LINE Official Account Manager にログイン
2. 「設定」→「応答設定」
3. 以下を設定：
   - 応答メッセージ：`Off`
   - あいさつメッセージ：`On`
   - Webhook：`On`（必要に応じて）

### Step 2: メニュー設定
リッチメニューまたはテキストメニューで予約フォームへのリンクを設定：

```
種苗のご予約はこちら 🌱
https://line.me/R/app/123456789-zzzzzzzz
```

### Step 3: QRコード生成
1. 以下のURLでQRコードを生成：
   ```
   https://line.me/R/app/123456789-zzzzzzzz
   ```
2. 店舗やWebサイトでの案内に使用

## 5. セキュリティ設定

### LIFF URLドメイン検証
1. LINE Developers → LIFF設定
2. 「ドメイン」が正しく設定されているか確認
3. 本番ドメインのSSL証明書が有効であることを確認

### アクセス制御
1. Supabase RLS（Row Level Security）が適切に設定されているか確認
2. 不正なアクセスを防ぐため、適切な認証フローが実装されているか検証

## 6. 運用開始後の監視

### 分析指標
1. LINE Developersコンソール → Analytics で以下を監視：
   - LIFF アプリ起動数
   - ユーザー数
   - エラー率

### ログ監視
1. Vercel Function Logs
2. Supabase Logs
3. LINE Platform エラーログ

## 7. トラブルシューティング

### よくある問題と解決策

#### 1. LIFF初期化エラー
```
Error: LIFF init failed
```
**解決策**：
- LIFF IDが正しく設定されているか確認
- ドメインがLIFF設定と一致しているか確認

#### 2. プロフィール取得エラー
```
Error: Profile not available
```
**解決策**：
- Scopeに`profile`が含まれているか確認
- ユーザーがプロフィール情報の提供に同意しているか確認

#### 3. 環境変数が反映されない
**解決策**：
- Vercelで環境変数が正しく設定されているか確認
- デプロイ後にアプリケーションが最新版を使用しているか確認

## 8. チェックリスト

移行作業完了前に以下を確認してください：

- [ ] ベジライスLINE Developersアカウントでチャネル作成完了
- [ ] 本番用LIFF ID取得完了
- [ ] アプリケーション環境変数更新完了
- [ ] 本番環境デプロイ完了
- [ ] LIFF URLアクセステスト完了
- [ ] プロフィール情報取得テスト完了
- [ ] LINE公式アカウントメニュー設定完了
- [ ] QRコード生成・配布準備完了
- [ ] 監視・ログ設定完了

## 9. 緊急時の対応

### ロールバック手順
問題が発生した場合の緊急対応：

1. Vercelで前のバージョンにロールバック
2. 環境変数を前の設定に戻す
3. DNS設定の確認
4. ユーザーへの案内（必要に応じて）

### 連絡先
- 技術サポート：[技術担当者の連絡先]
- LINE Platform サポート：https://developers.line.biz/ja/support/

---

このガイドに従って設定を行うことで、テスト環境から本番のベジライスLINEアカウントへの移行が完了します。