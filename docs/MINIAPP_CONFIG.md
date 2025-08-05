# ベジライス予約システム - LINE Mini App 設定情報

## 環境別チャネル情報

### 開発用
- **チャネルID**: `2007484444`
- **チャネルシークレット**: `bbab95e89d618d3fe050bf83b5fedb8d`
- **LIFF URL**: `https://miniapp.line.me/2007484444-JDmG6Vvy`
- **LIFF ID**: `2007484444-JDmG6Vvy`
- **アプリ名**: 開発用（ベジライス予約）

### 審査用
- **チャネルID**: `2007484445`
- **チャネルシークレット**: `a3f04b86c20ca6146e39857505108d77`
- **LIFF URL**: `https://miniapp.line.me/2007484445-Qaxn3MX6`
- **LIFF ID**: `2007484445-Qaxn3MX6`
- **アプリ名**: 審査用（ベジライス予約）

### 本番用
- **チャネルID**: `2007484446`
- **チャネルシークレット**: `28dcb383eb7c929688346b625780e363`
- **LIFF URL**: `https://miniapp.line.me/2007484446-ryPBa2bJ`
- **LIFF ID**: `2007484446-ryPBa2bJ`
- **アプリ名**: 本番用（ベジライス予約）

---

## 環境変数設定

### 開発環境（.env.local）
```bash
# LINEミニアプリ設定（開発用）
NEXT_PUBLIC_LIFF_ID=2007484444-JDmG6Vvy
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484444
LINE_MINIAPP_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484444
LINE_CHANNEL_SECRET=bbab95e89d618d3fe050bf83b5fedb8d
```

### 審査用環境
```bash
# LINEミニアプリ設定（審査用）
NEXT_PUBLIC_LIFF_ID=2007484445-Qaxn3MX6
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484445
LINE_MINIAPP_CHANNEL_SECRET=a3f04b86c20ca6146e39857505108d77

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484445
LINE_CHANNEL_SECRET=a3f04b86c20ca6146e39857505108d77
```

### 本番環境
```bash
# LINEミニアプリ設定（本番用）
NEXT_PUBLIC_LIFF_ID=2007484446-ryPBa2bJ
NEXT_PUBLIC_LINE_MINIAPP_CHANNEL_ID=2007484446
LINE_MINIAPP_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363

# 互換性維持
NEXT_PUBLIC_LINE_CHANNEL_ID=2007484446
LINE_CHANNEL_SECRET=28dcb383eb7c929688346b625780e363
```

---

## アクセス用URL

### 開発用ミニアプリ
```
https://miniapp.line.me/2007484444-JDmG6Vvy
```

### 審査用ミニアプリ
```
https://miniapp.line.me/2007484445-Qaxn3MX6
```

### 本番用ミニアプリ
```
https://miniapp.line.me/2007484446-ryPBa2bJ
```

---

## 注意事項

1. **エンドポイントURL**: 提供された情報では全て開発用URLが設定されていますが、実際の運用では各環境に対応したドメインに設定する必要があります。

2. **アプリ名**: 現在すべて「開発用（ベジライス予約）」となっていますが、審査用・本番用は適切な名前に変更することを推奨します。

3. **セキュリティ**: チャネルシークレットは機密情報です。環境変数として適切に管理し、リポジトリにコミットしないよう注意してください。

4. **Messaging API**: 通知機能を使用する場合は、別途Messaging APIチャネルの設定が必要です。

---

## 実装における使用方法

既存の `LiffProvider.tsx` で、環境変数 `NEXT_PUBLIC_LIFF_ID` に上記のLIFF IDを設定することで、各環境での動作が可能です。

```typescript
// 開発環境での使用例
const liffId = process.env.NEXT_PUBLIC_LIFF_ID; // "2007484444-JDmG6Vvy"
await liff.init({ liffId });
```

この設定により、ベジライス予約システムがLINE Mini Appとして正常に動作します。