import { NextResponse } from 'next/server';

// 簡易商品データ取得API
export async function GET() {
  try {
    // フロントエンドのローカルストレージから商品データを取得する代替手段として
    // デフォルト商品を返す（実際の商品データは管理画面で設定）
    const defaultProducts = [
      { id: 1, name: 'りんご', price: 100, visible: true },
      { id: 2, name: 'みかん', price: 120, visible: true },
      { id: 3, name: 'バナナ', price: 80, visible: true }
    ];

    return NextResponse.json({
      success: true,
      data: defaultProducts.filter(p => p.visible),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple products API error:', error);
    return NextResponse.json({
      success: false,
      error: '商品データの取得に失敗しました',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}