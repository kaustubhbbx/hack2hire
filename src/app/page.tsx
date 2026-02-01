'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Upload, Target, TrendingUp, FileText, Brain, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-slate-900">AI Interview</span>
          </div>
          <Link href="/onboarding">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Start Interview
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Powered by AI
          </Badge>
          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Master Your Next Interview with{' '}
            <span className="text-emerald-600">AI Simulation</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Practice with intelligent, adaptive questions tailored to your skills and the job you want.
            Get instant feedback and detailed performance analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700 h-14"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Your Mock Interview
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6 h-14"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          Why Choose AI Interview?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <Target className="h-12 w-12 text-emerald-600" />,
              title: 'Adaptive Difficulty',
              description: 'Questions adjust based on your performance, challenging you appropriately throughout the interview.'
            },
            {
              icon: <Brain className="h-12 w-12 text-blue-600" />,
              title: 'AI-Powered Analysis',
              description: 'Get detailed feedback on accuracy, clarity, depth, and relevance of your answers.'
            },
            {
              icon: <TrendingUp className="h-12 w-12 text-purple-600" />,
              title: 'Performance Insights',
              description: 'Identify strengths and weaknesses with actionable improvement recommendations.'
            }
          ].map((feature, index) => (
            <Card key={index} className="border-2 hover:border-emerald-300 transition-all h-full">
              <CardContent className="p-6">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-16 bg-slate-50 -mx-4 px-4 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: '1',
              icon: <Upload className="h-10 w-10 text-emerald-600" />,
              title: 'Upload Documents',
              description: 'Upload your resume and the job description. Our AI parses and analyzes them to create a personalized interview.'
            },
            {
              step: '2',
              icon: <FileText className="h-10 w-10 text-blue-600" />,
              title: 'Answer Questions',
              description: 'Face 8-12 adaptive questions across technical, behavioral, and scenario categories with time limits.'
            },
            {
              step: '3',
              icon: <CheckCircle2 className="h-10 w-10 text-purple-600" />,
              title: 'Get Results',
              description: 'Receive a comprehensive report with scores, strengths, weaknesses, and actionable feedback.'
            }
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="absolute -top-4 -left-4 text-8xl font-bold text-slate-200">
                {step.step}
              </div>
              <Card className="border-2 hover:border-emerald-300 transition-all pt-12">
                <CardContent className="p-6">
                  <div className="mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
              <p className="text-xl mb-8 text-emerald-50">
                Join thousands of candidates who improved their interview skills with AI Interview.
              </p>
              <Link href="/onboarding">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-10 py-6 h-14"
                >
                  Start Your Mock Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-slate-900">AI Interview</span>
            </div>
            <p className="text-slate-600 text-sm">
              © 2026 AI Interview Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
