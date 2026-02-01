/**
 * Interview Service
 * Main service coordinating all interview operations
 */

import { db } from '@/lib/db';
import { generateQuestion, evaluateAnswer, parseResume, parseJobDescription, calculateFitScore } from './llm.service';
import {
  determineNextDifficulty,
  determineQuestionCategory,
  checkTerminationConditions,
  calculatePerformanceMetrics,
  calculatePerformanceTrend,
  calculateRecommendation,
  calculateStrengthsAndWeaknesses,
  shouldContinueInterview,
  getQuestionBounds,
  getCategoryFromQuestion,
  normalizeScore,
  roundScore
} from './interview-engine.service';
import type {
  ParsedResume,
  ParsedJD,
  Question,
  EvaluationResult,
  FinalReportData,
  QuestionCategory,
  Difficulty
} from '../types/interview';

/**
 * Create a new user (or get existing one)
 */
export async function getOrCreateUser(email: string, name?: string) {
  let user = await db.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name
      }
    });
  }

  return user;
}

/**
 * Upload and parse resume
 */
export async function uploadResume(
  userId: string,
  fileName: string,
  resumeText: string
) {
  try {
    // Parse resume using LLM
    const parsedData = await parseResume(resumeText);

    // Store in database
    const resume = await db.resume.create({
      data: {
        userId,
        fileName,
        parsedData: JSON.stringify(parsedData),
        skills: JSON.stringify(parsedData.skills || []),
        experience: JSON.stringify(parsedData.experience || []),
        projects: JSON.stringify(parsedData.projects || []),
        education: JSON.stringify(parsedData.education || []),
        certifications: JSON.stringify(parsedData.certifications || [])
      }
    });

    return {
      success: true,
      resumeId: resume.id,
      data: parsedData
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw new Error('Failed to upload resume');
  }
}

/**
 * Upload and parse job description
 */
export async function uploadJobDescription(
  userId: string,
  title: string,
  jdText: string
) {
  try {
    // Parse JD using LLM
    const parsedData = await parseJobDescription(jdText);

    // Store in database
    const jd = await db.jobDescription.create({
      data: {
        userId,
        title,
        requirements: JSON.stringify(parsedData.requirements || []),
        skillsRequired: JSON.stringify(parsedData.skillsRequired || []),
        experienceLevel: parsedData.experienceLevel || 'Mid',
        responsibilities: JSON.stringify(parsedData.responsibilities || []),
        keyCompetencies: JSON.stringify(parsedData.keyCompetencies || [])
      }
    });

    return {
      success: true,
      jdId: jd.id,
      data: parsedData
    };
  } catch (error) {
    console.error('Error uploading job description:', error);
    throw new Error('Failed to upload job description');
  }
}

/**
 * Calculate initial fit score between resume and JD
 */
export async function calculateInitialFit(resumeId: string, jdId: string) {
  try {
    const resume = await db.resume.findUnique({
      where: { id: resumeId }
    });

    const jd = await db.jobDescription.findUnique({
      where: { id: jdId }
    });

    if (!resume || !jd) {
      throw new Error('Resume or Job Description not found');
    }

    const parsedResume: ParsedResume = JSON.parse(resume.parsedData);
    const parsedJD: ParsedJD = {
      title: jd.title,
      requirements: JSON.parse(jd.requirements),
      skillsRequired: JSON.parse(jd.skillsRequired),
      experienceLevel: jd.experienceLevel as any,
      responsibilities: JSON.parse(jd.responsibilities),
      keyCompetencies: JSON.parse(jd.keyCompetencies)
    };

    const fitScore = await calculateFitScore(parsedResume, parsedJD);

    // Update JD with fit score
    await db.jobDescription.update({
      where: { id: jdId },
      data: { initialFitScore: Math.round(fitScore) }
    });

    return {
      success: true,
      fitScore: Math.round(fitScore)
    };
  } catch (error) {
    console.error('Error calculating fit score:', error);
    throw new Error('Failed to calculate fit score');
  }
}

/**
 * Start a new interview session
 */
export async function startInterview(
  userId: string,
  resumeId: string,
  jdId: string
) {
  try {
    // Get resume and JD
    const resume = await db.resume.findUnique({
      where: { id: resumeId }
    });

    const jd = await db.jobDescription.findUnique({
      where: { id: jdId }
    });

    if (!resume || !jd) {
      throw new Error('Resume or Job Description not found');
    }

    // Create interview session
    const session = await db.interviewSession.create({
      data: {
        userId,
        resumeId,
        jobDescriptionId: jdId,
        status: 'InProgress',
        currentDifficulty: 'Medium',
        currentQuestionNumber: 0,
        startTime: new Date()
      }
    });

    return {
      success: true,
      sessionId: session.id,
      status: session.status,
      currentDifficulty: session.currentDifficulty,
      message: 'Interview session started successfully'
    };
  } catch (error) {
    console.error('Error starting interview:', error);
    throw new Error('Failed to start interview');
  }
}

/**
 * Get next question for the interview
 */
export async function getNextQuestion(sessionId: string) {
  try {
    // Get session
    const session = await db.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        resume: true,
        jobDescription: true,
        questions: {
          include: {
            answer: true
          },
          orderBy: {
            askedAt: 'asc'
          }
        }
      }
    });

    if (!session) {
      throw new Error('Interview session not found');
    }

    if (session.status !== 'InProgress') {
      throw new Error(`Interview is ${session.status}`);
    }

    // Get bounds
    const { max } = getQuestionBounds();

    // Check if max questions reached
    if (session.currentQuestionNumber >= max) {
      await endInterview(sessionId, 'Maximum questions reached');
      throw new Error('Interview completed. Maximum questions reached.');
    }

    // Parse resume and JD
    const parsedResume: ParsedResume = JSON.parse(session.resume.parsedData);
    const parsedJD: ParsedJD = {
      title: session.jobDescription.title,
      requirements: JSON.parse(session.jobDescription.requirements),
      skillsRequired: JSON.parse(session.jobDescription.skillsRequired),
      experienceLevel: session.jobDescription.experienceLevel as any,
      responsibilities: JSON.parse(session.jobDescription.responsibilities),
      keyCompetencies: JSON.parse(session.jobDescription.keyCompetencies)
    };

    // Get previous questions and scores
    const previousQuestions = session.questions.map(q => ({
      id: q.id,
      sessionId: q.sessionId,
      text: q.text,
      category: q.category as any,
      difficulty: q.difficulty as any,
      timeLimit: q.timeLimit,
      askedAt: q.askedAt
    }));

    const previousScores = session.questions
      .filter(q => q.answer)
      .map(q => q.answer!.score);

    const askedCategories = previousQuestions.map(q => q.category) as QuestionCategory[];

    // Determine next question category
    const nextCategory = determineQuestionCategory(askedCategories, session.currentQuestionNumber + 1);

    // Generate question using LLM
    const generatedQuestion = await generateQuestion({
      candidateSkills: parsedResume.skills,
      candidateExperience: parsedResume.experience,
      jdRequirements: parsedJD.requirements,
      jdSkillsRequired: parsedJD.skillsRequired,
      jdExperienceLevel: parsedJD.experienceLevel,
      currentDifficulty: session.currentDifficulty as Difficulty,
      questionCategory: nextCategory,
      previousQuestions,
      previousScores
    });

    // Save question to database
    const question = await db.question.create({
      data: {
        sessionId,
        text: generatedQuestion.text,
        category: generatedQuestion.category,
        difficulty: generatedQuestion.difficulty,
        timeLimit: generatedQuestion.timeLimit,
        askedAt: new Date()
      }
    });

    // Update session question number
    await db.interviewSession.update({
      where: { id: sessionId },
      data: { currentQuestionNumber: session.currentQuestionNumber + 1 }
    });

    return {
      success: true,
      question: {
        id: question.id,
        text: question.text,
        category: question.category,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
        questionNumber: session.currentQuestionNumber + 1
      }
    };
  } catch (error: any) {
    console.error('Error getting next question:', error);
    if (error.message.includes('Interview completed')) {
      throw error;
    }
    throw new Error('Failed to get next question');
  }
}

