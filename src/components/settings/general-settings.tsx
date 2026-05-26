"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import {
  getProjectDetail,
  updateProject,
  getTimezones,
  type Project,
  type Timezone,
} from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Globe,
  Settings2,
  CalendarDays,
  Image as ImageIcon,
  Loader2,
  Check,
  ChevronsUpDown,
  ShieldCheck,
  Copyright,
  Palette,
  FileText,
  Mail,
  Pencil,
  Search,
  MapPin,
  Ticket,
  Plus,
  X,
  Eye,
  Link as LinkIcon,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CountrySelector } from "@/components/CountrySelector"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  countries as countryOptions,
  getCountryCodeFromValue,
  getCountryNameFromValue,
} from "@/lib/countries"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

const SOCIAL_LINK_TYPE_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
] as const

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "tl", label: "Filipino" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
] as const

interface ProjectSettingsProps {
  projectUuid: string
}

type SettingsRecord = Record<string, unknown>

interface SocialLinkForm {
  label: string
  type: string
  url: string
}

interface ScheduleForm {
  date: string
  open_time: string
  close_time: string
}

interface RelatedBrandForm {
  source_key?: string
  label: string
  short_label: string
  description: string
  logo_url: string
  website_url: string
  social_links: SocialLinkForm[]
}

interface SettingsForm {
  badge: {
    background_image_url: string
    default_category: string
    default_country_label: string
    page_size: {
      width: string
      height: string
    }
    layout: {
      header_spacer_height: string
      content_area_height: string
      footer_height: string
    }
  }
  branding: {
    theme_color: string
    primary_hover_color: string
    accent_color: string
    favicon_url: string
  }
  closed_html_content: string
  confirmation: {
    message: string
  }
  contact: {
    email: string
    website_url: string
    social_links: SocialLinkForm[]
  }
  dates: {
    display_range: string
    display_hours: string
    start_date: string
    end_date: string
    timezone: string
    schedule: ScheduleForm[]
  }
  exhibitor_portal: {
    title: string
    subtitle: string
    footer_text: string
    logo_url: string
    favicon_url: string
    support_email: string
    branding: {
      theme_color: string
      primary_hover_color: string
      accent_color: string
    }
    defaults: {
      default_country_code: string
      default_language: string
      default_phone_code: string
    }
  }
  legal: {
    consent_marketing_text_en: string
    consent_pdpa_text_en: string
    privacy_policy_url: string
  }
  preferences: {
    default_language: string
    languages: string
  }
  registration: {
    individual_attendee_type_code: string
    group_attendee_type_code: string
    group_min_members: string
    group_max_members: string
  }
  related_brands: RelatedBrandForm[]
  seo: {
    og_title: string
    og_description: string
    og_image: string
  }
  venue: {
    display_text: string
  }
}

const emptySocialLink = (): SocialLinkForm => ({
  label: "",
  type: "",
  url: "",
})

const emptyRelatedBrand = (): RelatedBrandForm => ({
  source_key: undefined,
  label: "",
  short_label: "",
  description: "",
  logo_url: "",
  website_url: "",
  social_links: [],
})

const emptySchedule = (): ScheduleForm => ({
  date: "",
  open_time: "",
  close_time: "",
})

const defaultSettingsForm = (): SettingsForm => ({
  badge: {
    background_image_url: "",
    default_category: "",
    default_country_label: "",
    page_size: {
      width: "",
      height: "",
    },
    layout: {
      header_spacer_height: "",
      content_area_height: "",
      footer_height: "",
    },
  },
  branding: {
    theme_color: "#000000",
    primary_hover_color: "#000000",
    accent_color: "#000000",
    favicon_url: "",
  },
  closed_html_content: "",
  confirmation: {
    message: "",
  },
  contact: {
    email: "",
    website_url: "",
    social_links: [],
  },
  dates: {
    display_range: "",
    display_hours: "",
    start_date: "",
    end_date: "",
    timezone: "",
    schedule: [],
  },
  exhibitor_portal: {
    title: "",
    subtitle: "",
    footer_text: "",
    logo_url: "",
    favicon_url: "",
    support_email: "",
    branding: {
      theme_color: "#000000",
      primary_hover_color: "#000000",
      accent_color: "#000000",
    },
    defaults: {
      default_country_code: "",
      default_language: "",
      default_phone_code: "",
    },
  },
  legal: {
    consent_marketing_text_en: "",
    consent_pdpa_text_en: "",
    privacy_policy_url: "",
  },
  preferences: {
    default_language: "",
    languages: "",
  },
  registration: {
    individual_attendee_type_code: "",
    group_attendee_type_code: "",
    group_min_members: "",
    group_max_members: "",
  },
  related_brands: [],
  seo: {
    og_title: "",
    og_description: "",
    og_image: "",
  },
  venue: {
    display_text: "",
  },
})

const asRecord = (value: unknown): SettingsRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as SettingsRecord) : {}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const getString = (record: SettingsRecord, key: string, fallback = "") =>
  typeof record[key] === "string" ? (record[key] as string) : fallback

const normalizeColor = (value: string, fallback = "#000000") =>
  /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback

const toNumber = (value: string, fallback: unknown) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const csvToArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeLanguageCode = (value: string) => value.trim().toLowerCase().replace("_", "-")

const getLanguageCodes = (value: string) =>
  Array.from(new Set(csvToArray(value).map(normalizeLanguageCode).filter(Boolean)))

const languageCodesToCsv = (codes: string[]) =>
  Array.from(new Set(codes.map(normalizeLanguageCode).filter(Boolean))).join(", ")

const getLanguageOption = (value: string) => {
  const languageCode = normalizeLanguageCode(value)
  return LANGUAGE_OPTIONS.find((option) => option.value === languageCode) ?? {
    value: languageCode,
    label: languageCode.toUpperCase(),
  }
}

const getLanguageOptionsWithExtras = (codes: string[] = []) => {
  const extraCodes = new Set(codes.map(normalizeLanguageCode).filter(Boolean))
  const baseCodes = new Set<string>(LANGUAGE_OPTIONS.map((option) => option.value))
  const extraOptions = Array.from(extraCodes)
    .filter((code) => !baseCodes.has(code))
    .map(getLanguageOption)

  return [...LANGUAGE_OPTIONS, ...extraOptions]
}

const getLanguageOptionsForCodes = (codes: string[], extraCodes: string[] = []) => {
  const availableCodes = new Set([...codes, ...extraCodes].map(normalizeLanguageCode).filter(Boolean))
  return getLanguageOptionsWithExtras(Array.from(availableCodes)).filter((option) => availableCodes.has(option.value))
}

