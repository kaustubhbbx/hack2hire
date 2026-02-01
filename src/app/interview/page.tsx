'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useInterviewStore } from '@/store/interview-store'
import { Clock, Send, FastForward, Loader2, AlertCircle } from 'lucide-react'

export default function InterviewPage() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [lastEvaluation, setLastEvaluation] = useState<any>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [timeWarning, setTimeWarning] = useState(false)
  const [localStorageContent, setLocalStorageContent] = useState<string>('{}')

  const { resumeId, jdId, sessionId, email, setSessionId, setInterviewActive, setInterviewComplete } = useInterviewStore()

  // Get localStorage content on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const content = localStorage.getItem('interview-storage') || '{}'
      setLocalStorageContent(content)
    }
  }, [])

  // Log store state on mount
  useEffect(() => {
    console.log('[Interview Page] Store state on mount:', {
      resumeId,
      jdId,
      sessionId,
      email
    })
    console.log('[Interview Page] Full store:', useInterviewStore.getState())
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'Hard': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-700'
      case 'Behavioral': return 'bg-purple-100 text-purple-700'
      case 'Conceptual': return 'bg-cyan-100 text-cyan-700'
      case 'Scenario': return 'bg-orange-100 text-orange-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const fetchQuestion = useCallback(async () => {
    console.log('[Interview Page] fetchQuestion called, sessionId:', sessionId)
    if (!sessionId) {
      console.log('[Interview Page] No sessionId, returning')
      return
    }

    setIsLoading(true)
    try {
      console.log('[Interview Page] Calling next-question API')
      const response = await fetch(`/api/interview/next-question?sessionId=${sessionId}`)
      const result = await response.json()
      console.log('[Interview Page] next-question API response:', result)

      if (result.success) {
        console.log('[Interview Page] Setting current question:', result.data)
        if (!result.data) {
          console.error('[Interview Page] Question data is null/undefined:', result)
          alert('No question data received. Please try starting a new interview.')
          setIsLoading(false)
          router.push('/onboarding')
          return
        }
        setCurrentQuestion(result.data)
        setResponse('')
        setTimeLeft(result.data.timeLimit)
        setQuestionStartTime(Date.now())
        setTimeWarning(false)
      } else if (result.interviewComplete) {
        console.log('[Interview Page] Interview complete detected from API')
        setIsLoading(false)
        router.push('/results')
      } else {
        console.log('[Interview Page] Failed to fetch question:', result.error)
        alert('Failed to fetch question: ' + (result.error || 'Unknown error'))
        setIsLoading(false)
      }
    } catch (error) {
      console.error('[Interview Page] Failed to fetch question:', error)
      alert('Failed to fetch question. Please try again.')
      setIsLoading(false)
    }
  }, [sessionId])

  const submitAnswer = async () => {
    if (!currentQuestion || !response.trim()) return

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    setIsEvaluating(true)

    try {
      const apiResponse = await fetch('/api/interview/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          responseText: response,
          timeTaken
        })
      })

      const result = await apiResponse.json()
      if (result.success) {
        setLastEvaluation(result.data)
        setShowEvaluation(true)

        if (result.data.interviewComplete) {
          setTimeout(() => {
            setInterviewComplete(true)
            router.push('/results')
          }, 3000)
        } else {
          setTimeout(() => {
            setShowEvaluation(false)
            setLastEvaluation(null)
            fetchQuestion()
          }, 4000)
        }
      } else {
        alert('Failed to submit answer: ' + (result.error || 'Unknown error'))
        setIsEvaluating(false)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      alert('Failed to submit answer. Please try again.')
      setIsEvaluating(false)
    } finally {
      setIsEvaluating(false)
    }
  }

  const skipQuestion = () => {
    if (!currentQuestion) return
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)

    fetch('/api/interview/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: currentQuestion.id,
        responseText: 'Question skipped',
        timeTaken
      })
    }).then(async (response) => {
      const result = await response.json()
      if (result.success) {
        fetchQuestion()
      } else {
        alert('Failed to skip question: ' + (result.error || 'Unknown error'))
      }
    }).catch((error) => {
      console.error('Failed to skip question:', error)
      alert('Failed to skip question. Please try again.')
    })
  }

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showEvaluation && !isEvaluating) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLeft, showEvaluation, isEvaluating])

  // Time warning effect
  useEffect(() => {
    if (currentQuestion && !showEvaluation) {
      const warningThreshold = currentQuestion.timeLimit * 0.8
      setTimeWarning(timeLeft <= warningThreshold)
    }
  }, [timeLeft, currentQuestion, showEvaluation])

  // Auto-submit when time expires
  useEffect(() => {
    if (timeLeft === 0 && response.trim() && !showEvaluation && !isEvaluating) {
      submitAnswer()
    }
  }, [timeLeft, response, showEvaluation, isEvaluating])

  // Start interview
  useEffect(() => {
    const startInterview = async () => {
      console.log('[Interview Page] Attempting to start interview...')
      console.log('[Interview Page] Store state:', {
        resumeId,
        jdId,
        email
      })

      // Validate both IDs and email exist
      if (!resumeId || !jdId || !email) {
        console.log('[Interview Page] Missing required data:', { resumeId, jdId, email })
        alert('Please complete all onboarding steps before starting the interview.')
        setInterviewActive(false)
        return
      }

      // If we already have a session, just fetch the next question
      if (sessionId) {
        console.log('[Interview Page] Existing session found, fetching question')
        setInterviewActive(true)
        fetchQuestion()
        return
      }

      setIsLoading(true)

      try {
        console.log('[Interview Page] Calling start API with:', { email, resumeId, jdId })
        const response = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            resumeId,
            jdId
          })
        })

        const result = await response.json()

        console.log('[Interview Page] Start API response:', result)

        if (result.success) {
          console.log('[Interview Page] Setting session ID:', result.data.sessionId)
          setSessionId(result.data.sessionId)
          setInterviewActive(true)
          setTimeout(() => {
            console.log('[Interview Page] Fetching first question...')
            fetchQuestion()
          }, 500)
        } else {
          const errorMsg = result.error || 'Unknown error'
          console.error('[Interview Page] Start failed:', errorMsg)
          alert('Failed to start interview: ' + errorMsg + '\n\nPlease try again.')
        }
      } catch (error) {
        console.error('[Interview Page] Network error:', error)
        alert('Network error starting interview. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    startInterview()
  }, [resumeId, jdId, email])

  if (!sessionId && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
            <h2 className="text-xl font-semibold mb-2">Starting Interview</h2>
            <p className="text-slate-600">Preparing your questions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Interview Not Ready</h2>
            <p className="text-slate-600 mb-4">
              {sessionId ? 'No questions available for this interview session.' : 'Please complete the onboarding process first.'}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Session ID: {sessionId || 'None'}
            </p>
            <Button onClick={() => router.push('/onboarding')}>
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0
  const timeColor = timeWarning ? 'bg-red-500' : timePercentage < 50 ? 'bg-yellow-500' : 'bg-emerald-600'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Clock className={`h-5 w-5 ${timeWarning ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`} />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <Badge variant="outline" className="text-sm">
                Question {currentQuestion?.questionNumber || '-'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/results')}
            >
              End Interview
            </Button>
          </div>
          {/* Timer Progress Bar */}
          <div className="mt-4">
            <Progress value={timePercentage} className="h-2" />
            <div className={`h-1 transition-colors duration-300 ${timeColor}`} style={{ width: `${timePercentage}%` }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {!showEvaluation ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(currentQuestion?.category)}>
                          {currentQuestion?.category}
                        </Badge>
                        <Badge className={getDifficultyColor(currentQuestion?.difficulty)}>
                          {currentQuestion?.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl lg:text-2xl">
                        {currentQuestion?.text}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Your Answer
                      </label>
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your answer here..."
                        className="min-h-[300px] text-base resize-none"
                        disabled={isLoading || isEvaluating || timeLeft === 0}
                      />
                      <div className="flex justify-between mt-2 text-sm text-slate-600">
                        <span>{response.length} characters</span>
                        {timeWarning && (
                          <span className="text-red-600 font-medium animate-pulse">
                            ⚠️ Time is running out!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={submitAnswer}
                        disabled={!response.trim() || isEvaluating || isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={skipQuestion}
                        disabled={isEvaluating || isLoading}
                        className="h-12"
                      >
                        <FastForward className="mr-2 h-4 w-4" />
                        Skip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className={`
                      text-6xl font-bold mb-4
                      ${lastEvaluation?.overallScore >= 75 ? 'text-emerald-600' : 
                        lastEvaluation?.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'}
                    `}>
                      {Math.round(lastEvaluation?.overallScore || 0)}
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                      {lastEvaluation?.overallScore >= 75 ? 'Excellent!' :
                        lastEvaluation?.overallScore >= 50 ? 'Good job!' : 'Keep practicing!'}
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {lastEvaluation?.feedback || 'Processing your answer...'}
                    </p>
                    {lastEvaluation?.nextDifficulty && (
                      <Badge className={getDifficultyColor(lastEvaluation.nextDifficulty)} variant="outline">
                        Next: {lastEvaluation.nextDifficulty} Difficulty
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug Panel */}
        <div className="mt-8 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono">
          <h3 className="font-bold mb-2 text-lg">Debug Information</h3>
          <div className="space-y-2">
            <p><strong>Store State:</strong></p>
            <pre className="bg-slate-800 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(useInterviewStore.getState(), null, 2)}
            </pre>
            <p className="mt-4"><strong>LocalStorage 'interview-storage':</strong></p>
            <pre className="bg-slate-800 p-2 rounded overflow-auto max-h-64">
              {localStorageContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
