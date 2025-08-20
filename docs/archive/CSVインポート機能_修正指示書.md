# CSVインポート機能 修正指示書

## 📋 修正概要

**対象機能**: 商品一覧CSVインポート機能  
**修正理由**: 今回の型定義統一・API設計改善に合わせた整合性確保  
**作成日**: 2025年8月5日  
**優先度**: 中（機能改善）

## 🔍 現状の問題点

### 1. 型定義の不整合
- 既存の`Product`型と異なる独自のCSV型定義
- 新しい簡素化された型定義との不整合
- エラーハンドリングの型安全性不足

### 2. API設計の不統一
- 直接Supabaseクライアントを作成（他のAPIと異なる）
- エラーレスポンス形式の不統一
- 統一されたエラーハンドリングを使用していない

### 3. データ変換ロジックの複雑化
- POS形式と標準形式で重複するロジック
- 型変換の安全性不足
- バリデーション処理の分散

## 🎯 修正方針

### 1. 型定義の統一
- 既存の`Product`型を基準とした型定義
- 統一されたエラー型の使用
- 型安全なデータ変換

### 2. API設計の統一
- 統一されたエラーハンドリングの使用
- 共通のSupabaseクライアント使用
- RESTful設計の適用

### 3. サービス層の導入
- ビジネスロジックの分離
- 再利用可能なバリデーション関数
- 統一されたデータ変換処理

## 📋 修正内容

### Phase 1: 型定義の統一

#### 修正1: CSVインポート専用型の定義

**新規ファイル**: `src/types/csv.ts`
```typescript
import type { Product } from '@/types';

// 標準CSV形式の行データ
export interface StandardCSVRow {
  name: string;
  external_id?: string;
  category_id?: string;
  price: string;
  variation?: string;
  comment?: string;
  base_name?: string;
}

// POS CSV形式の行データ
export interface POSCSVRow {
  'カテゴリーID': string;
  '商品名': string;
  '価格': string;
  'バリエーション（種別1）'?: string;
  '税設定'?: string;
  '適用税率'?: string;
  '価格設定'?: string;
  '商品コード'?: string;
  'バーコード'?: string;
  'ポイント付与対象'?: string;
  '表示/非表示'?: string;
  // ... 他のフィールド
}

// CSVインポート結果
export interface CSVImportResult {
  success: number;
  total: number;
  errors: CSVImportError[];
  warnings: string[];
  insertedProducts: Product[];
}

// CSVインポートエラー
export interface CSVImportError {
  row: number;
  field?: string;
  message: string;
  data: unknown;
}
```#### 修正2
: 既存APIファイルの型統一

**ファイル**: `src/app/api/admin/products/import/route.ts`

**修正前**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

**修正後**:
```typescript
import { supabaseAdmin } from '@/lib/supabase';
import { 
  handleApiError, 
  createSuccessResponse 
} from '@/lib/utils/apiErrorHandler';
import type { 
  StandardCSVRow, 
  CSVImportResult, 
  CSVImportError 
} from '@/types/csv';
import type { Product } from '@/types';
```

### Phase 2: サービス層の導入

#### 修正3: CSVインポートサービスの作成

