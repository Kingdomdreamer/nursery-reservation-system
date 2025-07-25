# Vercelデプロイ用環境変数設定

## ❗ 重要: 環境変数エラーの解決

現在のエラー: `supabaseKey is required.`

これは環境変数が正しく設定されていないことが原因です。

## 必須環境変数

以下の環境変数をVercelのプロジェクト設定で**必ず**設定してください：

### 🔴 最優先（必須）
- `NEXT_PUBLIC_SUPABASE_URL`: `https://uscvsipskkbegcfktjyt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3ZzaXBza2tiZWdjZmt0anl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDI4MzUsImV4cCI6MjA2Nzk3ODgzNX0.VhcGWXb-PpHTfqPApSIG4C6xXLik8JClsNhOdJIgdzw`

### 🟡 重要
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3ZzaXBza2tiZWdjZmt0anl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwMjgzNSwiZXhwIjoyMDY3OTc4ODM1fQ.GpIODjKZJppJLu2Hwa2i2goPmE23vS5FnMa9J1LDzB0`
- `NEXT_PUBLIC_LIFF_ID`: `2007787336-ONKMVygx`
- `NEXT_PUBLIC_BASE_URL`: `https://your-vercel-domain.vercel.app`（デプロイ後のURL）

### 🟢 オプション（後で設定可能）
- `LINE_CHANNEL_ACCESS_TOKEN`: `UYqfMDzllpxhibeD9aHspQ1lbP50f1/zJk71E+/2+LYA3NPO7DaGm2YU5BRomA3n86L9z0b1KW+g3D9HsGe0G7iPz0yZtN7liEv5qs3lltZ3YKxP0Zst9BvZsmYnc2qgG1JtF6fEYax4AGQkaZsgCAdB04t89/1O/w1cDnyilFU=`
- `LINE_CHANNEL_SECRET`: `36cf07cbd04fe902a7d41d4508d68905`
- `LINE_LOGIN_CHANNEL_ID`: `2007787336`
- `LINE_LOGIN_CHANNEL_SECRET`: `eaf2dc5e15fd8d1cb14303491b751d12`

## デプロイ手順

### 1. Vercel Web Dashboard を使用

1. https://vercel.com/dashboard にアクセス
2. "New Project" をクリック
3. GitHubアカウントと連携
4. このリポジトリを選択
5. **重要**: "Configure Project" で環境変数を設定
   - 🔴 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を**必ず**設定
6. "Deploy" をクリック

### 2. 環境変数設定の確認方法

デプロイ後に以下のURLにアクセスして環境変数が正しく設定されているか確認：
```
https://your-vercel-domain.vercel.app/debug
```

### 3. エラーが発生した場合

1. Vercelダッシュボードで "Settings" > "Environment Variables" を確認
2. 環境変数を追加後、"Redeploy" を実行
3. `/debug` ページで接続状態を確認

### 2. 自動デプロイ設定

- mainブランチにプッシュすると自動的にデプロイされます
- プルリクエストではプレビューデプロイが作成されます

### 3. カスタムドメイン設定（オプション）

Vercelの設定で独自ドメインを設定できます：
- プロジェクト設定 > Domains
- `vejiraisu.yoyaku.com` を追加

## 注意事項

1. **NEXT_PUBLIC_BASE_URL** は実際のVercelドメイン名に更新してください
2. LINE LIFF設定で許可するドメインにVercelのURLを追加してください
3. Supabaseの許可されたオリジンにVercelのURLを追加してください

## デプロイ後の確認

1. アプリケーションが正常に起動することを確認
2. LIFF機能が動作することを確認
3. データベース接続が正常であることを確認
4. LINE通知機能が動作することを確認