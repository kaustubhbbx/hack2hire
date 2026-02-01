'use client'

import { ParsedJD } from '@/store/interview-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Target, Brain, Award, FileText } from 'lucide-react'

interface JDPreviewProps {
  data: ParsedJD
  fitScore?: number
  candidateSkills?: string[]
}

export function JDPreview({ data, fitScore, candidateSkills }: JDPreviewProps) {
  // Calculate skill gap
  const skillGap = candidateSkills 
    ? data.skillsRequired.filter(skill => 
        !candidateSkills.some(cs => 
          cs.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(cs.toLowerCase())
        )
      )
    : []

  const matchedSkills = candidateSkills
    ? data.skillsRequired.filter(skill => 
        candidateSkills.some(cs => 
          cs.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(cs.toLowerCase())
        )
      )
    : []

  const skillMatchPercentage = data.skillsRequired.length > 0
    ? Math.round((matchedSkills.length / data.skillsRequired.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Job Title & Fit Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            {data.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fitScore !== undefined && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Candidate-JD Match
                  </span>
                  <Badge className={`
                    text-lg px-4 py-1
                    ${fitScore >= 75 ? 'bg-emerald-600 text-white' :
                      fitScore >= 50 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}
                  `}>
                    {fitScore}%
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Experience Level
                </span>
                <Badge variant="outline">{data.experienceLevel}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Analysis */}
      {data.skillsRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Skills Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Matched Skills */}
            {matchedSkills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-emerald-700 mb-2">
                  ✅ Matched Skills ({matchedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill, index) => (
                    <Badge key={index} className="bg-emerald-100 text-emerald-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {skillGap.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-amber-700 mb-2">
                  ⚠️ Skill Gaps ({skillGap.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skillGap.map((skill, index) => (
                    <Badge key={index} className="bg-amber-100 text-amber-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Focus on these skills to improve your match percentage.
                </p>
              </div>
            )}

            {/* Skill Match Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Skill Match
                </span>
                <span className={`font-bold ${skillMatchPercentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {skillMatchPercentage}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`
                      h-full transition-all duration-500
                      ${skillMatchPercentage >= 70 ? 'bg-emerald-500' :
                        skillMatchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                    `}
                    style={{ width: `${skillMatchPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Skills */}
      {data.skillsRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Required Skills ({data.skillsRequired.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skillsRequired.map((skill, index) => {
                const isMatched = matchedSkills.includes(skill)
                return (
                  <Badge 
                    key={index} 
                    className={isMatched ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}
                  >
                    {isMatched ? '✓ ' : '✗ '}
                    {skill}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsibilities */}
      {data.responsibilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-600" />
              Key Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <Award className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  {resp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Competencies */}
      {data.keyCompetencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Key Competencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.keyCompetencies.map((comp, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {comp}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