**新規ファイル**: `src/lib/services/CSVImportService.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase';
import type { 
  StandardCSVRow, 
  POSCSVRow, 
  CSVImportResult, 
  CSVImportError 
} from '@/types/csv';
import type { Product } from '@/types';
import { 
  InvalidProductDataError,
  PresetNotFoundError 
} from '@/types';

export class CSVImportService {
  /**
   * 標準形式CSVのインポート
   */
  static async importStandardCSV(
    csvText: string, 
    presetId?: number
  ): Promise<CSVImportResult> {
    const rows = this.parseStandardCSV(csvText);
    return await this.processStandardRows(rows, presetId);
  }

  /**
   * POS形式CSVのインポート
   */
  static async importPOSCSV(csvText: string): Promise<CSVImportResult> {
    const rows = this.parsePOSCSV(csvText);
    return await this.processPOSRows(rows);
  }

  /**
   * 標準形式CSVパーサー
   */
  private static parseStandardCSV(csvText: string): StandardCSVRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: StandardCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row as StandardCSVRow);
    }

    return rows;
  }

  /**
   * 標準形式データの処理
   */
  private static async processStandardRows(
    rows: StandardCSVRow[], 
    presetId?: number
  ): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: 0,
      total: rows.length,
      errors: [],
      warnings: [],
      insertedProducts: []
    };

    const validProducts: Omit<Product, 'id'>[] = [];

    // バリデーションとデータ変換
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      try {
        const validationErrors = this.validateStandardRow(row, rowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          continue;
        }

        const productData = this.convertStandardRowToProduct(row);
        validProducts.push(productData);
      } catch (error) {
        result.errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : '不明なエラー',
          data: row
        });
      }
    }

    // データベース挿入
    if (validProducts.length > 0) {
      try {
        const { data: insertedProducts, error } = await supabaseAdmin
          .from('products')
          .insert(validProducts)
          .select();

        if (error) {
          throw error;
        }

        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];

        // プリセット関連付け
        if (presetId && insertedProducts) {
          await this.linkProductsToPreset(insertedProducts, presetId);
          result.warnings.push(
            `${insertedProducts.length}個の商品をプリセット${presetId}に関連付けました`
          );
        }
      } catch (error) {
        throw new InvalidProductDataError(error);
      }
    }

    return result;
  }

  /**
   * 標準形式データのバリデーション
   */
  private static validateStandardRow(
    row: StandardCSVRow, 
    rowIndex: number
  ): CSVImportError[] {
    const errors: CSVImportError[] = [];

    // 商品名チェック
    if (!row.name?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: '商品名は必須です',
        data: row
      });
    } else if (row.name.length > 100) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: '商品名は100文字以内で入力してください',
        data: row
      });
    }

    // 価格チェック
    if (!row.price?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: '価格は必須です',
        data: row
      });
    } else if (isNaN(Number(row.price)) || Number(row.price) < 0) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: '正しい価格を入力してください（0以上の数値）',
        data: row
      });
    }

    // カテゴリIDチェック
    if (row.category_id && (isNaN(Number(row.category_id)) || Number(row.category_id) < 1)) {
      errors.push({
        row: rowIndex,
        field: 'category_id',
        message: 'カテゴリIDは正の整数で入力してください',
        data: row
      });
    }

    return errors;
  }

  /**
   * 標準形式データを商品データに変換
   */
  private static convertStandardRowToProduct(row: StandardCSVRow): Omit<Product, 'id'> {
    // 商品名の決定（バリエーション対応）
    let productName = row.name.trim();
    
    if (row.base_name?.trim() && row.variation?.trim()) {
      productName = `${row.base_name.trim()}（${row.variation.trim()}）`;
    }

    return {
      name: productName,
      external_id: row.external_id?.trim() || null,
      category_id: row.category_id ? parseInt(row.category_id) : null,
      price: parseInt(row.price),
      visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 商品をプリセットに関連付け
   */
  private static async linkProductsToPreset(
    products: Product[], 
    presetId: number
  ): Promise<void> {
    // プリセットの存在確認
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .select('id')
      .eq('id', presetId)
      .single();

    if (presetError || !preset) {
      throw new PresetNotFoundError(presetId);
    }

    const presetProducts = products.map((product, index) => ({
      preset_id: presetId,
      product_id: product.id,
      display_order: index + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
      .from('preset_products')
      .insert(presetProducts);

    if (error) {
      throw error;
    }
  }

  /**
   * CSVテンプレートの生成
   */
  static generateStandardTemplate(): string {
    return `name,external_id,category_id,price,variation,comment,base_name
野菜セットA,VEG001,1,1000,,春の野菜を詰め合わせ,
野菜セットB,VEG002,1,1500,,夏の野菜を詰め合わせ,
果物セット（小サイズ）,FRUIT001,2,1500,小サイズ,季節の果物3種類,果物セット
果物セット（大サイズ）,FRUIT002,2,2500,大サイズ,季節の果物5種類,果物セット`;
  }

  static generatePOSTemplate(): string {
    return `カテゴリーID,商品名,価格,バリエーション（種別1）,税設定,適用税率,価格設定,商品コード,バーコード,ポイント付与対象,表示/非表示
