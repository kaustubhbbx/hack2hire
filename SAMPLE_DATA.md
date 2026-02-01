# Sample Test Data for AI-Powered Mock Interview Platform

This document provides sample data for testing the interview platform API.

## 1. Sample Resume (Text Format)

```json
{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "fileName": "john_doe_resume.txt",
  "resumeText": "John Doe
Senior Full Stack Developer

Skills:
- JavaScript, TypeScript, React, Next.js, Node.js
- Python, Django, Flask
- SQL (PostgreSQL, MySQL), MongoDB
- Docker, Kubernetes, AWS
- RESTful APIs, GraphQL
- Git, CI/CD pipelines

Experience:

Software Engineer at TechCorp (2020 - Present)
- Led development of microservices architecture serving 1M+ users
- Implemented real-time features using WebSockets
- Improved system performance by 40% through optimization
- Mentored junior developers and conducted code reviews

Full Stack Developer at StartupXYZ (2018 - 2020)
- Built e-commerce platform from scratch
- Integrated payment gateways and third-party APIs
- Deployed applications on AWS infrastructure

Junior Developer at CodeInc (2016 - 2018)
- Developed web applications using React and Node.js
- Collaborated with design team on UI/UX improvements
- Participated in agile development processes

Projects:

E-commerce Platform (2022)
- Technologies: React, Node.js, PostgreSQL, Redis
- Role: Lead Developer
- Built scalable e-commerce platform with real-time inventory management
- Implemented recommendation engine using machine learning

Real-time Chat Application (2021)
- Technologies: Socket.io, Node.js, MongoDB
- Role: Full Stack Developer
- Built chat application supporting 10K concurrent users
- Implemented end-to-end encryption

Education:

Bachelor of Science in Computer Science
Stanford University (2012 - 2016)
GPA: 3.8/4.0

Certifications:
- AWS Certified Solutions Architect (2021)
- Google Cloud Professional Developer (2020)
- MongoDB Certified Developer (2019)"
}
```

## 2. Sample Job Description (Text Format)

```json
{
  "email": "recruiter@company.com",
  "title": "Senior Full Stack Developer",
  "jdText": "Senior Full Stack Developer

Company Overview:
We are a fast-growing tech company building next-generation cloud solutions. We're looking for talented engineers to join our team and help us scale our platform.

Position Summary:
We are seeking a Senior Full Stack Developer with strong experience in modern web technologies. The ideal candidate will have experience building scalable applications and working with cross-functional teams.

Requirements:
- 5+ years of professional software development experience
- 3+ years of experience with React or similar frameworks
- Strong proficiency in TypeScript/JavaScript
- Experience with Node.js and backend development
- Experience with relational databases (PostgreSQL, MySQL)
- Knowledge of cloud platforms (AWS, GCP, Azure)
- Experience with containerization (Docker, Kubernetes)
- Strong understanding of RESTful APIs and microservices

Required Skills:
- TypeScript, JavaScript
- React, Next.js
- Node.js, Express
- PostgreSQL, MongoDB
- Docker, Kubernetes
- AWS or GCP
- GraphQL
- CI/CD pipelines

Responsibilities:
- Design and develop scalable web applications
- Collaborate with product managers and designers
- Write clean, maintainable, and efficient code
- Participate in code reviews and mentor junior developers
- Optimize application performance and reliability
- Implement best practices for security and data protection
- Contribute to architectural decisions and technical strategy

Key Competencies:
- Problem-solving and analytical thinking
- Strong communication skills
- Leadership and mentoring abilities
- Adaptability and continuous learning
- Attention to detail
- Team collaboration

Experience Level: Senior

Benefits:
- Competitive salary and equity
- Health, dental, and vision insurance
- Flexible work arrangements
- Professional development budget
- Modern tech stack and tools"
}
```

## 3. API Test Examples

### Example 1: Complete Interview Flow

