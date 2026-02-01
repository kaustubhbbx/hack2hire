/**
 * Interview Engine Service
 * Manages interview state, adaptive difficulty, early termination, and performance tracking
 */

import type {
  Difficulty,
  QuestionCategory,
  TerminationCondition,
  PerformanceMetrics,
  PerformanceTrend,
  Recommendation
} from '../types/interview';
import { TIME_LIMITS } from '../types/interview';

/**
 * Determine next difficulty level based on answer score
 * Strong answer (≥75) → increase difficulty
 * Weak answer (<50) → maintain or decrease difficulty
 * Moderate answer (50-74) → maintain difficulty
 */
export function determineNextDifficulty(
  currentDifficulty: Difficulty,
  answerScore: number,
  questionNumber: number
): Difficulty {
  const difficultyLevels: Difficulty[] = ['Easy', 'Medium', 'Hard'];
  const currentIndex = difficultyLevels.indexOf(currentDifficulty);

  // Don't increase difficulty in first 3 questions (warm-up period)
  if (questionNumber < 3) {
    if (answerScore < 50 && currentIndex > 0) {
      return difficultyLevels[currentIndex - 1];
    }
    return currentDifficulty;
  }

  // Strong answer → increase difficulty
  if (answerScore >= 75) {
    if (currentIndex < difficultyLevels.length - 1) {
      return difficultyLevels[currentIndex + 1];
    }
    return currentDifficulty;
  }

  // Weak answer → decrease difficulty
  if (answerScore < 50) {
    if (currentIndex > 0) {
      return difficultyLevels[currentIndex - 1];
    }
    return currentDifficulty;
  }

  // Moderate answer → maintain difficulty
  return currentDifficulty;
}

/**
 * Determine question category based on history and weights
 * Technical: 40%, Conceptual: 25%, Behavioral: 20%, Scenario: 15%
 */