/**
 * Submit answer and get evaluation
 */
export async function submitAnswer(
  questionId: string,
  responseText: string,
  timeTaken: number
) {
  try {
    // Get question with session data
    const question = await db.question.findUnique({
      where: { id: questionId },
      include: {
        answer: true,
        session: {
          include: {
            resume: true,
            jobDescription: true,
            questions: {
              include: {
                answer: true
              }
            }
          }
        }
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.answer) {
      throw new Error('Answer already submitted for this question');
    }

    const session = question.session;

    // Parse resume and JD
    const parsedResume: ParsedResume = JSON.parse(session.resume.parsedData);
    const parsedJD: ParsedJD = {
      title: session.jobDescription.title,
      requirements: JSON.parse(session.jobDescription.requirements),
      skillsRequired: JSON.parse(session.jobDescription.skillsRequired),
      experienceLevel: session.jobDescription.experienceLevel as any,
      responsibilities: JSON.parse(session.jobDescription.responsibilities),
      keyCompetencies: JSON.parse(session.jobDescription.keyCompetencies)
    };

    // Get previous scores
    const previousScores = session.questions
      .filter(q => q.answer)
      .map(q => q.answer!.score);

    // Evaluate answer using LLM
    const evaluation = await evaluateAnswer({
      question: {
        id: question.id,
        sessionId: question.sessionId,
        text: question.text,
        category: question.category as any,
        difficulty: question.difficulty as any,
        timeLimit: question.timeLimit,
        askedAt: question.askedAt
      },
      answerText: responseText,
      timeTaken,
      timeLimit: question.timeLimit,
      questionCategory: question.category as any,
      candidateSkills: parsedResume.skills,
      jdSkillsRequired: parsedJD.skillsRequired
    });

    // Save answer to database
    const answer = await db.answer.create({
      data: {
        questionId,
        responseText,
        timeTaken,
        score: normalizeScore(evaluation.overallScore),
        accuracyScore: normalizeScore(evaluation.breakdown.accuracy),
        clarityScore: normalizeScore(evaluation.breakdown.clarity),
        depthScore: normalizeScore(evaluation.breakdown.depth),
        relevanceScore: normalizeScore(evaluation.breakdown.relevance),
        timeEfficiencyScore: normalizeScore(evaluation.breakdown.timeEfficiency),
        timePenalty: evaluation.timePenalty,
        evaluationBreakdown: JSON.stringify(evaluation.breakdown),
        feedback: evaluation.feedback
      }
    });

    // Determine next difficulty
    const nextDifficulty = determineNextDifficulty(
      session.currentDifficulty as Difficulty,
      evaluation.overallScore,
      session.currentQuestionNumber
    );

    // Update session difficulty
    await db.interviewSession.update({
      where: { id: session.id },
      data: { currentDifficulty: nextDifficulty }
    });

    // Check termination conditions
    const allScores = [...previousScores, evaluation.overallScore];
    const termination = checkTerminationConditions(
      allScores,
      session.startTime,
      new Date()
    );

    // Check if should continue
    const shouldContinue = shouldContinueInterview(
      session.currentQuestionNumber,
      allScores,
      session.startTime,
      new Date()
    );

    // End interview if needed
    if (!shouldContinue) {
      await endInterview(session.id, termination.reason || 'Interview completed');
    }

    return {
      success: true,
      evaluation: {
        overallScore: roundScore(evaluation.overallScore),
        breakdown: {
          accuracy: roundScore(evaluation.breakdown.accuracy),
          clarity: roundScore(evaluation.breakdown.clarity),
          depth: roundScore(evaluation.breakdown.depth),
          relevance: roundScore(evaluation.breakdown.relevance),
          timeEfficiency: roundScore(evaluation.breakdown.timeEfficiency)
        },
        timePenalty: evaluation.timePenalty,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        nextDifficulty,
        interviewComplete: !shouldContinue,
        terminationReason: termination.reason
      }
    };
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    throw new Error(error.message || 'Failed to submit answer');
  }
}

/**
 * Get interview status and performance metrics
 */
export async function getInterviewStatus(sessionId: string) {
  try {
    const session = await db.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            answer: true
          },
          orderBy: {
            askedAt: 'asc'
          }
        }
      }
    });

    if (!session) {
      throw new Error('Interview session not found');
    }

    // Get scores
    const scores = session.questions
      .filter(q => q.answer)
      .map(q => q.answer!.score);

    // Group scores by category
    const answersByCategory: Record<QuestionCategory, number[]> = {
      Technical: [],
      Conceptual: [],
      Behavioral: [],
      Scenario: []
    };

    session.questions.forEach(q => {
      if (q.answer) {
        const category = getCategoryFromQuestion(q);
        answersByCategory[category].push(q.answer!.score);
      }
    });

    // Calculate metrics
    const metrics = calculatePerformanceMetrics(
      session.currentQuestionNumber,
      scores,
      session.currentDifficulty as Difficulty,
      session.startTime,
      new Date(),
      answersByCategory
    );

    // Calculate performance trend
    const performanceTrend = calculatePerformanceTrend(scores);

    return {
      success: true,
      status: {
        sessionId: session.id,
        status: session.status,
        currentQuestionNumber: session.currentQuestionNumber,
        currentDifficulty: session.currentDifficulty,
        startTime: session.startTime,
        timeElapsed: metrics.timeElapsed,
        questionsAnswered: metrics.totalQuestionsAsked,
        averageScore: roundScore(metrics.averageScore),
        lastScores: metrics.lastScores,
        performanceTrend,
        skillBreakdown: metrics.skillBreakdown
      }
    };
  } catch (error) {
    console.error('Error getting interview status:', error);
    throw new Error('Failed to get interview status');
  }
}

