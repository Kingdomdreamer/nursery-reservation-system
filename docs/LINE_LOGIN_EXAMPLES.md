# LINE Login & Messaging API 実装例・テンプレート集

## 環境変数設定例

### .env.local の完全な設定例
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# データベース設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LINE Login設定
LINE_LOGIN_CHANNEL_ID=1234567890
LINE_LOGIN_CHANNEL_SECRET=abcdef1234567890abcdef1234567890
LINE_LOGIN_CALLBACK_URL=https://your-domain.com/api/auth/line/callback

# LINE Messaging API設定
LINE_MESSAGING_CHANNEL_ID=9876543210
LINE_MESSAGING_CHANNEL_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
LINE_MESSAGING_ACCESS_TOKEN=long-access-token-string

# NextAuth.js設定
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=https://your-domain.com
```

---

## NextAuth.js 実装例

### 認証設定ファイル
`src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'

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
      clientId: process.env.LINE_LOGIN_CHANNEL_ID!,
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
      profile(profile: any) {
        return {
          id: profile.userId,
          name: profile.displayName,
          email: `${profile.userId}@line.local`, // LINEはemailを提供しないため
          image: profile.pictureUrl,
          lineUserId: profile.userId,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 初回ログイン時にLINE情報を保存
      if (account && profile) {
        token.lineUserId = (profile as any).userId
        token.linePictureUrl = (profile as any).pictureUrl
        token.lineDisplayName = (profile as any).displayName
      }
      return token
    },
    async session({ session, token }) {
      // セッションにLINE情報を含める
      if (session.user) {
        (session.user as any).lineUserId = token.lineUserId
        (session.user as any).linePictureUrl = token.linePictureUrl
        (session.user as any).lineDisplayName = token.lineDisplayName
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // サインイン時の追加処理（必要に応じて）
      if (account?.provider === 'line') {
        // Supabaseにユーザー情報を保存
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          const { error } = await supabase
            .from('users')
            .upsert({
              line_user_id: (profile as any).userId,
              display_name: (profile as any).displayName,
              picture_url: (profile as any).pictureUrl,
              last_login: new Date().toISOString(),
            })

          if (error) {
            console.error('Error saving user to Supabase:', error)
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 型定義の拡張
`src/types/next-auth.d.ts`

```typescript
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      lineUserId?: string
      linePictureUrl?: string
      lineDisplayName?: string
    }
  }

  interface User {
    lineUserId?: string
    linePictureUrl?: string
    lineDisplayName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    lineUserId?: string
    linePictureUrl?: string
    lineDisplayName?: string
  }
}
```

---

## LINE Messaging API 実装例

### メッセージ送信ライブラリ
`src/lib/line-messaging.ts`

```typescript
interface LineTextMessage {
  type: 'text';
  text: string;
}

interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: any;
}

type LineMessage = LineTextMessage | LineFlexMessage;

class LineMessagingService {
  private accessToken: string;
  private channelSecret: string;

  constructor() {
    this.accessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN!;
    this.channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET!;
  }

  // 単一ユーザーにメッセージ送信
  async pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LINE API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending LINE message:', error);
      throw error;
    }
  }

  // 複数ユーザーにメッセージ送信（マルチキャスト）
  async multicastMessage(userIds: string[], messages: LineMessage[]): Promise<void> {
    if (userIds.length === 0) return;
    
    try {
      const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          to: userIds,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LINE API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending multicast LINE message:', error);
      throw error;
    }
  }

  // Webhook署名検証
  verifySignature(body: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('SHA256', this.channelSecret)
      .update(body, 'utf8')
      .digest('base64');
    
    return signature === expectedSignature;
  }
}

export const lineMessaging = new LineMessagingService();

// 便利な関数をエクスポート
export async function sendReservationConfirmation(userId: string, reservationData: any) {
  const message: LineFlexMessage = {
    type: 'flex',
    altText: '予約確認',
    contents: createReservationConfirmationFlex(reservationData),
  };

  await lineMessaging.pushMessage(userId, [message]);
}

export async function sendReminder(userId: string, reservationData: any) {
  const message: LineFlexMessage = {
    type: 'flex',
    altText: '受取リマインダー',
    contents: createReminderFlex(reservationData),
  };

  await lineMessaging.pushMessage(userId, [message]);
}
```

### Flexメッセージテンプレート
`src/lib/line-message-templates.ts`

```typescript
// 予約確認メッセージ
export function createReservationConfirmationFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 予約確認',
          weight: 'bold',
          size: 'xl',
          color: '#27AE60',
        },
      ],
      backgroundColor: '#E8F6F3',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: 'ご予約ありがとうございます！',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 ご注文内容',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'box',
              layout: 'baseline',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '•',
                  size: 'sm',
                  color: '#666666',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: `${product.name} × ${product.quantity}`,
                  size: 'sm',
                  flex: 4,
                  wrap: true,
                },
                {
                  type: 'text',
                  text: `¥${product.price.toLocaleString()}`,
                  size: 'sm',
                  align: 'end',
                  color: '#2C3E50',
                  flex: 2,
                },
              ],
            })),
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📅 受取予定日',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }),
              size: 'lg',
              weight: 'bold',
              color: '#E74C3C',
              margin: 'sm',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '💰 合計金額',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: `¥${reservation.total_amount.toLocaleString()}`,
              size: 'xl',
              weight: 'bold',
              color: '#27AE60',
              margin: 'sm',
            },
          ],
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '予約詳細を確認',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/${reservation.id}`,
          },
          style: 'primary',
          color: '#27AE60',
        },
        {
          type: 'text',
          text: 'ご不明点はお気軽にお問い合わせください',
          size: 'xs',
          color: '#999999',
          wrap: true,
          margin: 'md',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
    },
  };
}

// リマインダーメッセージ
export function createReminderFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔔 受取リマインダー',
          weight: 'bold',
          size: 'xl',
          color: '#F39C12',
        },
      ],
      backgroundColor: '#FEF9E7',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: '明日は商品の受取日です！',
          margin: 'md',
          color: '#E74C3C',
          weight: 'bold',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 受取商品',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'text',
              text: `• ${product.name} × ${product.quantity}`,
              size: 'sm',
              margin: 'sm',
              wrap: true,
            })),
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📅 受取日時',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }),
              size: 'lg',
              weight: 'bold',
              color: '#E74C3C',
              margin: 'sm',
            },
            {
              type: 'text',
              text: '営業時間：9:00 - 17:00',
              size: 'sm',
              color: '#666666',
              margin: 'sm',
            },
          ],
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '受取場所を確認',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/location`,
          },
          style: 'primary',
          color: '#F39C12',
        },
      ],
      paddingAll: 'lg',
    },
  };
}

// キャンセル通知メッセージ
export function createCancellationFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '❌ 予約キャンセル',
          weight: 'bold',
          size: 'xl',
          color: '#E74C3C',
        },
      ],
      backgroundColor: '#FADBD8',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: 'ご予約がキャンセルされました',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 キャンセルされた商品',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'text',
              text: `• ${product.name} × ${product.quantity}`,
              size: 'sm',
              margin: 'sm',
              wrap: true,
            })),
          ],
        },
        {
          type: 'text',
          text: 'またのご利用をお待ちしております',
          margin: 'lg',
          align: 'center',
          color: '#666666',
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '新しく予約する',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}`,
          },
          style: 'primary',
          color: '#27AE60',
        },
      ],
      paddingAll: 'lg',
    },
  };
}
```

---

## Webhook実装例

### Webhookハンドラー
`src/app/api/line/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { lineMessaging } from '@/lib/line-messaging';

