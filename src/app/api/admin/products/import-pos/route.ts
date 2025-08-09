import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/CSVImportService';
import { 
  handleApiError, 
  createSuccessResponse,
  createValidationError 
} from '@/lib/utils/apiErrorHandler';

export async function POST(request: NextRequest) {
  console.log('=== POS CSV Import API Started ===');
  
  try {
    // 環境変数の確認
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const presetId = formData.get('preset_id') as string;

    console.log('Request data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      presetId
    });

    // ファイルバリデーション
    if (!file) {
      console.log('Validation failed: No file provided');
      return createValidationError('CSVファイルが必要です');
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      console.log('Validation failed: Invalid file type', { type: file.type, name: file.name });
      return createValidationError('CSVファイルのみアップロード可能です');
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log('Validation failed: File too large', { size: file.size });
      return createValidationError('ファイルサイズは10MB以下にしてください');
    }

    // CSVファイルを文字列として読み込み
    const csvText = await file.text();
    console.log('CSV content loaded:', {
      length: csvText.length,
      preview: csvText.substring(0, 200),
      isEmpty: !csvText.trim()
    });
    
    if (!csvText.trim()) {
      console.log('Validation failed: Empty CSV file');
      return createValidationError('CSVファイルが空です');
    }

    console.log('Starting POS CSV import process...');
    // POS形式インポート処理（プリセット関連付けはPOSでは行わない）
    const result = await CSVImportService.importPOSCSV(csvText);

    console.log('POS CSV import completed successfully:', {
      success: result.success,
      total: result.total,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length
    });

    return createSuccessResponse(result, {
      importType: 'pos',
      fileSize: file.size,
      fileName: file.name,
      presetId: presetId ? parseInt(presetId) : undefined
    });

  } catch (error) {
    console.error('=== POS CSV Import API Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return handleApiError(error, 'POS CSV Import');
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