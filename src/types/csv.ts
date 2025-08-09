import type { Product } from '@/types';

// 標準CSV形式の行データ（実際のproductsテーブル構造に合わせて修正）
export interface StandardCSVRow {
  name: string;
  product_code?: string;
  variation_name?: string;
  tax_type?: string;
  price: string;
  barcode?: string;
  visible?: string;
  display_order?: string;
}

// POS CSV形式の行データ（実際のproductsテーブル構造に合わせて修正）
export interface POSCSVRow {
  '商品名': string;
  '商品コード'?: string;
  'バリエーション（種別1）'?: string;
  '税設定'?: string;
  '価格': string;
  'バーコード'?: string;
  '表示/非表示'?: string;
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