interface LineWebhookEvent {
  type: string;
  source: {
    type: string;
    userId?: string;
  };
  message?: {
    type: string;
    text?: string;
  };
  timestamp: number;
  replyToken?: string;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
  destination: string;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-line-signature');
    const body = await request.text();

    // 署名検証
    if (!signature || !lineMessaging.verifySignature(body, signature)) {
      console.error('Invalid LINE webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookBody: LineWebhookBody = JSON.parse(body);
    
    // イベント処理
    for (const event of webhookBody.events) {
      await handleLineEvent(event);
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleLineEvent(event: LineWebhookEvent) {
  const userId = event.source.userId;
  
  if (!userId) return;

  switch (event.type) {
    case 'message':
      await handleMessage(event, userId);
      break;
    case 'follow':
      await handleFollow(userId);
      break;
    case 'unfollow':
      await handleUnfollow(userId);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
}

async function handleMessage(event: LineWebhookEvent, userId: string) {
  if (event.message?.type !== 'text') return;
  
  const messageText = event.message.text?.toLowerCase() || '';
  
  // 簡単なキーワード応答
  if (messageText.includes('営業時間')) {
    await lineMessaging.pushMessage(userId, [
      {
        type: 'text',
        text: '📅 営業時間のご案内\n\n【平日】9:00 - 17:00\n【土曜】9:00 - 15:00\n【定休日】日曜・祝日\n\n※予約受付は24時間可能です',
      },
    ]);
  } else if (messageText.includes('予約') || messageText.includes('注文')) {
    await lineMessaging.pushMessage(userId, [
      {
        type: 'text',
        text: '🌱 ご利用ありがとうございます！\n\n予約は以下のリンクから可能です：\n' + process.env.NEXT_PUBLIC_BASE_URL,
      },
    ]);
  } else {
    // デフォルト応答
    await lineMessaging.pushMessage(userId, [
      {
        type: 'text',
        text: 'お問い合わせありがとうございます。\n\n営業時間や予約に関するご質問は、キーワードを入力してお試しください。\n\n【キーワード例】\n• 営業時間\n• 予約\n• 注文',
      },
    ]);
  }
}

async function handleFollow(userId: string) {
  // 友達追加時の処理
  await lineMessaging.pushMessage(userId, [
    {
      type: 'text',
      text: '🌱 ○○農園にご登録いただき、ありがとうございます！\n\n新鮮な農産物の予約ができます。\n下のリンクからぜひご利用ください。\n\n' + process.env.NEXT_PUBLIC_BASE_URL,
    },
  ]);
  
  // データベースにユーザー情報を記録
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('line_users')
      .upsert({
        line_user_id: userId,
        is_friend: true,
        followed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error recording follow event:', error);
  }
}

async function handleUnfollow(userId: string) {
  // フォロー解除時の処理
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('line_users')
      .update({
        is_friend: false,
        unfollowed_at: new Date().toISOString(),
      })
      .eq('line_user_id', userId);
  } catch (error) {
    console.error('Error recording unfollow event:', error);
  }
}
```

---

## フロントエンド実装例

### ログインページ
`src/app/login/page.tsx`

```typescript
'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 既にログイン済みの場合はリダイレクト
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleLineLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('line', {
        callbackUrl: '/',
        redirect: false,
      });
      
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ○○農園 予約システム
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            LINEアカウントでログインしてご利用ください
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLineLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ログイン中...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 4.925 0 11c0 2.653.94 5.086 2.504 6.986L2 24l6.014-.504C9.36 23.832 10.656 24 12 24c6.627 0 12-4.925 12-11S18.627 0 12 0z"/>
                </svg>
                LINEでログイン
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### セッションプロバイダー
`src/components/providers/SessionProvider.tsx`

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
```

### 認証ガード
`src/components/auth/AuthGuard.tsx`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // まだロード中
    
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // リダイレクト中
  }

  return <>{children}</>;
}
```

---

これらの実装例を参考に、LINEログイン（Web版）とMessaging APIを使用したシステム構築を行ってください。