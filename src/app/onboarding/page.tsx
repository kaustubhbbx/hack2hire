'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileUploader } from '@/components/interview/FileUploader'
import { ResumePreview } from '@/components/interview/ResumePreview'
import { JDPreview } from '@/components/interview/JDPreview'
import { useInterviewStore, ParsedJD } from '@/store/interview-store'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  Play
} from 'lucide-react'

// Pre-defined Engineering roles
const ENGINEERING_ROLES = [
  { title: 'Software Engineer', level: 'Mid', description: 'Full-stack development' },
  { title: 'Senior Frontend Engineer', level: 'Senior', description: 'React/Next.js specialist' },
  { title: 'Backend Engineer', level: 'Mid', description: 'Node.js/Python/Java' },
  { title: 'Full Stack Developer', level: 'Mid', description: 'Frontend + Backend' },
  { title: 'DevOps Engineer', level: 'Senior', description: 'CI/CD & Infrastructure' },
  { title: 'Data Engineer', level: 'Mid', description: 'ETL & Pipelines' },
  { title: 'Machine Learning Engineer', level: 'Senior', description: 'ML & AI Systems' },
  { title: 'Cloud Architect', level: 'Lead', description: 'AWS/GCP/Azure Design' },
  { title: 'Mobile Developer', level: 'Mid', description: 'iOS/Android Development' },
  { title: 'QA Engineer', level: 'Mid', description: 'Testing & Automation' }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)

  // Step 2: JD
  const [jdInputMethod, setJdInputMethod] = useState<'upload' | 'paste'>('paste')
  const [jdFileName, setJdFileName] = useState<string | null>(null)
  const [jdText, setJdText] = useState('')
  const [jdData, setJdData] = useState<ParsedJD | null>(null)
  const [selectedRole, setSelectedRole] = useState<any>(null)

  // Step 3: Configuration
  const [questionCount, setQuestionCount] = useState(10)
  const [difficultyMode, setDifficultyMode] = useState<'adaptive' | 'easy' | 'medium' | 'hard'>('adaptive')

  const [isLoading, setIsLoading] = useState(false)
  const [fitScore, setFitScore] = useState<number | null>(null)
  const [localStorageContent, setLocalStorageContent] = useState<string>('{}')

  const {
    setResumeId,
    setResumeData: setStoreResumeData,
    setEmail: setStoreEmail,
    setName: setStoreName,
    setJdId,
    setJdData: setStoreJdData,
    setFitScore: setStoreFitScore,
    sessionId
  } = useInterviewStore()

  // Get localStorage content on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const content = localStorage.getItem('interview-storage') || '{}'
      setLocalStorageContent(content)
    }
  }, [step])

  const store = useInterviewStore.getState()

  // Handle resume upload
  const handleResumeFile = async (file: File, text: string) => {
    console.log('[Onboarding] handleResumeFile called:', { fileName: file.name, textLength: text.length })

    if (file.name === '') {
      setResumeFileName(null)
      setResumeText('')
      setResumeData(null)
      return
    }

    setResumeFileName(file.name)
    setResumeText(text)
    setIsLoading(true)

    try {
      console.log('[Onboarding] Calling upload-resume API with email:', email)
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          fileName: file.name,
          resumeText: text
        })
      })

      const result = await response.json()
      console.log('[Onboarding] upload-resume API response:', result)

      if (result.success) {
        setResumeData(result.data.parsedData)
        setResumeId(result.data.resumeId)
        setStoreEmail(email)
        setStoreName(name)
        console.log('[Onboarding] Store updated with:', {
          resumeId: result.data.resumeId,
          email: email,
          storeEmail: useInterviewStore.getState().email
        })
      } else {
        alert('Failed to parse resume: ' + result.error)
      }
    } catch (error) {
      console.error('[Onboarding] upload-resume error:', error)
      alert('Failed to upload resume. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle JD upload
  const handleJDFile = async (file: File, text: string) => {
    console.log('[Onboarding] handleJDFile called:', { file: file.name, textLength: text.length, email })

    if (file.name === '') {
      setJdFileName(null)
      setJdText('')
      setJdData(null)
      return
    }

    // Validate email is present
    if (!email || !email.includes('@')) {
      alert('Please provide your email address in Step 1 before uploading job description.')
      return
    }

    // Validate text is not empty
    if (!text || text.trim().length === 0) {
      alert('Job description text is empty. Please provide a valid job description.')
      return
    }

    setJdFileName(file.name)
    setJdText(text)
    setIsLoading(true)

    try {
      const title = text.split('\n')[0].substring(0, 100) || 'Job Description'
      console.log('[Onboarding] Calling upload-jd API with:', { email, title, jdTextLength: text.length })

      const response = await fetch('/api/upload-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          title,
          jdText: text
        })
      })

      const result = await response.json()
      console.log('[Onboarding] upload-jd API response:', result)

      if (result.success) {
        setJdData(result.data.parsedData)
        setJdId(result.data.jdId)
        console.log('[Onboarding] Store updated with JD:', {
          jdId: result.data.jdId,
          storeJdId: useInterviewStore.getState().jdId,
          jdData: result.data.parsedData
        })
      } else {
        console.error('[Onboarding] upload-jd API error:', result.error)
        alert('Failed to parse JD: ' + result.error)
      }
    } catch (error) {
      console.error('[Onboarding] upload-jd network error:', error)
      alert('Failed to upload job description. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate fit score when both resume and JD are ready
  useEffect(() => {
    const calculateFit = async () => {
      if (resumeData && jdData) {
        try {
          const response = await fetch('/api/upload-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              fileName: 'fit-calculation',
              resumeText: JSON.stringify(resumeData)
            })
          })
          // For now, estimate fit score based on skill overlap
          const skillOverlap = resumeData.skills.filter((skill: string) =>
            jdData.skillsRequired.some((reqSkill: string) =>
              skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
              reqSkill.toLowerCase().includes(skill.toLowerCase())
            )
          ).length
          
          const fitPercentage = jdData.skillsRequired.length > 0
            ? Math.round((skillOverlap / jdData.skillsRequired.length) * 100)
            : 50
          
          setFitScore(fitPercentage)
          setStoreFitScore(fitPercentage)
        } catch (error) {
          console.error('Fit calculation error:', error)
        }
      }
    }

    calculateFit()
  }, [resumeData, jdData])

  // Select pre-defined role
  const selectRole = (role: any) => {
    setSelectedRole(role)
    setJdData({
      title: role.title,
      requirements: [
        `${role.level} level position in ${role.description}`,
        'Strong problem-solving and analytical skills',
        'Experience with modern development practices',
        'Excellent communication and teamwork abilities'
      ],
      skillsRequired: getSkillsForRole(role.title),
      experienceLevel: role.level as any,
      responsibilities: [
        'Design and implement scalable solutions',
        'Collaborate with cross-functional teams',
        'Participate in code reviews and architecture decisions',
        'Mentor junior developers',
        'Optimize application performance'
      ],
      keyCompetencies: [
        'Technical Excellence',
        'Problem Solving',
        'Communication',
        'Leadership',
        'Adaptability'
      ]
    })
  }

  // Get skills for a role
  const getSkillsForRole = (roleTitle: string): string[] => {
    const roleSkills: Record<string, string[]> = {
      'Software Engineer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'REST APIs'],
      'Senior Frontend Engineer': ['React', 'Next.js', 'TypeScript', 'CSS/Tailwind', 'State Management', 'Performance Optimization'],
      'Backend Engineer': ['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'API Design'],
      'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'CI/CD', 'AWS'],
      'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS/GCP', 'CI/CD', 'Terraform', 'Monitoring'],
      'Data Engineer': ['Python', 'SQL', 'ETL', 'Airflow', 'Apache Spark', 'Data Warehousing'],
      'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'Statistics', 'Data Science'],
      'Cloud Architect': ['AWS', 'GCP', 'Azure', 'System Design', 'Security', 'Cost Optimization'],
      'Mobile Developer': ['React Native', 'Swift', 'Kotlin', 'Mobile UX', 'App Store Deployment'],
      'QA Engineer': ['Selenium', 'Cypress', 'Test Automation', 'CI/CD', 'API Testing', 'Bug Tracking']
    }
    return roleSkills[roleTitle] || ['JavaScript', 'Python', 'SQL', 'Git']
  }

  const handleContinue = async () => {
    console.log('[Onboarding] handleContinue called, step:', step)

    if (step === 3) {
      // Start interview
      console.log('[Onboarding] Attempting to start interview...')
      console.log('[Onboarding] Current state:', {
        email,
        resumeData: !!resumeData,
        jdData: !!jdData
      })
      console.log('[Onboarding] Store state before navigation:', {
        resumeId: useInterviewStore.getState().resumeId,
        jdId: useInterviewStore.getState().jdId,
        email: useInterviewStore.getState().email
      })

      // Validate we have both IDs before starting
      const storeResumeId = useInterviewStore.getState().resumeId
      const storeJdId = useInterviewStore.getState().jdId
      const storeEmail = useInterviewStore.getState().email

      console.log('[Onboarding] Validation:', {
        hasResumeId: !!storeResumeId,
        hasJdId: !!storeJdId,
        hasEmail: !!storeEmail,
        resumeId: storeResumeId,
        jdId: storeJdId,
        email: storeEmail
      })

      if (!storeResumeId) {
        alert('Please upload your resume first (Step 1)')
        return
      }

      if (!storeJdId) {
        alert('Please select or upload a job description (Step 2)')
        return
      }

      if (!storeEmail) {
        alert('Please enter your email address (Step 1)')
        return
      }

      setIsLoading(true)

      try {
        console.log('[Onboarding] Calling interview start API...')
        const response = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: storeEmail,
            resumeId: storeResumeId,
            jdId: storeJdId
          })
        })

        const result = await response.json()
        console.log('[Onboarding] Interview start API response:', result)

        if (result.success) {
          console.log('[Onboarding] Interview started, redirecting to /interview')
          console.log('[Onboarding] Session ID:', result.data.sessionId)
          router.push('/interview')
        } else {
          const errorMsg = result.error || 'Unknown error'
          console.error('[Onboarding] Interview start failed:', errorMsg)
          alert('Failed to start interview: ' + errorMsg + '\n\nPlease try again.')
        }
      } catch (error) {
        console.error('[Onboarding] Error in handleContinue:', error)
        alert('Network error starting interview. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      console.log('[Onboarding] Moving to next step:', step + 1)
      setStep(step + 1)
    }
  }

  const canContinue = () => {
    if (step === 1) return resumeData !== null
    if (step === 2) return jdData !== null
    if (step === 3) return true
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => s < step && setStep(s)}
                      disabled={s > step || isLoading}
                      className={`
                        flex-1 h-2 rounded-full transition-all duration-300 relative
                        ${s <= step ? 'bg-emerald-600' : 'bg-slate-200'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium">
                        Step {s}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Resume Upload */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Upload Your Resume
                  </h1>
                  <p className="text-slate-600">
                    Upload your resume to get started. We'll extract your skills, experience, and projects.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>

                <FileUploader
                  fileName={resumeFileName}
                  onFileSelect={handleResumeFile}
                  disabled={!email || isLoading}
                  accept=".txt,.pdf,.doc,.docx"
                />

                {isLoading && step === 1 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                      <p className="text-slate-600">Parsing your resume with AI...</p>
                    </CardContent>
                  </Card>
                )}

                {resumeData && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                      ✓ Parsed Information
                    </h2>
                    <ResumePreview data={resumeData} />
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 2: Job Description */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Add Job Description
                  </h1>
                  <p className="text-slate-600">
                    Choose from engineering roles, paste JD text, or upload a file.
                  </p>
                </div>

                {/* Quick Role Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Quick Role Selection (Engineering)
                      </div>
                      {selectedRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(null)
                            setJdData(null)
                            setJdText('')
                            setJdFileName(null)
                          }}
                          disabled={isLoading}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Clear Selection
                        </Button>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Select a role below, or paste/upload your own job description.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {ENGINEERING_ROLES.map((role, index) => (
                        <button
                          key={index}
                          onClick={() => selectRole(role)}
                          disabled={isLoading}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-all
                            ${selectedRole?.title === role.title 
                              ? 'border-emerald-500 bg-emerald-50' 
                              : 'border-slate-200 hover:border-emerald-300 bg-white'}
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="text-sm font-medium text-slate-900 mb-1">
                            {role.title}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {role.level}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Input Method Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={jdInputMethod === 'paste' ? 'default' : 'outline'}
                        onClick={() => setJdInputMethod('paste')}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Paste Text
                      </Button>
                      <Button
                        variant={jdInputMethod === 'upload' ? 'default' : 'outline'}
                        onClick={() => setJdInputMethod('upload')}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                    </div>

                    {jdInputMethod === 'paste' ? (
                      <div>
                        <Label htmlFor="jd-text">Paste Job Description</Label>
                        <Textarea
                          id="jd-text"
                          placeholder="Paste the job description here..."
                          value={jdText}
                          onChange={(e) => {
                            setJdText(e.target.value)
                            // Clear role selection if user starts typing
                            if (selectedRole && e.target.value.trim() !== '') {
                              setSelectedRole(null)
                              setJdData(null)
                            }
                          }}
                          className="min-h-[200px]"
                          disabled={isLoading}
                        />
                        <Button
                          onClick={() => handleJDFile(new File([''], 'uploaded.txt'), jdText)}
                          disabled={!jdText.trim() || isLoading}
                          className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          Parse Job Description
                        </Button>
                      </div>
                    ) : (
                      <FileUploader
                        fileName={jdFileName}
                        onFileSelect={(file, text) => {
                          // Clear role selection if user uploads file
                          if (selectedRole && file.name !== '') {
                            setSelectedRole(null)
                            setJdData(null)
                          }
                          handleJDFile(file, text)
                        }}
                        disabled={isLoading}
                        accept=".txt,.pdf,.doc,.docx"
                      />
                    )}
                  </CardContent>
                </Card>

                {isLoading && step === 2 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                      <p className="text-slate-600">Parsing job description...</p>
                    </CardContent>
                  </Card>
                )}

                {jdData && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <JDPreview 
                      data={jdData} 
                      fitScore={fitScore || undefined}
                      candidateSkills={resumeData?.skills}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 3: Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Ready to Start
                  </h1>
                  <p className="text-slate-600">
                    Review your settings and start your mock interview.
                  </p>
                </div>

                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Resume Uploaded</p>
                        <p className="text-xs text-slate-600">
                          {resumeData?.skills.length} skills extracted
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Job Description</p>
                        <p className="text-xs text-slate-600">
                          {jdData?.title} • {jdData?.experienceLevel} Level
                        </p>
                      </div>
                    </div>

                    {fitScore !== null && (
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">Candidate Fit</p>
                          <p className={`text-xs font-bold ${fitScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {fitScore}% match
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Number of Questions</Label>
                      <div className="flex gap-2 mt-2">
                        {[8, 10, 12].map((num) => (
                          <Button
                            key={num}
                            variant={questionCount === num ? 'default' : 'outline'}
                            onClick={() => setQuestionCount(num)}
                            disabled={isLoading}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        More questions = more comprehensive evaluation
                      </p>
                    </div>

                    <div>
                      <Label>Difficulty Mode</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {[
                          { value: 'adaptive', label: 'Adaptive', icon: '🎯' },
                          { value: 'easy', label: 'Easy', icon: '🟢' },
                          { value: 'medium', label: 'Medium', icon: '🟡' },
                          { value: 'hard', label: 'Hard', icon: '🔴' }
                        ].map((mode) => (
                          <Button
                            key={mode.value}
                            variant={difficultyMode === mode.value ? 'default' : 'outline'}
                            onClick={() => setDifficultyMode(mode.value as any)}
                            disabled={isLoading}
                          >
                            <span className="mr-1">{mode.icon}</span>
                            {mode.label}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Adaptive mode adjusts difficulty based on your performance
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Estimated Duration</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        ~{Math.round(questionCount * 3.5)} minutes
                      </p>
                      <p className="text-xs text-slate-600">
                        Based on {questionCount} questions with 2-4 min per question
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Start Button */}
                <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0">
                  <CardContent className="p-8 text-center">
                    <Button
                      size="lg"
                      onClick={handleContinue}
                      disabled={isLoading}
                      className="bg-white text-emerald-700 hover:bg-emerald-50 text-xl px-12 py-6 h-16"
                    >
                      <Play className="mr-3 h-6 w-6" />
                      Start Interview Now
                      {isLoading && <Loader2 className="ml-3 h-5 w-5 animate-spin" />}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {step === 3 ? 'Start Interview' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>

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