const normalizeSocialLinkType = (value: string) => {
  const normalizedValue = value.trim().toLowerCase()
  return SOCIAL_LINK_TYPE_OPTIONS.some((option) => option.value === normalizedValue) ? normalizedValue : ""
}

const getSocialLinkTypeLabel = (value: string) =>
  SOCIAL_LINK_TYPE_OPTIONS.find((option) => option.value === normalizeSocialLinkType(value))?.label || ""

const shouldReplaceSocialLinkLabel = (currentLabel: string, currentType: string) => {
  const currentTypeLabel = getSocialLinkTypeLabel(currentType)
  return !currentLabel || currentLabel === currentTypeLabel
}

const getPhoneCodeByCountryCode = (countryCode: string) =>
  countryOptions.find((country) => country.code === countryCode)?.phoneCode || countryCode

const socialLinkFromSettings = (value: unknown): SocialLinkForm => {
  const record = asRecord(value)
  return {
    label: getString(record, "label"),
    type: normalizeSocialLinkType(getString(record, "type")),
    url: getString(record, "url"),
  }
}

const scheduleFromSettings = (value: unknown): ScheduleForm => {
  const record = asRecord(value)
  return {
    date: getString(record, "date"),
    open_time: getString(record, "open_time"),
    close_time: getString(record, "close_time"),
  }
}

const relatedBrandFromSettings = (value: unknown): RelatedBrandForm => {
  const record = asRecord(value)
  return {
    source_key: getString(record, "key") || undefined,
    label: getString(record, "label"),
    short_label: getString(record, "short_label"),
    description: getString(record, "description"),
    logo_url: getString(record, "logo_url"),
    website_url: getString(record, "website_url"),
    social_links: asArray(record.social_links).map(socialLinkFromSettings),
  }
}

const formFromSettings = (settings?: SettingsRecord | null): SettingsForm => {
  const source = asRecord(settings)
  const badge = asRecord(source.badge)
  const badgePageSize = asRecord(badge.page_size)
  const badgeLayout = asRecord(badge.layout)
  const branding = asRecord(source.branding)
  const confirmation = asRecord(source.confirmation)
  const contact = asRecord(source.contact)
  const dates = asRecord(source.dates)
  const exhibitorPortal = asRecord(source.exhibitor_portal)
  const exhibitorPortalBranding = asRecord(exhibitorPortal.branding)
  const exhibitorPortalDefaults = asRecord(exhibitorPortal.defaults)
  const legal = asRecord(source.legal)
  const consentMarketing = asRecord(legal.consent_marketing_text)
  const consentPdpa = asRecord(legal.consent_pdpa_text)
  const preferences = asRecord(source.preferences)
  const registration = asRecord(source.registration)
  const attendeeTypeCodes = asRecord(registration.attendee_type_codes)
  const seo = asRecord(source.seo)
  const venue = asRecord(source.venue)

  return {
    badge: {
      background_image_url: getString(badge, "background_image_url"),
      default_category: getString(badge, "default_category"),
      default_country_label: getString(badge, "default_country_label"),
      page_size: {
        width: getString(badgePageSize, "width"),
        height: getString(badgePageSize, "height"),
      },
      layout: {
        header_spacer_height: getString(badgeLayout, "header_spacer_height"),
        content_area_height: getString(badgeLayout, "content_area_height"),
        footer_height: getString(badgeLayout, "footer_height"),
      },
    },
    branding: {
      theme_color: normalizeColor(getString(branding, "theme_color")),
      primary_hover_color: normalizeColor(getString(branding, "primary_hover_color")),
      accent_color: normalizeColor(getString(branding, "accent_color")),
      favicon_url: getString(branding, "favicon_url"),
    },
    closed_html_content: getString(source, "closed_html_content"),
    confirmation: {
      message: getString(confirmation, "message"),
    },
    contact: {
      email: getString(contact, "email"),
      website_url: getString(contact, "website_url"),
      social_links: asArray(contact.social_links).map(socialLinkFromSettings),
    },
    dates: {
      display_range: getString(dates, "display_range"),
      display_hours: getString(dates, "display_hours"),
      start_date: getString(dates, "start_date"),
      end_date: getString(dates, "end_date"),
      timezone: getString(dates, "timezone"),
      schedule: asArray(dates.schedule).map(scheduleFromSettings),
    },
    exhibitor_portal: {
      title: getString(exhibitorPortal, "title"),
      subtitle: getString(exhibitorPortal, "subtitle"),
      footer_text: getString(exhibitorPortal, "footer_text"),
      logo_url: getString(exhibitorPortal, "logo_url"),
      favicon_url: getString(exhibitorPortal, "favicon_url"),
      support_email: getString(exhibitorPortal, "support_email"),
      branding: {
        theme_color: normalizeColor(getString(exhibitorPortalBranding, "theme_color")),
        primary_hover_color: normalizeColor(getString(exhibitorPortalBranding, "primary_hover_color")),
        accent_color: normalizeColor(getString(exhibitorPortalBranding, "accent_color")),
      },
      defaults: {
        default_country_code: getString(exhibitorPortalDefaults, "default_country_code"),
        default_language: getString(exhibitorPortalDefaults, "default_language"),
        default_phone_code: getString(exhibitorPortalDefaults, "default_phone_code"),
      },
    },
    legal: {
      consent_marketing_text_en: getString(consentMarketing, "en"),
      consent_pdpa_text_en: getString(consentPdpa, "en"),
      privacy_policy_url: getString(legal, "privacy_policy_url"),
    },
    preferences: {
      default_language: getString(preferences, "default_language"),
      languages: asArray(preferences.languages).filter((item) => typeof item === "string").join(", "),
    },
    registration: {
      individual_attendee_type_code: getString(attendeeTypeCodes, "individual"),
      group_attendee_type_code: getString(attendeeTypeCodes, "group"),
      group_min_members: String(registration.group_min_members ?? ""),
      group_max_members: String(registration.group_max_members ?? ""),
    },
    related_brands: asArray(source.related_brands).map(relatedBrandFromSettings),
    seo: {
      og_title: getString(seo, "og_title"),
      og_description: getString(seo, "og_description"),
      og_image: getString(seo, "og_image"),
    },
    venue: {
      display_text: getString(venue, "display_text"),
    },
  }
}

