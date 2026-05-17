import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PREDEFINED_CATEGORIES = [
  "Cloud Servers",
  "IT Hardware",
  "Networking",
  "Office Supplies",
  "Furniture",
  "Pantry Consumables",
  "Stationery",
  "Miscellaneous",
  "Audio Visual Equipment",
  "Security Systems",
  "Printing Solutions",
  "Storage Devices",
  "Computer Accessories",
  "Power Solutions",
  "Cables & Connectors",
  "Software Licenses",
  "Maintenance Services",
];

export interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onChange,
  placeholder = "Search or create category...",
  className,
  disabled = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [showCustomOption, setShowCustomOption] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredCategories = React.useMemo(() => {
    if (!inputValue) {
      return PREDEFINED_CATEGORIES.slice(0, 10);
    }
    const query = inputValue.toLowerCase();
    return PREDEFINED_CATEGORIES
      .filter((category) => category.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b));
  }, [inputValue]);

  const noMatchFound = inputValue.length > 0 && filteredCategories.length === 0 && !showCustomOption;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
    setShowCustomOption(false);
  };

  const handleCreateCustomCategory = () => {
    const customCategory = inputValue.trim();
    if (customCategory) {
      onChange(customCategory);
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
                handleCreateCustomCategory();
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center">
              {noMatchFound ? (
                <div className="space-y-3 px-2">
                  <p className="text-sm text-muted-foreground">No category found</p>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Create:</p>
                    <p className="font-medium text-foreground">"{inputValue}"</p>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleCreateCustomCategory}
                      className="w-full"
                    >
                      Create category
                    </Button>
                  </div>
                </div>
              ) : (
                "Type to search or create categories..."
              )}
            </CommandEmpty>
            {filteredCategories.length > 0 && (
              <CommandItem
                value="category-list"
                className="hidden"
                disabled
              />
            )}
            {filteredCategories.map((category) => (
              <CommandItem
                key={category}
                value={category}
                onSelect={() => handleSelect(category)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.toLowerCase() === category.toLowerCase()
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {category}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CategoryCombobox;