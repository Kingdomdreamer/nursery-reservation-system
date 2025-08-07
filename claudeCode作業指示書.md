# claudeCode作業指示書 - 商品予約システム統一化

## 📋 **作業概要**

LINE連携による商品予約システムの包括的な統一化・改善作業です。現在の分散したデータベース構造とAPI実装を統一し、管理者が複数のフォームを効率的に管理できるシステムに再構築します。

## 🎯 **作業目標**

1. **データベース構造の統一**: 現在の複雑な関係を整理し、明確な責任分離を実現
2. **API実装の統一**: 一貫性のあるエラーハンドリングとレスポンス形式
3. **フォーム管理の強化**: 複数フォーム同時運用と柔軟な設定機能
4. **予約機能の完全実装**: 変更・キャンセル機能を含む完全な予約システム
5. **管理画面の充実**: 商品・フォーム・予約の一元管理

## 🗂️ **参考資料**

作業前に以下のファイルを必ず確認してください：

- **要件文書**: `.kiro/specs/database-schema-sync/requirements.md`
- **設計文書**: `.kiro/specs/database-schema-sync/design.md`
- **現在の実装**: `src/app/api/presets/[presetId]/config/route.ts`
- **データベース設計**: `データベース設計整理・統一指示書.md`

## 🔧 **作業手順**

### **Phase 1: 基盤整備（優先度：最高）**

#### **作業1: データベース構造の再構築**
```sql
-- 実行するSQLコード（設計文書から取得）
-- 1. 既存テーブルの一括削除
-- 2. 新しいテーブル構造の作成
-- 3. インデックスの作成
-- 4. 初期データの投入
```

**具体的な作業内容:**
- 設計文書のSQLコードを実行してデータベースを完全に再構築
- 既存データのバックアップ（必要に応じて）
- 新しいテーブル構造での動作確認

**成果物:**
- 統一されたデータベース構造
- 適切なインデックス設定
- サンプルデータの投入完了

---

#### **作業2: 統一型定義の作成**
**ファイル:** `src/types/database.ts`

**作業内容:**
```typescript
// 新しいデータベース構造に対応した型定義を作成
// 設計文書の「TypeScript型定義」セクションを参考に実装

export interface Product {
  readonly id: number;
  readonly product_code?: string;
  readonly name: string;
  readonly variation_id: number;
  readonly variation_name: string;
  readonly tax_type: '内税' | '外税';
  readonly price: number;
  readonly barcode?: string;
  readonly visible: boolean;
  readonly display_order: number;
  readonly created_at: string;
  readonly updated_at: string;
}

// 他の型定義も同様に実装...
```

**成果物:**
- 完全な型定義ファイル
- 型ガード関数の実装
- 既存コードとの互換性確保

---

#### **作業3: Supabaseクライアントの更新**
**ファイル:** `src/lib/supabase.ts`

**作業内容:**
- Database インターフェースを新しいテーブル構造に更新
- 型安全性の確保
- 既存のクエリとの互換性チェック

---

### **Phase 2: API実装（優先度：高）**

#### **作業4: 統一プリセット設定APIの更新**
**ファイル:** `src/app/api/presets/[presetId]/config/route.ts`

**現在の問題点:**
- pickup_windowsテーブルとの複雑な関係
- エラーハンドリングの不統一
- レスポンス形式の不整合

**改善内容:**
```typescript
// 新しいDB構造に対応したクエリに変更
const { data: presetData, error: dbError } = await supabaseAdmin
  .from('product_presets')
  .select(`
    id,
    preset_name,
    description,
    form_expiry_date,
    is_active,
    form_settings (*),
    preset_products (
      id,
      pickup_start,
      pickup_end,
      display_order,
      is_active,
      product:products (*)
    )
  `)
  .eq('id', id)
  .single();
```

---

#### **作業5: 予約作成APIの実装**
**ファイル:** `src/app/api/reservations/route.ts`

**実装内容:**
```typescript
export async function POST(request: NextRequest) {
  // 1. 入力データのバリデーション
  // 2. 予約データのDB保存
  // 3. キャンセルトークンの生成
  // 4. LINE通知の送信
  // 5. レスポンスの返却
}
```

