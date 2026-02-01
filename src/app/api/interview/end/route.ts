/**
 * POST /api/interview/end
 * Terminate and generate report
 */

import { NextRequest, NextResponse } from 'next/server';
import { endInterview } from '@/lib/services/interview.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reason } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: sessionId'
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session ID'
        },
        { status: 400 }
      );
    }

    // End interview
    const result = await endInterview(sessionId, reason);

    return NextResponse.json({
      success: true,
      data: result.report
    });

  } catch (error: any) {
    console.error('Error in interview/end API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to end interview'
      },
      { status: 500 }
    );
  }
}