/**
 * End interview and generate final report
 */
export async function endInterview(sessionId: string, reason?: string) {
  try {
    const session = await db.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            answer: true
          }
        },
        resume: true,
        jobDescription: true
      }
    });

    if (!session) {
      throw new Error('Interview session not found');
    }

    // Calculate total duration
    const endTime = new Date();
    const totalDuration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Get all scores
    const scores = session.questions
      .filter(q => q.answer)
      .map(q => q.answer!.score);

    if (scores.length === 0) {
      throw new Error('No answers to evaluate');
    }

    // Group scores by category
    const answersByCategory: Record<QuestionCategory, number[]> = {
      Technical: [],
      Conceptual: [],
      Behavioral: [],
      Scenario: []
    };

    session.questions.forEach(q => {
      if (q.answer) {
        const category = getCategoryFromQuestion(q);
        answersByCategory[category].push(q.answer!.score);
      }
    });

    // Calculate skill breakdown averages
    const technicalScore = calculateCategoryAverage(answersByCategory.Technical);
    const conceptualScore = calculateCategoryAverage(answersByCategory.Conceptual);
    const behavioralScore = calculateCategoryAverage(answersByCategory.Behavioral);
    const scenarioScore = calculateCategoryAverage(answersByCategory.Scenario);

    // Calculate time management score
    const timeEfficiencyScores = session.questions
      .filter(q => q.answer)
      .map(q => q.answer!.timeEfficiencyScore);
    const timeManagementScore = calculateCategoryAverage(timeEfficiencyScores);

    const skillBreakdown = {
      technical: roundScore(technicalScore),
      behavioral: roundScore(behavioralScore),
      conceptual: roundScore(conceptualScore),
      communication: roundScore(behavioralScore * 0.5 + scenarioScore * 0.5),
      timeManagement: roundScore(timeManagementScore)
    };

    // Calculate overall score
    const overallScore = roundScore(
      (technicalScore * 0.35) +
      (behavioralScore * 0.20) +
      (conceptualScore * 0.20) +
      (scenarioScore * 0.15) +
      (timeManagementScore * 0.10)
    );

    // Calculate performance trend
    const performanceTrend = calculatePerformanceTrend(scores);

    // Calculate recommendation
    const { recommendation, confidence } = calculateRecommendation(
      overallScore,
      performanceTrend,
      skillBreakdown
    );

    // Calculate strengths and weaknesses
    const { strengths, weaknesses } = calculateStrengthsAndWeaknesses(
      skillBreakdown,
      [] // feedbackItems would come from individual answers
    );

    // Create final report
    const finalReport = await db.finalReport.create({
      data: {
        sessionId,
        overallScore,
        technicalScore: skillBreakdown.technical,
        behavioralScore: skillBreakdown.behavioral,
        conceptualScore: skillBreakdown.conceptual,
        communicationScore: skillBreakdown.communication,
        timeManagementScore: skillBreakdown.timeManagement,
        performanceTrend,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        recommendation,
        recommendationConfidence: confidence,
        questionCount: session.questions.length,
        averageTimePerQuestion: Math.round(totalDuration / session.questions.length)
      }
    });

    // Update session status
    await db.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'Completed',
        endTime,
        totalDuration,
        earlyTerminationReason: reason
      }
    });

    return {
      success: true,
      report: {
        sessionId,
        overallScore,
        skillBreakdown,
        performanceTrend,
        strengths,
        weaknesses,
        recommendation,
        recommendationConfidence: Math.round(confidence),
        questionCount: session.questions.length,
        averageTimePerQuestion: Math.round(totalDuration / session.questions.length),
        totalDuration,
        generatedAt: finalReport.generatedAt
      }
    };
  } catch (error) {
    console.error('Error ending interview:', error);
    throw new Error('Failed to end interview');
  }
}

