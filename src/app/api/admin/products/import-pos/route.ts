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

    // POS形式インポート処理（プリセット関連付けはPOSでは行わない）
    const result = await CSVImportService.importPOSCSV(csvText);

    return createSuccessResponse(result, {
      importType: 'pos',
      fileSize: file.size,
      fileName: file.name,
      presetId: presetId ? parseInt(presetId) : undefined
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