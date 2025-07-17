# ベジライス様 LINE公式アカウント切り替え手順書

## 📋 概要

現在のテスト環境からベジライス様のLINE公式アカウントに切り替えるための詳細な手順書です。

## 🔧 前提条件

### 必要なもの
- ベジライス様のLINE公式アカウント（LINE Business ID）
- LINE Developers Console への管理者アクセス
- 本番環境のドメイン（例：https://reservation.veggie-rice.com）

### 確認事項
- [x] LINE公式アカウントが開設済み
- [x] LINE Developers Console へのアクセス権限
- [x] 本番ドメインの SSL証明書が有効
- [x] システムの本番環境デプロイが完了

## 📝 手順1: LINE Developers Console でのプロバイダー・チャンネル作成

### 1.1 LINE Developers Console にアクセス
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. ベジライス様のLINE Business ID でログイン

### 1.2 プロバイダーの作成
1. 「プロバイダー」タブをクリック
2. 「新規プロバイダー作成」をクリック
3. プロバイダー名を入力（例：「片桐商店 ベジライス」）
4. 「作成」をクリック

### 1.3 Messaging API チャンネルの作成
1. 作成したプロバイダーを選択
2. 「新規チャンネル作成」をクリック
3. 「Messaging API」を選択
4. チャンネル情報を入力：
   - **チャンネル名**: 「ベジライス予約システム」
   - **チャンネル説明**: 「種苗店の予約管理システム」
   - **大業種**: 「小売・流通」
   - **小業種**: 「その他小売」
   - **メールアドレス**: ベジライス様の連絡先メールアドレス
5. 利用規約に同意して「作成」をクリック

### 1.4 LIFF アプリの作成
1. 作成したMessaging API チャンネルを選択
2. 「LIFF」タブをクリック
3. 「追加」をクリック
4. LIFF アプリ情報を入力：
   - **LIFFアプリ名**: 「ベジライス予約フォーム」
   - **サイズ**: 「Full」
   - **エンドポイントURL**: `https://your-domain.com/form/`
   - **Scope**: `profile`, `openid`
   - **Bot link feature**: 「On（通常）」
5. 「追加」をクリック

## 📋 手順2: 必要な認証情報の取得

### 2.1 チャンネルアクセストークンの取得
1. Messaging API チャンネルの「Basic settings」タブ
2. 「Channel secret」をコピー・保存
3. 「Messaging API settings」タブ
4. 「Channel access token」を発行・コピー・保存

### 2.2 LIFF ID の取得
1. 「LIFF」タブで作成したLIFFアプリを選択
2. 「LIFF ID」をコピー・保存

### 2.3 チャンネルIDの取得
1. 「Basic settings」タブ
2. 「Channel ID」をコピー・保存

## 🔧 手順3: 環境変数の更新

### 3.1 本番環境の環境変数設定
以下の環境変数を本番環境に設定してください：

```bash
# LINE Messaging API（本番）
LINE_CHANNEL_ACCESS_TOKEN=取得したチャンネルアクセストークン
LINE_CHANNEL_SECRET=取得したチャンネルシークレット

# LINE Mini App（本番）
NEXT_PUBLIC_LIFF_ID_PROD=取得したLIFF ID
NEXT_PUBLIC_LINE_CHANNEL_ID_PROD=取得したチャンネルID

# 環境設定
NODE_ENV=production
```

### 3.2 開発・テスト環境の保持
開発・テスト用の環境変数は引き続き保持してください：

```bash
# 開発環境（そのまま保持）
NEXT_PUBLIC_LIFF_ID_DEV=2007484444-JDmG6Vvy
NEXT_PUBLIC_LINE_CHANNEL_ID_DEV=2007484444
LINE_CHANNEL_SECRET_DEV=bbab95e89d618d3fe050bf83b5fedb8d

# ステージング環境（そのまま保持）
NEXT_PUBLIC_LIFF_ID_STAGING=2007484445-Qaxn3MX6
NEXT_PUBLIC_LINE_CHANNEL_ID_STAGING=2007484445
LINE_CHANNEL_SECRET_STAGING=a3f04b86c20ca6146e39857505108d77
```

## 🌐 手順4: ドメインとWebhookの設定

### 4.1 Webhook URLの設定
1. Messaging API チャンネルの「Messaging API settings」タブ
2. 「Webhook URL」に本番環境のエンドポイントを設定：
   ```
   https://your-domain.com/api/webhook/line
   ```
3. 「Webhook の利用」を有効にする
4. 「検証」をクリックして接続を確認

### 4.2 LIFF エンドポイントURLの更新
1. 「LIFF」タブで作成したLIFFアプリを選択
2. 「編集」をクリック
3. 「エンドポイントURL」を本番環境のURLに更新：
   ```
   https://your-domain.com/form/
   ```
4. 「更新」をクリック

## 🔒 手順5: セキュリティ設定

### 5.1 IP アドレス制限（推奨）
1. 「Security」タブでIP制限を設定
2. 本番サーバーのIPアドレスを許可リストに追加

### 5.2 リッチメニューの設定
1. 「Rich menu」タブで予約用リッチメニューを作成
2. 予約フォームへのリンクを設定

## 🧪 手順6: テスト・検証

### 6.1 LIFF アプリのテスト
1. LINE公式アカウントを友だち追加
2. 設定したリッチメニューから予約フォームにアクセス
3. フォーム送信のテスト
4. 通知機能のテスト

### 6.2 機能確認チェックリスト
- [ ] LIFFアプリの起動
- [ ] ユーザープロフィールの取得
- [ ] フォーム送信機能
- [ ] 予約確認通知の送信
- [ ] リマインダー通知の送信
- [ ] 管理画面での顧客情報表示

## 📱 手順7: 本番運用開始

### 7.1 段階的ロールアウト
1. 内部テストで全機能を確認
2. 限定的なベータテスト（数名の顧客）
3. 段階的に利用者を増やす
4. 全面的な本番運用開始

### 7.2 監視・メンテナンス
1. エラーログの監視設定
2. 通知送信状況の確認
3. 定期的な機能テスト
4. 顧客からのフィードバック収集

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. LIFFアプリが起動しない
- **原因**: ドメインまたはLIFF IDの設定ミス
- **解決方法**: 環境変数とLIFF設定を再確認

#### 2. 通知が送信されない
- **原因**: チャンネルアクセストークンの問題
- **解決方法**: トークンの再発行・設定確認

#### 3. プロフィール情報が取得できない
- **原因**: Scopeの設定不備
- **解決方法**: LIFFアプリのScope設定を確認

## 📞 サポート連絡先

### 緊急時の連絡先
- **システム開発者**: [連絡先情報]
- **LINE Business サポート**: [LINEサポート情報]

### 定期メンテナンス
- **頻度**: 月1回
- **内容**: 機能テスト、ログ確認、セキュリティ更新

---

**重要**: この手順書は機密情報を含むため、関係者以外への共有は避けてください。
**更新日**: 2025年7月16日
**バージョン**: 1.0