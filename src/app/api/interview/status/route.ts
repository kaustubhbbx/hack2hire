/**
 * GET /api/interview/status
 * Current performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInterviewStatus } from '@/lib/services/interview.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameter: sessionId'
        },
        { status: 400 }
      );
    }

    // Get interview status
    const result = await getInterviewStatus(sessionId);

    return NextResponse.json({
      success: true,
      data: result.status
    });

  } catch (error: any) {
    console.error('Error in interview/status API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get interview status'
      },
      { status: 500 }
    );
  }
}
