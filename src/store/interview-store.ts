import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ParsedResume {
  skills: string[]
  experience: Array<{
    company: string
    role: string
    duration: string
    description: string[]
  }>
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    role: string
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    year: string
  }>
  certifications: string[]
}

export interface ParsedJD {
  title: string
  requirements: string[]
  skillsRequired: string[]
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead'
  responsibilities: string[]
  keyCompetencies: string[]
}

export interface InterviewAnswer {
  questionId: string
  responseText: string
  timeTaken: number
  score?: number
  feedback?: string
}

interface InterviewStore {
  // User info
  email: string | null
  name: string | null

  // Step 1: Resume
  resumeId: string | null
  resumeData: ParsedResume | null
  resumeFileName: string | null

  // Step 2: Job Description
  jdId: string | null
  jdData: ParsedJD | null
  fitScore: number | null

  // Step 3: Configuration
  sessionId: string | null

  // Interview state
  currentQuestionNumber: number
  totalQuestions: number
  currentQuestion: any | null
  answers: InterviewAnswer[]
  isInterviewActive: boolean
  isInterviewComplete: boolean

  // Results
  finalReport: any | null

  // Actions
  setEmail: (email: string) => void
  setName: (name: string) => void

  setResumeId: (id: string) => void
  setResumeData: (data: ParsedResume) => void
  setResumeFileName: (fileName: string) => void

  setJdId: (id: string) => void
  setJdData: (data: ParsedJD) => void
  setFitScore: (score: number) => void

  setSessionId: (id: string) => void

  setCurrentQuestion: (question: any) => void
  setCurrentQuestionNumber: (number: number) => void
  addAnswer: (answer: InterviewAnswer) => void
  setInterviewActive: (active: boolean) => void
  setInterviewComplete: (complete: boolean) => void

  setFinalReport: (report: any) => void

  reset: () => void
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      email: null,
      name: null,

      resumeId: null,
      resumeData: null,
      resumeFileName: null,

      jdId: null,
      jdData: null,
      fitScore: null,

      sessionId: null,

      currentQuestionNumber: 0,
      totalQuestions: 12,
      currentQuestion: null,
      answers: [],
      isInterviewActive: false,
      isInterviewComplete: false,

      finalReport: null,

      setEmail: (email) => set({ email }),
      setName: (name) => set({ name }),

      setResumeId: (resumeId) => set({ resumeId }),
      setResumeData: (resumeData) => set({ resumeData }),
      setResumeFileName: (resumeFileName) => set({ resumeFileName }),

      setJdId: (jdId) => set({ jdId }),
      setJdData: (jdData) => set({ jdData }),
      setFitScore: (fitScore) => set({ fitScore }),

      setSessionId: (sessionId) => set({ sessionId }),

      setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
      setCurrentQuestionNumber: (currentQuestionNumber) => set({ currentQuestionNumber }),
      addAnswer: (answer) => set((state) => ({
        answers: [...state.answers, answer]
      })),
      setInterviewActive: (isInterviewActive) => set({ isInterviewActive }),
      setInterviewComplete: (isInterviewComplete) => set({ isInterviewComplete }),

      setFinalReport: (finalReport) => set({ finalReport }),

      reset: () => set({
        email: null,
        name: null,
        resumeId: null,
        resumeData: null,
        resumeFileName: null,
        jdId: null,
        jdData: null,
        fitScore: null,
        sessionId: null,
        currentQuestionNumber: 0,
        currentQuestion: null,
        answers: [],
        isInterviewActive: false,
        isInterviewComplete: false,
        finalReport: null
      })
    }),
    {
      name: 'interview-storage',
      partialize: (state) => ({
        email: state.email,
        name: state.name,
        resumeId: state.resumeId,
        resumeData: state.resumeData,
        resumeFileName: state.resumeFileName,
        jdId: state.jdId,
        jdData: state.jdData,
        fitScore: state.fitScore,
        sessionId: state.sessionId,
        isInterviewActive: state.isInterviewActive,
        isInterviewComplete: state.isInterviewComplete,
        finalReport: state.finalReport
      })
    }
  )
)
