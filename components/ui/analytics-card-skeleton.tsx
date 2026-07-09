/**
 * Analytics Card Skeleton Component
 * Skeleton loader that matches exact dimensions of AnalyticsCard
 * Used during data fetching to prevent layout shift
 */

import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

/**
 * Props for AnalyticsCardSkeleton component
 */
interface AnalyticsCardSkeletonProps {
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * AnalyticsCardSkeleton component
 * Displays a skeleton loader matching AnalyticsCard structure and dimensions
 * Matches: CardHeader (), CardTitle (text-sm), Icon (h-4 w-4), Value (text-lg sm:text-xl), Description (text-xs)
 */
export function AnalyticsCardSkeleton({
  className,
}: AnalyticsCardSkeletonProps) {
  return (
    <Card className={cn("min-h-[140px] h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
        {/* Title skeleton - matches text-sm font-medium (14px font, ~20px line-height) */}
        <Skeleton className="h-5 w-24" />
        {/* Icon skeleton - matches h-4 w-4 */}
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        {/* Value skeleton - matches text-lg sm:text-xl font-medium (24px font, ~32px line-height) */}
        <Skeleton className="h-8 w-32" />
        {/* Description skeleton - matches text-xs (12px font, ~16px line-height) with mt-1 */}
        <Skeleton className="h-4 w-full mt-1" />
      </CardContent>
    </Card>
  );
}
