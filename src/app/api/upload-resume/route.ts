/**
 * POST /api/upload-resume
 * Upload and parse a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, uploadResume } from '@/lib/services/interview.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, fileName, resumeText } = body;

    // Validate required fields
    if (!email || !fileName || !resumeText) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, fileName, resumeText'
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      );
    }

    if (typeof fileName !== 'string' || fileName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file name'
        },
        { status: 400 }
      );
    }

    if (typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resume text is too short (minimum 50 characters)'
        },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(email, name);

    // Upload and parse resume
    const result = await uploadResume(user.id, fileName, resumeText);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: result.resumeId,
        parsedData: result.data
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in upload-resume API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload resume'
      },
      { status: 500 }
    );
  }
}
