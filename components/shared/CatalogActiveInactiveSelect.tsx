"use client";

/**
 * REQ-0041 — catalog Active/Inactive status Select with entity icon + glass badges.
 * DeferredSelectGate avoids Radix portal teardown on App Router navigation.
 */
import { ChevronDown } from "lucide-react";
import { DeferredSelectGate } from "@/components/shared/DeferredSelectGate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ActiveInactiveBadge } from "@/lib/ui/semantic-badges";
import {
  CATALOG_ENTITY_META,
  type CatalogEntity,
  type CatalogStatusFilter,
} from "@/lib/ui/catalog-filter-tokens";
import { cn } from "@/lib/utils";

export type CatalogActiveInactiveSelectProps = {
  entity: CatalogEntity;
  value: CatalogStatusFilter;
  onValueChange: (value: CatalogStatusFilter) => void;
  className?: string;
};

function SelectTriggerLabel({
  entity,
  value,
}: {
  entity: CatalogEntity;
  value: CatalogStatusFilter;
}) {
  const meta = CATALOG_ENTITY_META[entity];
  const Icon = meta.icon;

  if (value === "all") {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
        <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="truncate">{meta.allLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      <ActiveInactiveBadge active={value === "active"} size="compact" />
    </div>
  );
}

export function CatalogActiveInactiveSelect({
  entity,
  value,
  onValueChange,
  className,
}: CatalogActiveInactiveSelectProps) {
  const meta = CATALOG_ENTITY_META[entity];
  const Icon = meta.icon;

  return (
    <DeferredSelectGate
      placeholder={
        <div className={cn(meta.selectPlaceholderClass, "gap-2")} aria-hidden>
          <SelectTriggerLabel entity={entity} value={value} />
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        </div>
      }
    >
      {({ selectRemountKey }) => (
        <Select
          key={selectRemountKey}
          value={value}
          onValueChange={(next) => onValueChange(next as CatalogStatusFilter)}
        >
          <SelectTrigger
            className={cn(meta.selectTriggerClass, "[&>div]:min-w-0", className)}
          >
            <SelectTriggerLabel entity={entity} value={value} />
          </SelectTrigger>
          <SelectContent className={meta.selectContentClass}>
            <SelectItem value="all" className={meta.selectItemClass}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {meta.allLabel}
              </span>
            </SelectItem>
            <SelectItem value="active" className={meta.selectItemClass}>
              <ActiveInactiveBadge active size="compact" />
            </SelectItem>
            <SelectItem value="inactive" className={meta.selectItemClass}>
              <ActiveInactiveBadge active={false} size="compact" />
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </DeferredSelectGate>
  );
}
