/**
 * LLM Service for AI-Powered Mock Interview Platform
 * Handles question generation and answer evaluation using z-ai-web-dev-sdk
 */

import ZAI from 'z-ai-web-dev-sdk';
import type {
  QuestionGenerationRequest,
  Question,
  AnswerEvaluationRequest,
  EvaluationResult,
  Difficulty,
  QuestionCategory,
  ParsedResume,
  ParsedJD
} from '../types/interview';

let zaiInstance: any = null;

/**
 * Initialize ZAI instance (lazy loading)
 */
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Generate an interview question based on candidate profile and JD
 */
export async function generateQuestion(request: QuestionGenerationRequest): Promise<Question> {
  const zai = await getZAI();

  const {
    candidateSkills,
    candidateExperience,
    jdRequirements,
    jdSkillsRequired,
    jdExperienceLevel,
    currentDifficulty,
    questionCategory,
    previousQuestions,
    previousScores
  } = request;

  // Build context for question generation
  const context = `
Candidate Skills: ${candidateSkills.join(', ')}
Candidate Experience: ${candidateExperience.map(e => `${e.role} at ${e.company}`).join('; ')}
Job Requirements: ${jdRequirements.join('; ')}
Required Skills: ${jdSkillsRequired.join(', ')}
Experience Level: ${jdExperienceLevel}
Current Difficulty: ${currentDifficulty}
Question Category: ${questionCategory}
Previous Questions: ${previousQuestions.map(q => q.text).join(' | ')}
Average Previous Score: ${previousScores.length > 0 ? (previousScores.reduce((a, b) => a + b, 0) / previousScores.length).toFixed(1) : 'N/A'}
`;

  const categorySpecificInstructions = getCategoryInstructions(questionCategory);

  const systemPrompt = `You are an expert technical interviewer for ${jdExperienceLevel} level positions. 
Generate focused, relevant interview questions that assess candidate capabilities.

${categorySpecificInstructions}

CRITICAL RULES:
1. Return ONLY the question text, nothing else
2. Questions must be appropriate for ${currentDifficulty} difficulty level
3. Questions must align with required skills and candidate background
4. Questions should be clear, specific, and answerable within the time limit
5. Avoid questions already asked in previous rounds
6. Make questions progressively harder if previous scores are high (>75)
7. Make questions easier if previous scores are low (<50)`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate ONE ${questionCategory} interview question for ${currentDifficulty} difficulty level.\n\n${context}`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const questionText = completion.choices[0]?.message?.content?.trim();

    if (!questionText) {
      throw new Error('Failed to generate question');
    }

    return {
      id: '', // Will be set by database
      sessionId: '',
      text: questionText,
      category: questionCategory,
      difficulty: currentDifficulty,
      timeLimit: getTimeLimit(currentDifficulty),
      askedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate question');
  }
}

/**
 * Evaluate an answer and provide detailed feedback
 */
export async function evaluateAnswer(request: AnswerEvaluationRequest): Promise<EvaluationResult> {
  const zai = await getZAI();

  const {
    question,
    answerText,
    timeTaken,
    timeLimit,
    questionCategory,
    candidateSkills,
    jdSkillsRequired
  } = request;

  // Calculate time efficiency score first
  const timeEfficiencyScore = calculateTimeEfficiency(timeTaken, timeLimit);

  const evaluationPrompt = getEvaluationPrompt(questionCategory);

  const systemPrompt = `You are an expert interview evaluator. Score answers on a 0-100 scale for each criterion.

${evaluationPrompt}

CRITICAL: Return your response in this EXACT JSON format:
{
  "accuracy": <number 0-100>,
  "clarity": <number 0-100>,
  "depth": <number 0-100>,
  "relevance": <number 0-100>,
  "feedback": "<detailed feedback>",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Do NOT include any text outside the JSON.`;

  const userPrompt = `
Question: ${question.text}
Difficulty: ${question.difficulty}
Category: ${questionCategory}

Candidate Answer:
"${answerText}"

Time Taken: ${timeTaken}s / ${timeLimit}s

Candidate Skills: ${candidateSkills.join(', ')}
Required Skills: ${jdSkillsRequired.join(', ')}

Evaluate this answer and return the JSON response.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    // Parse JSON response
    let evaluation;
    try {
      evaluation = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      // Return default evaluation
      evaluation = {
        accuracy: 50,
        clarity: 50,
        depth: 50,
        relevance: 50,
        feedback: 'Could not parse evaluation. Please try again.',
        strengths: [],
        improvements: []
      };
    }

    // Calculate overall score with weights
    const breakdown = {
      accuracy: evaluation.accuracy,
      clarity: evaluation.clarity,
      depth: evaluation.depth,
      relevance: evaluation.relevance,
      timeEfficiency: timeEfficiencyScore
    };

    const overallScore = 
      (breakdown.accuracy * 0.30) +
      (breakdown.clarity * 0.20) +
      (breakdown.depth * 0.25) +
      (breakdown.relevance * 0.15) +
      (breakdown.timeEfficiency * 0.10);

    // Calculate time penalty
    const timePenalty = calculateTimePenalty(timeTaken, timeLimit);

    // Apply time penalty to final score
    const finalScore = Math.max(0, Math.min(100, overallScore + timePenalty));

    return {
      overallScore: finalScore,
      breakdown,
      timePenalty,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error('Failed to evaluate answer');
  }
}

/**
 * Parse resume using LLM
 */
function cleanLLMResponse(text: string): string {
  let cleaned = text

  // Remove all markdown code blocks - multiple patterns
  cleaned = cleaned
    .replace(/```json\s*[\s\S]*?\s*```/gi, '')
    .replace(/```javascript\s*[\s\S]*?\s*```/gi, '')
    .replace(/```\s*[\s\S]*?\s*```/gi, '')
    .replace(/```[\s\S]*?[\s\S]*``/g, '')
    .replace(/```[a-zA-Z]*\s*[\s\S]*?\s*```/g, '')

  // Remove any remaining markdown bold/italic markers
  cleaned = cleaned
    .replace(/\*\*[^*]*\*/g, '')
    .replace(/_([^_]+)_/g, '$1')

  // Trim whitespace
  cleaned = cleaned.trim()

  return cleaned
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const zai = await getZAI();

  const systemPrompt = `You are an expert resume parser. Extract structured information from resumes.
Return ONLY valid JSON with this structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "company name",
      "role": "role title",
      "duration": "duration (e.g., '2 years', 'Jan 2020 - Present')",
      "description": ["responsibility1", "responsibility2", ...]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "description",
      "technologies": ["tech1", "tech2"],
      "role": "role in project"
    }
  ],
  "education": [
    {
      "institution": "university/school name",
      "degree": "degree (e.g., BS, MS)",
      "field": "field of study",
      "year": "graduation year"
    }
  ],
  "certifications": ["cert1", "cert2", ...]
}