```bash
# Step 1: Upload Resume
curl -X POST http://localhost:3000/api/upload-resume \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "fileName": "resume.txt",
    "resumeText": "John Doe\nSenior Full Stack Developer\n\nSkills:\n- JavaScript, TypeScript, React, Next.js, Node.js\n\nExperience:\nSoftware Engineer at TechCorp (2020 - Present)\n- Led development of microservices architecture serving 1M+ users\n- Implemented real-time features using WebSockets"
  }'

# Response:
{
  "success": true,
  "data": {
    "resumeId": "cm1234567890",
    "parsedData": {
      "skills": ["JavaScript", "TypeScript", "React", "Next.js", "Node.js"],
      "experience": [...],
      "projects": [...],
      "education": [...],
      "certifications": [...]
    }
  }
}

# Step 2: Upload Job Description
curl -X POST http://localhost:3000/api/upload-jd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "title": "Senior Full Stack Developer",
    "jdText": "Senior Full Stack Developer\n\nRequirements:\n- 5+ years of professional software development experience\n- 3+ years of experience with React or similar frameworks\n- Strong proficiency in TypeScript/JavaScript"
  }'

# Step 3: Start Interview
curl -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "resumeId": "cm1234567890",
    "jdId": "cm0987654321"
  }'

# Step 4: Get Next Question
curl -X GET "http://localhost:3000/api/interview/next-question?sessionId=cm111222333"

# Step 5: Submit Answer
curl -X POST http://localhost:3000/api/interview/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "cm444555666",
    "responseText": "React uses a virtual DOM to optimize rendering performance...",
    "timeTaken": 120
  }'

# Step 6: Get Interview Status
curl -X GET "http://localhost:3000/api/interview/status?sessionId=cm111222333"

# Step 7: End Interview (or it will auto-complete)
curl -X POST http://localhost:3000/api/interview/end \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cm111222333",
    "reason": "User requested"
  }'

# Step 8: Get Final Report
curl -X GET "http://localhost:3000/api/interview/report?sessionId=cm111222333"
```

### Example 2: Sample Answer Responses

```json
{
  "questionId": "cm444555666",
  "responseText": "React uses a virtual DOM to efficiently update the UI. When state changes, React creates a virtual DOM tree, compares it with the previous one, and only updates the actual DOM with the differences. This minimizes expensive DOM operations. React also uses reconciliation algorithms to determine the minimal set of changes needed. Additionally, React's component lifecycle methods and hooks like useEffect help manage side effects and optimize performance through memoization with useMemo and useCallback.",
  "timeTaken": 120
}
```

## 4. Sample Expected Responses

### Interview Status Response

```json
{
  "success": true,
  "data": {
    "sessionId": "cm111222333",
    "status": "InProgress",
    "currentQuestionNumber": 5,
    "currentDifficulty": "Hard",
    "startTime": "2024-02-01T10:00:00Z",
    "timeElapsed": 900,
    "questionsAnswered": 4,
    "averageScore": 78.5,
    "lastScores": [75, 82, 80, 77],
    "performanceTrend": "Stable",
    "skillBreakdown": {
      "technical": 82.0,
      "behavioral": 75.0,
      "conceptual": 78.0,
      "timeManagement": 80.0
    }
  }
}
```

### Final Report Response

```json
{
  "success": true,
  "data": {
    "sessionId": "cm111222333",
    "overallScore": 78.5,
    "skillBreakdown": {
      "technical": 82.0,
      "behavioral": 75.0,
      "conceptual": 78.0,
      "communication": 76.5,
      "timeManagement": 80.0
    },
    "performanceTrend": "Stable",
    "strengths": [
      "technical",
      "timeManagement",
      "conceptual"
    ],
    "weaknesses": [
      {
        "skill": "behavioral",
        "feedback": "Could improve on providing specific examples in behavioral questions",
        "improvement": "Focus on improving behavioral skills through practice and learning"
      }
    ],
    "recommendation": "Needs Practice",
    "recommendationConfidence": 85,
    "questionCount": 10,
    "averageTimePerQuestion": 180,
    "totalDuration": 1800,
    "generatedAt": "2024-02-01T10:30:00Z",
    "sessionStatus": "Completed",
    "startTime": "2024-02-01T10:00:00Z",
    "endTime": "2024-02-01T10:30:00Z"
  }
}
```

## 5. WebSocket Event Examples

### Join Session

```javascript
const socket = io('/?XTransformPort=3003');

socket.emit('join-session', 'cm111222333');

socket.on('session-joined', (data) => {
  console.log('Joined session:', data.sessionId);
});
```

### Receive New Question

```javascript
socket.on('new-question', (data) => {
  console.log('New question:', data.question);
  // Display question to user
});
```

### Receive Answer Evaluation

```javascript
socket.on('answer-evaluated', (data) => {
  console.log('Evaluation:', data.evaluation);
  // Display results to user
});
```

### Performance Update

```javascript
socket.on('performance-updated', (data) => {
  console.log('Performance:', data.metrics);
  // Update dashboard
});
```

## 6. Edge Cases to Test

1. **Empty Resume**: Test with resume text less than 50 characters
2. **Invalid Email**: Test with malformed email addresses
3. **Short Answers**: Test answers with very brief responses
5. **Time Exceeded**: Test submitting answers after time limit
6. **Consecutive Low Scores**: Test early termination logic
7. **Non-existent Session**: Test with invalid session IDs
8. **Duplicate Answers**: Try submitting answer twice for same question
