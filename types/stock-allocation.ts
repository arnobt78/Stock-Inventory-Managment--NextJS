/**
 * Stock Allocation & Transfer type definitions
 */

/**
 * Stock allocation status
 */
export type StockTransferStatus = "pending" | "completed" | "cancelled";

/**
 * Stock allocation interface (product in a warehouse)
 */
export interface StockAllocation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  userId: string;
  createdAt: string;
  updatedAt: string | null;
  // Extended with relations
  product?: {
    id: string;
    name: string;
    sku: string;
    /** Product image for allocation row thumbnails (REQ-0059) */
    imageUrl?: string | null;
    price?: number;
    /** Global product stock (not warehouse allocation qty) */
    quantity?: number;
    categoryName?: string | null;
    supplierName?: string | null;
  };
  warehouse?: {
    id: string;
    name: string;
    /** Warehouse active flag for product-detail inline badge (REQ-0077) */
    status?: boolean;
  };
}

/**
 * Stock transfer interface
 */
export interface StockTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: StockTransferStatus;
  notes: string | null;
  userId: string;
  createdAt: string;
  completedAt: string | null;
  // Extended with relations
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  fromWarehouse?: {
    id: string;
    name: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
  };
}

/**
 * Create stock allocation input
 */
export interface CreateStockAllocationInput {
  productId: string;
  warehouseId: string;
  quantity: number;
}

/**
 * Update stock allocation input
 */
export interface UpdateStockAllocationInput {
  quantity?: number;
}

/**
 * Create stock transfer input
 */
export interface CreateStockTransferInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}

/**
 * Stock by warehouse summary
 */
export interface WarehouseStockSummary {
  warehouseId: string;
  warehouseName: string;
  totalProducts: number;
  totalQuantity: number;
  totalReserved: number;
  totalValue: number;
}
