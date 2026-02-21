"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getProjectDetail, updateProject, type Project } from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Globe, Settings2, CalendarDays, Image, Loader2 } from "lucide-react"

interface ProjectSettingsProps {
  projectUuid: string
}

export function ProjectSettings({ projectUuid }: Readonly<ProjectSettingsProps>) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function fetchProject() {
    setLoading(true)
    const result = await getProjectDetail(projectUuid)
    if (result.success && result.project) {
      setProject(result.project)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!project) return
    setSaving(true)

    const formData = new FormData(e.currentTarget)

    const projectData = {
      project_uuid: project.project_uuid,
      project_name: formData.get('project_name') as string,
      project_site_url: formData.get('project_site_url') as string,
      is_open_registration: (formData.get('is_open_registration') as string) === 'on',
      start_date: new Date(formData.get('start_date') as string).toISOString(),
      end_date: new Date(formData.get('end_date') as string).toISOString(),
      cutoff_date_exhibitor_edit: new Date(formData.get('cutoff_date_exhibitor_edit') as string).toISOString(),
      logo_url: formData.get('logo_url') as string,
      banner_url: formData.get('banner_url') as string,
      banner_2_url: formData.get('banner_2_url') as string,
      copy_right: formData.get('copy_right') as string,
      country_code: formData.get('country_code') as string,
    }

    const result = await updateProject(projectData)
    setSaving(false)

    if (result.success) {
      toast.success("Project settings updated")
      fetchProject()
    } else {
      toast.error(result.error || "Failed to update project settings")
    }
  }

  const formatInputDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load project details.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registration Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Registration Status</Label>
              <p className="text-sm text-muted-foreground">Enable or disable new registrations.</p>
            </div>
            <Switch name="is_open_registration" defaultChecked={project.is_open_registration} />
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project_name" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Project Name
              </Label>
              <Input id="project_name" name="project_name" defaultValue={project.project_name} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project_site_url" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Site URL
              </Label>
              <Input id="project_site_url" name="project_site_url" defaultValue={project.project_site_url} placeholder="https://example.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country_code" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Country Code
              </Label>
              <Input id="country_code" name="country_code" defaultValue={project.country_code} placeholder="e.g. VN, TH" maxLength={2} className="uppercase" />
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Event Dates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input type="date" id="start_date" name="start_date" defaultValue={formatInputDate(project.start_date)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input type="date" id="end_date" name="end_date" defaultValue={formatInputDate(project.end_date)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cutoff_date_exhibitor_edit">Exhibitor Edit Cutoff Date</Label>
              <Input type="date" id="cutoff_date_exhibitor_edit" name="cutoff_date_exhibitor_edit" defaultValue={formatInputDate(project.cutoff_date_exhibitor_edit)} />
            </div>
          </div>

          <Separator />

          {/* Assets */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              Assets
            </h4>
            <div className="grid gap-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" name="logo_url" defaultValue={project.logo_url} placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner_url">Banner URL</Label>
              <Input id="banner_url" name="banner_url" defaultValue={project.banner_url} placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner_2_url">Banner 2 URL</Label>
              <Input id="banner_2_url" name="banner_2_url" defaultValue={project.banner_2_url} placeholder="https://..." />
            </div>
          </div>

          <Separator />

          {/* Copyright */}
          <div className="grid gap-2">
            <Label htmlFor="copy_right">Copyright Text</Label>
            <Input id="copy_right" name="copy_right" defaultValue={project.copy_right} />
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
