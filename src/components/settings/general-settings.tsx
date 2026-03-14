"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getProjectDetail, updateProject, getTimezones, getCountries, type Project, type Timezone, type Country } from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Globe, Settings2, CalendarDays, Image, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface ProjectSettingsProps {
  projectUuid: string
}

export function ProjectSettings({ projectUuid }: Readonly<ProjectSettingsProps>) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countryCode, setCountryCode] = useState<string>("")
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedTimezone, setSelectedTimezone] = useState<string>('')
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)

  async function fetchProject() {
    setLoading(true)
    const result = await getProjectDetail(projectUuid)
    if (result.success && result.project) {
      setProject(result.project)
      setCountryCode(result.project.country_code || "VN") // Default to VN if empty
      setSelectedTimezone(result.project.timezone || "")
      
      const [tzResult, countryResult] = await Promise.all([
        getTimezones(projectUuid),
        getCountries(projectUuid)
      ])

      if (tzResult.success && tzResult.data) {
        setTimezones(tzResult.data)
      }
      if (countryResult.success && countryResult.data) {
        setCountries(countryResult.data)
      }
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
      exhibitor_portal_url: formData.get('exhibitor_portal_url') as string,
      conference_booking_url: formData.get('conference_booking_url') as string,
      timezone: formData.get('timezone') as string,
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
              <Label htmlFor="exhibitor_portal_url" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Exhibitor Portal URL
              </Label>
              <Input id="exhibitor_portal_url" name="exhibitor_portal_url" defaultValue={project.exhibitor_portal_url} placeholder="https://..." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conference_booking_url" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Conference Booking URL
              </Label>
              <Input id="conference_booking_url" name="conference_booking_url" defaultValue={project.conference_booking_url} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Timezone
                </Label>
                <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={timezoneOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedTimezone
                        ? timezones.find((tz) => tz.value === selectedTimezone)?.label
                        : 'Select timezone...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
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
                                  selectedTimezone === tz.value ? 'opacity-100' : 'opacity-0'
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
                <input type="hidden" name="timezone" value={selectedTimezone} />
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Country
                </Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryOpen}
                      className="w-full justify-between font-normal"
                    >
                      {countryCode
                        ? countries.find((c) => c.code === countryCode)?.name
                        : 'Select country...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
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
                                setCountryCode(country.code)
                                setCountryOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  countryCode === country.code ? 'opacity-100' : 'opacity-0'
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
                <input type="hidden" name="country_code" value={countryCode} />
              </div>
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