If information is not found, return empty arrays. Do NOT include any text outside JSON.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Parse this resume and extract the information:\n\n${resumeText}`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    const cleanJsonText = cleanLLMResponse(responseText);

    let parsed: ParsedResume;
    try {
      parsed = JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error('Failed to parse resume:', cleanJsonText);
      parsed = {
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: []
      };
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}

/**
 * Parse job description using LLM
 */
export async function parseJobDescription(jdText: string): Promise<ParsedJD> {
  const zai = await getZAI();

  const systemPrompt = `You are an expert job description parser. Extract structured information from JDs.
Return ONLY valid JSON with this structure:
{
  "title": "job title",
  "requirements": ["requirement1", "requirement2", ...],
  "skillsRequired": ["skill1", "skill2", ...],
  "experienceLevel": "Entry" | "Mid" | "Senior" | "Lead",
  "responsibilities": ["responsibility1", "responsibility2", ...],
  "keyCompetencies": ["competency1", "competency2", ...]
}

Determine experience level based on the JD content. If information is not found, return empty arrays. 
Do NOT include any text outside JSON.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Parse this job description and extract the information:\n\n${jdText}`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    const cleanJsonText = cleanLLMResponse(responseText);
    let parsed: ParsedJD;
    try {
      parsed = JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error('Failed to parse JD:', cleanJsonText);
      parsed = {
        title: '',
        requirements: [],
        skillsRequired: [],
        experienceLevel: 'Mid',
        responsibilities: [],
        keyCompetencies: []
      };
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing JD:', error);
    throw new Error('Failed to parse job description');
  }
}

/**
 * Calculate candidate fit score with JD
 */
export async function calculateFitScore(resume: ParsedResume, jd: ParsedJD): Promise<number> {
  const zai = await getZAI();

  const systemPrompt = `You are an expert recruiter. Evaluate candidate fit for a position.
Return ONLY a number from 0-100 representing the fit score.
Consider: skills match, experience level match, project relevance, education alignment.`;

  const userPrompt = `
Resume Summary:
Skills: ${resume.skills.join(', ')}
Experience: ${resume.experience.map(e => `${e.role} at ${e.company}`).join(', ')}
Education: ${resume.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join(', ')}

