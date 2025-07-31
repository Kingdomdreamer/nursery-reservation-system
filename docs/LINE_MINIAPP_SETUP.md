# LINE ミニアプリ & Messaging API 設定マニュアル（2024年版）

## 概要
このマニュアルでは、2024年にLIFFアプリがLINEミニアプリに統合されたことを踏まえ、nursery-reservation-system（予約システム）でLINEミニアプリとMessaging APIを使用するために必要な設定手順を説明します。

**重要: 2024年よりLIFFアプリは「LINEミニアプリ」として統合されました。**

## 必要なもの
- LINEアカウント
- LINE Business ID（LINE公式アカウント用）
- 本番環境のドメイン（HTTPS必須）
- LINE Developers アカウント

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

## 2. LINEミニアプリチャネルの作成

### 2.1 チャネルの作成
1. 作成したプロバイダーをクリック
2. **「チャネルを作成」** ボタンをクリック
3. **「LINEミニアプリ」** を選択
4. 以下の情報を入力：

```
チャネル名: 予約システム
チャネル説明: 農産物の予約・受取システム
アプリタイプ: ウェブアプリ
大業種: 小売・卸売
小業種: 食品・飲料
メールアドレス: your-email@example.com
```

5. 利用規約に同意して **「作成」** をクリック

### 2.2 LINEミニアプリ設定
1. **「LINEミニアプリ」** タブをクリック
2. **「追加」** ボタンをクリック
3. 以下の設定を入力：

#### 基本設定
```
ミニアプリ名: 予約フォーム
サイズ: Full
エンドポイントURL: https://your-domain.com/form/1
説明: 新鮮な農産物の予約システム
```

#### スコープ設定
以下のスコープを **すべてチェック**：
- `profile` - ユーザーのプロフィール情報取得
- `openid` - OpenID Connect

#### その他の設定
```
ボットリンク機能: On（推奨）
Scan QR: Off
PC版を利用可能にする: On（推奨）
```

4. **「追加」** をクリック

### 2.3 重要な情報の取得
作成後、以下の情報をメモしてください：

```
LIFF ID: liff-xxxxxxxxxxxxxxx
チャネルID: 1234567890
チャネルシークレット: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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
- アプリアイコン: ロゴ画像をアップロード（任意）

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

---

## 4. LINEミニアプリとMessaging APIの連携

### 4.1 ボットリンク機能の設定
1. **LINEミニアプリ設定** で「ボットリンク機能」を **オン** に設定
2. **「連携するbot」** で作成したMessaging APIチャネルを選択
3. 設定を保存

### 4.2 連携確認
- ユーザーがミニアプリを初回利用時に自動的にLINE公式アカウントが友達追加される
- Messaging APIからの通知がユーザーに届くようになる

---

## 5. 環境変数の設定（2024年版）

取得した情報を本システムの環境変数ファイル（`.env.local`）に設定します：

# 環境別設定例

## 開発環境（.env.local）
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-development-domain.com
NODE_ENV=development

# データベース設定（既存）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINEミニアプリ設定（開発用）
NEXT_PUBLIC_LIFF_ID=2007484444-JDmG6Vvy
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484444
LINE_MINIAPP_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d

# LINE Messaging API設定（開発用）
LINE_MESSAGING_CHANNEL_ID=your-messaging-dev-channel-id
LINE_MESSAGING_CHANNEL_SECRET=your-messaging-dev-channel-secret
LINE_MESSAGING_ACCESS_TOKEN=your-messaging-dev-access-token

# 互換性維持（既存コードとの互換性）
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484444
LINE_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d
```

## 審査用環境
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-staging-domain.com
NODE_ENV=staging

# LINEミニアプリ設定（審査用）
NEXT_PUBLIC_LIFF_ID=2007484445-Qaxn3MX6
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484445
LINE_MINIAPP_CHANNEL_SECRET=a3f04b86c20ca6146e39857505108d77

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484445
LINE_CHANNEL_SECRET=a3f04b86c20ca6146e39857505108d77
```

## 本番環境
```bash
# システム設定
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
NODE_ENV=production

