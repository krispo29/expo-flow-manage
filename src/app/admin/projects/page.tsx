'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProjects, createProject } from '@/app/actions/project'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Folder } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

// Define Project type locally since we might not have the Prisma type available on client easily without importing
type Project = {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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
    // In a real app, you might save this to Zustand or Context
    console.log('Selected Project:', projectId, 'User:', user?.username)
    router.push(`/admin?projectId=${projectId}`)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Select Project</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to manage.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" name="description" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading projects...</p>
        ) : (
          projects.length === 0 ? (
            <p className="text-muted-foreground">No projects found. Create one to get started.</p>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSelectProject(project.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {project.name}
                  </CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">{project.description || 'No description'}</div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  )
}
