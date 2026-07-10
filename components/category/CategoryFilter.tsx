"use client";

import * as React from "react";
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
import { FolderTree } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/queries";
import { useAuth } from "@/contexts";

type CategoryDropDownProps = {
  selectedCategory: string[];
  setSelectedCategory: React.Dispatch<React.SetStateAction<string[]>>;
  /** When provided (e.g. client browse mode), use these instead of fetching */
  categoriesOverride?: Array<{ id: string; name: string }>;
};

export function CategoryDropDown({
  selectedCategory,
  setSelectedCategory,
  categoriesOverride,
}: CategoryDropDownProps) {
  const [open, setOpen] = React.useState(false);
  const { data: categories = [] } = useCategories();
  const { user } = useAuth();

  const userCategories = React.useMemo(() => {
    if (categoriesOverride) return categoriesOverride;
    return categories.filter((category) => category.userId === user?.id);
  }, [categories, user, categoriesOverride]);

  function handleCheckboxChange(value: string) {
    setSelectedCategory((prev) => {
      const updatedCategories = prev.includes(value)
        ? prev.filter((category) => category !== value)
        : [...prev, value];
      return updatedCategories;
    });
  }

  function clearFilters() {
    setSelectedCategory([]);
  }

  return (
    <div className="flex items-center poppins w-full sm:w-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"secondary"}
            className="h-10 w-full sm:w-auto rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15"
          >
            <FolderTree className="h-4 w-4 mr-1" aria-hidden />
            Categories
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-56 poppins rounded-[28px] border border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(2,132,199,0.15)] [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-gray-300/50 [&_[cmdk-input-wrapper]]:dark:border-white/10 [&_[cmdk-input-wrapper]]:bg-white/10 [&_[cmdk-input-wrapper]]:dark:bg-white/5 [&_[cmdk-input-wrapper]]:backdrop-blur-md"
          side="bottom"
          align="end"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Category"
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
                No category found.
              </CommandEmpty>
              <CommandGroup>
                {userCategories.map((category) => (
                  <CommandItem
                    className="h-9 text-gray-700 dark:text-white/80 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                    key={category.id}
                  >
                    <Checkbox
                      checked={selectedCategory.includes(category.id)} // Use category ID
                      onClick={() => handleCheckboxChange(category.id)} // Pass category ID
                      className="size-4 rounded-[4px] border-white/20 bg-white/5 backdrop-blur-md accent-sky-500 focus:ring-sky-500/50 focus:ring-2"
                    />
                    <div
                      className={`flex items-center gap-1 p-1 rounded-lg px-2 text-[14px]`}
                    >
                      {category.name}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                onClick={clearFilters}
                variant={"ghost"}
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-white/10"
              >
                Clear Filters
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
