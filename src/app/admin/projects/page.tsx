'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProjects, updateProject, type Project } from '@/app/actions/project'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Folder, Calendar, ArrowRight, LayoutGrid, Activity, Search, Filter, Edit, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    const result = await getProjects()
    if (result.success && result.projects) {
      setProjects(result.projects)
    } else {
      setError(result.error || 'Failed to load projects')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpdateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProject) return
    setSaving(true)

    const formData = new FormData(event.currentTarget)

    const projectData = {
      project_uuid: editingProject.project_uuid,
      project_name: formData.get('project_name') as string,
      project_site_url: formData.get('project_site_url') as string,
      is_open_registration: formData.get('is_open_registration') === 'on',
      start_date: new Date(formData.get('start_date') as string).toISOString(),
      end_date: new Date(formData.get('end_date') as string).toISOString(),
      cutoff_date_exhibitor_edit: new Date(formData.get('cutoff_date_exhibitor_edit') as string).toISOString(),
      logo_url: formData.get('logo_url') as string,
      banner_url: formData.get('banner_url') as string,
      banner_2_url: formData.get('banner_2_url') as string,
      copy_right: formData.get('copy_right') as string,
    }

    const result = await updateProject(projectData)
    setSaving(false)

    if (result.success) {
      setProjects(projects.map(p =>
        p.project_uuid === editingProject.project_uuid
          ? { ...p, ...projectData } as Project
          : p
      ))
      setIsEditOpen(false)
      setEditingProject(null)
      toast.success('Project updated successfully')
    } else {
      toast.error(result.error || 'Failed to update project')
    }
  }

  function handleSelectProject(projectId: string) {
    router.push(`/admin?projectId=${projectId}`)
  }

  function openEditDialog(project: Project, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingProject(project)
    setIsEditOpen(true)
  }

  const filteredProjects = projects.filter(p =>
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'N/A'
    }
  }

  const formatInputDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Workspace</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Select a project to manage.
              </p>
            </div>
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
                  <p className="text-2xl font-bold">{projects.filter(p => new Date(p.end_date) >= new Date()).length}</p>
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
                  <p className="text-2xl font-bold">{projects.filter(p => new Date(p.start_date) > new Date()).length}</p>
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
              <Card key={i} className="animate-pulse h-[200px] bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed text-center">
            <div className="size-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <Folder className="size-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Unable to load projects</h3>
            <p className="text-slate-500 max-w-sm mb-8">{error}</p>
            <Button onClick={fetchProjects}>Try Again</Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Folder className="size-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              {searchQuery
                ? 'No projects match your current search criteria.'
                : 'No projects available.'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.project_uuid}
                className="group relative overflow-hidden cursor-pointer border-transparent dark:hover:border-slate-700 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900"
                onClick={() => handleSelectProject(project.project_uuid)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4 relative">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => openEditDialog(project, e)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between mb-2 mr-8">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 overflow-hidden">
                      {project.logo_url ? (
                        <img src={project.logo_url} alt={project.project_name} className="size-full object-cover" />
                      ) : (
                        <Folder className="size-6" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter opacity-60">
                      {project.project_code || 'N/A'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {project.project_name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                    {project.project_site_url || 'No site URL provided'}
                  </CardDescription>
                </CardHeader>
                <Separator className="mx-6 w-auto" />
                <CardFooter className="p-6 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="size-3" />
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
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

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and settings.
            </DialogDescription>
          </DialogHeader>
          {editingProject && (
            <form onSubmit={handleUpdateProject}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input id="project_name" name="project_name" defaultValue={editingProject.project_name} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="project_site_url">Site URL</Label>
                  <Input id="project_site_url" name="project_site_url" defaultValue={editingProject.project_site_url} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input type="date" id="start_date" name="start_date" defaultValue={formatInputDate(editingProject.start_date)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input type="date" id="end_date" name="end_date" defaultValue={formatInputDate(editingProject.end_date)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cutoff_date_exhibitor_edit">Exhibitor Edit Cutoff</Label>
                  <Input type="date" id="cutoff_date_exhibitor_edit" name="cutoff_date_exhibitor_edit" defaultValue={formatInputDate(editingProject.cutoff_date_exhibitor_edit)} />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="is_open_registration" name="is_open_registration" defaultChecked={editingProject.is_open_registration} />
                  <Label htmlFor="is_open_registration">Open Registration</Label>
                </div>

                <Separator />
                <h4 className="font-medium">Assets</h4>

                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input id="logo_url" name="logo_url" defaultValue={editingProject.logo_url} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner_url">Banner URL</Label>
                  <Input id="banner_url" name="banner_url" defaultValue={editingProject.banner_url} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner_2_url">Banner 2 URL</Label>
                  <Input id="banner_2_url" name="banner_2_url" defaultValue={editingProject.banner_2_url} />
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="copy_right">Copyright Text</Label>
                  <Input id="copy_right" name="copy_right" defaultValue={editingProject.copy_right} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
