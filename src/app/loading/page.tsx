'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, LayoutDashboard, Cpu, Sparkles, AlertCircle } from 'lucide-react'
import { getStoredProjects, setSelectedProject, clearAuthStorage } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Delay in milliseconds before redirect
const REDIRECT_DELAY = 2000

function LoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [progress, setProgress] = useState(0)

  // Get project info from sessionStorage
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md glass p-10 rounded-[2.5rem] border-red-500/20 text-center space-y-6">
          <div className="p-4 bg-red-500/10 rounded-3xl inline-flex border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-black text-foreground">Pipeline Error</h1>
            <p className="text-muted-foreground font-medium italic text-sm">Unable to load project metadata from the core database.</p>
          </div>
          <Button
            onClick={handleManualRedirect}
            className="w-full btn-aurora h-14 rounded-2xl font-bold shadow-lg"
          >
            Return to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-1000">
        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden">
          {/* Logo / Header */}
          <div className="text-center mb-10 space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className={cn(
                "relative flex items-center justify-center w-20 h-20 rounded-[2rem] border-2 transition-all duration-700",
                status === 'ready' 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                  : "bg-primary/10 border-primary/20 text-primary"
              )}>
                {status === 'ready' ? (
                  <CheckCircle2 className="w-10 h-10 animate-in zoom-in duration-500" />
                ) : (
                  <Loader2 className="w-10 h-10 animate-spin" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-display font-black tracking-tight text-foreground">
                {status === 'ready' ? 'Ready!' : 'Initializing'}
              </h1>
              <p className="text-muted-foreground font-medium italic text-sm">
                {status === 'ready' 
                  ? 'Accessing project dashboard...' 
                  : 'Synthesizing workspace environment...'}
              </p>
            </div>
          </div>

          {/* Project Details */}
          {currentProject && (
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 flex items-center gap-4 transition-all hover:bg-white/10 group">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-0.5">Active Project</p>
                <p className="text-lg font-bold text-foreground truncate leading-none">
                  {currentProject.project_name}
                </p>
              </div>
            </div>
          )}

          {/* Progress Architecture */}
          <div className="mb-10 space-y-4">
            <div className="flex items-end justify-between px-1">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Integrity Check</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-xs font-bold opacity-60">Database Linkage</span>
                </div>
              </div>
              <span className="text-2xl font-display font-black text-primary">
                {Math.min(progress, 100)}%
              </span>
            </div>
            <div className="h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className={cn(
                  "h-full transition-all duration-500 ease-out rounded-full relative overflow-hidden",
                  status === 'ready' 
                    ? 'bg-emerald-500 shadow-glow-sm' 
                    : 'bg-primary shadow-glow-sm'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>

          {/* Direct Controls */}
          <div className="space-y-4">
            {status === 'ready' ? (
              <div className="flex items-center justify-center gap-2 text-emerald-500 animate-in slide-in-from-bottom-2">
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-black uppercase tracking-widest">Entry Granted</span>
              </div>
            ) : (
              <p className="text-center text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] animate-pulse">
                Decrypting Protocol Data
              </p>
            )}

            <div className="pt-6 border-t border-white/5">
              <button
                onClick={handleManualRedirect}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group"
              >
                <span>Bypass Wait</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* System Branding */}
        <div className="mt-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 opacity-20">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Expo Flow v2.5</span>
            </div>
            <p className="text-[9px] font-medium text-muted-foreground/40 italic">Secure Operational Intelligence Interface</p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <span className="text-xs font-black uppercase tracking-[0.3em] opacity-20">Initializing Tools</span>
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
