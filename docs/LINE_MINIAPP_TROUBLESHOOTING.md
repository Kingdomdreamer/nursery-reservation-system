# LINE Mini App トラブルシューティングガイド

## 🚨 「Failed to initialize LINE app」エラーの解決方法

### 原因と対処法

#### 1. **エンドポイントURLの不整合**
**現在の設定状況:**
```
エンドポイントURL: https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app
環境変数: https://vejiraisu.yoyaku.com (修正済み)
```

**対処法:**
- ✅ 環境変数を実際のVercel URLに更新済み
- LINE DevelopersコンソールでエンドポイントURLが正しく設定されているか確認

#### 2. **スコープ設定の問題**
**現在のスコープ:** `openid, profile, chat_message.write`

**注意点:**
- `chat_message.write`スコープは特別な権限
- ブラウザの最小化機能が無効になる
- 初期化時に追加の同意が必要な場合がある

**対処法:**
1. 必要でない場合は`chat_message.write`スコープを削除
2. 必要な場合は適切な権限要求処理を実装

#### 3. **チャネル同意の簡略化設定**
**設定状況:**
- シェアターゲットピッカー: 有効
- チャネル同意の簡略化: 有効（開発・審査用のみ）

**確認項目:**
```
✅ 開発用LINEミニアプリで有効
✅ 審査用LINEミニアプリで有効
❌ 本番用では無効（未認証ミニアプリのため）
```

---

## 🔧 LINE Developersコンソール設定確認

### 基本設定の確認
```
LIFF URL:
- 開発用: https://miniapp.line.me/2007484444-JDmG6Vvy
- 審査用: https://miniapp.line.me/2007484445-Qaxn3MX6  
- 本番用: https://miniapp.line.me/2007484446-ryPBa2bJ

エンドポイントURL:
全環境: https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app

サイズ: full
スコープ: openid, profile, chat_message.write
友だち追加オプション: On (normal)
```

### 推奨設定変更

#### Option 1: スコープを最小限に（推奨）
```
変更前: openid, profile, chat_message.write
変更後: openid, profile
```

**メリット:**
- 初期化エラーの可能性を減らす
- ユーザーの同意プロセスが簡素化
- ブラウザ機能制限なし

#### Option 2: 現在の設定を維持
```
スコープ: openid, profile, chat_message.write
```

**必要な実装:**
- メッセージ送信機能の追加実装
- 適切な権限要求処理

---

## 🛠️ デバッグ手順

### 1. ブラウザ開発者ツールでの確認
```javascript
// コンソールで確認するべき項目
console.log('LIFF ID:', process.env.NEXT_PUBLIC_LIFF_ID);
console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL);

// LIFF初期化状況の確認
// LiffProvider.tsxで追加したログを確認
```

### 2. 段階的テスト手順
```
1. ✅ Vercel URLに直接アクセス → サイトが表示されるか
2. ✅ LIFF URLからアクセス → LINEアプリで開けるか  
3. ✅ LIFF初期化ログ → エラーの詳細確認
4. ✅ ユーザープロフィール取得 → 認証が成功するか
```

### 3. エラーログの確認方法
```bash
# ブラウザコンソールで確認
- "LIFF ID: 2007484444-JDmG6Vvy" が表示されるか
- "LIFF SDK loaded successfully" が表示されるか
- "LIFF initialized successfully" が表示されるか

# エラーが発生した場合
- エラーメッセージの詳細をコピー
- 発生したステップを特定
```

---

## 🎯 推奨修正手順

### Step 1: LINE Developersでの設定変更
1. **スコープ変更**: `chat_message.write`を削除（不要な場合）
2. **エンドポイントURL確認**: 全環境で正しいVercel URLが設定されているか
3. **チャネル同意の簡略化**: 設定内容を再確認

### Step 2: コード側の確認
1. **環境変数**: 実際のVercel URLに更新済み ✅
2. **LIFF初期化**: Mini App対応設定追加済み ✅
3. **エラーハンドリング**: 詳細なログ追加済み ✅

### Step 3: テスト実行
1. **ローカルテスト**: `npm run dev`で動作確認
2. **Vercelテスト**: デプロイ後のURL直接アクセス
3. **LIFF URLテスト**: LINEアプリからアクセス

---

## 🔍 よくある問題と解決策

### Q1: 「Invalid LIFF ID」エラー
**原因**: LIFF IDの形式が間違っている
**解決策**: `2007484444-JDmG6Vvy`形式で正しく設定されているか確認

### Q2: 「LIFF endpoint URL mismatch」エラー  
**原因**: エンドポイントURLとアクセス元URLが一致しない
**解決策**: LINE Developersの設定とVercel URLを完全一致させる

### Q3: 「Permission denied」エラー
**原因**: スコープ設定の問題
**解決策**: 
- 必要最小限のスコープに変更
- または適切な権限要求処理を実装

### Q4: ブラウザで「Loading...」のまま
**原因**: HTTPS証明書またはCORS設定の問題
**解決策**: Vercelの自動HTTPS証明書を確認

---

## 📞 サポート情報

### LINE公式サポート
- [LINE Developers FAQ](https://developers.line.biz/ja/faq/)
- [LINEミニアプリ ドキュメント](https://developers.line.biz/ja/docs/liff/)

### 現在の設定情報（デバッグ用）
```
LIFF ID: 2007484444-JDmG6Vvy (開発用)
Vercel URL: https://nursery-reservation-system-e4r1cv2av-kingdomdreamers-projects.vercel.app
スコープ: openid, profile, chat_message.write
友だち追加: On (normal)
```

このガイドに従って設定を確認・修正すれば、「Failed to initialize LINE app」エラーを解決できるはずです。