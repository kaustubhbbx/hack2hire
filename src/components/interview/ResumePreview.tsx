'use client'

import { ParsedResume } from '@/store/interview-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, GraduationCap, Award, Code, Folder } from 'lucide-react'

interface ResumePreviewProps {
  data: ParsedResume
}

export function ResumePreview({ data }: ResumePreviewProps) {
  return (
    <div className="space-y-6">
      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-emerald-600" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      {data.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-slate-200 pl-4">
                <h4 className="font-semibold text-slate-900">{exp.role}</h4>
                <p className="text-sm text-slate-600 mb-2">{exp.company} • {exp.duration}</p>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {exp.description.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      {data.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-purple-600" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.projects.map((project, index) => (
              <div key={index} className="border-l-2 border-slate-200 pl-4">
                <h4 className="font-semibold text-slate-900">{project.name}</h4>
                <p className="text-sm text-slate-600 mb-2">{project.role}</p>
                <p className="text-sm text-slate-700 mb-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.education.map((edu, index) => (
              <div key={index} className="border-l-2 border-slate-200 pl-4">
                <h4 className="font-semibold text-slate-900">{edu.degree} in {edu.field}</h4>
                <p className="text-sm text-slate-600">{edu.institution} • {edu.year}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.certifications.map((cert, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <Award className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  {cert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
