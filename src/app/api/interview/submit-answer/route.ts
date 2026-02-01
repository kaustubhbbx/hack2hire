/**
 * POST /api/interview/submit-answer
 * Submit answer and get evaluation
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitAnswer } from '@/lib/services/interview.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, responseText, timeTaken } = body;

    // Validate required fields
    if (!questionId || responseText === undefined || timeTaken === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: questionId, responseText, timeTaken'
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (typeof questionId !== 'string' || questionId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid question ID'
        },
        { status: 400 }
      );
    }

    if (typeof responseText !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Response text must be a string'
        },
        { status: 400 }
      );
    }

    if (typeof timeTaken !== 'number' || timeTaken < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time taken must be a positive number'
        },
        { status: 400 }
      );
    }

    if (responseText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Response text cannot be empty'
        },
        { status: 400 }
      );
    }

    // Submit answer
    const result = await submitAnswer(questionId, responseText.trim(), timeTaken);

    return NextResponse.json({
      success: true,
      data: result.evaluation
    });

  } catch (error: any) {
    console.error('Error in submit-answer API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit answer'
      },
      { status: 500 }
    );
  }
}