---

#### **作業6: 予約変更・キャンセルAPIの実装**
**ファイル:** `src/app/api/reservations/[reservationId]/route.ts`

**実装内容:**
- GET: 予約詳細取得（電話番号認証付き）
- PUT: 予約更新
- DELETE: 予約キャンセル

---

### **Phase 3: フロントエンド実装（優先度：中）**

#### **作業7: 予約フォーム画面の実装**
**ファイル:** `src/app/form/[presetId]/page.tsx`

**画面構成:**
1. **入力画面**: フォーム名、設定に基づく入力項目、商品選択
2. **確認画面**: 入力内容の確認
3. **完了画面**: 予約完了とキャンセルURL表示

**実装ポイント:**
- フォーム設定に基づく動的な項目表示
- 商品ごとの引き取り期間制限
- リアルタイムバリデーション

---

#### **作業8: 予約変更・キャンセル画面の実装**
**ファイル:** `src/app/cancel/[reservationId]/page.tsx`

**画面構成:**
1. **電話番号確認画面**: 認証用
2. **変更・キャンセル画面**: 予約内容の編集

---

#### **作業9: 管理画面の実装**
**ファイル:** `src/app/admin/`

**実装画面:**
- `login/page.tsx`: 管理者ログイン
- `dashboard/page.tsx`: ダッシュボード
- `products/page.tsx`: 商品管理（CSV一括登録含む）
- `presets/page.tsx`: フォーム管理
- `reservations/page.tsx`: 予約管理

---

### **Phase 4: 機能強化（優先度：中）**

#### **作業10: LINE通知機能の強化**
**ファイル:** `src/lib/line-messaging.ts`, `src/lib/line-message-templates.ts`

**改善内容:**
- 予約完了時の詳細通知
- キャンセルURL付きメッセージ
- エラーハンドリングとリトライ機能

---

#### **作業11: 予約履歴管理機能**
**実装内容:**
- 24時間後の自動データ移行バッチ処理
- 履歴検索・表示機能
- データアーカイブ機能

---

### **Phase 5: 品質向上（優先度：低）**

#### **作業12: エラーハンドリングの統一**
**ファイル:** `src/lib/utils/apiErrorHandler.ts`

**実装内容:**
- カスタムエラークラス
- 統一されたエラーレスポンス
- フロントエンドエラー表示

---

#### **作業13: テスト実装**
**実装内容:**
- 単体テスト（Jest + Testing Library）
- API統合テスト
- E2Eテスト（Playwright）

---

#### **作業14: パフォーマンス最適化**
**実装内容:**
- データベースクエリの最適化
- フロントエンドコンポーネントの最適化
- 画像・アセットの最適化

---

## ⚠️ **重要な注意事項**

### **データベース作業時の注意**
1. **必ずバックアップを取得**してから作業開始
2. **テスト環境で先に実行**して動作確認
3. **段階的な移行**を心がける

### **API実装時の注意**
1. **既存のエンドポイント**との互換性を確認
2. **エラーハンドリング**を統一する
3. **レスポンス形式**を一貫させる

### **フロントエンド実装時の注意**
1. **レスポンシブデザイン**を考慮
2. **アクセシビリティ**を確保
3. **パフォーマンス**を意識した実装

## 📊 **進捗管理**

各作業完了時に以下をチェック：

- [ ] 要件文書の該当項目を満たしているか
- [ ] 設計文書の仕様に準拠しているか
- [ ] 既存機能に影響を与えていないか
- [ ] テストが通るか
- [ ] ドキュメントが更新されているか

## 🚀 **作業開始方法**

1. **Phase 1から順番に実行**することを強く推奨
2. **各作業の成果物を確認**してから次に進む
3. **問題が発生した場合は即座に報告**
4. **定期的な進捗報告**を行う

## 📞 **サポート**

作業中に不明点や問題が発生した場合：
1. 要件文書・設計文書を再確認
2. 既存の実装コードを参照
3. 必要に応じて質問・相談

---

**この指示書に基づいて、段階的かつ確実に作業を進めてください。各Phase完了時には必ず動作確認を行い、次のPhaseに進む前に品質を確保してください。**