export function determineQuestionCategory(
  askedCategories: QuestionCategory[],
  questionNumber: number
): QuestionCategory {
  const categories: QuestionCategory[] = ['Technical', 'Conceptual', 'Behavioral', 'Scenario'];
  const weights = { Technical: 0.40, Conceptual: 0.25, Behavioral: 0.20, Scenario: 0.15 };

  // Count asked categories
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = askedCategories.filter(c => c === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Calculate expected counts based on weights
  const expectedCounts = categories.map(cat => ({
    category: cat,
    expected: questionNumber * weights[cat],
    actual: categoryCounts[cat]
  }));

  // Find category with highest deviation from expected (under-represented)
  const deviations = expectedCounts.map(item => ({
    ...item,
    deviation: item.expected - item.actual
  }));

  // Sort by deviation (highest positive first)
  deviations.sort((a, b) => b.deviation - a.deviation);

  // Return category with highest positive deviation
  return deviations[0].category;
}

/**
 * Check early termination conditions
 * - Average score falls below 35% after 4 questions
 * - Consecutive 3 answers score below 40
 * - Total interview time exceeds 45 minutes
 */
export function checkTerminationConditions(
  scores: number[],
  startTime: Date,
  currentTime: Date,
  explicitRequest: boolean = false
): TerminationCondition {
  // Explicit termination request
  if (explicitRequest) {
    return {
      shouldTerminate: true,
      reason: 'Candidate requested termination',
      checkType: 'UserRequested'
    };
  }

  const questionCount = scores.length;
  const timeElapsed = (currentTime.getTime() - startTime.getTime()) / 1000; // seconds
  const maxInterviewTime = 45 * 60; // 45 minutes

  // Check max time exceeded
  if (timeElapsed > maxInterviewTime) {
    return {
      shouldTerminate: true,
      reason: 'Maximum interview time (45 minutes) exceeded',
      checkType: 'MaxTimeExceeded'
    };
  }

  // Check average score after 4 questions
  if (questionCount >= 4) {
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / questionCount;
    if (averageScore < 35) {
      return {
        shouldTerminate: true,
        reason: `Average score (${averageScore.toFixed(1)}) falls below 35% threshold`,
        checkType: 'LowAverageScore'
      };
    }
  }

  // Check consecutive 3 low scores
  if (questionCount >= 3) {
    const lastThreeScores = scores.slice(-3);
    const allBelowThreshold = lastThreeScores.every(score => score < 40);
    if (allBelowThreshold) {
      return {
        shouldTerminate: true,
        reason: 'Three consecutive answers scored below 40%',
        checkType: 'ConsecutiveLowScores'
      };
    }
  }

  // No termination condition met
  return {
    shouldTerminate: false
  };
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(
  currentQuestionNumber: number,
  scores: number[],
  currentDifficulty: Difficulty,
  startTime: Date,
  currentTime: Date,
  answersByCategory: Record<QuestionCategory, number[]>
): PerformanceMetrics {
  const timeElapsed = (currentTime.getTime() - startTime.getTime()) / 1000;
  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  // Calculate skill breakdown averages
  const skillBreakdown: any = {};
  Object.entries(answersByCategory).forEach(([category, categoryScores]) => {
    if (categoryScores.length > 0) {
      skillBreakdown[category.toLowerCase()] =
        categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
    }
  });

  return {
    currentQuestionNumber,
    totalQuestionsAsked: scores.length,
    averageScore,
    currentDifficulty,
    timeElapsed,
    lastScores: scores.slice(-3),
    skillBreakdown
  };
}

/**
 * Calculate performance trend
 */
export function calculatePerformanceTrend(scores: number[]): PerformanceTrend {
  if (scores.length < 3) {
    return 'Stable';
  }

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;

  if (difference > 10) {
    return 'Improving';
  } else if (difference < -10) {
    return 'Declining';
  } else {
    return 'Stable';
  }
}

/**
 * Calculate hiring recommendation
 */
export function calculateRecommendation(
  overallScore: number,
  performanceTrend: PerformanceTrend,
  skillBreakdown: any
): { recommendation: Recommendation; confidence: number } {
  let confidence = 75; // Base confidence

  // Adjust confidence based on trend
  if (performanceTrend === 'Improving') {
    confidence += 10;
  } else if (performanceTrend === 'Declining') {
    confidence -= 10;
  }

  // Determine recommendation based on score
  let recommendation: Recommendation;
  if (overallScore >= 75) {
    recommendation = 'Ready';
    confidence = Math.min(95, confidence);
  } else if (overallScore >= 50) {
    recommendation = 'Needs Practice';
    confidence = Math.min(90, confidence);
  } else {
    recommendation = 'Not Ready';
    confidence = Math.min(85, confidence);
  }

  // Adjust confidence based on score distribution
  const skillScores = Object.values(skillBreakdown).filter((v): v is number => typeof v === 'number');
  if (skillScores.length > 0) {
    const avgSkillScore = skillScores.reduce((sum, score) => sum + score, 0) / skillScores.length;
    const scoreVariance = Math.max(...skillScores) - Math.min(...skillScores);

    // High variance reduces confidence
    if (scoreVariance > 30) {
      confidence -= 15;
    }

    // If average skill score differs significantly from overall score
    if (Math.abs(avgSkillScore - overallScore) > 15) {
      confidence -= 10;
    }
  }

  // Ensure confidence is within bounds
  confidence = Math.max(40, Math.min(95, confidence));

  return { recommendation, confidence };
}

/**
 * Calculate strengths and weaknesses
 */
export function calculateStrengthsAndWeaknesses(
  skillBreakdown: any,
  feedbackItems: Array<{ skill: string; score: number; feedback: string }>
): { strengths: string[]; weaknesses: Array<{ skill: string; feedback: string; improvement: string }> } {
  // Convert skill breakdown to array and sort
  const sortedSkills = Object.entries(skillBreakdown)
    .map(([skill, score]) => ({ skill, score: score as number }))
    .sort((a, b) => b.score - a.score);

  // Top 3 strengths
  const strengths = sortedSkills.slice(0, 3).map(item => item.skill);

  // Bottom 3 weaknesses with feedback
  const weaknesses = sortedSkills
    .slice(-3)
    .reverse()
    .map(item => {
      const feedbackItem = feedbackItems.find(fi => fi.skill.toLowerCase() === item.skill.toLowerCase());
      return {
        skill: item.skill,
        feedback: feedbackItem?.feedback || `Performance in ${item.skill} needs improvement`,
        improvement: `Focus on improving ${item.skill} skills through practice and learning`
      };
    });

  return { strengths, weaknesses };
}

/**
 * Validate answer submission time
 */
export function validateAnswerTime(
  timeTaken: number,
  timeLimit: number
): { isValid: boolean; penalty: number; shouldAutoSubmit: boolean } {
  const maxTime = timeLimit * 1.5; // 150% of allocated time

  return {
    isValid: true,
    penalty: calculateTimePenalty(timeTaken, timeLimit),
    shouldAutoSubmit: timeTaken >= maxTime
  };
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
 * Get minimum and maximum question counts
 */
export function getQuestionBounds(): { min: number; max: number } {
  return {
    min: 8,
    max: 12
  };
}

/**
 * Check if interview should continue
 */
export function shouldContinueInterview(
  currentQuestionNumber: number,
  scores: number[],
  startTime: Date,
  currentTime: Date
): boolean {
  const bounds = getQuestionBounds();

  // Check if minimum questions reached
  if (currentQuestionNumber < bounds.min) {
    return true;
  }

  // Check if maximum questions reached
  if (currentQuestionNumber >= bounds.max) {
    return false;
  }

  // Check termination conditions
  const termination = checkTerminationConditions(scores, startTime, currentTime);
  return !termination.shouldTerminate;
}

/**
 * Calculate skill category from question
 */
export function getCategoryFromQuestion(question: any): QuestionCategory {
  return question.category || 'Technical';
}

/**
 * Normalize score to 0-100 range
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Round score to specified decimal places
 */
export function roundScore(score: number, decimals: number = 1): number {
  return Math.round(score * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
