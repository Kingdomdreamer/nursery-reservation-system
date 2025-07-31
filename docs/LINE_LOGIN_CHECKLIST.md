# LINE Login & Messaging API 設定チェックリスト

## 📋 設定完了チェックリスト

### ✅ LINE Developersコンソール設定

#### プロバイダー作成
- [ ] LINE Developersにログイン済み
- [ ] プロバイダーを作成済み（例：「○○農園」）

#### LINE Login チャネル作成・設定
- [ ] LINE Loginチャネルを作成済み
- [ ] コールバックURLを正しく設定（`https://your-domain.com/api/auth/line/callback`）
- [ ] スコープで `profile` と `openid` をチェック
- [ ] アプリ情報（名前、説明、アイコン）を設定済み
- [ ] チャネルIDとチャネルシークレットを取得・記録済み

#### Messaging API チャネル作成・設定
- [ ] Messaging APIチャネルを作成済み
- [ ] Webhook URLを設定（`https://your-domain.com/api/line/webhook`）
- [ ] Webhookの利用を「オン」に設定
- [ ] チャネルアクセストークンを発行済み（長期）
- [ ] 応答メッセージを「オフ」に設定
- [ ] 自動応答メッセージを「オフ」に設定

---

### ✅ 環境変数設定

#### 必須の環境変数
- [ ] `LINE_LOGIN_CHANNEL_ID` - LINE LoginチャネルIDを設定
- [ ] `LINE_LOGIN_CHANNEL_SECRET` - LINE Loginチャネルシークレットを設定
- [ ] `LINE_LOGIN_CALLBACK_URL` - コールバックURLを設定
- [ ] `LINE_MESSAGING_CHANNEL_ID` - Messaging APIチャネルIDを設定
- [ ] `LINE_MESSAGING_CHANNEL_SECRET` - Messaging APIチャネルシークレットを設定
- [ ] `LINE_MESSAGING_ACCESS_TOKEN` - Messaging APIアクセストークンを設定
- [ ] `NEXTAUTH_SECRET` - NextAuth.js用のシークレットキーを設定
- [ ] `NEXTAUTH_URL` - システムのベースURLを設定
- [ ] `NEXT_PUBLIC_BASE_URL` - システムのベースURLを設定（フロントエンド用）

#### 設定値の確認
```bash
# 設定値の例
LINE_LOGIN_CHANNEL_ID=1234567890
LINE_LOGIN_CHANNEL_SECRET=abcdef1234567890abcdef1234567890
LINE_LOGIN_CALLBACK_URL=https://your-domain.com/api/auth/line/callback
LINE_MESSAGING_CHANNEL_ID=9876543210
LINE_MESSAGING_CHANNEL_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
LINE_MESSAGING_ACCESS_TOKEN=長いアクセストークン文字列
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

### ✅ 実装確認

#### NextAuth.js設定
- [ ] `/src/app/api/auth/[...nextauth]/route.ts` が作成済み
- [ ] LINE プロバイダーが正しく設定済み
- [ ] コールバック関数が実装済み
- [ ] セッション設定が適切に設定済み

#### LINE Messaging API実装
- [ ] `/src/lib/line-messaging.ts` が作成済み
- [ ] メッセージ送信機能が実装済み
- [ ] Webhook署名検証が実装済み
- [ ] `/src/app/api/line/webhook/route.ts` が作成済み

#### フロントエンド実装
- [ ] SessionProvider が設定済み
- [ ] ログインページが作成済み
- [ ] 認証ガードが実装済み
- [ ] 型定義が拡張済み

---

### ✅ 動作確認テスト

#### LINE Login動作確認
- [ ] `/api/auth/signin` にアクセスして「LINEでサインイン」が表示される
- [ ] LINE認証画面が正常に表示される
- [ ] 認証後、システムに正常にログインできる
- [ ] ユーザー情報（名前、画像）が正しく表示される

#### Webhook動作確認
- [ ] LINE Developersコンソールで「Webhookの検証」が成功する
- [ ] LINE公式アカウントに友達追加すると、あいさつメッセージが送信される
- [ ] メッセージを送信すると、適切な自動応答が返される
- [ ] サーバーログでWebhookリクエストが受信できている

#### 通知機能確認
- [ ] 予約システムから予約を実行すると、LINE通知が送信される
- [ ] メッセージ内容が正しく表示される
- [ ] Flexメッセージが適切にレンダリングされる

---

## 🚨 よくある問題と解決方法

### LINE Login関連の問題

#### ❌ 問題: 「無効なclient_id」エラー
```
原因: チャネルIDの設定間違い
```
**解決方法:**
1. LINE Developersコンソールで正しいチャネルIDを確認
2. 環境変数 `LINE_LOGIN_CHANNEL_ID` を正しく設定
3. アプリを再起動

#### ❌ 問題: 「redirect_uri_mismatch」エラー
```
原因: コールバックURLの設定間違い
```
**解決方法:**
1. LINE Developersコンソールでコールバック URLが正しく設定されているか確認
2. HTTPSで始まっていることを確認
3. 開発環境と本番環境でURLが異なる場合は、それぞれ設定

#### ❌ 問題: 認証後にユーザー情報が取得できない
```
原因: スコープ設定が不適切、またはプロフィール取得の実装エラー
```
**解決方法:**
1. LINE Loginチャネルでprofileスコープがチェックされているか確認
2. NextAuth.jsのprofile関数が正しく実装されているか確認
3. LINE APIのレスポンス形式を確認

---

### Messaging API関連の問題

#### ❌ 問題: Webhookの検証が失敗する
```
原因: Webhook URLが無効、またはサーバーが応答していない
```
**解決方法:**
1. Webhook URLが正しく設定されているか確認（`https://your-domain.com/api/line/webhook`）
2. サーバーが起動しているか確認
3. HTTPSでアクセス可能か確認
4. ファイアウォールやセキュリティ設定を確認