Job Description:
Title: ${jd.title}
Required Skills: ${jd.skillsRequired.join(', ')}
Experience Level: ${jd.experienceLevel}
Key Responsibilities: ${jd.responsibilities.join('; ')}

Evaluate the candidate's fit and return a score from 0-100. Just the number.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '50';
    const score = parseFloat(responseText);
    return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Error calculating fit score:', error);
    return 50; // Default score
  }
}

/**
 * Get category-specific instructions for question generation
 */
function getCategoryInstructions(category: QuestionCategory): string {
  const instructions = {
    Technical: `Generate technical questions that assess:
- Practical knowledge and coding abilities
- Framework and technology understanding
- Problem-solving skills
- Code quality and best practices
- System design capabilities`,

    Conceptual: `Generate conceptual questions that assess:
- Theoretical understanding
- Architectural concepts
- Design patterns and principles
- Technology trade-offs
- Fundamental concepts`,

    Behavioral: `Generate behavioral questions that assess:
- Problem-solving approach
- Team collaboration
- Leadership abilities
- Conflict resolution
- Communication skills`,

    Scenario: `Generate scenario-based questions that assess:
- Practical application of knowledge
- Real-world problem solving
- Decision-making under pressure
- Prioritization skills
- Customer/user focus`
  };

  return instructions[category] || instructions.Technical;
}

/**
 * Get evaluation prompt for different question categories
 */
function getEvaluationPrompt(category: QuestionCategory): string {
  const prompts = {
    Technical: `Evaluate technical answers on:
- Accuracy (30%): Correct terminology, concepts, and information
- Clarity (20%): Clear communication of technical concepts
- Depth (25%): Practical understanding, code quality, best practices
- Relevance (15%): Alignment with the question asked
- Time Efficiency (10%): Answer provided within time limits

Scoring Guide for Technical Questions:
- Correct terminology and concepts: up to 25 points
- Practical understanding: up to 25 points
- Code quality if applicable: up to 20 points
- Best practices mentioned: up to 15 points
- Completeness: up to 15 points`,

    Conceptual: `Evaluate conceptual answers on:
- Accuracy (30%): Correct theoretical understanding
- Clarity (20%): Clear explanation of concepts
- Depth (25%): Understanding of underlying principles
- Relevance (15%): Alignment with question
- Time Efficiency (10%): Answer within time limits`,

    Behavioral: `Evaluate behavioral answers on:
- Accuracy (30%): Use of STAR method (Situation, Task, Action, Result)
- Clarity (20%): Communication clarity
- Depth (25%): Specific examples and self-awareness
- Relevance (15%): Alignment with question
- Time Efficiency (10%): Answer within time limits

Scoring Guide for Behavioral Questions:
- STAR method usage: up to 25 points
- Specific examples: up to 25 points
- Self-awareness: up to 20 points
- Problem-solving approach: up to 20 points
- Communication clarity: up to 10 points`,

    Scenario: `Evaluate scenario-based answers on:
- Accuracy (30%): Appropriate solution to scenario
- Clarity (20%): Clear explanation of approach
- Depth (25%): Consideration of alternatives and trade-offs
- Relevance (15%): Alignment with scenario
- Time Efficiency (10%): Answer within time limits`
  };

  return prompts[category] || prompts.Technical;
}

/**
 * Calculate time efficiency score
 */
function calculateTimeEfficiency(timeTaken: number, timeLimit: number): number {
  if (timeTaken <= timeLimit) {
    // Full score if within time limit
    return 100;
  } else {
    // Linear decrease beyond time limit
    const overtime = timeTaken - timeLimit;
    const penalty = Math.min(100, (overtime / timeLimit) * 100);
    return Math.max(0, 100 - penalty);
  }
}

/**
 * Calculate time penalty
 */
function calculateTimePenalty(timeTaken: number, timeLimit: number): number {
  if (timeTaken <= timeLimit) {
    return 0;
  }

  const overtime = timeTaken - timeLimit;
  const penaltyIntervals = Math.floor(overtime / 10);
  const penalty = penaltyIntervals * 5;

  return Math.max(-20, Math.min(0, -penalty));
}

/**
 * Get time limit based on difficulty
 */
function getTimeLimit(difficulty: Difficulty): number {
  const limits = {
    Easy: 120,    // 2 minutes
    Medium: 180,  // 3 minutes
    Hard: 240     // 4 minutes
  };
  return limits[difficulty] || 180;
}
