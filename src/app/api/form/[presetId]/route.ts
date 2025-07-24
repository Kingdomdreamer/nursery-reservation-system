import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/DatabaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { presetId: string } }
) {
  try {
    const presetId = parseInt(params.presetId, 10);

    if (isNaN(presetId) || presetId < 1) {
      return NextResponse.json(
        { error: 'Invalid preset ID' },
        { status: 400 }
      );
    }

    const config = await DatabaseService.getFormConfig(presetId);

    if (!config) {
      return NextResponse.json(
        { error: 'Form configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error('Error in form config API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}