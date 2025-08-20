# 🚀 デプロイメントガイド

保育園商品予約システムの本番環境デプロイ手順書

## 📋 前提条件

### 必要なアカウント・サービス
- [Vercel](https://vercel.com/) または [Netlify](https://netlify.com/) アカウント
- [Supabase](https://supabase.com/) プロジェクト
- [LINE Developers](https://developers.line.biz/) アカウント
- 独自ドメイン（推奨）

### 技術要件
- Node.js 18.17以上
- PostgreSQL 13以上（Supabaseで提供）

## 🗄️ 1. データベースセットアップ

### Supabaseプロジェクト作成
1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. 「New Project」でプロジェクト作成
3. リージョンを選択（日本なら ap-northeast-1）
4. データベースパスワードを設定

### データベース初期化
```sql
-- 1. メインスキーマの作成
-- Supabase SQL Editorで実行
\copy database-rebuild.sql

-- 2. RLS設定の無効化
\copy disable-rls.sql

-- 3. 既存データがある場合の整合性修正
\copy database-integrity-fixes.sql
```

### 環境変数の取得
```bash
# Supabase Dashboard → Settings → API から取得
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 重要: 絶対に公開しない
```

## 📱 2. LINE Platform設定

### LIFF アプリ作成
1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. チャネル作成（LINE Login チャネル）
3. LIFF タブで新しいLIFFアプリを追加
   - **サイズ**: Full
   - **エンドポイントURL**: `https://your-domain.com/form/1`
   - **スコープ**: `profile` `openid`
   - **ボットリンク機能**: オプション

### Messaging API設定
1. Messaging APIチャネルを作成
2. チャネルアクセストークンを取得
3. Webhook URLを設定: `https://your-domain.com/api/line/webhook`

```bash
# LINE設定の環境変数
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret
```

## ☁️ 3. Vercelデプロイ（推奨）

### GitHub連携デプロイ
1. GitHubにリポジトリをプッシュ
2. [Vercel Dashboard](https://vercel.com/dashboard) でImport
3. プロジェクト設定:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 環境変数設定
```bash
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_LIFF_ID=your-liff-id
LINE_CHANNEL_ACCESS_TOKEN=your-token
NODE_ENV=production
```

### カスタムドメイン設定
1. Vercel Dashboard → Domains
2. カスタムドメインを追加
3. DNS設定（AレコードまたはCNAME）
4. SSL証明書の自動取得を確認

## 🔧 4. 本番環境最適化

### パフォーマンス設定
```javascript
// next.config.ts での最適化確認
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

### キャッシュ戦略
```javascript
// 静的リソースの最適化
{
  source: '/static/(.*)',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

## 🛡️ 5. セキュリティ設定

### 環境変数の安全管理
```bash
# 🚨 絶対に公開してはいけない値
SUPABASE_SERVICE_ROLE_KEY=  # データベース完全アクセス
LINE_CHANNEL_ACCESS_TOKEN=  # LINE API完全アクセス
LINE_CHANNEL_SECRET=        # 認証用秘密鍵

# ✅ 公開しても安全な値（NEXT_PUBLIC_プレフィックス）
NEXT_PUBLIC_SUPABASE_URL=   # 公開API URL
NEXT_PUBLIC_LIFF_ID=        # LIFF アプリID
```

### CORS設定
```sql
-- Supabase でのCORS設定
-- Dashboard → Settings → API → CORS Origins
https://your-domain.com
https://www.your-domain.com
```

### Rate Limiting
```javascript
// API Routes での制限実装例
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト制限
  message: 'Too many requests from this IP',
});
```

## 📊 6. モニタリング設定

### Vercel Analytics
```bash
# Vercelでのアナリティクス有効化
NEXT_PUBLIC_VERCEL_ANALYTICS=1
```

### エラー監視（Sentry）
```bash
# Sentry設定
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### パフォーマンス監視
```javascript
// Core Web Vitals の監視
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    // Google Analytics または Vercel Analytics に送信
    gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
    });
  }
}
```

## 🧪 7. デプロイ前チェックリスト

### ✅ 技術チェック
- [ ] `npm run build` が成功する
- [ ] `npm run lint` でエラーなし
- [ ] `npm test` でテスト通過
- [ ] TypeScriptエラーなし
- [ ] 環境変数が正しく設定されている

### ✅ 機能チェック
- [ ] 予約フォームが正常動作
- [ ] 管理画面にログイン可能
- [ ] LINE連携が動作
- [ ] メール通知が送信される
- [ ] データベース操作が正常

### ✅ セキュリティチェック
- [ ] 機密情報が環境変数に設定済み
- [ ] 本番用の強力なパスワード設定
- [ ] HTTPS通信の確認
- [ ] CSRFトークンの実装確認

### ✅ パフォーマンスチェック
- [ ] Lighthouse スコア 90+
- [ ] バンドルサイズ最適化
- [ ] 画像最適化確認
- [ ] キャッシュ設定確認

## 🚨 8. トラブルシューティング

### よくある問題

#### ビルドエラー
```bash
# TypeScriptエラーの場合
npm run type-check

# 依存関係の問題
npm ci
rm -rf .next
npm run build
```

#### 環境変数が認識されない
```bash
# 本番環境での確認
console.log('Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // 機密情報は表示しない
});
```

#### データベース接続エラー
```sql
-- Supabase での接続確認
SELECT 1 as connection_test;

-- RLS設定の確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 📞 9. サポート

### デプロイ後の確認事項
1. **基本動作**: すべてのページが正常表示されるか
2. **API動作**: 予約作成・取得が正常動作するか
3. **LINE連携**: LIFFアプリが正常起動するか
4. **管理機能**: 管理画面の全機能が動作するか

### 緊急時の対応
- **ロールバック**: Vercel Dashboard から前のデプロイに復元
- **メンテナンスモード**: 一時的にメンテナンスページを表示
- **ログ確認**: Vercel Function Logs でエラー詳細を確認

---

**🎉 デプロイ完了！高品質な保育園商品予約システムが本番稼働開始です！**