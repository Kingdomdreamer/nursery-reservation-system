import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/DatabaseService';

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'LINE Channel Access Token is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, messages } = body;

    if (!to || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters: to, messages' },
        { status: 400 }
      );
    }

    // Validate LINE User ID format
    if (!to.startsWith('U') || to.length !== 33) {
      return NextResponse.json(
        { error: 'Invalid LINE User ID format' },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload = {
      to,
      messages: Array.isArray(messages) ? messages : [messages],
    };

    // Send message to LINE Messaging API
    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LINE API Error:', errorData);
      
      // Log the failed notification
      await DatabaseService.logNotification(to, 'error', {
        error: errorData,
        payload,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Failed to send LINE message', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log successful notification
    await DatabaseService.logNotification(to, 'message_sent', {
      messages: payload.messages,
      timestamp: new Date().toISOString(),
      response: result,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: result 
    });

  } catch (error) {
    console.error('Error in LINE message API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'LINE Messaging API',
    timestamp: new Date().toISOString() 
  });
}