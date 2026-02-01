'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FileUploaderProps {
  onFileSelect: (file: File, text: string) => void
  fileName?: string | null
  accept?: string
  maxSize?: number
  disabled?: boolean
}

export function FileUploader({
  onFileSelect,
  fileName = null,
  accept = '.txt,.pdf,.doc,.docx',
  maxSize = 5,
  disabled = false
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSize}MB limit` }
    }
    return { valid: true }
  }

  const readTextFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const readFile = async (file: File): Promise<string> => {
    const fileType = file.name.toLowerCase()
    
    // For PDF and DOCX files, try to read as text
    if (fileType.endsWith('.pdf') || fileType.endsWith('.docx')) {
      return await readTextFile(file)
    }
    
    // Text files - read normally
    return await readTextFile(file)
  }

  const handleFile = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setIsLoading(true)
    setLoadProgress(0)

    try {
      const text = await readFile(file)
      onFileSelect(file, text)
    } catch (error) {
      alert(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('File read error:', error)
    } finally {
      setIsLoading(false)
      setLoadProgress(0)
    }
  }, [onFileSelect, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const getFileTypeIcon = (fileName: string): string => {
    const type = fileName.toLowerCase()
    if (type.endsWith('.pdf')) { return '📄' }
    if (type.endsWith('.docx')) { return '📝' }
    return '📄'
  }

  return (
    <div className="w-full">
      <Card
        className={`
          border-2 transition-all cursor-pointer relative overflow-hidden
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-dashed'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-300'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={accept}
            onChange={handleFileInput}
            disabled={disabled || isLoading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-3 py-4">
                <Check className="h-8 w-8 text-emerald-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFileTypeIcon(fileName)}</span>
                    <p className="font-semibold text-slate-900 truncate flex-1">{fileName}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">File uploaded successfully</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onFileSelect(new File([''], ''), '')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-6xl mb-4">
                  📄
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  Processing your file...
                </p>
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {loadProgress}% complete
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`
                  mb-4 rounded-full p-4 transition-colors
                  ${isDragging ? 'bg-emerald-100' : 'bg-slate-100'}
                `}>
                  <Upload className={`h-16 w-16 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Supported formats: TXT, PDF, DOCX (Max {maxSize}MB)
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Text File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <span className="mr-2">📄</span>
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <span className="mr-2">📝</span>
                    Word (DOCX)
                  </Button>
                </div>
              </div>
            )}
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