#### ❌ 問題: LINE通知が送信されない
```
原因: アクセストークンが無効、またはユーザーが友達登録していない
```
**解決方法:**
1. 新しいチャネルアクセストークンを発行（長期を選択）
2. 環境変数を更新してアプリを再起動
3. 対象ユーザーがLINE公式アカウントを友達登録しているか確認
4. API呼び出しのエラーログを確認

#### ❌ 問題: 「Invalid signature」エラー
```
原因: Webhook署名検証の失敗
```
**解決方法:**
1. チャネルシークレットが正しく設定されているか確認
2. 署名検証ロジックが正しく実装されているか確認
3. リクエストボディの文字エンコーディングを確認

---

### NextAuth.js関連の問題

#### ❌ 問題: 「NEXTAUTH_URL」エラー
```
原因: NEXTAUTH_URL環境変数が設定されていない、または間違っている
```
**解決方法:**
1. 環境変数 `NEXTAUTH_URL` を正しく設定
2. 開発環境では `http://localhost:3000`、本番環境では実際のドメインを設定
3. アプリを再起動

#### ❌ 問題: セッションが保持されない
```
原因: NEXTAUTH_SECRET が設定されていない、またはセッション設定の問題
```
**解決方法:**
1. 環境変数 `NEXTAUTH_SECRET` にランダムな文字列を設定
2. セッション戦略が 'jwt' に設定されているか確認
3. ブラウザのクッキーが有効になっているか確認

---

### 環境変数関連の問題

#### ❌ 問題: 環境変数が読み込まれない
```
原因: ファイル名の間違い、または設定場所の間違い
```
**解決方法:**
1. ファイル名が `.env.local` であることを確認
2. プロジェクトのルートディレクトリに配置されているか確認
3. アプリを再起動
4. `process.env` でアクセスできているか確認

#### ❌ 問題: 本番環境で環境変数が反映されない
```
原因: デプロイプラットフォームで環境変数が設定されていない
```
**解決方法:**
1. Vercel/Netlify等のプラットフォームで環境変数を設定
2. デプロイを再実行
3. プラットフォームのログを確認

---

## 🔧 デバッグ方法

### ログの確認方法

#### 開発環境でのデバッグ
```bash
# 開発サーバー起動
npm run dev

# ログの確認
# NextAuth.jsのデバッグログを有効化
export NEXTAUTH_DEBUG=1
npm run dev
```

#### 本番環境でのログ確認
```bash
# Vercelの場合
vercel logs

# その他のプラットフォームの場合
# プラットフォーム固有のログ確認方法を使用
```

### ブラウザでのデバッグ
```javascript
// セッション情報の確認
import { useSession } from 'next-auth/react';

function DebugComponent() {
  const { data: session, status } = useSession();
  
  console.log('Session status:', status);
  console.log('Session data:', session);
  
  return <div>Debug info logged to console</div>;
}

// 環境変数の確認（フロントエンド）
console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL);
```

### API テスト方法

#### LINE Login テスト
```bash
# 認証URLの確認
curl -I https://your-domain.com/api/auth/signin

# コールバックURLの確認
curl -I https://your-domain.com/api/auth/line/callback
```

#### Webhook テスト
```bash
# Webhook URLの動作確認
curl -X POST https://your-domain.com/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{"events":[]}'
```

#### メッセージ送信テスト
```bash
# LINE Messaging API テスト
curl -X POST https://api.line.me/v2/bot/message/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "to": "USER_ID",
    "messages": [
      {
        "type": "text",
        "text": "テストメッセージ"
      }
    ]
  }'
```

---

## 📞 サポート・お問い合わせ

### LINE公式サポート
- [LINE Developers Community](https://www.line-community.me/)
- [LINE Developers FAQ](https://developers.line.biz/ja/faq/)
- [LINE Login ドキュメント](https://developers.line.biz/ja/docs/line-login/)
- [Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)

### NextAuth.js サポート
- [NextAuth.js 公式ドキュメント](https://next-auth.js.org/)
- [NextAuth.js GitHub](https://github.com/nextauthjs/next-auth)

### 技術的な問題の報告
問題が解決しない場合は、以下の情報を含めて開発チームまでお問い合わせください：

1. 発生している具体的なエラーメッセージ
2. 設定した環境変数（機密情報は除く）
3. サーバーログの関連部分
4. 実行した手順
5. 使用しているブラウザ・デバイス情報

---

**重要:** 機密情報（チャネルシークレット、アクセストークン、NextAuthシークレットなど）は決して他の人と共有しないでください。