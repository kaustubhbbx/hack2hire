/**
 * POST /api/upload-jd
 * Upload and parse a job description
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, uploadJobDescription } from '@/lib/services/interview.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, title, jdText } = body;

    console.log('[API /upload-jd] Request received:', {
      email,
      title,
      jdTextLength: jdText?.length || 0
    });

    // Validate required fields
    if (!email || !title || !jdText) {
      console.error('[API /upload-jd] Missing required fields:', {
        hasEmail: !!email,
        hasTitle: !!title,
        hasJdText: !!jdText
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, title, jdText'
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (typeof email !== 'string' || !email.includes('@')) {
      console.error('[API /upload-jd] Invalid email:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      );
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      console.error('[API /upload-jd] Invalid title:', title);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job title'
        },
        { status: 400 }
      );
    }

    if (typeof jdText !== 'string' || jdText.trim().length < 50) {
      console.error('[API /upload-jd] JD text too short:', jdText.trim().length);
      return NextResponse.json(
        {
          success: false,
          error: 'Job description text is too short (minimum 50 characters)'
        },
        { status: 400 }
      );
    }

    console.log('[API /upload-jd] All validations passed, getting user...');

    // Get or create user
    const user = await getOrCreateUser(email);
    console.log('[API /upload-jd] User:', user.id);

    console.log('[API /upload-jd] Uploading and parsing JD...');

    // Upload and parse job description
    const result = await uploadJobDescription(user.id, title, jdText);
    console.log('[API /upload-jd] JD uploaded successfully:', result.jdId);

    return NextResponse.json({
      success: true,
      data: {
        jdId: result.jdId,
        parsedData: result.data
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API /upload-jd] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload job description'
      },
      { status: 500 }
    );
  }
}
