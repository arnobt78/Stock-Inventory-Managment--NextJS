/**
 * Card Skeleton Component
 * Skeleton loading component that matches exact card dimensions
 * Reusable for AnalyticsCard, ChartCard, and other card components
 */

import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

/**
 * Props for CardSkeleton component
 */
interface CardSkeletonProps {
  /**
   * Optional className for the card container
   */
  className?: string;
  /**
   * Whether to show icon skeleton in header (default: true)
   */
  showIcon?: boolean;
  /**
   * Whether to show description skeleton (default: true)
   */
  showDescription?: boolean;
  /**
   * Height of the content area (default: "h-24")
   */
  contentHeight?: string;
}

/**
 * CardSkeleton component
 * Displays a skeleton loader that matches the exact structure and dimensions of card components
 * Matches AnalyticsCard and ChartCard structure
 */
export function CardSkeleton({
  className = "",
  showIcon = true,
  showDescription = true,
  contentHeight = "h-24",
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
        <Skeleton className="h-4 w-24" />
        {showIcon && <Skeleton className="h-4 w-4 rounded" />}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        {showDescription && <Skeleton className="h-3 w-full mt-1" />}
        <Skeleton className={`${contentHeight} w-full mt-2`} />
      </CardContent>
    </Card>
  );
}