1,種粕 20kg,1800,通常価格,外税,標準税率,通常,#2000000000619,#2000000000619,対象,表示
1,種粕 20kg,1700,売出価格,外税,標準税率,通常,#2000000000077,#2000000000077,対象,表示
1,種粕ペレット 20kg,1900,通常価格,外税,標準税率,通常,#2000000000053,#2000000000053,対象,表示`;
  }
}
```

### Phase 3: APIエンドポイントの修正

#### 修正4: 標準形式インポートAPIの修正

**ファイル**: `src/app/api/admin/products/import/route.ts`

**修正後**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/CSVImportService';
import { 
  handleApiError, 
  createSuccessResponse,
  createValidationError 
} from '@/lib/utils/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const presetId = formData.get('preset_id') as string;

    // ファイルバリデーション
    if (!file) {
      return createValidationError('CSVファイルが必要です');
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return createValidationError('CSVファイルのみアップロード可能です');
    }

    if (file.size > 10 * 1024 * 1024) {
      return createValidationError('ファイルサイズは10MB以下にしてください');
    }

    // CSVファイルを文字列として読み込み
    const csvText = await file.text();
    
    if (!csvText.trim()) {
      return createValidationError('CSVファイルが空です');
    }

    // インポート処理
    const result = await CSVImportService.importStandardCSV(
      csvText, 
      presetId ? parseInt(presetId) : undefined
    );

    return createSuccessResponse(result, {
      importType: 'standard',
      fileSize: file.size,
      fileName: file.name
    });

  } catch (error) {
    console.error('CSV インポートエラー:', error);
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const csvTemplate = CSVImportService.generateStandardTemplate();
    
    return new NextResponse(csvTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="product_template.csv"'
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 修正5: POS形式インポートAPIの修正

**ファイル**: `src/app/api/admin/products/import-pos/route.ts`

**修正後**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/CSVImportService';
import { 
  handleApiError, 
  createSuccessResponse,
  createValidationError 
} from '@/lib/utils/apiErrorHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // ファイルバリデーション
    if (!file) {
      return createValidationError('CSVファイルが必要です');
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return createValidationError('CSVファイルのみアップロード可能です');
    }

    if (file.size > 10 * 1024 * 1024) {
      return createValidationError('ファイルサイズは10MB以下にしてください');
    }

    // CSVファイルを文字列として読み込み
    const csvText = await file.text();
    
    if (!csvText.trim()) {
      return createValidationError('CSVファイルが空です');
    }

    // インポート処理
    const result = await CSVImportService.importPOSCSV(csvText);

    return createSuccessResponse(result, {
      importType: 'pos',
      fileSize: file.size,
      fileName: file.name
    });

  } catch (error) {
    console.error('POS CSV インポートエラー:', error);
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const csvTemplate = CSVImportService.generatePOSTemplate();
    
    return new NextResponse(csvTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pos_products_template.csv"'
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Phase 4: フロントエンドの修正

#### 修正6: CSVImportModalの型安全性強化

**ファイル**: `src/components/admin/CSVImportModal.tsx`

**修正内容**:
```typescript
import type { 
  CSVImportResult, 
  CSVImportError 
} from '@/types/csv';
import type { Product, ProductPreset } from '@/types';

// 既存のインターフェースを削除し、統一された型を使用
interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  presets: ProductPreset[];
  format?: 'standard' | 'pos';
}

// エラーハンドリングの改善
const handleImport = async () => {
  if (!file) {
    alert('CSVファイルを選択してください');
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (selectedPresetId) {
      formData.append('preset_id', selectedPresetId);
    }

    const endpoint = format === 'pos' 
      ? '/api/admin/products/import-pos' 
      : '/api/admin/products/import';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '読み込みに失敗しました');
    }

    // 統一されたレスポンス形式に対応
    const importResult = result.success ? result.data : result;
    setImportResult(importResult);

    if (importResult.success > 0) {
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }

  } catch (error) {
    console.error('CSVインポートエラー:', error);
    alert(error instanceof Error ? error.message : '読み込みに失敗しました');
  } finally {
    setLoading(false);
  }
};
```

## 📋 検証手順

### 1. 型チェック
```bash
npx tsc --noEmit
```

### 2. APIエンドポイントのテスト
```bash
# 標準形式テンプレートダウンロード
curl -X GET http://localhost:3000/api/admin/products/import

# POS形式テンプレートダウンロード
curl -X GET http://localhost:3000/api/admin/products/import-pos

# CSVインポートテスト
curl -X POST http://localhost:3000/api/admin/products/import \
  -F "file=@test.csv" \
  -F "preset_id=1"
```

### 3. フロントエンドの動作確認
- CSVファイルのアップロード
- バリデーションエラーの表示
- インポート結果の表示
- プリセット関連付けの動作

## 🚨 注意事項

### 1. 既存データとの互換性
- 既存の商品データに影響しないよう注意
- インポート前のバックアップ推奨
- 段階的なテスト実施

### 2. パフォーマンス考慮
- 大量データのインポート時のメモリ使用量
- データベース接続のタイムアウト
- ファイルサイズ制限の適切な設定

### 3. エラーハンドリング
- ユーザーフレンドリーなエラーメッセージ
- 部分的な成功時の適切な通知
- ロールバック機能の検討

## 📊 期待される効果

### 即座の効果
- 型安全性の向上
- エラーハンドリングの統一
- コードの保守性向上

### 長期的効果
- 機能拡張の容易性
- バグ発生率の削減
- 開発効率の改善

---

**作成者**: Kiro AI Assistant  
**最終更新**: 2025年8月5日  
**実装推定時間**: 3-4時間