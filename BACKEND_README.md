# AI-Powered Mock Interview Platform - Backend Documentation

## Overview

This is a complete, production-ready backend system for an AI-Powered Mock Interview Platform. The system analyzes resumes, matches them with job descriptions, conducts adaptive interviews, and provides comprehensive performance evaluations.

## Features Implemented

### ✅ Core Features

1. **Document Processing Module**
   - Resume parser using LLM to extract skills, experience, projects, education, certifications
   - JD parser to extract requirements, skills, experience level, responsibilities
   - AI-powered profile-to-JD matching with initial fit score (0-100)

2. **Interview State Management**
   - Session-based interview tracking
   - Current question difficulty tracking (Easy/Medium/Hard)
   - Real-time performance metrics
   - Question history and response tracking
   - Time tracking per question and total interview duration

3. **Adaptive Question Generation**
   - AI-generated questions based on candidate skills and JD requirements
   - Question categories: Technical (40%), Conceptual (25%), Behavioral (20%), Scenario-based (15%)
   - Difficulty progression logic:
     - Start at Medium difficulty
     - Strong answer (≥75) → increase difficulty
     - Weak answer (<50) → maintain or decrease difficulty
     - Moderate answer (50-74) → maintain difficulty
   - Minimum 8-12 questions per interview

4. **Response Evaluation Engine**
   - Score each answer (0-100) based on:
     - Accuracy (30%): Correctness of information
     - Clarity (20%): Communication effectiveness
     - Depth (25%): Level of detail and understanding
     - Relevance (15%): Alignment with question
     - Time Efficiency (10%): Response within time limit

5. **Time Constraint System**
   - Easy questions: 2 minutes (120 seconds)
   - Medium questions: 3 minutes (180 seconds)
   - Hard questions: 4 minutes (240 seconds)
   - Penalty: -5 points per 10 seconds overtime (max -20)
   - Auto-submit after 150% of allocated time

6. **Early Termination Logic**
   End interview if:
   - Average score falls below 35% after 4 questions
   - Consecutive 3 answers score below 40%
   - Total interview time exceeds 45 minutes
   - Candidate explicitly requests termination

7. **Final Scoring & Analysis**
   - Overall readiness score (weighted average)
   - Skill-wise breakdown (technical, behavioral, communication, time management)
   - Performance trend (improving/declining/stable)
   - Top 3 strengths
   - Bottom 3 weaknesses with specific feedback
   - Hiring recommendation: Ready/Needs Practice/Not Ready (with confidence %)

8. **Real-time Updates**
   - WebSocket service for live interview updates
   - Real-time question broadcasts
   - Live performance metrics
   - Time warnings

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **AI**: z-ai-web-dev-sdk for LLM capabilities
- **Real-time**: Socket.io WebSocket service
- **Authentication**: JWT (middleware available)
- **Logging**: Custom structured logging utility

## Project Structure

```
/home/z/my-project/
├── prisma/
│   └── schema.prisma                 # Database schema
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── upload-resume/        # POST - Upload and parse resume
│   │       ├── upload-jd/            # POST - Upload and parse job description
│   │       └── interview/
│   │           ├── start/            # POST - Start interview session
│   │           ├── next-question/    # GET - Get next adaptive question
│   │           ├── submit-answer/    # POST - Submit answer and get evaluation
│   │           ├── status/           # GET - Current performance metrics
│   │           ├── end/              # POST - Terminate and generate report
│   │           └── report/           # GET - Comprehensive interview report
│   └── lib/
│       ├── db.ts                     # Prisma client
│       ├── types/
│       │   └── interview.ts          # TypeScript type definitions
│       ├── services/
│       │   ├── llm.service.ts        # LLM integration (question generation & evaluation)
│       │   ├── interview.service.ts   # Main interview business logic
│       │   └── interview-engine.service.ts  # Interview state management
│       ├── middleware/
│       │   └── auth.middleware.ts    # JWT authentication
│       └── utils/
│           └── logger.ts             # Structured logging
├── mini-services/
│   └── interview-ws/                 # WebSocket service (port 3003)
│       ├── index.ts                 # Socket.IO server
│       └── package.json
├── db/
│   └── custom.db                    # SQLite database
├── API_DOCUMENTATION.md             # Complete API documentation
├── SAMPLE_DATA.md                   # Sample test data and examples
└── BACKEND_README.md                # This file
```

## Database Schema

### Models

1. **User**: User accounts and authentication
2. **Resume**: Parsed resume data (skills, experience, projects, education, certifications)
3. **JobDescription**: Parsed job description data (requirements, skills, responsibilities)
4. **InterviewSession**: Interview state tracking (status, difficulty, timing)
5. **Question**: Interview questions with category and difficulty
6. **Answer**: Candidate responses with detailed evaluation
7. **FinalReport**: Comprehensive interview analysis

## API Endpoints

### Document Processing

- `POST /api/upload-resume` - Upload and parse resume
- `POST /api/upload-jd` - Upload and parse job description

### Interview Management

- `POST /api/interview/start` - Start interview session
- `GET /api/interview/next-question` - Get next adaptive question
- `POST /api/interview/submit-answer` - Submit answer and get evaluation
- `GET /api/interview/status` - Current performance metrics
- `POST /api/interview/end` - Terminate and generate report
- `GET /api/interview/report` - Comprehensive interview report

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## WebSocket Service

The WebSocket service runs on port 3003 and provides real-time updates:

**Connection**: `io('/?XTransformPort=3003')`

**Events**:
- `join-session` - Join an interview session
- `leave-session` - Leave an interview session
- `new-question` - Receive new question
- `answer-evaluated` - Receive answer evaluation
- `performance-updated` - Receive performance metrics
- `interview-status-changed` - Receive status updates
- `time-warning` - Receive time warnings