const mergeSettings = (baseSettings: SettingsRecord | undefined | null, form: SettingsForm): SettingsRecord => {
  const base = asRecord(baseSettings)
  const badge = asRecord(base.badge)
  const badgePageSize = asRecord(badge.page_size)
  const badgeLayout = asRecord(badge.layout)
  const branding = asRecord(base.branding)
  const confirmation = asRecord(base.confirmation)
  const contact = asRecord(base.contact)
  const dates = asRecord(base.dates)
  const exhibitorPortal = asRecord(base.exhibitor_portal)
  const exhibitorPortalBranding = asRecord(exhibitorPortal.branding)
  const exhibitorPortalDefaults = asRecord(exhibitorPortal.defaults)
  const legal = asRecord(base.legal)
  const preferences = asRecord(base.preferences)
  const registration = asRecord(base.registration)
  const attendeeTypeCodes = asRecord(registration.attendee_type_codes)
  const relatedBrandBase = asArray(base.related_brands).map(asRecord)
  const seo = asRecord(base.seo)
  const venue = asRecord(base.venue)

  return {
    ...base,
    badge: {
      ...badge,
      background_image_url: form.badge.background_image_url,
      default_category: form.badge.default_category,
      default_country_label: form.badge.default_country_label,
      page_size: {
        ...badgePageSize,
        width: form.badge.page_size.width,
        height: form.badge.page_size.height,
      },
      layout: {
        ...badgeLayout,
        header_spacer_height: form.badge.layout.header_spacer_height,
        content_area_height: form.badge.layout.content_area_height,
        footer_height: form.badge.layout.footer_height,
      },
    },
    branding: {
      ...branding,
      theme_color: form.branding.theme_color,
      primary_hover_color: form.branding.primary_hover_color,
      accent_color: form.branding.accent_color,
      favicon_url: form.branding.favicon_url,
    },
    closed_html_content: form.closed_html_content,
    confirmation: {
      ...confirmation,
      message: form.confirmation.message,
    },
    contact: {
      ...contact,
      email: form.contact.email,
      website_url: form.contact.website_url,
      social_links: form.contact.social_links,
    },
    dates: {
      ...dates,
      display_range: form.dates.display_range,
      display_hours: form.dates.display_hours,
      start_date: form.dates.start_date,
      end_date: form.dates.end_date,
      timezone: form.dates.timezone,
      schedule: form.dates.schedule,
    },
    exhibitor_portal: {
      ...exhibitorPortal,
      title: form.exhibitor_portal.title,
      subtitle: form.exhibitor_portal.subtitle,
      footer_text: form.exhibitor_portal.footer_text,
      logo_url: form.exhibitor_portal.logo_url,
      favicon_url: form.exhibitor_portal.favicon_url,
      support_email: form.exhibitor_portal.support_email,
      branding: {
        ...exhibitorPortalBranding,
        theme_color: form.exhibitor_portal.branding.theme_color,
        primary_hover_color: form.exhibitor_portal.branding.primary_hover_color,
        accent_color: form.exhibitor_portal.branding.accent_color,
      },
      defaults: {
        ...exhibitorPortalDefaults,
        default_country_code: form.exhibitor_portal.defaults.default_country_code,
        default_language: form.exhibitor_portal.defaults.default_language,
        default_phone_code: form.exhibitor_portal.defaults.default_phone_code,
      },
    },
    legal: {
      ...legal,
      consent_marketing_text: {
        ...asRecord(legal.consent_marketing_text),
        en: form.legal.consent_marketing_text_en,
      },
      consent_pdpa_text: {
        ...asRecord(legal.consent_pdpa_text),
        en: form.legal.consent_pdpa_text_en,
      },
      privacy_policy_url: form.legal.privacy_policy_url,
    },
    preferences: {
      ...preferences,
      default_language: form.preferences.default_language,
      languages: csvToArray(form.preferences.languages),
    },
    registration: {
      ...registration,
      attendee_type_codes: {
        ...attendeeTypeCodes,
        individual: form.registration.individual_attendee_type_code,
        group: form.registration.group_attendee_type_code,
      },
      group_min_members: toNumber(form.registration.group_min_members, registration.group_min_members),
      group_max_members: toNumber(form.registration.group_max_members, registration.group_max_members),
    },
    related_brands: form.related_brands.map((brand, brandIndex) => {
      const sourceBrand =
        relatedBrandBase.find((item) => getString(item, "key") === brand.source_key) ||
        relatedBrandBase[brandIndex] ||
        {}
      return {
        ...sourceBrand,
        label: brand.label,
        short_label: brand.short_label,
        description: brand.description,
        logo_url: brand.logo_url,
        website_url: brand.website_url,
        social_links: brand.social_links,
      }
    }),
    seo: {
      ...seo,
      og_title: form.seo.og_title,
      og_description: form.seo.og_description,
      og_image: form.seo.og_image,
    },
    venue: {
      ...venue,
      display_text: form.venue.display_text,
    },
  }
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}>) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: Readonly<{
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}>) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label htmlFor={htmlFor} className="text-[10px] font-bold uppercase tracking-widest opacity-60">
        {label}
      </Label>
      {children}
    </div>
  )
}

function NativeTextarea({
  value,
  onChange,
  className,
  rows = 4,
  disabled = false,
}: Readonly<{
  value: string
  onChange: (value: string) => void
  className?: string
  rows?: number
  disabled?: boolean
}>) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      spellCheck={false}
      disabled={disabled}
      className={cn(
        "w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    />
  )
}

const getCentimeterInputValue = (value: string) => {
  const normalizedValue = value.trim().replace(",", ".")
  const match = normalizedValue.match(/^\d+(?:\.\d*)?/)
  return match?.[0] ?? ""
}

const sanitizeCentimeterInput = (value: string) => {
  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "")
  const [integerPart, ...decimalParts] = normalizedValue.split(".")
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart
}

const toCentimeterSettingValue = (value: string) => {
  const normalizedValue = sanitizeCentimeterInput(value).replace(/\.$/, "")
  return normalizedValue ? `${normalizedValue}cm` : ""
}

function CentimeterField({
  label,
  value,
  onChange,
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
}>) {
  const [displayValue, setDisplayValue] = useState(getCentimeterInputValue(value))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(getCentimeterInputValue(value))
    }
  }, [isFocused, value])

  const handleChange = (nextValue: string) => {
    const sanitizedValue = sanitizeCentimeterInput(nextValue)
    setDisplayValue(sanitizedValue)
    onChange(toCentimeterSettingValue(sanitizedValue))
  }

  const handleBlur = () => {
    const nextValue = toCentimeterSettingValue(displayValue)
    setDisplayValue(getCentimeterInputValue(nextValue))
    onChange(nextValue)
    setIsFocused(false)
  }

  return (
    <Field label={label}>
      <div
        className="flex h-12 items-center overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        data-unit="cm"
      >
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          value={displayValue}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
          aria-label={label}
        />
        <span className="flex h-full items-center border-l border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          cm
        </span>
      </div>
    </Field>
  )
}