/**
 * Get final report
 */
export async function getFinalReport(sessionId: string) {
  try {
    const session = await db.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        finalReport: true
      }
    });

    if (!session) {
      throw new Error('Interview session not found');
    }

    if (!session.finalReport) {
      throw new Error('Final report not generated yet');
    }

    const report = {
      sessionId,
      overallScore: session.finalReport.overallScore,
      skillBreakdown: {
        technical: session.finalReport.technicalScore,
        behavioral: session.finalReport.behavioralScore,
        conceptual: session.finalReport.conceptualScore,
        communication: session.finalReport.communicationScore,
        timeManagement: session.finalReport.timeManagementScore
      },
      performanceTrend: session.finalReport.performanceTrend,
      strengths: JSON.parse(session.finalReport.strengths),
      weaknesses: JSON.parse(session.finalReport.weaknesses),
      recommendation: session.finalReport.recommendation,
      recommendationConfidence: Math.round(session.finalReport.recommendationConfidence),
      questionCount: session.finalReport.questionCount,
      averageTimePerQuestion: session.finalReport.averageTimePerQuestion,
      generatedAt: session.finalReport.generatedAt,
      sessionStatus: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      totalDuration: session.totalDuration
    };

    return {
      success: true,
      report
    };
  } catch (error) {
    console.error('Error getting final report:', error);
    throw new Error('Failed to get final report');
  }
}

/**
 * Calculate average for a category
 */
function calculateCategoryAverage(scores: number[]): number {
  if (scores.length === 0) {
    return 50; // Default neutral score
  }
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
