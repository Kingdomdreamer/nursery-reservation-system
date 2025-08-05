import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface POSCSVRow {
  'カテゴリーID': string;
  '商品名': string;
  '商品名（レシート用）'?: string;
  '商品名（商品入力用）'?: string;
  'バリエーション（種別1）'?: string;
  'バリエーション（種別2）'?: string;
  '税設定': string;
  '適用税率': string;
  '税率別価格'?: string;
  '価格設定': string;
  '販売単位ID'?: string;
  '価格': string;
  '価格2'?: string;
  '原価'?: string;
  '商品コード'?: string;
  '自動発番（バーコード）'?: string;
  'バーコード'?: string;
  'ポイント付与対象': string;
  '表示/非表示': string;
  'レシート印字設定': string;
  '備考'?: string;
  '旧商品コード'?: string;
  '分析タグID'?: string;
}

interface POSImportError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

interface POSImportResult {
  success: number;
  total: number;
  errors: POSImportError[];
  warnings: string[];
  insertedProducts: any[];
}

// POS形式CSV商品一括インポート
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'CSVファイルが必要です' }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSVファイルのみアップロード可能です' }, { status: 400 });
    }

    // CSVファイルを文字列として読み込み
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSVファイルが空です' }, { status: 400 });
    }

    // バリデーションとデータ変換
    const result = await processPOSCSVRows(rows);

    return NextResponse.json(result);
  } catch (err) {
    console.error('POS CSV インポートエラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 簡易CSVパーサー（POS形式対応）
function parseCSV(csvText: string): POSCSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: POSCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as POSCSVRow);
  }

  return rows;
}

// POS CSVデータの処理とデータベース挿入
async function processPOSCSVRows(rows: POSCSVRow[]): Promise<POSImportResult> {
  const result: POSImportResult = {
    success: 0,
    total: rows.length,
    errors: [],
    warnings: [],
    insertedProducts: []
  };

  const validProducts: any[] = [];

  // 各行をバリデーション
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // CSVの行番号（ヘッダー含む）

    // バリデーション
    const validationErrors = validatePOSCSVRow(row, rowIndex);
    if (validationErrors.length > 0) {
      result.errors.push(...validationErrors);
      continue;
    }

    // 商品データの変換
    const productData = convertPOSRowToProduct(row);
    validProducts.push(productData);
  }

  // データベースに挿入
  if (validProducts.length > 0) {
    try {
      const { data: insertedProducts, error } = await supabaseAdmin
        .from('products')
        .insert(validProducts)
        .select();

      if (error) {
        console.error('POS商品挿入エラー:', error);
        result.errors.push({
          row: 0,
          message: `データベースエラー: ${error.message}`,
          data: null
        });
      } else {
        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];
      }
    } catch (dbError) {
      console.error('データベース挿入エラー:', dbError);
      result.errors.push({
        row: 0,
        message: `データベース接続エラー`,
        data: null
      });
    }
  }

  return result;
}

// POS CSVデータのバリデーション
function validatePOSCSVRow(row: POSCSVRow, rowIndex: number): POSImportError[] {
  const errors: POSImportError[] = [];

  // カテゴリーIDチェック
  if (!row['カテゴリーID']) {
    errors.push({
      row: rowIndex,
      field: 'カテゴリーID',
      message: 'カテゴリーIDは必須です',
      data: row
    });
  } else if (isNaN(Number(row['カテゴリーID'])) || Number(row['カテゴリーID']) < 1) {
    errors.push({
      row: rowIndex,
      field: 'カテゴリーID',
      message: 'カテゴリーIDは正の整数で入力してください',
      data: row
    });
  }

  // 商品名チェック
  if (!row['商品名']?.trim()) {
    errors.push({
      row: rowIndex,
      field: '商品名',
      message: '商品名は必須です',
      data: row
    });
  } else if (row['商品名'].length > 49) {
    errors.push({
      row: rowIndex,
      field: '商品名',
      message: '商品名は49文字以内で入力してください',
      data: row
    });
  }

  // 価格チェック
  if (!row['価格']?.trim()) {
    errors.push({
      row: rowIndex,
      field: '価格',
      message: '価格は必須です',
      data: row
    });
  } else if (isNaN(Number(row['価格'])) || Number(row['価格']) < 0) {
    errors.push({
      row: rowIndex,
      field: '価格',
      message: '正しい価格を入力してください（0以上の数値）',
      data: row
    });
  }

  // 税設定チェック
  if (row['税設定'] && !['外税', '内税'].includes(row['税設定'])) {
    errors.push({
      row: rowIndex,
      field: '税設定',
      message: '税設定は「外税」または「内税」を指定してください',
      data: row
    });
  }

  // 適用税率チェック
  if (row['適用税率'] && !['標準税率', '軽減税率', '注文時に選択', '非課税'].includes(row['適用税率'])) {
    errors.push({
      row: rowIndex,
      field: '適用税率',
      message: '適用税率は「標準税率」「軽減税率」「注文時に選択」「非課税」のいずれかを指定してください',
      data: row
    });
  }

  // 価格設定チェック
  if (row['価格設定'] && !['通常', '部門打ち', '量り売り'].includes(row['価格設定'])) {
    errors.push({
      row: rowIndex,
      field: '価格設定',
      message: '価格設定は「通常」「部門打ち」「量り売り」のいずれかを指定してください',
      data: row
    });
  }

  return errors;
}

