import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GLOBAL_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "Dell",
  "HP",
  "Lenovo",
  "Acer",
  "Asus",
  "Blue Star",
  "LG",
  "Bosch",
  "CP Plus",
  "Sandisk",
  "Canon",
  "Epson",
  "Intel",
  "AMD",
  "Cisco",
  "Safex",
  "Black & Decker",
  "Microsoft",
  "Western Digital",
  "Seagate",
  "Kingston",
  "Logitech",
  "Jabra",
  "Plantronics",
  "Poly",
  "TP-Link",
  "D-Link",
  "Netgear",
  "Linksys",
  "BenQ",
  "ViewSonic",
  "LG Electronics",
  "Hitachi",
  "Toshiba",
  "Panasonic",
  "Philips",
  "Huawei",
  "Zebra",
  "Honeywell",
  "Datalogic",
  "Motorola",
  "Realme",
  "Xiaomi",
  "OnePlus",
  "Oppo",
  "Vivo",
  "Micromax",
  "ibo",
  "Haier",
  "Godrej",
  "Voltas",
  "Daikin",
  "Mitsubishi",
  "Sharp",
  "Fujitsu",
  "APC",
  "Eaton",
  "Emerson",
  "CyberPower",
  "Tripp Lite",
  "Belkin",
  "Anker",
  "Duracell",
];

export interface BrandAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function BrandAutocomplete({
  value,
  onChange,
  placeholder = "Search brand...",
  className,
  disabled = false,
}: BrandAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [showCustomOption, setShowCustomOption] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredBrands = React.useMemo(() => {
    if (!inputValue) {
      return GLOBAL_BRANDS.slice(0, 10);
    }
    const query = inputValue.toLowerCase();
    return GLOBAL_BRANDS
      .filter((brand) => brand.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b));
  }, [inputValue]);

  const noMatchFound = inputValue.length > 0 && filteredBrands.length === 0 && !showCustomOption;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
    setShowCustomOption(false);
  };

  const handleUseCustomBrand = () => {
    const customBrand = inputValue.trim();
    if (customBrand) {
      onChange(customBrand);
      setOpen(false);
      setShowCustomOption(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
    setShowCustomOption(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && noMatchFound) {
                handleUseCustomBrand();
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center">
              {noMatchFound ? (
                <div className="space-y-3 px-2">
                  <p className="text-sm text-muted-foreground">No match found</p>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Continue with custom brand:</p>
                    <p className="font-medium text-foreground">"{inputValue}"</p>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleUseCustomBrand}
                      className="w-full"
                    >
                      Use custom brand
                    </Button>
                  </div>
                </div>
              ) : (
                "Type to search brands..."
              )}
            </CommandEmpty>
            {filteredBrands.length > 0 && (
              <CommandItem
                value="brand-list"
                className="hidden"
                disabled
              />
            )}
            {filteredBrands.map((brand) => (
              <CommandItem
                key={brand}
                value={brand}
                onSelect={() => handleSelect(brand)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.toLowerCase() === brand.toLowerCase()
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {brand}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default BrandAutocomplete;