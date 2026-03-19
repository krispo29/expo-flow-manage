"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getProjectDetail, updateProject, getTimezones, getCountries, type Project, type Timezone, type Country } from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Globe, Settings2, CalendarDays, Image, Loader2, Check, ChevronsUpDown, ShieldCheck, Copyright } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

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
      setCountryCode(result.project.country_code || "VN")
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
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse font-bold tracking-widest uppercase">Initializing configuration...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-20 text-center glass rounded-3xl border-dashed">
        <Settings2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-lg font-display font-bold">Configuration unreachable</p>
        <p className="text-sm text-muted-foreground italic mt-2">Failed to load project details from the core.</p>
      </div>
    )
  }

  return (
    <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          {/* Header Action Bar */}
          <div className="bg-white/5 border-b border-white/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display font-bold">Core Configuration</CardTitle>
                <CardDescription className="font-medium italic">Adjust the fundamental parameters of your project environment.</CardDescription>
              </div>
            </div>
            <Button type="submit" disabled={saving} className="btn-aurora rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <div className="p-8 space-y-10">
            {/* Registration Status Section */}
            <div className="glass p-6 rounded-2xl border-white/5 bg-primary/5 flex items-center justify-between transition-all hover:bg-primary/10 group">
              <div className="space-y-1">
                <Label className="text-lg font-display font-bold group-hover:text-primary transition-colors">Registration Status</Label>
                <p className="text-sm text-muted-foreground font-medium">Enable or disable new registration pipelines across the platform.</p>
              </div>
              <Switch name="is_open_registration" defaultChecked={project.is_open_registration} className="data-[state=checked]:bg-primary" />
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Basic Info Matrix */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Settings2 className="h-4 w-4 text-primary/60" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Profile Matrix</h3>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="project_name" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Project Name</Label>
                    <Input id="project_name" name="project_name" defaultValue={project.project_name} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="project_site_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Site URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="project_site_url" name="project_site_url" defaultValue={project.project_site_url} placeholder="https://example.com" className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="exhibitor_portal_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Exhibitor Portal URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="exhibitor_portal_url" name="exhibitor_portal_url" defaultValue={project.exhibitor_portal_url} placeholder="https://..." className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="conference_booking_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Conference Booking URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input id="conference_booking_url" name="conference_booking_url" defaultValue={project.conference_booking_url} placeholder="https://..." className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Timezone</Label>
                      <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={timezoneOpen} className="w-full h-12 justify-between font-bold text-xs bg-white/5 border-white/10 rounded-xl px-4">
                            <span className="truncate">
                              {selectedTimezone ? timezones.find((tz) => tz.value === selectedTimezone)?.label : 'Select timezone...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] glass border-white/10 rounded-xl shadow-2xl" align="start">
                          <Command>
                            <CommandInput placeholder="Search timezone..." />
                            <CommandList>
                              <CommandEmpty>No timezone found.</CommandEmpty>
                              <CommandGroup>
                                {timezones.map((tz) => (
                                  <CommandItem key={tz.value} value={tz.value} onSelect={(value) => { setSelectedTimezone(value); setTimezoneOpen(false); }} className="text-xs font-bold">
                                    <Check className={cn('mr-2 h-4 w-4', selectedTimezone === tz.value ? 'opacity-100' : 'opacity-0')} />
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

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Country</Label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={countryOpen} className="w-full h-12 justify-between font-bold text-xs bg-white/5 border-white/10 rounded-xl px-4">
                            <span className="truncate">
                              {countryCode ? countries.find((c) => c.code === countryCode)?.name : 'Select country...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] glass border-white/10 rounded-xl shadow-2xl" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((country) => (
                                  <CommandItem key={country.code} value={country.name} onSelect={() => { setCountryCode(country.code); setCountryOpen(false); }} className="text-xs font-bold">
                                    <Check className={cn('mr-2 h-4 w-4', countryCode === country.code ? 'opacity-100' : 'opacity-0')} />
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
              </div>

              {/* Temporal & Visual Logic */}
              <div className="space-y-10">
                {/* Event Dates Matrix */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarDays className="h-4 w-4 text-primary/60" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Temporal Matrix</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="space-y-2.5">
                      <Label htmlFor="start_date" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Start Date</Label>
                      <Input type="date" id="start_date" name="start_date" defaultValue={formatInputDate(project.start_date)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="end_date" className="text-[10px] font-bold uppercase tracking-widest opacity-60">End Date</Label>
                      <Input type="date" id="end_date" name="end_date" defaultValue={formatInputDate(project.end_date)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2.5 col-span-2">
                      <Label htmlFor="cutoff_date_exhibitor_edit" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Exhibitor Edit Cutoff Date</Label>
                      <Input type="date" id="cutoff_date_exhibitor_edit" name="cutoff_date_exhibitor_edit" defaultValue={formatInputDate(project.cutoff_date_exhibitor_edit)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* Brand Assets */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Image className="h-4 w-4 text-primary/60" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Brand Assets</h3>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="logo_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Logo URL</Label>
                      <Input id="logo_url" name="logo_url" defaultValue={project.logo_url} placeholder="https://..." className="h-12 bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="banner_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Banner URL</Label>
                        <Input id="banner_url" name="banner_url" defaultValue={project.banner_url} placeholder="https://..." className="h-12 bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="banner_2_url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Banner 2 URL</Label>
                        <Input id="banner_2_url" name="banner_2_url" defaultValue={project.banner_2_url} placeholder="https://..." className="h-12 bg-white/5 border-white/10 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Legal Matrix */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Copyright className="h-4 w-4 text-primary/60" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Legal Matrix</h3>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="copy_right" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Copyright Text</Label>
                <Input id="copy_right" name="copy_right" defaultValue={project.copy_right} className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>
          </div>
          
          {/* Mobile bottom footer button (duplicate of top) */}
          <div className="p-8 bg-white/5 border-t border-white/10 sm:hidden">
            <Button type="submit" disabled={saving} className="btn-aurora w-full h-14 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest">
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
