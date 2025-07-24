import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { sendNotification } from '@/lib/utils/line';
import { createConditionalSchema } from '@/lib/validations/reservationSchema';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, userId, presetId } = body;

    if (!formData || !userId || !presetId) {
      return NextResponse.json(
        { error: 'Missing required parameters: formData, userId, presetId' },
        { status: 400 }
      );
    }

    // Get form configuration for validation
    const config = await DatabaseService.getFormConfig(presetId);
    if (!config) {
      return NextResponse.json(
        { error: 'Form configuration not found' },
        { status: 404 }
      );
    }

    // Validate form data
    const validationSchema = createConditionalSchema(config.form_settings);
    const validationResult = validationSchema.safeParse(formData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Create reservation
    const result = await DatabaseService.createReservation(
      userId,
      validationResult.data,
      presetId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Send LINE notification if reservation was created successfully
    if (result.reservation) {
      try {
        const notificationResult = await sendNotification(
          userId,
          'confirmation',
          result.reservation
        );

        if (!notificationResult.success) {
          console.error('Failed to send notification:', notificationResult.error);
          // Don't fail the reservation if notification fails
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Continue with successful reservation response
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        reservation: result.reservation,
      },
    });

  } catch (error) {
    console.error('Error in reservation API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const reservations = await DatabaseService.getUserReservations(userId);

    return NextResponse.json({
      success: true,
      data: {
        reservations,
        total: reservations.length,
      },
    });

  } catch (error) {
    console.error('Error fetching reservations:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}