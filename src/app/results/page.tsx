'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useInterviewStore } from '@/store/interview-store'
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  Share2,
  RefreshCw,
  Home,
  Brain,
  MessageSquare,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react'

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const { sessionId, setInterviewActive } = useInterviewStore()

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) {
        window.location.href = '/'
        return
      }

      try {
        const response = await fetch(`/api/interview/report?sessionId=${sessionId}`)
        const result = await response.json()

        if (result.success) {
          setReport(result.data)
        }
      } catch (error: any) {
        console.error('Failed to fetch report:', error)
        if (error.message?.includes('not found') || error.message?.includes('not generated')) {
          setIsLoading(false)
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [sessionId])

  const getReadinessColor = (score: number) => {
    if (score >= 75) return { bg: 'bg-emerald-500', text: 'Interview Ready' }
    if (score >= 50) return { bg: 'bg-amber-500', text: 'Needs Practice' }
    return { bg: 'bg-red-500', text: 'Requires Preparation' }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving': return <TrendingUp className="h-5 w-5 text-emerald-600" />
      case 'Declining': return <TrendingDown className="h-5 w-5 text-red-600" />
      default: return <Minus className="h-5 w-5 text-slate-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Results</h2>
            <p className="text-slate-600">Generating your performance report...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
            <p className="text-slate-600 mb-4">
              Complete an interview to see your results.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const readiness = getReadinessColor(report.overallScore)
  const skillBreakdown = report.skillBreakdown || {}
  const strengths = report.strengths || []
  const weaknesses = report.weaknesses || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Performance Report</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className={`
            border-2 overflow-hidden
            ${report.overallScore >= 75 ? 'border-emerald-300' :
              report.overallScore >= 50 ? 'border-amber-300' : 'border-red-300'}
          `}>
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Circular Score */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 md:w-56 md:h-56">
                    {/* Outer ring */}
                    <div className={`
                      absolute inset-0 rounded-full border-8
                      ${readiness.bg}
                    `} />
                    {/* Inner circle */}
                    <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                      <div className={`text-6xl md:text-7xl font-bold ${getScoreColor(report.overallScore)}`}>
                        {Math.round(report.overallScore)}
                      </div>
                      <div className="text-slate-600 mt-2">Overall Score</div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex-1 space-y-6">
                  <div>
                    <Badge className={`${readiness.bg} text-white text-lg px-4 py-2`}>
                      {readiness.text}
                    </Badge>
                    <p className="text-slate-600 mt-3 text-lg">
                      Confidence: {Math.round(report.recommendationConfidence)}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(skillBreakdown.technical || 0)}`}>
                        {Math.round(skillBreakdown.technical || 0)}
                      </div>
                      <div className="text-sm text-slate-600">Technical</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(skillBreakdown.behavioral || 0)}`}>
                        {Math.round(skillBreakdown.behavioral || 0)}
                      </div>
                      <div className="text-sm text-slate-600">Behavioral</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(skillBreakdown.communication || 0)}`}>
                        {Math.round(skillBreakdown.communication || 0)}
                      </div>
                      <div className="text-sm text-slate-600">Communication</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(skillBreakdown.timeManagement || 0)}`}>
                        {Math.round(skillBreakdown.timeManagement || 0)}
                      </div>
                      <div className="text-sm text-slate-600">Time Mgmt</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-lg">
                    {getTrendIcon(report.performanceTrend)}
                    <span className="text-slate-900 font-medium">
                      Performance: {report.performanceTrend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-900 capitalize">{strength}</div>
                      </div>
                    </div>
                  ))}
                  {strengths.length === 0 && (
                    <p className="text-slate-600 text-center py-4">
                      Keep practicing to identify your strengths!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weaknesses.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 mb-1 capitalize">{item.skill}</div>
                        <p className="text-sm text-slate-600">{item.feedback || item.improvement}</p>
                      </div>
                    </div>
                  ))}
                  {weaknesses.length === 0 && (
                    <p className="text-slate-600 text-center py-4">
                      Great job! No major weaknesses detected.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Skill Breakdown Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Skill Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'technical', label: 'Technical Skills', icon: <Brain className="h-5 w-5" /> },
                  { key: 'behavioral', label: 'Behavioral Skills', icon: <MessageSquare className="h-5 w-5" /> },
                  { key: 'communication', label: 'Communication', icon: <MessageSquare className="h-5 w-5" /> },
                  { key: 'timeManagement', label: 'Time Management', icon: <Clock className="h-5 w-5" /> }
                ].map((skill) => (
                  <div key={skill.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        {skill.icon}
                        {skill.label}
                      </div>
                      <span className={`font-bold ${getScoreColor(skillBreakdown[skill.key] || 0)}`}>
                        {Math.round(skillBreakdown[skill.key] || 0)}%
                      </span>
                    </div>
                    <Progress value={skillBreakdown[skill.key] || 0} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interview Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Interview Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {report.questionCount}
                  </div>
                  <div className="text-sm text-slate-600">Questions Answered</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {Math.round(report.averageTimePerQuestion / 60)}:{(report.averageTimePerQuestion % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-slate-600">Avg Time/Question</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {Math.round(report.totalDuration / 60)}
                  </div>
                  <div className="text-sm text-slate-600">Total Duration (min)</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className={`text-3xl font-bold mb-1 ${getScoreColor(report.overallScore)}`}>
                    {Math.round(report.overallScore)}
                  </div>
                  <div className="text-sm text-slate-600">Final Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={() => {
              setInterviewActive(false)
              window.location.href = '/'
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Retake Interview
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setInterviewActive(false)
              window.location.href = '/onboarding'
            }}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Try Different Role
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
