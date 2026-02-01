/**
 * POST /api/interview/start
 * Start a new interview session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, startInterview } from '@/lib/services/interview.service';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] /api/interview/start called')
    const body = await request.json();
    const { email, resumeId, jdId } = body;

    console.log('[API] Request body:', { email, resumeId, jdId })

    // Validate required fields
    if (!email || !resumeId || !jdId) {
      console.log('[API] Validation failed: missing fields')
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, resumeId, jdId'
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (typeof email !== 'string' || !email.includes('@')) {
      console.log('[API] Invalid email:', email)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      );
    }

    if (typeof resumeId !== 'string' || resumeId.trim().length === 0) {
      console.log('[API] Invalid resumeId:', resumeId)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid resume ID'
        },
        { status: 400 }
      );
    }

    if (typeof jdId !== 'string' || jdId.trim().length === 0) {
      console.log('[API] Invalid jdId:', jdId)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job description ID'
        },
        { status: 400 }
      );
    }

    console.log('[API] All validations passed, getting user')

    // Get or create user
    const user = await getOrCreateUser(email);
    console.log('[API] User:', user.id)

    // Start interview
    console.log('[API] Starting interview session...')
    const result = await startInterview(user.id, resumeId, jdId);
    console.log('[API] Interview started:', result)

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        status: result.status,
        currentDifficulty: result.currentDifficulty
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error in interview/start API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start interview'
      },
      { status: 500 }
    );
  }
}
