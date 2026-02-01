/**
 * Core types for the AI-Powered Mock Interview Platform
 */

// Difficulty levels
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Question categories with weights
export type QuestionCategory = 'Technical' | 'Conceptual' | 'Behavioral' | 'Scenario';
export const CATEGORY_WEIGHTS = {
  Technical: 0.40,    // 40%
  Conceptual: 0.25,  // 25%
  Behavioral: 0.20,  // 20%
  Scenario: 0.15     // 15%
};

// Interview session status
export type SessionStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Terminated';

// Experience levels
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead';

// Evaluation rubric components
export interface EvaluationRubric {
  accuracy: number;        // 30% weight - Correctness of information
  clarity: number;         // 20% weight - Communication effectiveness
  depth: number;           // 25% weight - Level of detail and understanding
  relevance: number;       // 15% weight - Alignment with question
  timeEfficiency: number;  // 10% weight - Response within time limit
}

// Evaluation result
export interface EvaluationResult {
  overallScore: number;            // 0-100
  breakdown: EvaluationRubric;
  timePenalty: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// Time limits based on difficulty
export const TIME_LIMITS = {
  Easy: 120,    // 2 minutes
  Medium: 180,  // 3 minutes
  Hard: 240     // 4 minutes
};

// Time penalty configuration
export const TIME_PENALTY_CONFIG = {
  penaltyInterval: 10,  // Apply penalty every 10 seconds overtime
  penaltyAmount: 5,     // -5 points per interval
  maxPenalty: 20,       // Maximum -20 points
  maxTimeMultiplier: 1.5  // Auto-submit at 150% of allocated time
};

// Performance trend
export type PerformanceTrend = 'Improving' | 'Declining' | 'Stable';

// Hiring recommendation
export type Recommendation = 'Ready' | 'Needs Practice' | 'Not Ready';

// Skill breakdown
export interface SkillBreakdown {
  technical: number;
  behavioral: number;
  conceptual: number;
  communication: number;
  timeManagement: number;
}

// Parsed resume data
export interface ParsedResume {
  skills: string[];
  experience: ExperienceEntry[];
  projects: Project[];
  education: EducationEntry[];
  certifications: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  description: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

// Parsed job description data
export interface ParsedJD {
  title: string;
  requirements: string[];
  skillsRequired: string[];
  experienceLevel: ExperienceLevel;
  responsibilities: string[];
  keyCompetencies: string[];
}

// Question generation request
export interface QuestionGenerationRequest {
  candidateSkills: string[];
  candidateExperience: ExperienceEntry[];
  jdRequirements: string[];
  jdSkillsRequired: string[];
  jdExperienceLevel: ExperienceLevel;
  currentDifficulty: Difficulty;
  previousQuestions: Question[];
  previousScores: number[];
  questionCategory: QuestionCategory;
}

// Generated question
export interface Question {
  id: string;
  sessionId: string;
  text: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  timeLimit: number;
  askedAt: Date;
}

// Answer submission
export interface AnswerSubmission {
  questionId: string;
  responseText: string;
  timeTaken: number;  // in seconds
}

// Answer evaluation request
export interface AnswerEvaluationRequest {
  question: Question;
  answerText: string;
  timeTaken: number;
  timeLimit: number;
  questionCategory: QuestionCategory;
  candidateSkills: string[];
  jdSkillsRequired: string[];
}

// Final report data
export interface FinalReportData {
  sessionId: string;
  overallScore: number;
  skillBreakdown: SkillBreakdown;
  performanceTrend: PerformanceTrend;
  strengths: string[];
  weaknesses: WeaknessWithFeedback[];
  recommendation: Recommendation;
  recommendationConfidence: number;
  questionCount: number;
  averageTimePerQuestion: number;
  generatedAt: Date;
}

export interface WeaknessWithFeedback {
  skill: string;
  feedback: string;
  improvement: string;
}

// Early termination conditions
export interface TerminationCondition {
  shouldTerminate: boolean;
  reason?: string;
  checkType?: 'LowAverageScore' | 'ConsecutiveLowScores' | 'MaxTimeExceeded' | 'UserRequested';
}

// Performance metrics
export interface PerformanceMetrics {
  currentQuestionNumber: number;
  totalQuestionsAsked: number;
  averageScore: number;
  currentDifficulty: Difficulty;
  timeElapsed: number;  // in seconds
  lastScores: number[];  // Last 3 scores
  skillBreakdown: Partial<SkillBreakdown>;
}