function ColorField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: Readonly<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}>) {
  const colorValue = normalizeColor(value)

  return (
    <Field label={label} htmlFor={id}>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3">
        <input
          id={id}
          type="color"
          value={colorValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-10 flex-1 border-0 bg-transparent px-0 font-mono text-xs shadow-none focus-visible:ring-0"
          placeholder="#000000"
        />
      </div>
    </Field>
  )
}

function ImageUrlInput({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "https://...",
  disabled = false,
}: Readonly<{
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}>) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue
  const previewUrl = currentValue.trim()

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
  }

  return (
    <div className="flex gap-3">
      <Input
        id={id}
        name={name}
        value={currentValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 min-w-0 flex-1 rounded-xl border-white/10 bg-white/5"
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={!previewUrl}
            className="h-12 w-12 shrink-0 rounded-xl border-white/10 bg-white/5 p-0"
            aria-label="Preview image"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription className="break-all">{previewUrl || "No image URL"}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Configured asset preview"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No image URL to preview.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HtmlField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: Readonly<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}>) {
  return (
    <Field label={label} htmlFor={id}>
      <div id={id} className="settings-rich-text min-h-80 rounded-xl border border-white/10 bg-white">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          readOnly={disabled}
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ align: [] }],
              ["link", "clean"],
            ],
          }}
        />
      </div>
      <style jsx global>{`
        .settings-rich-text .ql-toolbar {
          border: 0;
          border-bottom: 1px solid hsl(var(--border));
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: hsl(var(--muted) / 0.25);
        }
        .settings-rich-text .ql-container {
          min-height: 18rem;
          border: 0;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .settings-rich-text .ql-editor {
          min-height: 18rem;
        }
      `}</style>
    </Field>
  )
}

function SocialLinkTypeSelect({
  value,
  onChange,
  disabled = false,
}: Readonly<{
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}>) {
  return (
    <Select value={normalizeSocialLinkType(value) || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent className="glass rounded-xl border-white/10">
        {SOCIAL_LINK_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs font-bold uppercase">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function LanguageSelectField({
  label,
  value,
  onChange,
  options = getLanguageOptionsWithExtras([value]),
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  options?: Array<{ value: string; label: string }>
}>) {
  return (
    <Field label={label}>
      <Select value={normalizeLanguageCode(value) || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="glass rounded-xl border-white/10">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs font-bold">
              <span className="flex w-full items-center justify-between gap-4">
                <span>{option.label}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">{option.value}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function LanguageMultiSelectField({
  label,
  value,
  onChange,
  className,
}: Readonly<{
  label: string
  value: string
  onChange: (codes: string[]) => void
  className?: string
}>) {
  const selectedCodes = getLanguageCodes(value)
  const selectedSet = new Set(selectedCodes)
  const options = getLanguageOptionsWithExtras(selectedCodes)

  const toggleLanguage = (code: string) => {
    const languageCode = normalizeLanguageCode(code)
    const nextCodes = selectedSet.has(languageCode)
      ? selectedCodes.filter((selectedCode) => selectedCode !== languageCode)
      : [...selectedCodes, languageCode]

    if (nextCodes.length === 0) return

    onChange(nextCodes)
  }

  return (
    <Field label={label} className={className}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const isSelected = selectedSet.has(option.value)
          return (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              aria-pressed={isSelected}
              disabled={isSelected && selectedCodes.length === 1}
              onClick={() => toggleLanguage(option.value)}
              className={cn(
                "h-12 justify-between rounded-xl border-white/10 bg-white/5 px-4 text-left text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60",
                isSelected && "border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/10"
              )}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase opacity-60">{option.value}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </span>
            </Button>
          )
        })}
      </div>
    </Field>
  )
}

