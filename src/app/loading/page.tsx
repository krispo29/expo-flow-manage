'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getStoredProjects, setSelectedProject, clearAuthStorage, type StoredProject } from '@/lib/auth-storage'

// Delay in milliseconds before redirect
const REDIRECT_DELAY = 2000

function LoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [progress, setProgress] = useState(0)

  // Get project info from sessionStorage - use useMemo to avoid useEffect issues
  const projectData = useMemo(() => {
    const projects = getStoredProjects()
    const projectId = searchParams.get('projectId')

    if (!projects || projects.length === 0 || !projectId) {
      return { projects: [], projectId: null, currentProject: null }
    }

    const currentProject = projects.find(p => p.project_uuid === projectId)
    return { 
      projects, 
      projectId, 
      currentProject: currentProject || null 
    }
  }, [searchParams])

  const { projectId, currentProject } = projectData

  useEffect(() => {
    // Redirect if no project data
    if (!projectId || !currentProject) {
      clearAuthStorage()
      router.push('/admin/projects')
      return
    }

    // Save selected project to sessionStorage
    setSelectedProject(projectId)

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, REDIRECT_DELAY / 10)

    // Set timeout for redirect
    const redirectTimeout = setTimeout(() => {
      setStatus('ready')
      // Small delay for animation before actual redirect
      setTimeout(() => {
        router.push(`/admin?projectId=${projectId}`)
      }, 500)
    }, REDIRECT_DELAY)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(redirectTimeout)
    }
  }, [router, projectId, currentProject])

  // Handle manual redirect button click
  const handleManualRedirect = () => {
    if (projectId) {
      router.push(`/admin?projectId=${projectId}`)
    } else {
      router.push('/admin/projects')
    }
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">Unable to load project data</p>
          <button
            onClick={handleManualRedirect}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              {status === 'ready' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Loader2 className="w-8 h-8 animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {status === 'ready' ? 'Ready!' : 'Loading Project'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {status === 'ready' 
                ? 'Redirecting to your project...' 
                : 'Preparing your workspace'}
            </p>
          </div>

          {/* Project Name */}
          {currentProject && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Project
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {currentProject.project_name}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">Progress</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {Math.min(progress, 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out rounded-full ${
                  status === 'ready' 
                    ? 'bg-emerald-500' 
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center">
            {status === 'loading' ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
                Please wait while we set up your environment...
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-medium">Redirecting now...</span>
              </div>
            )}
          </div>

          {/* Manual Skip Button */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleManualRedirect}
              className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Skip waiting →
            </button>
          </div>
        </div>

        {/* Branding */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Expo Flow Management System
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-slate-500 dark:text-slate-400 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoadingContent />
    </Suspense>
  )
}
