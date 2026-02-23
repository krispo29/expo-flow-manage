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
import { Label } from "@/components/ui/label";
import { countries } from "@/lib/countries"; 

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  label?: string;
  placeholder?: string;
  displayProperty?: 'name' | 'nationality' | 'phoneCode';
  required?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  label = "Country",
  placeholder = "Select country",
  displayProperty = "name",
  required = false
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      // Prioritize Vietnam first, then Thailand
      if (a.code === 'VN') return -1;
      if (b.code === 'VN') return 1;
      if (a.code === 'TH') return -1;
      if (b.code === 'TH') return 1;
      
      const valA = a[displayProperty as keyof typeof a] as string;
      const valB = b[displayProperty as keyof typeof b] as string;
      return valA.localeCompare(valB);
    });
  }, [displayProperty]);

  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal bg-background h-10"
          >
            {selectedCountry ? (
              <span className="flex items-center gap-2">
                <img 
                  src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`} 
                  alt={selectedCountry.name} 
                  className="w-5 h-auto rounded-sm object-cover shadow-sm"
                />
                <span className="truncate">{selectedCountry[displayProperty]}</span>
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
                    value={country[displayProperty]}
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
                      <span>{country[displayProperty]}</span>
                    </span>
                    {value === country.code && <Check className="ml-auto h-4 w-4" />}
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