export function ProjectSettings({ projectUuid }: Readonly<ProjectSettingsProps>) {
  const formRef = useRef<HTMLFormElement>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(defaultSettingsForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [countryCode, setCountryCode] = useState<string>("")
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [selectedTimezone, setSelectedTimezone] = useState<string>("")
  const [isStatusActive, setIsStatusActive] = useState(false)
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const fieldsDisabled = !isEditing || saving
  const preferenceLanguageCodes = getLanguageCodes(settingsForm.preferences.languages)
  const preferenceDefaultLanguageOptions =
    preferenceLanguageCodes.length > 0
      ? getLanguageOptionsForCodes(preferenceLanguageCodes, [settingsForm.preferences.default_language])
      : getLanguageOptionsWithExtras([settingsForm.preferences.default_language])

  async function fetchProject() {
    setLoading(true)
    const result = await getProjectDetail(projectUuid)
    if (result.success && result.project) {
      setProject(result.project)
      setSettingsForm(formFromSettings(result.project.settings))
      setCountryCode(getCountryCodeFromValue(result.project.country_code, "VN"))
      setSelectedTimezone(result.project.timezone || "")
      setIsStatusActive(result.project.status === "active")

      const tzResult = await getTimezones(projectUuid)

      if (tzResult.success && tzResult.data) {
        setTimezones(tzResult.data)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])

  const selectedCountryName = getCountryNameFromValue(countryCode, "VN")

  const updateSettings = (updater: (current: SettingsForm) => SettingsForm) => {
    setSettingsForm((current) => updater(current))
  }

  const updateContactSocialLink = (index: number, field: keyof SocialLinkForm, value: string) => {
    updateSettings((current) => ({
      ...current,
      contact: {
        ...current.contact,
        social_links: current.contact.social_links.map((link, linkIndex) =>
          linkIndex === index ? { ...link, [field]: value } : link
        ),
      },
    }))
  }

  const updateContactSocialLinkType = (index: number, value: string) => {
    const nextType = normalizeSocialLinkType(value)
    updateSettings((current) => ({
      ...current,
      contact: {
        ...current.contact,
        social_links: current.contact.social_links.map((link, linkIndex) =>
          linkIndex === index
            ? {
                ...link,
                type: nextType,
                label: shouldReplaceSocialLinkLabel(link.label, link.type) ? getSocialLinkTypeLabel(nextType) : link.label,
              }
            : link
        ),
      },
    }))
  }

  const updateSchedule = (index: number, field: keyof ScheduleForm, value: string) => {
    updateSettings((current) => ({
      ...current,
      dates: {
        ...current.dates,
        schedule: current.dates.schedule.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    }))
  }

  const updateRelatedBrand = (index: number, field: keyof Omit<RelatedBrandForm, "social_links">, value: string) => {
    updateSettings((current) => ({
      ...current,
      related_brands: current.related_brands.map((brand, brandIndex) =>
        brandIndex === index ? { ...brand, [field]: value } : brand
      ),
    }))
  }

  const updateRelatedBrandSocialLink = (
    brandIndex: number,
    linkIndex: number,
    field: keyof SocialLinkForm,
    value: string
  ) => {
    updateSettings((current) => ({
      ...current,
      related_brands: current.related_brands.map((brand, currentBrandIndex) =>
        currentBrandIndex === brandIndex
          ? {
              ...brand,
              social_links: brand.social_links.map((link, currentLinkIndex) =>
                currentLinkIndex === linkIndex ? { ...link, [field]: value } : link
              ),
            }
          : brand
      ),
    }))
  }

  const updateDefaultPhoneCode = (countryCodeValue: string) => {
    updateSettings((current) => ({
      ...current,
      exhibitor_portal: {
        ...current.exhibitor_portal,
        defaults: {
          ...current.exhibitor_portal.defaults,
          default_phone_code: getPhoneCodeByCountryCode(countryCodeValue),
        },
      },
    }))
  }

  const updateExhibitorPortalDefaultLanguage = (value: string) => {
    const languageCode = normalizeLanguageCode(value)
    updateSettings((current) => ({
      ...current,
      exhibitor_portal: {
        ...current.exhibitor_portal,
        defaults: {
          ...current.exhibitor_portal.defaults,
          default_language: languageCode,
        },
      },
    }))
  }

  const updatePreferenceDefaultLanguage = (value: string) => {
    const languageCode = normalizeLanguageCode(value)
    updateSettings((current) => {
      const currentLanguageCodes = getLanguageCodes(current.preferences.languages)
      const nextLanguageCodes =
        currentLanguageCodes.length === 0 || !currentLanguageCodes.includes(languageCode)
          ? [...currentLanguageCodes, languageCode]
          : currentLanguageCodes

      return {
        ...current,
        preferences: {
          ...current.preferences,
          default_language: languageCode,
          languages: languageCodesToCsv(nextLanguageCodes),
        },
      }
    })
  }

  const updatePreferenceLanguages = (codes: string[]) => {
    const nextLanguageCodes = Array.from(new Set(codes.map(normalizeLanguageCode).filter(Boolean)))
    if (nextLanguageCodes.length === 0) return

    updateSettings((current) => {
      const currentDefaultLanguage = normalizeLanguageCode(current.preferences.default_language)
      const nextDefaultLanguage = nextLanguageCodes.includes(currentDefaultLanguage)
        ? currentDefaultLanguage
        : nextLanguageCodes[0]

      return {
        ...current,
        preferences: {
          ...current.preferences,
          default_language: nextDefaultLanguage,
          languages: languageCodesToCsv(nextLanguageCodes),
        },
      }
    })
  }

  const cancelEditing = () => {
    if (!project) return

    formRef.current?.reset()
    setSettingsForm(formFromSettings(project.settings))
    setCountryCode(getCountryCodeFromValue(project.country_code, "VN"))
    setSelectedTimezone(project.timezone || "")
    setIsStatusActive(project.status === "active")
    setIsEditing(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!project) return
    if (!isEditing) {
      setIsEditing(true)
      return
    }
    setSaving(true)

    const formData = new FormData(e.currentTarget)

    const projectData = {
      project_uuid: project.project_uuid,
      project_name: formData.get("project_name") as string,
      project_site_url: formData.get("project_site_url") as string,
      is_individual_registration_open: (formData.get("is_individual_registration_open") as string) === "on",
      is_group_registration_open: (formData.get("is_group_registration_open") as string) === "on",
      settings: mergeSettings(project.settings, settingsForm),
      start_date: new Date(formData.get("start_date") as string).toISOString(),
      end_date: new Date(formData.get("end_date") as string).toISOString(),
      cutoff_date_exhibitor_edit: new Date(formData.get("cutoff_date_exhibitor_edit") as string).toISOString(),
      logo_url: formData.get("logo_url") as string,
      banner_url: formData.get("banner_url") as string,
      banner_2_url: formData.get("banner_2_url") as string,
      copy_right: formData.get("copy_right") as string,
      country_code: selectedCountryName,
      exhibitor_portal_url: formData.get("exhibitor_portal_url") as string,
      conference_booking_url: formData.get("conference_booking_url") as string,
      timezone: formData.get("timezone") as string,
      status: isStatusActive ? "active" : "closed",
      attendance_marker_code: (formData.get("attendance_marker_code") as string).trim(),
    }

    const result = await updateProject(projectData)
    setSaving(false)

    if (result.success) {
      toast.success("Project settings updated")
      setIsEditing(false)
      fetchProject()
    } else {
      toast.error(result.error || "Failed to update project settings")
    }
  }

  const formatInputDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl p-20 glass">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 animate-pulse text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing configuration...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="rounded-3xl border-dashed p-20 text-center glass">
        <Settings2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
        <p className="font-display text-lg font-bold">Configuration unreachable</p>
        <p className="mt-2 text-sm italic text-muted-foreground">Failed to load project details from the core.</p>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border-white/10 shadow-xl shadow-primary/5 glass">
      <CardContent className="p-0">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 bg-white/5 p-8 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl font-bold">Core Configuration</CardTitle>
                <CardDescription className="font-medium italic">Adjust the project details and registration experience.</CardDescription>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={cancelEditing}
                    className="h-12 rounded-xl border-white/10 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="btn-aurora h-12 rounded-xl px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(true)}
                  className="btn-aurora h-12 rounded-xl px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Setting
                </Button>
              )}
            </div>
          </div>

          <fieldset disabled={fieldsDisabled} className={cn("space-y-10 p-8", fieldsDisabled && "opacity-80")}>
            <div className="rounded-2xl border-white/5 bg-primary/5 p-6 transition-all hover:bg-primary/10 glass group">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <Label className="font-display text-lg font-bold transition-colors group-hover:text-primary">Registration Status</Label>
                  <p className="text-sm font-medium text-muted-foreground">Enable or disable new registration pipelines across the platform.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[360px]">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <Label htmlFor="is_individual_registration_open" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Individual</Label>
                    <Switch id="is_individual_registration_open" name="is_individual_registration_open" defaultChecked={project.is_individual_registration_open} className="data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <Label htmlFor="is_group_registration_open" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Group</Label>
                    <Switch id="is_group_registration_open" name="is_group_registration_open" defaultChecked={project.is_group_registration_open} className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <SectionHeader icon={Settings2} title="Profile Matrix" />
                <div className="grid gap-6">
                  <Field label="Project Name" htmlFor="project_name">
                    <Input id="project_name" name="project_name" defaultValue={project.project_name} required className="h-12 rounded-xl border-white/10 bg-white/5" />
                  </Field>
                  <Field label="Status" htmlFor="status">
                    <div className="flex h-12 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {isStatusActive ? "Active" : "Closed"}
                      </span>
                      <Switch id="status" name="status" checked={isStatusActive} onCheckedChange={setIsStatusActive} className="data-[state=checked]:bg-primary" />
                    </div>
                  </Field>
                  <Field label="Site URL" htmlFor="project_site_url">
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                      <Input id="project_site_url" name="project_site_url" defaultValue={project.project_site_url} placeholder="https://example.com" className="h-12 rounded-xl border-white/10 bg-white/5 pl-11" />
                    </div>
                  </Field>
                  <Field label="Exhibitor Portal URL" htmlFor="exhibitor_portal_url">
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                      <Input id="exhibitor_portal_url" name="exhibitor_portal_url" defaultValue={project.exhibitor_portal_url} placeholder="https://..." className="h-12 rounded-xl border-white/10 bg-white/5 pl-11" />
                    </div>
                  </Field>
                  <Field label="Conference Booking URL" htmlFor="conference_booking_url">
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                      <Input id="conference_booking_url" name="conference_booking_url" defaultValue={project.conference_booking_url} placeholder="https://..." className="h-12 rounded-xl border-white/10 bg-white/5 pl-11" />
                    </div>
                  </Field>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Timezone">
                      <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={timezoneOpen} className="h-12 w-full justify-between rounded-xl border-white/10 bg-white/5 px-4 text-xs font-bold">
                            <span className="truncate">
                              {selectedTimezone ? timezones.find((tz) => tz.value === selectedTimezone)?.label : "Select timezone..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border-white/10 p-0 shadow-2xl glass" align="start">
                          <Command>
                            <CommandInput placeholder="Search timezone..." />
                            <CommandList>
                              <CommandEmpty>No timezone found.</CommandEmpty>
                              <CommandGroup>
                                {timezones.map((tz) => (
                                  <CommandItem key={tz.value} value={tz.value} onSelect={(value) => { setSelectedTimezone(value); setTimezoneOpen(false) }} className="text-xs font-bold">
                                    <Check className={cn("mr-2 h-4 w-4", selectedTimezone === tz.value ? "opacity-100" : "opacity-0")} />
                                    {tz.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <input type="hidden" name="timezone" value={selectedTimezone} />
                    </Field>
                    <Field label="Country">
                      <CountrySelector
                        value={countryCode}
                        onChange={setCountryCode}
                        label="Country"
                        placeholder="Select country..."
                        className="h-12 rounded-xl border-white/10 bg-white/5 px-4 text-xs font-bold"
                      />
                      <input type="hidden" name="country_code" value={selectedCountryName} />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <SectionHeader icon={CalendarDays} title="Temporal Matrix" />
                  <div className="grid gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 sm:grid-cols-2">
                    <Field label="Start Date" htmlFor="start_date">
                      <Input type="date" id="start_date" name="start_date" defaultValue={formatInputDate(project.start_date)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                    </Field>
                    <Field label="End Date" htmlFor="end_date">
                      <Input type="date" id="end_date" name="end_date" defaultValue={formatInputDate(project.end_date)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                    </Field>
                    <Field label="Exhibitor Edit Cutoff Date" htmlFor="cutoff_date_exhibitor_edit" className="sm:col-span-2">
                      <Input type="date" id="cutoff_date_exhibitor_edit" name="cutoff_date_exhibitor_edit" defaultValue={formatInputDate(project.cutoff_date_exhibitor_edit)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                    </Field>
                  </div>
                </div>

                <div className="space-y-6">
                  <SectionHeader icon={ImageIcon} title="Brand Assets" />
                  <div className="grid gap-6">
                    <Field label="Logo URL" htmlFor="logo_url">
                      <ImageUrlInput id="logo_url" name="logo_url" defaultValue={project.logo_url} />
                    </Field>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Banner URL" htmlFor="banner_url">
                        <ImageUrlInput id="banner_url" name="banner_url" defaultValue={project.banner_url} />
                      </Field>
                      <Field label="Banner 2 URL" htmlFor="banner_2_url">
                        <ImageUrlInput id="banner_2_url" name="banner_2_url" defaultValue={project.banner_2_url} />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Palette} title="Registration Branding" description="Colors use a picker with the selected color shown in the control." />
              <div className="grid gap-6 lg:grid-cols-3">
                <ColorField id="settings-theme-color" label="Theme Color" value={settingsForm.branding.theme_color} onChange={(value) => updateSettings((current) => ({ ...current, branding: { ...current.branding, theme_color: value } }))} />
                <ColorField id="settings-hover-color" label="Hover Color" value={settingsForm.branding.primary_hover_color} onChange={(value) => updateSettings((current) => ({ ...current, branding: { ...current.branding, primary_hover_color: value } }))} />
                <ColorField id="settings-accent-color" label="Accent Color" value={settingsForm.branding.accent_color} onChange={(value) => updateSettings((current) => ({ ...current, branding: { ...current.branding, accent_color: value } }))} />
              </div>
              <Field label="Favicon URL">
                <Input value={settingsForm.branding.favicon_url} onChange={(event) => updateSettings((current) => ({ ...current, branding: { ...current.branding, favicon_url: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
              </Field>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={CalendarDays} title="Display Dates" description="These values control registration copy and public schedule text inside settings." />
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Display Range">
                  <Input value={settingsForm.dates.display_range} onChange={(event) => updateSettings((current) => ({ ...current, dates: { ...current.dates, display_range: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Timezone">
                  <Input value={settingsForm.dates.timezone} onChange={(event) => updateSettings((current) => ({ ...current, dates: { ...current.dates, timezone: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Start Date">
                  <Input type="date" value={settingsForm.dates.start_date} onChange={(event) => updateSettings((current) => ({ ...current, dates: { ...current.dates, start_date: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="End Date">
                  <Input type="date" value={settingsForm.dates.end_date} onChange={(event) => updateSettings((current) => ({ ...current, dates: { ...current.dates, end_date: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Display Hours" className="lg:col-span-2">
                  <NativeTextarea value={settingsForm.dates.display_hours} onChange={(value) => updateSettings((current) => ({ ...current, dates: { ...current.dates, display_hours: value } }))} rows={3} />
                </Field>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Schedule</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest"
                    onClick={() => updateSettings((current) => ({ ...current, dates: { ...current.dates, schedule: [...current.dates.schedule, emptySchedule()] } }))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Day
                  </Button>
                </div>
                <div className="grid gap-4">
                  {settingsForm.dates.schedule.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <Field label="Date">
                        <Input type="date" value={item.date} onChange={(event) => updateSchedule(index, "date", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Open Time">
                        <Input type="time" value={item.open_time} onChange={(event) => updateSchedule(index, "open_time", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Close Time">
                        <Input type="time" value={item.close_time} onChange={(event) => updateSchedule(index, "close_time", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-5 h-12 rounded-xl border-white/10 bg-white/5"
                        onClick={() => updateSettings((current) => ({ ...current, dates: { ...current.dates, schedule: current.dates.schedule.filter((_, itemIndex) => itemIndex !== index) } }))}
                        aria-label="Remove schedule day"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Ticket} title="Badge Settings" />
              <div className="grid gap-6 lg:grid-cols-3">
                <Field label="Background Image URL" className="lg:col-span-3">
                  <ImageUrlInput value={settingsForm.badge.background_image_url} onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, background_image_url: value } }))} />
                </Field>
                <Field label="Default Category">
                  <Input value={settingsForm.badge.default_category} onChange={(event) => updateSettings((current) => ({ ...current, badge: { ...current.badge, default_category: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Default Country Label">
                  <Input value={settingsForm.badge.default_country_label} onChange={(event) => updateSettings((current) => ({ ...current, badge: { ...current.badge, default_country_label: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <CentimeterField
                  label="Page Width"
                  value={settingsForm.badge.page_size.width}
                  onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, page_size: { ...current.badge.page_size, width: value } } }))}
                />
                <CentimeterField
                  label="Page Height"
                  value={settingsForm.badge.page_size.height}
                  onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, page_size: { ...current.badge.page_size, height: value } } }))}
                />
                <CentimeterField
                  label="Header Spacer"
                  value={settingsForm.badge.layout.header_spacer_height}
                  onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, layout: { ...current.badge.layout, header_spacer_height: value } } }))}
                />
                <CentimeterField
                  label="Content Area"
                  value={settingsForm.badge.layout.content_area_height}
                  onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, layout: { ...current.badge.layout, content_area_height: value } } }))}
                />
                <CentimeterField
                  label="Footer Height"
                  value={settingsForm.badge.layout.footer_height}
                  onChange={(value) => updateSettings((current) => ({ ...current, badge: { ...current.badge, layout: { ...current.badge.layout, footer_height: value } } }))}
                />
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={FileText} title="HTML Content" description="Rich text fields preserve formatting and save as HTML." />
              <HtmlField id="closed_html_content" label="Closed Registration HTML" value={settingsForm.closed_html_content} onChange={(value) => updateSettings((current) => ({ ...current, closed_html_content: value }))} disabled={fieldsDisabled} />
              <HtmlField id="confirmation_message" label="Confirmation Message HTML" value={settingsForm.confirmation.message} onChange={(value) => updateSettings((current) => ({ ...current, confirmation: { ...current.confirmation, message: value } }))} disabled={fieldsDisabled} />
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Mail} title="Contact And Legal" />
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Contact Email">
                  <Input type="email" value={settingsForm.contact.email} onChange={(event) => updateSettings((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Website URL">
                  <Input value={settingsForm.contact.website_url} onChange={(event) => updateSettings((current) => ({ ...current, contact: { ...current.contact, website_url: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Marketing Consent Text">
                  <NativeTextarea value={settingsForm.legal.consent_marketing_text_en} onChange={(value) => updateSettings((current) => ({ ...current, legal: { ...current.legal, consent_marketing_text_en: value } }))} rows={3} />
                </Field>
                <Field label="PDPA Consent Text">
                  <NativeTextarea value={settingsForm.legal.consent_pdpa_text_en} onChange={(value) => updateSettings((current) => ({ ...current, legal: { ...current.legal, consent_pdpa_text_en: value } }))} rows={3} />
                </Field>
                <Field label="Privacy Policy URL" className="lg:col-span-2">
                  <Input value={settingsForm.legal.privacy_policy_url} onChange={(event) => updateSettings((current) => ({ ...current, legal: { ...current.legal, privacy_policy_url: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Social Links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest"
                    onClick={() => updateSettings((current) => ({ ...current, contact: { ...current.contact, social_links: [...current.contact.social_links, emptySocialLink()] } }))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </div>
                <div className="grid gap-4">
                  {settingsForm.contact.social_links.map((link, index) => (
                    <div key={`${link.type}-${index}`} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_2fr_auto]">
                      <Field label="Label">
                        <Input value={link.label} onChange={(event) => updateContactSocialLink(index, "label", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Type">
                        <SocialLinkTypeSelect value={link.type} onChange={(value) => updateContactSocialLinkType(index, value)} />
                      </Field>
                      <Field label="URL">
                        <Input value={link.url} onChange={(event) => updateContactSocialLink(index, "url", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-5 h-12 rounded-xl border-white/10 bg-white/5"
                        onClick={() => updateSettings((current) => ({ ...current, contact: { ...current.contact, social_links: current.contact.social_links.filter((_, linkIndex) => linkIndex !== index) } }))}
                        aria-label="Remove social link"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Globe} title="Exhibitor Portal" />
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Title">
                  <Input value={settingsForm.exhibitor_portal.title} onChange={(event) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, title: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Subtitle">
                  <Input value={settingsForm.exhibitor_portal.subtitle} onChange={(event) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, subtitle: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Footer Text">
                  <Input value={settingsForm.exhibitor_portal.footer_text} onChange={(event) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, footer_text: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Support Email">
                  <Input type="email" value={settingsForm.exhibitor_portal.support_email} onChange={(event) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, support_email: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Logo URL">
                  <ImageUrlInput value={settingsForm.exhibitor_portal.logo_url} onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, logo_url: value } }))} />
                </Field>
                <Field label="Favicon URL">
                  <ImageUrlInput value={settingsForm.exhibitor_portal.favicon_url} onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, favicon_url: value } }))} />
                </Field>
                <Field label="Default Country Code">
                  <CountrySelector
                    value={settingsForm.exhibitor_portal.defaults.default_country_code}
                    onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, defaults: { ...current.exhibitor_portal.defaults, default_country_code: value } } }))}
                    label="Default country code"
                    placeholder="Select country..."
                    className="h-12 rounded-xl border-white/10 bg-white/5 px-4 text-xs font-bold"
                  />
                </Field>
                <Field label="Default Phone Code">
                  <CountrySelector
                    value={settingsForm.exhibitor_portal.defaults.default_phone_code}
                    onChange={updateDefaultPhoneCode}
                    label="Default phone code"
                    placeholder="Select phone code..."
                    displayProperty="phoneCode"
                    className="h-12 rounded-xl border-white/10 bg-white/5 px-4 text-xs font-bold"
                  />
                </Field>
                <LanguageSelectField
                  label="Default Language"
                  value={settingsForm.exhibitor_portal.defaults.default_language}
                  onChange={updateExhibitorPortalDefaultLanguage}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <ColorField id="portal-theme-color" label="Portal Theme Color" value={settingsForm.exhibitor_portal.branding.theme_color} onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, branding: { ...current.exhibitor_portal.branding, theme_color: value } } }))} />
                <ColorField id="portal-hover-color" label="Portal Hover Color" value={settingsForm.exhibitor_portal.branding.primary_hover_color} onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, branding: { ...current.exhibitor_portal.branding, primary_hover_color: value } } }))} />
                <ColorField id="portal-accent-color" label="Portal Accent Color" value={settingsForm.exhibitor_portal.branding.accent_color} onChange={(value) => updateSettings((current) => ({ ...current, exhibitor_portal: { ...current.exhibitor_portal, branding: { ...current.exhibitor_portal.branding, accent_color: value } } }))} />
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Ticket} title="Registration Rules" />
              <div className="grid gap-6 lg:grid-cols-4">
                <Field label="Individual Type Code">
                  <Input value={settingsForm.registration.individual_attendee_type_code} onChange={(event) => updateSettings((current) => ({ ...current, registration: { ...current.registration, individual_attendee_type_code: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Group Type Code">
                  <Input value={settingsForm.registration.group_attendee_type_code} onChange={(event) => updateSettings((current) => ({ ...current, registration: { ...current.registration, group_attendee_type_code: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Group Min Members">
                  <Input type="number" min="0" value={settingsForm.registration.group_min_members} onChange={(event) => updateSettings((current) => ({ ...current, registration: { ...current.registration, group_min_members: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="Group Max Members">
                  <Input type="number" min="0" value={settingsForm.registration.group_max_members} onChange={(event) => updateSettings((current) => ({ ...current, registration: { ...current.registration, group_max_members: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <LanguageSelectField
                  label="Default Language"
                  value={settingsForm.preferences.default_language}
                  onChange={updatePreferenceDefaultLanguage}
                  options={preferenceDefaultLanguageOptions}
                />
                <LanguageMultiSelectField
                  label="Languages"
                  value={settingsForm.preferences.languages}
                  onChange={updatePreferenceLanguages}
                  className="lg:col-span-2"
                />
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={Search} title="SEO" />
              <div className="grid gap-6">
                <Field label="OG Title">
                  <Input value={settingsForm.seo.og_title} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, og_title: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
                <Field label="OG Description">
                  <NativeTextarea value={settingsForm.seo.og_description} onChange={(value) => updateSettings((current) => ({ ...current, seo: { ...current.seo, og_description: value } }))} rows={4} />
                </Field>
                <Field label="OG Image URL">
                  <ImageUrlInput value={settingsForm.seo.og_image} onChange={(value) => updateSettings((current) => ({ ...current, seo: { ...current.seo, og_image: value } }))} />
                </Field>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-8">
              <SectionHeader icon={LinkIcon} title="Related Brands" />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest"
                  onClick={() => updateSettings((current) => ({ ...current, related_brands: [...current.related_brands, emptyRelatedBrand()] }))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Brand
                </Button>
              </div>
              <div className="space-y-6">
                {settingsForm.related_brands.map((brand, brandIndex) => (
                  <div key={`${brand.label}-${brandIndex}`} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{brand.label || `Brand ${brandIndex + 1}`}</p>
                        <p className="text-xs text-muted-foreground">Brand details and social links</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-white/10 bg-white/5"
                        onClick={() => updateSettings((current) => ({ ...current, related_brands: current.related_brands.filter((_, itemIndex) => itemIndex !== brandIndex) }))}
                        aria-label="Remove related brand"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Field label="Label">
                        <Input value={brand.label} onChange={(event) => updateRelatedBrand(brandIndex, "label", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Short Label">
                        <Input value={brand.short_label} onChange={(event) => updateRelatedBrand(brandIndex, "short_label", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Description">
                        <Input value={brand.description} onChange={(event) => updateRelatedBrand(brandIndex, "description", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Website URL">
                        <Input value={brand.website_url} onChange={(event) => updateRelatedBrand(brandIndex, "website_url", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                      </Field>
                      <Field label="Logo URL" className="lg:col-span-2">
                        <ImageUrlInput value={brand.logo_url} onChange={(value) => updateRelatedBrand(brandIndex, "logo_url", value)} />
                      </Field>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Brand Social Links</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest"
                          onClick={() => updateSettings((current) => ({
                            ...current,
                            related_brands: current.related_brands.map((currentBrand, currentBrandIndex) =>
                              currentBrandIndex === brandIndex
                                ? { ...currentBrand, social_links: [...currentBrand.social_links, emptySocialLink()] }
                                : currentBrand
                            ),
                          }))}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Link
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {brand.social_links.map((link, linkIndex) => (
                          <div key={`${link.type}-${linkIndex}`} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_2fr_auto]">
                            <Field label="Type">
                              <SocialLinkTypeSelect value={link.type} onChange={(value) => updateRelatedBrandSocialLink(brandIndex, linkIndex, "type", value)} />
                            </Field>
                            <Field label="URL">
                              <Input value={link.url} onChange={(event) => updateRelatedBrandSocialLink(brandIndex, linkIndex, "url", event.target.value)} className="h-12 rounded-xl border-white/10 bg-white/5" />
                            </Field>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-5 h-12 rounded-xl border-white/10 bg-white/5"
                              onClick={() => updateSettings((current) => ({
                                ...current,
                                related_brands: current.related_brands.map((currentBrand, currentBrandIndex) =>
                                  currentBrandIndex === brandIndex
                                    ? { ...currentBrand, social_links: currentBrand.social_links.filter((_, currentLinkIndex) => currentLinkIndex !== linkIndex) }
                                    : currentBrand
                                ),
                              }))}
                              aria-label="Remove brand social link"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <SectionHeader icon={Copyright} title="Legal Matrix" />
                <Field label="Copyright Text" htmlFor="copy_right">
                  <Input id="copy_right" name="copy_right" defaultValue={project.copy_right} className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
              </div>
              <div className="space-y-6">
                <SectionHeader icon={ShieldCheck} title="Attendance Matrix" />
                <Field label="Attendance Marker Code" htmlFor="attendance_marker_code">
                  <Input id="attendance_marker_code" name="attendance_marker_code" defaultValue={project.attendance_marker_code ?? ""} placeholder="88888888" className="h-12 rounded-xl border-white/10 bg-white/5" />
                </Field>
              </div>
              <Field label="Venue Display Text" className="lg:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input value={settingsForm.venue.display_text} onChange={(event) => updateSettings((current) => ({ ...current, venue: { ...current.venue, display_text: event.target.value } }))} className="h-12 rounded-xl border-white/10 bg-white/5 pl-11" />
                </div>
              </Field>
            </div>
          </fieldset>

          <div className="border-t border-white/10 bg-white/5 p-8 sm:hidden">
            {isEditing ? (
              <div className="grid gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="btn-aurora h-14 w-full rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={cancelEditing}
                  className="h-12 w-full rounded-2xl border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                disabled={saving}
                onClick={() => setIsEditing(true)}
                className="btn-aurora h-14 w-full rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
              >
                <Pencil className="mr-2 h-5 w-5" />
                Edit Setting
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
