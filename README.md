

https://github.com/user-attachments/assets/642ba235-65f0-4fd2-b13c-bbab7f328b99

# Hack2Hire

AI-powered interview platform that simulates realistic job interviews with adaptive difficulty and real-time feedback.

## Problem Statement

Traditional interview preparation lacks realistic practice environments. Candidates need an interactive platform that provides:
- Dynamic question generation based on job requirements
- Real-time AI evaluation of answers
- Adaptive difficulty adjustment based on performance
- Comprehensive performance analytics and feedback

## Solution Overview

Hack2Hire is a full-stack AI interview platform that:
- Extracts skills and experience from uploaded resumes
- Parses job descriptions to identify requirements
- Generates contextual interview questions using AI
- Evaluates responses in real-time with detailed feedback
- Adjusts question difficulty based on candidate performance
- Provides comprehensive performance reports with actionable insights

The system uses LLM-powered question generation and evaluation to create a personalized interview experience that adapts to each candidate's skill level.

## Tech Stack

### Frontend
- Next.js 16.1.3 with App Router
- React 19 with TypeScript 5.9.3
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Framer Motion for animations
- Zustand for state management

### Backend
- Next.js API Routes (server actions)
- Prisma ORM with SQLite database
- z-ai-web-dev-sdk for AI integration

### AI / APIs
- LLM for question generation and answer evaluation
- Chat completions API for interview flow

### Database
- SQLite with Prisma ORM
- User, Resume, JobDescription, InterviewSession, Question, Answer, FinalReport models

### Hosting / Deployment
- Vercel for production deployment
- Node.js runtime

## Core Features

- Multi-step onboarding with resume and job description upload
- AI-powered resume parsing and skill extraction
- Job description parsing with requirements identification
- Adaptive question generation across multiple categories
- Real-time answer evaluation with scoring
- Dynamic difficulty adjustment based on performance
- Comprehensive performance reports with skill breakdowns
- Fit score calculation between candidate and job requirements
- Session-based interview flow with question navigation
- Time tracking per question with auto-submission
- Interview statistics and performance trends

## Project Structure

```
src/
├── app/
│   ├── api/               # API routes
│   │   ├── interview/      # Interview management
│   │   ├── upload-resume/ # Resume processing
│   │   └── upload-jd/      # Job description processing
│   ├── interview/          # Interview interface
│   ├── onboarding/        # User setup flow
│   └── results/            # Performance reports
├── components/
│   ├── interview/          # Interview components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── services/          # Business logic
│   │   ├── interview.service.ts
│   │   └── llm.service.ts
│   └── types/             # TypeScript definitions
├── store/                # Zustand state management
└── hooks/                # React hooks

prisma/
├── schema.prisma        # Database schema
└── migrations/           # Database migrations
```

## Environment Variables

Required environment variables:

```
DATABASE_URL=file:./db/custom.db
NODE_ENV=development
```

For production with Vercel, configure these in project settings.

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/kaustubhbbx/hack2hire.git
   cd hack2hire
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Initialize database:
   ```bash
   bun run db:push
   ```

5. Start development server:
   ```bash
   bun run dev
   ```

The application will be available at http://localhost:3000

## Deployment on Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com and sign in
2. Connect your GitHub account

### Step 2: Import Repository
1. Click "Add New Project"
2. Select "Continue with GitHub"
3. Choose `kaustubhbbx/hack2hire` repository

### Step 3: Configure Project
1. Framework Preset: Next.js
2. Root Directory: `./` (leave as default)
3. Build Command: `bun run build`
4. Install Command: `bun install`
5. Output Directory: `.next`

### Step 4: Environment Variables
Add the following environment variables in Vercel project settings:
```
DATABASE_URL=postgresql://your-db-url
NODE_ENV=production
```

### Step 5: Deploy
1. Click "Deploy" button
2. Vercel will build and deploy your application

### Step 6: Verify Deployment
1. Wait for deployment to complete
2. Access your application at the provided Vercel URL
3. Check Vercel dashboard for logs if deployment fails

**Automatic Redeploy**: When you push to GitHub, Vercel automatically detects changes and redeploys your application.

**Checking Logs**: If deployment fails, go to Vercel Dashboard → Your Project → Logs to see error messages.

## Future Improvements

- Video response recording capability
- Voice-to-text transcription for video interviews
- Expanded question bank with industry-specific questions
- Multi-language support for international candidates
- Integration with LinkedIn for automated profile import
- Advanced analytics dashboard with performance trends
- Practice mode with timer and hints

## Team

- Kaustubh Shende – DevOps + Full-Stack Development
