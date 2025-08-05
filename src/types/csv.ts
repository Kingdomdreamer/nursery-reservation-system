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