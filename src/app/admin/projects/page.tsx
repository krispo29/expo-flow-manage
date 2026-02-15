'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProjects, createProject } from '@/app/actions/project'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Folder, Calendar, ArrowRight, LayoutGrid, Activity, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'

type Project = {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchProjects() {
      const result = await getProjects()
      if (result.success && result.projects) {
        setProjects(result.projects)
      }
      setLoading(false)
    }
    fetchProjects()
  }, [])

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = await createProject(formData)
    
    if (result.success && result.project) {
      setProjects([result.project, ...projects])
      setIsCreateOpen(false)
    }
  }

  function handleSelectProject(projectId: string) {
    router.push(`/admin?projectId=${projectId}`)
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Workspace</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Select a project to manage or create a new one.
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all h-12 px-6">
                  <Plus className="mr-2 h-5 w-5" /> 
                  Create New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New Project</DialogTitle>
                  <DialogDescription>
                    Organize your events and data by creating a dedicated project.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input id="name" name="name" placeholder="e.g., ILDEX Vietnam 2026" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Short Description</Label>
                      <Input id="description" name="description" placeholder="Optional context for this event" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full">Initialize Project</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-primary/5 border-primary/10 shadow-none">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <LayoutGrid className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/10 shadow-none">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Activity className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Events</p>
                  <p className="text-2xl font-bold">{projects.length > 0 ? 1 : 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-none">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Upcoming</p>
                  <p className="text-2xl font-bold">{projects.length > 1 ? projects.length - 1 : 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search projects..." 
              className="pl-10 h-11 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 px-4 gap-2 hidden sm:flex">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-[160px] bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Folder className="size-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              {(() => {
                if (searchQuery) return "No projects match your current search criteria."
                return "You haven't created any projects yet. Get started by clicking the button above."
              })()}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="group relative overflow-hidden cursor-pointer border-transparent dark:hover:border-slate-700 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900"
                onClick={() => handleSelectProject(project.id)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <Folder className="size-6" />
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter opacity-60">
                      ID: {project.id.slice(0, 8)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                    {project.description || 'No description provided for this project.'}
                  </CardDescription>
                </CardHeader>
                <Separator className="mx-6 w-auto" />
                <CardFooter className="p-6 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="size-3" />
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    Manage
                    <ArrowRight className="size-4" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ children, variant = 'default', className = '' }: Readonly<{ children: React.ReactNode, variant?: 'default' | 'outline', className?: string }>) {
  const styles = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}

function CardFooter({ children, className = '' }: Readonly<{ children: React.ReactNode, className?: string }>) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}
