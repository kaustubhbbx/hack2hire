# AI-Powered Mock Interview Platform - API Documentation

## Overview

The AI-Powered Mock Interview Platform provides a comprehensive backend system for conducting intelligent, adaptive interviews. This document describes all available API endpoints, their parameters, request/response formats, and usage examples.

## Base URL

All API endpoints are relative to:
```
http://localhost:3000/api
```

## Authentication

The platform currently uses email-based identification. JWT authentication middleware is available for production use.

## WebSocket Endpoint

Real-time updates are available via WebSocket:
```
http://localhost:3000/?XTransformPort=3003
```

---

## API Endpoints

### 1. Upload Resume

Uploads and parses a candidate's resume using AI.

**Endpoint:** `POST /api/upload-resume`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "string (required)",
  "name": "string (optional)",
  "fileName": "string (required)",
  "resumeText": "string (required, min 50 characters)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "resumeId": "string",
    "parsedData": {
      "skills": ["string"],
      "experience": [
        {
          "company": "string",
          "role": "string",
          "duration": "string",
          "description": ["string"]
        }
      ],
      "projects": [
        {
          "name": "string",
          "description": "string",
          "technologies": ["string"],
          "role": "string"
        }
      ],
      "education": [
        {
          "institution": "string",
          "degree": "string",
          "field": "string",
          "year": "string"
        }
      ],
      "certifications": ["string"]
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid input
- `500 Internal Server Error`: Failed to process resume

---

### 2. Upload Job Description

Uploads and parses a job description using AI.

**Endpoint:** `POST /api/upload-jd`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "string (required)",
  "title": "string (required)",
  "jdText": "string (required, min 50 characters)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "jdId": "string",
    "parsedData": {
      "title": "string",
      "requirements": ["string"],
      "skillsRequired": ["string"],
      "experienceLevel": "Entry | Mid | Senior | Lead",
      "responsibilities": ["string"],
      "keyCompetencies": ["string"]
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid input
- `500 Internal Server Error`: Failed to process job description

---

### 3. Start Interview

Initializes a new interview session.

**Endpoint:** `POST /api/interview/start`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "string (required)",
  "resumeId": "string (required)",
  "jdId": "string (required)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "status": "InProgress",
    "currentDifficulty": "Medium"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid IDs
- `404 Not Found`: Resume or job description not found
- `500 Internal Server Error`: Failed to start interview

---

### 4. Get Next Question

Fetches the next adaptive question for the interview.

**Endpoint:** `GET /api/interview/next-question?sessionId={sessionId}`

**Query Parameters:**
- `sessionId` (required): The interview session ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "text": "string",
    "category": "Technical | Conceptual | Behavioral | Scenario",
    "difficulty": "Easy | Medium | Hard",
    "timeLimit": "number (seconds)",
    "questionNumber": "number"
  }
}
```

**Special Response (Interview Completed):**
```json
{
  "success": false,
  "error": "Interview completed. Maximum questions reached.",
  "interviewComplete": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing session ID
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Failed to generate question

**Question Categories:**
- **Technical (40%)**: Coding, frameworks, problem-solving
- **Conceptual (25%)**: Theory, architecture, design patterns
- **Behavioral (20%)**: Teamwork, leadership, soft skills
- **Scenario (15%)**: Real-world problem solving

**Time Limits:**
- Easy: 120 seconds (2 minutes)
- Medium: 180 seconds (3 minutes)
- Hard: 240 seconds (4 minutes)

---

### 5. Submit Answer

Submits an answer and receives detailed evaluation.

**Endpoint:** `POST /api/interview/submit-answer`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "questionId": "string (required)",
  "responseText": "string (required)",
  "timeTaken": "number (required, >= 0)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overallScore": "number (0-100)",
    "breakdown": {
      "accuracy": "number (0-100)",
      "clarity": "number (0-100)",
      "depth": "number (0-100)",
      "relevance": "number (0-100)",
      "timeEfficiency": "number (0-100)"
    },
    "timePenalty": "number",
    "feedback": "string",
    "strengths": ["string"],
    "improvements": ["string"],
    "nextDifficulty": "Easy | Medium | Hard",
    "interviewComplete": "boolean",
    "terminationReason": "string (optional)"
  }
}
```

**Scoring Weights:**
- Accuracy: 30% - Correctness of information
- Clarity: 20% - Communication effectiveness
- Depth: 25% - Level of detail and understanding
- Relevance: 15% - Alignment with question
- Time Efficiency: 10% - Response within time limit

**Time Penalty:**
- -5 points per 10 seconds overtime
- Maximum penalty: -20 points
- Auto-submit at 150% of allocated time

**Error Responses:**
- `400 Bad Request`: Invalid input or empty response
- `404 Not Found`: Question not found
- `409 Conflict`: Answer already submitted
- `500 Internal Server Error`: Failed to evaluate answer

---

### 6. Get Interview Status

Retrieves current performance metrics for an active interview.

**Endpoint:** `GET /api/interview/status?sessionId={sessionId}`

**Query Parameters:**
- `sessionId` (required): The interview session ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "status": "NotStarted | InProgress | Completed | Terminated",
    "currentQuestionNumber": "number",
    "currentDifficulty": "Easy | Medium | Hard",
    "startTime": "ISO 8601 datetime",
    "timeElapsed": "number (seconds)",
    "questionsAnswered": "number",
    "averageScore": "number (0-100)",
    "lastScores": ["number"],
    "performanceTrend": "Improving | Declining | Stable",
    "skillBreakdown": {
      "technical": "number",
      "behavioral": "number",
      "conceptual": "number",
      "communication": "number",
      "timeManagement": "number"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing session ID
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Failed to retrieve status

---

### 7. End Interview

Terminates an interview session and generates a final report.

**Endpoint:** `POST /api/interview/end`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "reason": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "overallScore": "number (0-100)",
    "skillBreakdown": {
      "technical": "number (0-100)",
      "behavioral": "number (0-100)",
      "conceptual": "number (0-100)",
      "communication": "number (0-100)",
      "timeManagement": "number (0-100)"
    },
    "performanceTrend": "Improving | Declining | Stable",
    "strengths": ["string"],
    "weaknesses": [
      {
        "skill": "string",
        "feedback": "string",
        "improvement": "string"
      }
    ],
    "recommendation": "Ready | Needs Practice | Not Ready",
    "recommendationConfidence": "number (0-100)",
    "questionCount": "number",
    "averageTimePerQuestion": "number (seconds)",
    "totalDuration": "number (seconds)",
    "generatedAt": "ISO 8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid session ID
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Failed to generate report

---

### 8. Get Final Report

Retrieves the comprehensive interview report.

**Endpoint:** `GET /api/interview/report?sessionId={sessionId}`

**Query Parameters:**
- `sessionId` (required): The interview session ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "overallScore": "number (0-100)",
    "skillBreakdown": {
      "technical": "number (0-100)",
      "behavioral": "number (0-100)",
      "conceptual": "number (0-100)",
      "communication": "number (0-100)",
      "timeManagement": "number (0-100)"
    },
    "performanceTrend": "Improving | Declining | Stable",
    "strengths": ["string"],
    "weaknesses": [
      {
        "skill": "string",
        "feedback": "string",
        "improvement": "string"
      }
    ],
    "recommendation": "Ready | Needs Practice | Not Ready",
    "recommendationConfidence": "number (0-100)",
    "questionCount": "number",
    "averageTimePerQuestion": "number (seconds)",
    "generatedAt": "ISO 8601 datetime",
    "sessionStatus": "NotStarted | InProgress | Completed | Terminated",
    "startTime": "ISO 8601 datetime",
    "endTime": "ISO 8601 datetime",
    "totalDuration": "number (seconds)"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing session ID
- `404 Not Found`: Session or report not found
- `500 Internal Server Error`: Failed to retrieve report

---

## WebSocket Events

### Connection

```javascript
const socket = io('/?XTransformPort=3003');
```

### Join Session

**Emit:**
```javascript
socket.emit('join-session', 'sessionId');
```

**Listen:**
```javascript
socket.on('session-joined', (data) => {
  console.log('Joined session:', data.sessionId);
});
```

### New Question

**Listen:**
```javascript
socket.on('new-question', (data) => {
  console.log('Question:', data.question);
});
```

### Answer Evaluated

**Listen:**
```javascript
socket.on('answer-evaluated', (data) => {
  console.log('Evaluation:', data.evaluation);
});
```

### Performance Updated

**Listen:**
```javascript
socket.on('performance-updated', (data) => {
  console.log('Metrics:', data.metrics);
});
```

### Interview Status Changed

**Listen:**
```javascript
socket.on('interview-status-changed', (data) => {
  console.log('Status:', data.status);
});
```

### Time Warning

**Listen:**
```javascript
socket.on('time-warning', (data) => {
  console.log('Time remaining:', data.timeRemaining);
});
```

### Leave Session

**Emit:**
```javascript
socket.emit('leave-session', 'sessionId');
```

---

## Early Termination Conditions

The interview may be automatically terminated if:

1. **Low Average Score**: After 4 questions, if average score falls below 35%
2. **Consecutive Low Scores**: Three consecutive answers score below 40%
3. **Max Time Exceeded**: Total interview time exceeds 45 minutes
4. **User Requested**: Candidate explicitly requests termination

---

## Difficulty Progression Logic

- **Start**: Medium difficulty
- **Strong Answer (≥75)**: Increase difficulty
- **Weak Answer (<50)**: Maintain or decrease difficulty
- **Moderate Answer (50-74)**: Maintain difficulty

**Note**: First 3 questions are warm-up period (no difficulty increase).

---

## Interview Completion

The interview automatically completes when:

1. Maximum questions reached (12 questions)
2. Early termination condition triggered
3. Minimum questions answered (8 questions) and early termination condition met

---

## Error Handling

All endpoints follow this error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or missing required fields
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate answer)
- `500 Internal Server Error`: Server error

---

## Rate Limiting

For production deployment, implement rate limiting on all endpoints:

- Upload endpoints: 5 requests per minute
- Interview endpoints: 30 requests per minute
- Status endpoints: 60 requests per minute

---

## Security Considerations

1. **Input Validation**: All inputs are validated for type, format, and length
2. **SQL Injection**: Prisma ORM provides protection against SQL injection
3. **XSS Prevention**: All outputs are properly escaped
4. **JWT Authentication**: Middleware available for production use
5. **Session Tokens**: Separate tokens for interview sessions

---

## Performance Optimization

1. **Connection Pooling**: Database connections are pooled
2. **Caching**: Consider implementing Redis for caching parsed documents
3. **Batch Operations**: Use database transactions for related operations
4. **WebSocket**: Real-time updates reduce polling overhead

---

## Testing

See `SAMPLE_DATA.md` for sample test data and API usage examples.

---

## Support

For issues or questions, please refer to:
- Sample data: `SAMPLE_DATA.md`
- Code comments in implementation files
- Type definitions: `src/lib/types/interview.ts`
