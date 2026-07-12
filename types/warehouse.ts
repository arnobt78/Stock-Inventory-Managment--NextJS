/**
 * Warehouse-related type definitions
 */

import type { WarehouseInsights } from "@/types/warehouse-insights";

/**
 * Warehouse interface matching Prisma schema
 */
export interface Warehouse {
  id: string;
  name: string;
  address?: string | null;
  type?: string | null;
  status: boolean;
  userId: string;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  /** REQ-0084 — stock allocation KPIs (SSR from allocations). */
  warehouseInsights?: WarehouseInsights | null;
}

/**
 * Warehouse creation input
 */
export interface CreateWarehouseInput {
  name: string;
  address?: string | null;
  type?: string | null;
  status?: boolean;
}

/**
 * Warehouse update input
 */
export interface UpdateWarehouseInput {
  id: string;
  name: string;
  address?: string | null;
  type?: string | null;
  status?: boolean;
}
