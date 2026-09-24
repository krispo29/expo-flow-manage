"use client"

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countries, findCountryByPhoneCodeOrValue, getCountryDisplayName, getDefaultCountryCodeForProject } from "@/lib/countries";
import { getSelectedProject, getStoredProjects } from "@/lib/auth-storage";
import { THAILAB2026_PROJECT_UUID } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  label?: string;
  placeholder?: string;
  displayProperty?: 'name' | 'nationality' | 'phoneCode';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  projectId?: string;
  projectCode?: string;
}

export function CountrySelector({
  value,
  onChange,
  label = "Country",
  placeholder = "Select country",
  displayProperty = "name",
  required = false,
  disabled = false,
  className,
  projectId: propProjectId,
  projectCode: propProjectCode,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const userProjectId = useAuthStore((state) => state.user?.projectId);
  const projectIdFromUrl =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('projectId');
  const selectedProjectId =
    propProjectId || projectIdFromUrl || userProjectId || getSelectedProject();
  const matchedProject = getStoredProjects().find(
    (project) => project.project_uuid === selectedProjectId
  );
  const projectCode =
    propProjectCode ||
    (selectedProjectId === THAILAB2026_PROJECT_UUID
      ? 'THAILAB2026'
      : matchedProject?.project_code);
  const getDisplayValue = (country: typeof countries[number]) =>
    displayProperty === 'name'
      ? getCountryDisplayName(country, projectCode)
      : country[displayProperty];

  const primaryCountryCode = useMemo(() => {
    return getDefaultCountryCodeForProject(
      propProjectCode || matchedProject || selectedProjectId
    );
  }, [propProjectCode, matchedProject, selectedProjectId]);

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      // 1. Primary project country is top priority
      if (a.code === primaryCountryCode) return -1;
      if (b.code === primaryCountryCode) return 1;

      // 2. Secondary regional priorities
      const secondaries = ['TH', 'VN', 'ID'].filter((code) => code !== primaryCountryCode);
      for (const sec of secondaries) {
        if (a.code === sec) return -1;
        if (b.code === sec) return 1;
      }

      const valA = a[displayProperty as keyof typeof a] as string;
      const valB = b[displayProperty as keyof typeof b] as string;
      return valA.localeCompare(valB);
    });
  }, [displayProperty, primaryCountryCode]);

  const selectedCountry = findCountryByPhoneCodeOrValue(value);

  return (
    <>
      <Popover open={disabled ? false : open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            aria-required={required}
            disabled={disabled}
            className={cn("h-10 w-full justify-between bg-background font-normal", className)}
          >
            {selectedCountry ? (
              <span className="flex items-center gap-2">
                <img 
                  src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`} 
                  alt={selectedCountry.name} 
                  className="w-5 h-auto rounded-sm object-cover shadow-sm"
                />
                <span className="truncate">{getDisplayValue(selectedCountry)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {sortedCountries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={getDisplayValue(country)}
                    onSelect={() => {
                      onChange(country.code);
                      setOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2 w-full">
                      <img 
                        src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                        alt={country.name} 
                        className="w-5 h-auto rounded-sm object-cover shadow-sm"
                      />
                      <span>{getDisplayValue(country)}</span>
                    </span>
                    {selectedCountry?.code === country.code && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
