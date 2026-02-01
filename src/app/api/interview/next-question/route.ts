/**
 * GET /api/interview/next-question
 * Fetch next adaptive question
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNextQuestion } from '@/lib/services/interview.service';

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

    // Get next question
    const result = await getNextQuestion(sessionId);

    return NextResponse.json({
      success: true,
      data: result.question
    });

  } catch (error: any) {
    console.error('Error in next-question API:', error);

    // Check if interview is completed
    if (error.message?.includes('Interview completed')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          interviewComplete: true
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get next question'
      },
      { status: 500 }
    );
  }
}
