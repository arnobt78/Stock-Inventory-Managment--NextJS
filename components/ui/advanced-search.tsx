"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Save,
  Search,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface SearchFilter {
  field: string;
  value: string;
  operator: "contains" | "equals" | "starts_with" | "ends_with" | "greater_than" | "less_than";
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => void;
  onClear: () => void;
  isLoading?: boolean;
  savedSearches?: Array<{ name: string; query: string; filters: SearchFilter[] }>;
  onSaveSearch?: (name: string, query: string, filters: SearchFilter[]) => void;
  onLoadSearch?: (search: { name: string; query: string; filters: SearchFilter[] }) => void;
}

const searchFields = [
  { value: "name", label: "Product Name" },
  { value: "sku", label: "SKU" },
  { value: "category", label: "Category" },
  { value: "supplier", label: "Supplier" },
  { value: "status", label: "Status" },
];

const operators = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
];

export function AdvancedSearch({
  onSearch,
  onClear,
  isLoading = false,
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [newFilter, setNewFilter] = useState<SearchFilter>({
    field: "name",
    value: "",
    operator: "contains",
  });

  const handleAddFilter = () => {
    if (newFilter.value.trim()) {
      setFilters([...filters, { ...newFilter }]);
      setNewFilter({ field: "name", value: "", operator: "contains" });
    }
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleClear = () => {
    setQuery("");
    setFilters([]);
    onClear();
  };

  const handleSaveSearch = () => {
    if (onSaveSearch && (query.trim() || filters.length > 0)) {
      const name = prompt("Enter a name for this search:");
      if (name) {
        onSaveSearch(name, query, filters);
      }
    }
  };

  const activeFiltersCount = filters.length + (query.trim() ? 1 : 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Search className="h-5 w-5" />
          Advanced Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, category, or supplier..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            {isAdvancedOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Popover open={showSavedSearches} onOpenChange={setShowSavedSearches}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Saved Searches</h4>
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved searches</p>
                ) : (
                  <div className="">
                    {savedSearches.map((search, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          if (onLoadSearch) {
                            onLoadSearch(search);
                            setQuery(search.query);
                            setFilters(search.filters);
                          }
                          setShowSavedSearches(false);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{search.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {search.query || `${search.filters.length} filters`}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {(query.trim() || filters.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {query.trim() && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Query: {query}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setQuery("")}
                />
              </Badge>
            )}
            {filters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filter.field}: {filter.operator} &quot;{filter.value}&quot;
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter(index)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <Label htmlFor="filter-field">Field</Label>
                <select
                  id="filter-field"
                  value={newFilter.field}
                  onChange={(e) =>
                    setNewFilter({ ...newFilter, field: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  {searchFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="filter-operator">Operator</Label>
                <select
                  id="filter-operator"
                  value={newFilter.operator}
                  onChange={(e) =>
                    setNewFilter({
                      ...newFilter,
                      operator: e.target.value as SearchFilter["operator"],
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="filter-value">Value</Label>
                <Input
                  id="filter-value"
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter({ ...newFilter, value: e.target.value })
                  }
                  placeholder="Enter value..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddFilter()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddFilter} className="w-full">
                  Add Filter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex-1"
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-4 rounded-full" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          {onSaveSearch && (query.trim() || filters.length > 0) && (
            <Button variant="outline" onClick={handleSaveSearch}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