// POS CSVデータを商品データに変換
function convertPOSRowToProduct(row: POSCSVRow): any {
  // 税設定の変換
  const taxType = row['税設定'] === '内税' ? 'inclusive' : 'exclusive';
  
  // 税率の変換
  let taxRate = 10.00; // デフォルト: 標準税率
  if (row['適用税率'] === '軽減税率') taxRate = 8.00;
  else if (row['適用税率'] === '非課税') taxRate = 0.00;

  // 価格設定の変換
  let priceType = 'fixed';
  if (row['価格設定'] === '部門打ち') priceType = 'department';
  else if (row['価格設定'] === '量り売り') priceType = 'weight';

  // バリエーション情報の処理
  const variation1 = row['バリエーション（種別1）']?.trim();
  const variation2 = row['バリエーション（種別2）']?.trim();
  let variationName = null;
  let variationType = null;

  if (variation1) {
    variationName = variation2 ? `${variation1} ${variation2}` : variation1;
    variationType = 'price'; // デフォルトは価格バリエーション
  }

  return {
    name: row['商品名'].trim(),
    external_id: null, // POS形式では商品コードを使用
    category_id: parseInt(row['カテゴリーID']),
    price: parseInt(row['価格']),
    
    // バリエーション管理
    base_product_name: variation1 ? row['商品名'].trim() : null,
    variation_name: variationName,
    variation_type: variationType,
    
    // POSシステム連携
    product_code: row['商品コード']?.trim() || null,
    barcode: row['バーコード']?.trim() || row['自動発番（バーコード）']?.trim() || null,
    auto_barcode: !!row['自動発番（バーコード）']?.trim(),
    
    // 税設定
    tax_type: taxType,
    tax_rate: taxRate,
    
    // 価格設定
    price_type: priceType,
    price2: row['価格2'] ? parseInt(row['価格2']) : null,
    cost_price: row['原価'] ? parseInt(row['原価']) : null,
    
    // 販売・表示設定
    unit_id: row['販売単位ID'] ? parseInt(row['販売単位ID']) : null,
    point_eligible: row['ポイント付与対象'] === '対象',
    visible: row['表示/非表示'] === '表示',
    receipt_print: row['レシート印字設定'] === '印字する',
    
    // その他
    receipt_name: row['商品名（レシート用）']?.trim() || null,
    input_name: row['商品名（商品入力用）']?.trim() || null,
    memo: row['備考']?.trim() || null,
    old_product_code: row['旧商品コード']?.trim() || null,
    analysis_tag_id: row['分析タグID'] ? parseInt(row['分析タグID']) : null,
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// POS形式CSVテンプレートダウンロード
export async function GET() {
  const csvTemplate = `カテゴリーID,商品名,商品名（レシート用）,商品名（商品入力用）,バリエーション（種別1）,バリエーション（種別2）,税設定,適用税率,税率別価格,価格設定,販売単位ID,価格,価格2,原価,商品コード,自動発番（バーコード）,バーコード,ポイント付与対象,表示/非表示,レシート印字設定,備考,旧商品コード,分析タグID
1,種粕 20kg,種粕 20kg,種粕 20kg,通常価格,,外税,標準税率,,通常,,1800,,1650,#2000000000619,,#2000000000619,対象,表示,印字する,,,
1,種粕 20kg,種粕 20kg,種粕 20kg,売出価格,,外税,標準税率,,通常,,1700,,,#2000000000077,,#2000000000077,対象,表示,印字する,,,
1,種粕ペレット 20kg,種粕ペレット 20kg,種粕ペレット 20kg,通常価格,,外税,標準税率,,通常,,1900,,,#2000000000053,,#2000000000053,対象,表示,印字する,,,`;

  return new NextResponse(csvTemplate, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pos_products_template.csv"'
    }
  });
}