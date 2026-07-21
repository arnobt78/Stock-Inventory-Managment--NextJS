/**
 * Centralized type exports
 * Re-export all types from organized type files
 */

// Product types
export type {
  Product,
  ProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from "./product";

// Category types
export type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category";

// Supplier types
export type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "./supplier";

// Warehouse types
export type {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "./warehouse";

// Auth types
export type {
  User,
  AuthContextType,
  LoginInput,
  RegisterInput,
  LoginResponse,
  EmailNotificationType,
  EmailPreferences,
  UpdateEmailPreferencesInput,
  DEFAULT_EMAIL_PREFERENCES,
} from "./auth";

// Order types
export type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  BillingAddress,
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilters,
} from "./order";

// Notification types
export type {
  Notification,
  NotificationType,
  NotificationMetadata,
  CreateNotificationInput,
  UpdateNotificationInput,
  NotificationFilters,
} from "./notification";

// Invoice types
export type {
  Invoice,
  InvoiceStatus,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "./invoice";

// History (Import History) types
export type {
  ImportHistoryForPage,
  ImportHistoryStatus,
  ImportHistoryType,
  ImportHistoryErrorItem,
} from "./history";

// Support Ticket types
export type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
  SupportTicketFilters,
  SupportTicketReply,
  CreateSupportTicketReplyInput,
  ProductOwnerOption,
  SupportTicketOwnerProduct,
} from "./support-ticket";

// Product Review types
export type {
  ProductReview,
  ProductReviewStatus,
  CreateProductReviewInput,
  UpdateProductReviewInput,
  ProductReviewFilters,
  ReviewEligibilitySlot,
} from "./product-review";

// Dashboard (admin overview) types
export type {
  DashboardStats,
  DashboardCounts,
  DashboardRevenue,
  DashboardTrendPoint,
  DashboardRecent,
  DashboardRecentOrder,
  DashboardRecentTicket,
  DashboardRecentReview,
  DashboardRecentImport,
  DashboardOrderAnalytics,
  DashboardOrderStatusDist,
  DashboardTopProduct,
  DashboardInvoiceAnalytics,
  DashboardInvoiceStatusDist,
  DashboardWarehouseAnalytics,
  DashboardProductStatusBreakdown,
  DashboardUserRoleBreakdown,
  DashboardSupplierStatusBreakdown,
  DashboardCategoryStatusBreakdown,
  DashboardTicketStatusBreakdown,
  DashboardReviewStatusBreakdown,
  DashboardSelfOthersBreakdown,
} from "./dashboard";

// Stock Allocation types
export type {
  StockTransferStatus,
  StockAllocation,
  StockTransfer,
  CreateStockAllocationInput,
  UpdateStockAllocationInput,
  CreateStockTransferInput,
  WarehouseStockSummary,
} from "./stock-allocation";

// Forecasting types
export type {
  ProductSalesHistory,
  ProductDemandForecast,
  SalesAnomaly,
  ForecastingSummary,
  TrendAnalysis,
} from "./forecasting";

// Portal types
export type {
  SupplierPortalDashboard,
  ClientPortalDashboard,
  ClientCatalogOverview,
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
  PortalUser,
} from "./portal";

// Payment types
export type {
  CheckoutType,
  CreateCheckoutInput,
  CheckoutSessionResponse,
  PaymentRecord,
  StripeWebhookEventType,
  WebhookPayload,
} from "./payment";

// Shipping types
export type {
  ShippingCarrier,
  ShippingAddress as ShippoShippingAddress,
  ParcelDimensions,
  ShippingRate,
  GenerateLabelInput,
  GenerateLabelResponse,
  AddTrackingInput,
  GetRatesInput,
  GetRatesResponse,
  TrackingStatus,
  TrackingEvent,
  TrackingInfoResponse,
  ShippoWebhookPayload,
} from "./shipping";

// User Management (admin) types
export type {
  UserForAdmin,
  UserOverview,
  UserRole,
  UpdateUserAdminInput,
  CreateUserAdminInput,
  UserManagementFilters,
} from "./user-management";

// Admin Client Portal types
export type {
  ClientPortalStats,
  ClientPortalCounts,
  ClientPortalRevenue,
  ClientPortalRecentOrder,
  ClientPortalRecentInvoice,
  ClientPortalClient,
} from "./client-portal";

// Admin Supplier Portal types
export type {
  SupplierPortalStats,
  SupplierPortalCounts,
  SupplierPortalRecentProduct,
  SupplierPortalRecentOrder,
  SupplierPortalSupplier,
} from "./supplier-portal";

// System Configuration types
export type {
  ConfigValueType,
  ConfigCategory,
  SystemConfig,
  UpdateSystemConfigInput,
  SystemConfigGroup,
} from "./system-config";
export { DEFAULT_CONFIGS, CATEGORY_LABELS } from "./system-config";

// Audit Log types
export type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  CreateAuditLogInput,
  AuditLogFilters,
} from "./audit-log";

// API types (AdminCounts for admin sidebar counts)
export type { AdminCounts } from "./api";

// Re-export email types (InvoiceEmailData is in lib/email/types.ts, not types/)
export type { InvoiceEmailData } from "@/lib/email/types";
