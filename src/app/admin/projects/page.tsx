'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getProjects,
  updateProject,
  getTimezones,
  getCountries,
  type Project,
  type Timezone,
  type Country,
} from '@/app/actions/project'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Folder,
  Calendar,
  ArrowRight,
  LayoutGrid,
  Activity,
  Search,
  Filter,
  Edit,
  MoreVertical,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { getCountryCodeFromValue, getCountryNameFromValue } from '@/lib/countries'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<string>('')
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    setError(null)

    // Fetch projects first to get a valid UUID
    const projectResult = await getProjects()

    if (projectResult.success && projectResult.projects) {
      if (projectResult.projects.length === 1) {
        router.push(
          `/admin?projectId=${projectResult.projects[0].project_uuid}`
        )
        return
      }
      setProjects(projectResult.projects)

      // Use the first project's UUID to fetch timezones
      const firstUuid = projectResult.projects[0].project_uuid
      const tzResult = await getTimezones(firstUuid)
      if (tzResult.success && tzResult.data) {
        setTimezones(tzResult.data)
      }
      const countryResult = await getCountries(firstUuid)
      if (countryResult.success && countryResult.data) {
        setCountries(countryResult.data)
      }
    } else {
      setError(projectResult.error || 'Failed to load projects')
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
    const selectedCountryName =
      countries.find((country) => country.code === selectedCountry)?.name ||
      getCountryNameFromValue(selectedCountry || 'VN')

    const projectData = {
      project_uuid: editingProject.project_uuid,
      project_name: formData.get('project_name') as string,
      project_site_url: formData.get('project_site_url') as string,
      is_open_registration: formData.get('is_open_registration') === 'on',
      start_date: new Date(formData.get('start_date') as string).toISOString(),
      end_date: new Date(formData.get('end_date') as string).toISOString(),
      cutoff_date_exhibitor_edit: new Date(
        formData.get('cutoff_date_exhibitor_edit') as string
      ).toISOString(),
      logo_url: formData.get('logo_url') as string,
      banner_url: formData.get('banner_url') as string,
      banner_2_url: formData.get('banner_2_url') as string,
      copy_right: formData.get('copy_right') as string,
      exhibitor_portal_url: formData.get('exhibitor_portal_url') as string,
      conference_booking_url: formData.get('conference_booking_url') as string,
      timezone: selectedTimezone,
      country_code: selectedCountryName,
    }

    const result = await updateProject(projectData)
    setSaving(false)

    if (result.success) {
      setProjects(
        projects.map((p) =>
          p.project_uuid === editingProject.project_uuid
            ? ({ ...p, ...projectData } as Project)
            : p
        )
      )
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
    setSelectedTimezone(project.timezone || '')
    setSelectedCountry(getCountryCodeFromValue(project.country_code, 'VN'))
    setIsEditOpen(true)
  }

  const filteredProjects = projects.filter(
    (p) =>
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
    <div className="min-h-screen bg-slate-50/50 pb-20 dark:bg-slate-950/50">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Workspace
              </h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Select a project to manage.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/10 shadow-none">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                  <LayoutGrid className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    Total Projects
                  </p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-500/10 bg-orange-500/5 shadow-none">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                  <Activity className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    Active Events
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      projects.filter((p) => new Date(p.end_date) >= new Date())
                        .length
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/10 bg-emerald-500/5 shadow-none">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    Upcoming
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      projects.filter(
                        (p) => new Date(p.start_date) > new Date()
                      ).length
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search projects..."
              className="h-11 bg-white pl-10 dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="hidden h-11 gap-2 px-4 sm:flex">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="h-[200px] animate-pulse bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white py-20 text-center dark:bg-slate-900">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Folder className="size-10 text-red-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Unable to load projects
            </h3>
            <p className="mb-8 max-w-sm text-slate-500">{error}</p>
            <Button onClick={fetchProjects}>Try Again</Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white py-20 text-center dark:bg-slate-900">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Folder className="size-10 text-slate-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No projects found</h3>
            <p className="mb-8 max-w-sm text-slate-500">
              {searchQuery
                ? 'No projects match your current search criteria.'
                : 'No projects available.'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.project_uuid}
                className="group relative cursor-pointer overflow-hidden border-transparent bg-white shadow-sm transition-all duration-300 hover:border-slate-200 hover:shadow-xl dark:bg-slate-900 dark:hover:border-slate-700"
                onClick={() => handleSelectProject(project.project_uuid)}
              >
                <div className="bg-primary absolute top-0 left-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative pb-4">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => openEditDialog(project, e)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mr-8 mb-2 flex items-center justify-between">
                    <div className="group-hover:bg-primary/10 group-hover:text-primary flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 group-hover:scale-110 dark:bg-slate-800">
                      {project.logo_url ? (
                        <img
                          src={project.logo_url}
                          alt={project.project_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Folder className="size-6" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold tracking-tighter uppercase opacity-60"
                    >
                      {project.project_code || 'N/A'}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary text-xl font-bold transition-colors">
                    {project.project_name}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2 min-h-[40px]">
                    {project.project_site_url || 'No site URL provided'}
                  </CardDescription>
                </CardHeader>
                <Separator className="mx-6 w-auto" />
                <CardFooter className="flex items-center justify-between p-6 pt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Calendar className="size-3" />
                    {formatDate(project.start_date)} -{' '}
                    {formatDate(project.end_date)}
                  </div>
                  <div className="text-primary flex translate-x-4 items-center gap-1 text-sm font-bold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
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
                  <Input
                    id="project_name"
                    name="project_name"
                    defaultValue={editingProject.project_name}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="project_site_url">Site URL</Label>
                  <Input
                    id="project_site_url"
                    name="project_site_url"
                    defaultValue={editingProject.project_site_url}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exhibitor_portal_url">
                    Exhibitor Portal URL
                  </Label>
                  <Input
                    id="exhibitor_portal_url"
                    name="exhibitor_portal_url"
                    defaultValue={editingProject.exhibitor_portal_url}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="conference_booking_url">
                    Conference Booking URL
                  </Label>
                  <Input
                    id="conference_booking_url"
                    name="conference_booking_url"
                    defaultValue={editingProject.conference_booking_url}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Timezone</Label>
                    <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={timezoneOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedTimezone
                            ? timezones.find((tz) => tz.value === selectedTimezone)
                                ?.label
                            : 'Select timezone...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 sm:w-[300px]" align="start">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup>
                              {timezones.map((tz) => (
                                <CommandItem
                                  key={tz.value}
                                  value={tz.value}
                                  onSelect={(value) => {
                                    setSelectedTimezone(value)
                                    setTimezoneOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedTimezone === tz.value
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {tz.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Country</Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedCountry
                            ? countries.find((c) => c.code === selectedCountry)
                                ?.name
                            : 'Select country...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 sm:w-[300px]" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={() => {
                                    setSelectedCountry(country.code)
                                    setCountryOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedCountry === country.code
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {country.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      type="date"
                      id="start_date"
                      name="start_date"
                      defaultValue={formatInputDate(editingProject.start_date)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      type="date"
                      id="end_date"
                      name="end_date"
                      defaultValue={formatInputDate(editingProject.end_date)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cutoff_date_exhibitor_edit">
                    Exhibitor Edit Cutoff
                  </Label>
                  <Input
                    type="date"
                    id="cutoff_date_exhibitor_edit"
                    name="cutoff_date_exhibitor_edit"
                    defaultValue={formatInputDate(
                      editingProject.cutoff_date_exhibitor_edit
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_open_registration"
                    name="is_open_registration"
                    defaultChecked={editingProject.is_open_registration}
                  />
                  <Label htmlFor="is_open_registration">
                    Open Registration
                  </Label>
                </div>

                <Separator />
                <h4 className="font-medium">Assets</h4>

                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    defaultValue={editingProject.logo_url}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner_url">Banner URL</Label>
                  <Input
                    id="banner_url"
                    name="banner_url"
                    defaultValue={editingProject.banner_url}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner_2_url">Banner 2 URL</Label>
                  <Input
                    id="banner_2_url"
                    name="banner_2_url"
                    defaultValue={editingProject.banner_2_url}
                  />
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="copy_right">Copyright Text</Label>
                  <Input
                    id="copy_right"
                    name="copy_right"
                    defaultValue={editingProject.copy_right}
                  />
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
