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

interface CSVRow {
  name: string;
  external_id?: string;
  category_id?: string;
  price: string;
  variation?: string;
  comment?: string;
}

interface CSVImportError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

interface CSVImportResult {
  success: number;
  total: number;
  errors: CSVImportError[];
  warnings: string[];
  insertedProducts: any[];
}

// CSV商品一括インポート
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const presetId = formData.get('preset_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'CSVファイルが必要です' }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSVファイルのみアップロード可能です' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
    }

    // CSVファイルを文字列として読み込み
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSVファイルが空です' }, { status: 400 });
    }

    // バリデーションとデータ変換
    const result = await processCSVRows(rows, presetId ? parseInt(presetId) : undefined);

    return NextResponse.json(result);
  } catch (err) {
    console.error('CSV インポートエラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 簡易CSVパーサー（カンマ区切り、ヘッダー有り）
function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as CSVRow);
  }

  return rows;
}

// CSVデータの処理とデータベース挿入
async function processCSVRows(rows: CSVRow[], presetId?: number): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: 0,
    total: rows.length,
    errors: [],
    warnings: [],
    insertedProducts: []
  };

  const validProducts: any[] = [];
  const productVariations: any[] = [];

  // 各行をバリデーション
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // CSVの行番号（ヘッダー含む）

    // バリデーション
    const validationErrors = validateCSVRow(row, rowIndex);
    if (validationErrors.length > 0) {
      result.errors.push(...validationErrors);
      continue;
    }

    // 基本商品データ
    const productData = {
      name: row.name.trim(),
      external_id: row.external_id?.trim() || null,
      category_id: row.category_id ? parseInt(row.category_id) : null,
      price: parseInt(row.price),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    validProducts.push(productData);

    // バリエーション情報がある場合は記録
    if (row.variation?.trim()) {
      productVariations.push({
        productIndex: i,
        variation: row.variation.trim(),
        comment: row.comment?.trim() || null
      });
    }
  }

  // データベースに挿入
  if (validProducts.length > 0) {
    try {
      const { data: insertedProducts, error } = await supabaseAdmin
        .from('products')
        .insert(validProducts)
        .select();

      if (error) {
        console.error('商品挿入エラー:', error);
        result.errors.push({
          row: 0,
          message: `データベースエラー: ${error.message}`,
          data: null
        });
      } else {
        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];

        // プリセットとの関連付け（指定されている場合）
        if (presetId && insertedProducts) {
          await linkProductsToPreset(insertedProducts, presetId);
          result.warnings.push(`${insertedProducts.length}個の商品をプリセット${presetId}に関連付けました`);
        }

        // バリエーション情報の処理（将来の拡張用）
        if (productVariations.length > 0) {
          result.warnings.push(`${productVariations.length}個の商品にバリエーション情報があります（将来のpickup_windows設定で活用可能）`);
        }
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

// CSVデータのバリデーション
function validateCSVRow(row: CSVRow, rowIndex: number): CSVImportError[] {
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

  // 外部IDチェック（任意）
  if (row.external_id && row.external_id.length > 50) {
    errors.push({
      row: rowIndex,
      field: 'external_id',
      message: '外部IDは50文字以内で入力してください',
      data: row
    });
  }

  // カテゴリIDチェック（任意）
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

// 商品をプリセットに関連付け
async function linkProductsToPreset(products: any[], presetId: number) {
  try {
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
      console.error('プリセット関連付けエラー:', error);
    }
  } catch (error) {
    console.error('プリセット関連付け処理エラー:', error);
  }
}

// CSVテンプレートダウンロード
export async function GET() {
  const csvTemplate = `name,external_id,category_id,price,variation,comment
野菜セットA,VEG001,1,1000,,春の野菜を詰め合わせ
野菜セットB,VEG002,1,1500,,夏の野菜を詰め合わせ
果物セット小,FRUIT001,2,1500,小サイズ,季節の果物3種類
果物セット大,FRUIT002,2,2500,大サイズ,季節の果物5種類`;

  return new NextResponse(csvTemplate, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="product_template.csv"'
    }
  });
}