# LINEミニアプリ設定（本番用）
NEXT_PUBLIC_LIFF_ID=2007484446-ryPBa2bJ
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484446
LINE_MINIAPP_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484446
LINE_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363
```

**重要な変更点:**
- `NEXT_PUBLIC_LIFF_ID` は引き続き使用可能
- `NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID` を追加（ミニアプリ専用）
- `LINE_MINIAPP_CHANNEL_SECRET` を追加（ミニアプリ専用）
- 既存の `NEXT_PUBLIC_LINE_CHANNEL_ID` は互換性のため維持

---

## 6. フロントエンド実装の更新

### 6.1 LINEミニアプリSDKの使用
```typescript
// 従来のLIFF SDKは引き続き使用可能
import liff from '@line/liff';

// 初期化
await liff.init({ 
  liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
  withLoginOnExternalBrowser: true // ミニアプリ対応
});

// ミニアプリ特有の機能
if (liff.isInClient()) {
  // LINEアプリ内での実行時
  const os = liff.getOS(); // iOS, Android, etc.
  const version = liff.getVersion();
  
  // ミニアプリ固有の機能を使用
  if (liff.isApiAvailable('shareTargetPicker')) {
    // 共有機能の利用
  }
}
```

### 6.2 環境変数の更新対応
```typescript
// 新しい環境変数を優先的に使用
const channelId = process.env.NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID || 
                  process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;

const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
```

### 6.3 ミニアプリ対応のコンテキストプロバイダー
```typescript
// src/components/line/MiniAppProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Liff } from '@line/liff';

interface MiniAppContextType {
  liff: Liff | null;
  isLoggedIn: boolean;
  isInClient: boolean;
  isMiniAppSupported: boolean;
  // ... その他のプロパティ
}

export const MiniAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [isMiniAppSupported, setIsMiniAppSupported] = useState(false);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not configured');
        }

        const { default: liff } = await import('@line/liff');
        
        await liff.init({ 
          liffId,
          withLoginOnExternalBrowser: true 
        });
        
        setLiff(liff);
        setIsInClient(liff.isInClient());
        
        // ミニアプリ対応チェック
        const miniAppSupported = liff.isApiAvailable('shareTargetPicker') ||
                                 liff.isApiAvailable('subwindow');
        setIsMiniAppSupported(miniAppSupported);

      } catch (error) {
        console.error('MiniApp initialization failed:', error);
      }
    };

    initializeMiniApp();
  }, []);

  // ... コンテキスト値とプロバイダーの実装
};
```

---

## 7. LINE公式アカウントの設定

### 7.1 LINE Official Account Manager
1. [LINE Official Account Manager](https://manager.line.biz/) にアクセス
2. Messaging APIで作成したアカウントが表示されることを確認
3. アカウント名をクリック

### 7.2 基本設定
1. **「設定」** → **「応答設定」** で以下を設定：

```
あいさつメッセージ: オン
応答メッセージ: オフ  
Webhook: オン
```

2. **「設定」** → **「アカウント設定」** で以下を設定：

```
アカウント名: ○○農園
ステータスメッセージ: 農産物の予約受付中！
プロフィール画像: ロゴまたは商品画像をアップロード
```

### 7.3 リッチメニューの設定（ミニアプリ対応）
1. **「リッチメニュー」** をクリック
2. **「作成」** をクリック
3. 以下のテンプレートを使用：

```
表示期間: 期間を設定しない
メニューバーのテキスト: メニュー

アクション設定:
- 予約する（ミニアプリ）: https://liff.line.me/{your-liff-id}
- 予約確認: https://your-domain.com/reservations  
- お問い合わせ: テキスト「お問い合わせありがとうございます」
```

**重要:** ミニアプリへのリンクは `https://liff.line.me/{liff-id}` 形式を使用

---

## 8. ミニアプリ特有の機能

