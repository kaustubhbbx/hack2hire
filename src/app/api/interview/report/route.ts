/**
 * GET /api/interview/report
 * Comprehensive interview report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFinalReport } from '@/lib/services/interview.service';

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

    // Get final report
    const result = await getFinalReport(sessionId);

    return NextResponse.json({
      success: true,
      data: result.report
    });

  } catch (error: any) {
    console.error('Error in interview/report API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get final report'
      },
      { status: 500 }
    );
  }
}
