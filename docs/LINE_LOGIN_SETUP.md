# LINE Login & Messaging API 設定マニュアル

## 概要
このマニュアルでは、nursery-reservation-system（予約システム）でLINEログイン（Web版）とMessaging APIを使用するために必要なLINE Developersコンソールでの設定手順を説明します。

**重要: この設定はLIFFではなく、通常のWebアプリケーション向けのLINEログインを使用します。**

## 必要なもの
- LINEアカウント
- 本番環境のドメイン（HTTPS必須）
- システムのコールバックURL

---

## 1. LINE Developersコンソールへのアクセス

### 1.1 アカウント作成・ログイン
1. [LINE Developers](https://developers.line.biz/ja/) にアクセス
2. LINEアカウントでログイン
3. 初回利用時は開発者として登録

### 1.2 プロバイダーの作成
1. **「プロバイダー」** タブをクリック
2. **「作成」** ボタンをクリック
3. プロバイダー名を入力（例：「○○農園」）
4. **「作成」** をクリック

---

## 2. LINE Login チャネルの作成

### 2.1 チャネルの作成
1. 作成したプロバイダーをクリック
2. **「チャネルを作成」** ボタンをクリック
3. **「LINEログイン」** を選択
4. 以下の情報を入力：

```
チャネル名: 予約システム ログイン
チャネル説明: 農産物予約システムのユーザー認証
アプリタイプ: ウェブアプリ
大業種: 小売・卸売
小業種: 食品・飲料
メールアドレス: your-email@example.com
```

5. 利用規約に同意して **「作成」** をクリック

### 2.2 LINE Login設定
1. **「LINE Login設定」** タブをクリック
2. 以下の設定を行う：

#### コールバックURL
```
開発環境: http://localhost:3000/api/auth/line/callback
本番環境: https://your-domain.com/api/auth/line/callback
```

#### アプリ設定
```
アプリ名: ○○農園 予約システム
アプリ説明: 新鮮な農産物の予約・受取システム
アプリアイコン: ロゴ画像をアップロード（推奨）
利用規約URL: https://your-domain.com/terms（任意）
プライバシーポリシーURL: https://your-domain.com/privacy（任意）
```

#### スコープ設定
以下のスコープを **チェック**：
- `profile` - ユーザーのプロフィール情報取得
- `openid` - OpenID Connect

#### その他の設定
```
ボットリンク機能: 使用しない（Messaging API側で設定）
PC版を利用可能にする: 利用可能にする
```

3. **「更新」** をクリック

### 2.3 重要な情報の取得
設定完了後、以下の情報をメモしてください：

```
チャネルID: 1234567890
チャネルシークレット: abcdef1234567890abcdef1234567890
```

---

## 3. Messaging API チャネルの作成

### 3.1 新しいチャネルの作成
1. プロバイダー画面に戻る
2. **「チャネルを作成」** ボタンをクリック
3. **「Messaging API」** を選択
4. 以下の情報を入力：

```
チャネル名: 予約システム通知
チャネル説明: 予約確認・リマインダー通知
大業種: 小売・卸売
小業種: 食品・飲料
メールアドレス: your-email@example.com
```

5. 利用規約に同意して **「作成」** をクリック

### 3.2 基本設定
1. **「基本設定」** タブで以下を設定：

```
チャネル基本情報:
- アプリ名: ○○農園 予約システム
- アプリ説明: 農産物の予約・受取を管理するシステムです
- アプリアイコン: ロゴ画像をアップロード（推奨）

プライバシーポリシーURL: https://your-domain.com/privacy（任意）
サービス利用規約URL: https://your-domain.com/terms（任意）
```

### 3.3 Messaging API設定
1. **「Messaging API設定」** タブをクリック
2. 以下を設定：

```
Webhook URL: https://your-domain.com/api/line/webhook
Webhookの利用: オン
Webhook再送: オン（推奨）

応答メッセージ: オフ
あいさつメッセージ: オン
加友時あいさつ: オン
自動応答メッセージ: オフ
```

3. **「Webhookの検証」** をクリックして動作確認

### 3.4 重要な情報の取得
以下の情報をメモしてください：

```
チャネルID: 9876543210
チャネルシークレット: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
チャネルアクセストークン: （「発行」ボタンをクリックして生成）
```

**注意: チャネルアクセストークンは「長期」を選択してください**

---

## 4. 環境変数の設定

取得した情報を本システムの環境変数ファイル（`.env.local`）に設定します：

```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# Supabase設定（既存）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE Login設定
LINE_LOGIN_CHANNEL_ID=1234567890
LINE_LOGIN_CHANNEL_SECRET=abcdef1234567890abcdef1234567890
LINE_LOGIN_CALLBACK_URL=https://your-domain.com/api/auth/line/callback

# LINE Messaging API設定
LINE_MESSAGING_CHANNEL_ID=9876543210
LINE_MESSAGING_CHANNEL_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
LINE_MESSAGING_ACCESS_TOKEN=長いアクセストークン文字列

# セッション管理
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com
```

---

## 5. Next.js での実装に必要な設定

### 5.1 NextAuth.js設定例
`src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'line',
      name: 'LINE',
      type: 'oauth',
      version: '2.0',
      scope: 'profile openid',
      params: {
        grant_type: 'authorization_code',
      },
      accessTokenUrl: 'https://api.line.me/oauth2/v2.1/token',
      authorizationUrl: 'https://access.line.me/oauth2/v2.1/authorize?response_type=code',
      profileUrl: 'https://api.line.me/v2/profile',
      clientId: process.env.LINE_LOGIN_CHANNEL_ID,
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.displayName,
          image: profile.pictureUrl,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.lineUserId = profile.userId
      }
      return token
    },
    async session({ session, token }) {
      session.user.lineUserId = token.lineUserId
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 5.2 LINE Messaging API使用例
`src/lib/line-messaging.ts`

```typescript
interface LineMessage {
  type: 'text' | 'flex';
  text?: string;
  altText?: string;
  contents?: any;
}

export async function sendLineMessage(userId: string, messages: LineMessage[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: messages,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send LINE message');
  }

  return response.json();
}
```

---

## 6. LINE公式アカウントの設定

### 6.1 LINE Official Account Manager
1. [LINE Official Account Manager](https://manager.line.biz/) にアクセス
2. Messaging APIで作成したアカウントが表示されることを確認
3. アカウント名をクリック

### 6.2 基本設定
1. **「設定」** → **「応答設定」** で以下を設定：

```
あいさつメッセージ: オン
応答メッセージ: オフ
Webhook: オン
```

2. **「設定」** → **「アカウント設定」** で以下を設定：

```
アカウント名: ○○農園
ステータスメッセージ: 農産物の予約受付中！お気軽にご利用ください
プロフィール画像: ロゴまたは商品画像をアップロード
カバー画像: 農園や商品の魅力的な画像をアップロード
```

### 6.3 リッチメニューの設定（推奨）
1. **「リッチメニュー」** をクリック
2. **「作成」** をクリック
3. 以下のテンプレートを使用：

```
表示期間: 期間を設定しない
メニューバーのテキスト: メニュー

アクション設定:
- 予約サイト: https://your-domain.com
- 予約確認: https://your-domain.com/reservations
- お問い合わせ: テキスト「お問い合わせありがとうございます」
```

---

## 7. テスト・動作確認

### 7.1 LINE Login動作確認
1. ブラウザで `https://your-domain.com/api/auth/signin` にアクセス
2. **「LINEでサインイン」** ボタンをクリック
3. LINE認証画面が表示されることを確認
4. 認証後、システムに正常にログインできることを確認

### 7.2 Webhook動作確認
1. LINE Developersコンソールで **「Messaging API設定」**
2. **「Webhookの検証」** をクリック
3. 成功メッセージが表示されることを確認

### 7.3 通知機能確認
1. 予約システムから実際に予約を実行
2. LINE通知が送信されることを確認
3. メッセージ内容が正しく表示されることを確認

---

## 8. セキュリティ設定

### 8.1 チャネルシークレットの保護
- 環境変数として適切に管理
- GitHub等のリポジトリにコミットしない
- 定期的にローテーション（推奨：6ヶ月）

### 8.2 Webhook署名検証
```typescript
import crypto from 'crypto';

export function verifyLineSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET!;
  const expectedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');
  
  return signature === expectedSignature;
}
```

### 8.3 CORS設定
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://access.line.me' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        ],
      },
    ]
  },
}
```

---

## 9. 本番運用時の注意点

### 9.1 料金について
- **LINE Login**: 無料
- **LINE Messaging API**: 月1,000通まで無料、以降は従量課金（3円/通）

### 9.2 利用制限
- **API呼び出し制限**: 通常は十分だが、大量送信時は注意
- **メッセージ送信制限**: 友達登録したユーザーのみ

### 9.3 コンプライアンス
- 個人情報保護法の遵守
- LINE利用規約の遵守
- 利用規約・プライバシーポリシーの整備

---

## 10. トラブルシューティング

### よくある問題と解決方法

#### LINE Login認証が失敗する
```
原因: コールバックURLの設定間違い
解決: チャネル設定で正しいURLを確認・設定
```

#### Webhook URLが応答しない
```
原因: HTTPSでない、URLが間違っている、サーバーが起動していない
解決: 正しいHTTPS URLを設定、サーバーの動作確認
```

#### プロフィール情報が取得できない
```
原因: スコープ設定が不適切
解決: profile、openidスコープが有効になっているか確認
```

#### LINE通知が送信されない
```
原因: チャネルアクセストークンが無効、ユーザーが友達登録していない
解決: 新しいアクセストークンを発行、友達登録を確認
```

#### 「Invalid signature」エラー
```
原因: Webhook署名検証の失敗
解決: チャネルシークレットが正しく設定されているか確認
```

---

## 11. 開発フロー例

### 11.1 開発環境での確認手順
1. ngrokでローカル環境を公開
```bash
ngrok http 3000
```

2. 取得したURLをWebhook URLに設定
```
https://abc123.ngrok.io/api/line/webhook
```

3. 動作確認を実施

### 11.2 本番デプロイ前チェックリスト
- [ ] 環境変数が正しく設定されている
- [ ] HTTPS証明書が有効
- [ ] Webhook URLが正しく応答する
- [ ] LINE Login認証フローが正常
- [ ] 通知メッセージが正しく送信される

---

## 12. サポート・リファレンス

### LINE公式ドキュメント
- [LINE Login ドキュメント](https://developers.line.biz/ja/docs/line-login/)
- [Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Official Account Manager](https://manager.line.biz/)

### 技術サポート
- [LINE Developers Community](https://www.line-community.me/)
- [LINE Developers FAQ](https://developers.line.biz/ja/faq/)

---

**重要:** このマニュアルはLIFFではなく、通常のWebアプリケーション向けのLINEログインの設定手順です。LIFFを使用する場合は、別途LIFF専用の設定が必要になります。