### 8.1 共有機能
```typescript
// ミニアプリ内での共有機能
if (liff.isApiAvailable('shareTargetPicker')) {
  await liff.shareTargetPicker([
    {
      type: 'text',
      text: '○○農園で予約しました！新鮮な野菜をお届けします。'
    }
  ]);
}
```

### 8.2 サブウィンドウ機能
```typescript
// 外部ページをサブウィンドウで表示
if (liff.isApiAvailable('subwindow')) {
  liff.subwindow.open({
    url: 'https://your-domain.com/terms',
    isClosable: true
  });
}
```

### 8.3 ユーザーアクション追跡
```typescript
// ミニアプリでのユーザーアクション送信
if (liff.isApiAvailable('sendMessages')) {
  await liff.sendMessages([
    {
      type: 'text',
      text: '予約が完了しました！'
    }
  ]);
}
```

---

## 9. テスト・動作確認

### 9.1 ミニアプリ動作確認
1. LINEアプリでQRコードをスキャンまたはリンクをタップ
2. ミニアプリが正常に表示されることを確認
3. プロフィール情報が取得できることを確認
4. ボットリンク機能で公式アカウントが友達追加されることを確認

### 9.2 デスクトップ版確認
1. PC版LINEでミニアプリが利用可能か確認
2. ブラウザ版での動作確認

### 9.3 Webhook動作確認  
1. LINE Developersコンソールで **「Messaging API設定」** 
2. **「Webhookの検証」** をクリック
3. 成功メッセージが表示されることを確認

---

## 10. 2024年版での変更点まとめ

### 10.1 用語・概念の変更
| 旧（2023年以前） | 新（2024年以降） |
|------------------|------------------|
| LIFF アプリ | LINE ミニアプリ |
| LIFF URL | ミニアプリ URL |
| LIFF ブラウザ | ミニアプリ環境 |

### 10.2 技術的変更点
- **SDK**: 引き続き `@line/liff` を使用（互換性維持）
- **初期化**: `withLoginOnExternalBrowser: true` の推奨
- **新API**: 共有機能、サブウィンドウ機能の追加
- **URL形式**: `https://liff.line.me/{liff-id}` が正式形式

### 10.3 環境変数の推奨構成
```bash
# 2024年版推奨構成
NEXT_PUBLIC_LIFF_ID=liff-xxxxxxxxxxxxxxx
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=1234567890
LINE_MINIAPP_CHANNEL_SECRET=xxxxxxxxxx

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=xxxxxxxxxx
```

---

## 11. 移行ガイド（既存LIFFアプリから）

### 11.1 コード変更不要な部分
- 既存のLIFF SDKコード
- 基本的な認証フロー
- プロフィール情報取得

### 11.2 推奨される更新
```typescript
// 初期化オプションの追加
await liff.init({ 
  liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
  withLoginOnExternalBrowser: true // 追加推奨
});

// 新機能の活用
if (liff.isApiAvailable('shareTargetPicker')) {
  // 共有機能を実装
}
```

### 11.3 設定の確認・更新
1. LINE Developersコンソールでミニアプリ設定を確認
2. 環境変数の追加・更新
3. リッチメニューのURL更新

---

## 12. トラブルシューティング

### よくある問題と解決方法

#### ミニアプリが表示されない
```
原因: エンドポイントURLの設定間違い、SSL証明書の問題
解決: HTTPS URLの確認、証明書の有効性確認
```

#### ボットリンク機能が動作しない
```
原因: Messaging APIチャネルとの連携設定ミス
解決: ミニアプリ設定でボット連携を再確認
```

#### デスクトップ版で動作しない
```
原因: PC版利用設定がオフ
解決: ミニアプリ設定で「PC版を利用可能にする」をオン
```

---

## 13. 参考リンク

- [LINE Developers](https://developers.line.biz/ja/)
- [LINEミニアプリ ドキュメント](https://developers.line.biz/ja/docs/liff/)
- [Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Official Account Manager](https://manager.line.biz/)

---

このマニュアルは2024年のLINEミニアプリへの統合を反映した最新版です。既存のLIFFアプリも引き続き動作しますが、新機能を活用するためにはミニアプリとしての設定が推奨されます。