## Installation & Setup

### Prerequisites

- Bun runtime
- Node.js dependencies

### Database Setup

The database schema is already migrated. The SQLite database is located at `db/custom.db`.

To recreate the database:

```bash
bun run db:push
```

### Install Dependencies

```bash
# Main project dependencies
bun install

# WebSocket service dependencies
cd mini-services/interview-ws
bun install
```

### Start Services

```bash
# Main Next.js API server (runs on port 3000)
bun run dev

# WebSocket service (runs on port 3003)
cd mini-services/interview-ws
bun run dev
```

## Usage Example

### 1. Upload Resume

```bash
curl -X POST http://localhost:3000/api/upload-resume \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "fileName": "resume.txt",
    "resumeText": "John Doe\nSenior Developer\n\nSkills: JavaScript, TypeScript, React..."
  }'
```

### 2. Upload Job Description

```bash
curl -X POST http://localhost:3000/api/upload-jd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "title": "Senior Developer",
    "jdText": "We are looking for a Senior Developer..."
  }'
```

### 3. Start Interview

```bash
curl -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "resumeId": "cm1234567890",
    "jdId": "cm0987654321"
  }'
```

### 4. Get Next Question

```bash
curl -X GET "http://localhost:3000/api/interview/next-question?sessionId=cm111222333"
```

### 5. Submit Answer

```bash
curl -X POST http://localhost:3000/api/interview/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "cm444555666",
    "responseText": "React uses a virtual DOM to...",
    "timeTaken": 120
  }'
```

### 6. Get Final Report

```bash
curl -X GET "http://localhost:3000/api/interview/report?sessionId=cm111222333"
```

## Sample Data

See [SAMPLE_DATA.md](./SAMPLE_DATA.md) for:
- Sample resume text
- Sample job description text
- Complete API flow examples
- Expected response formats
- Edge cases to test

## Architecture

### Clean Architecture Principles

The backend follows clean architecture principles:

1. **API Layer**: Next.js route handlers
2. **Service Layer**: Business logic (interview.service.ts, llm.service.ts)
3. **Data Layer**: Prisma ORM
4. **Utility Layer**: Logging, authentication, type definitions

### Data Flow

```
Client Request
    ↓
API Route (validation)
    ↓
Service Layer (business logic)
    ↓
LLM Service (AI operations)
    ↓
Database (Prisma)
    ↓
Response
```

### WebSocket Flow

```
Client connects to WebSocket service
    ↓
Joins interview session
    ↓
Server broadcasts events (questions, evaluations, updates)
    ↓
Client receives real-time updates
```

## Error Handling

All endpoints include comprehensive error handling:

- Input validation (type, format, length)
- Database error handling
- LLM error handling with retries
- User-friendly error messages

Standard error response format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Logging

Structured logging is implemented in `src/lib/utils/logger.ts`:

- API requests/responses
- Database operations
- LLM operations
- Interview events
- WebSocket events

Log levels: info, warn, error, debug

## Security

- Input validation on all endpoints
- SQL injection protection (Prisma ORM)
- XSS prevention (output escaping)
- JWT authentication middleware available
- Session tokens for interviews

## Performance Optimization

- Database connection pooling (Prisma)
- Efficient database queries
- Connection reuse
- Real-time updates reduce polling

## Testing

See [SAMPLE_DATA.md](./SAMPLE_DATA.md) for testing examples.

Recommended test scenarios:
1. Complete interview flow
2. Edge cases (empty resume, invalid IDs)
3. Early termination conditions
4. Time limit violations
5. WebSocket connections

## Production Deployment Considerations

1. **Environment Variables**
   - Set `JWT_SECRET` for secure authentication
   - Configure `DATABASE_URL` for production database
   - Use production-ready database (PostgreSQL recommended)

2. **Rate Limiting**
   - Implement rate limiting on all endpoints
   - Use Redis for distributed rate limiting

3. **Caching**
   - Cache parsed documents
   - Cache frequently accessed data

4. **Monitoring**
   - Set up application monitoring
   - Log aggregation
   - Performance metrics

5. **Scaling**
   - Deploy WebSocket service separately
   - Use load balancer for API endpoints
   - Consider CDN for static assets

## Troubleshooting

### Database Issues

```bash
# Reset database
bun run db:reset

# Regenerate Prisma client
bun run db:generate
```

### WebSocket Issues

Ensure WebSocket service is running:
```bash
cd mini-services/interview-ws
bun run dev
```

### LLM Issues

- Check z-ai-web-dev-sdk is installed
- Verify API configuration
- Check error logs for specific issues

## Code Quality

Run linting to ensure code quality:
```bash
bun run lint
```

## Contributing

When contributing:
1. Follow existing code style
2. Add comprehensive comments
3. Update type definitions
4. Add error handling
5. Update documentation

## License

This project is part of the AI-Powered Mock Interview Platform.

## Support

For issues or questions:
1. Check API documentation: `API_DOCUMENTATION.md`
2. Check sample data: `SAMPLE_DATA.md`
3. Review code comments in service files
4. Check type definitions: `src/lib/types/interview.ts`

## Summary

This backend provides a complete, production-ready foundation for an AI-powered mock interview platform with:

- ✅ Intelligent document parsing using AI
- ✅ Adaptive interview flow
- ✅ Comprehensive answer evaluation
- ✅ Real-time performance tracking
- ✅ Early termination logic
- ✅ Detailed final reports
- ✅ WebSocket real-time updates
- ✅ JWT authentication support
- ✅ Structured logging
- ✅ Clean architecture
- ✅ Comprehensive documentation

The system is ready for integration with a frontend client and can be deployed to production with minimal additional configuration.
