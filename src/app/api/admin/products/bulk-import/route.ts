/**
 * CSVインポート用テンプレートダウンロードAPI
 */
export async function GET() {
  try {
    const csvContent = [
      '商品名,価格,商品コード,バリエーション名,税区分,バーコード,表示',
      'りんご,100,APPLE001,通常価格,内税,1234567890123,true',
      'みかん,120,ORANGE001,特価,外税,1234567890124,true',
      'バナナ,80,BANANA001,通常価格,内税,,false'
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="product_import_template.csv"'
      }
    });
  } catch (err) {
    console.error('テンプレートダウンロードAPI エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}