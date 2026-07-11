/**
 * Centralized API Client
 * Single Axios instance used by all hooks in hooks/queries: products, orders, invoices, auth, etc.
 * Sends session cookie (withCredentials) and optional Bearer token; baseURL points to /api.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "./endpoints";
import {
  createApiError,
  getErrorMessage,
  isAxiosError,
  type ApiError,
} from "./errors";
import type {
  Product,
  Category,
  Supplier,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  LoginInput,
  RegisterInput,
  LoginResponse,
  EmailPreferences,
  UpdateEmailPreferencesInput,
  Order,
  CreateOrderInput,
  UpdateOrderInput,
  Notification,
  UpdateNotificationInput,
  NotificationFilters,
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  ImportHistoryForPage,
  SupportTicket,
  SupportTicketReply,
  CreateSupportTicketInput,
  CreateSupportTicketReplyInput,
  UpdateSupportTicketInput,
  ProductReview,
  CreateProductReviewInput,
  UpdateProductReviewInput,
  ReviewEligibilitySlot,
  DashboardStats,
  UserForAdmin,
  UpdateUserAdminInput,
  CreateUserAdminInput,
  ClientPortalStats,
  SupplierPortalStats,
  StockAllocation,
  CreateStockAllocationInput,
  StockTransfer,
  CreateStockTransferInput,
  WarehouseStockSummary,
  ForecastingSummary,
  SupplierPortalDashboard,
  ClientPortalDashboard,
  ClientCatalogOverview,
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
  CreateCheckoutInput,
  CheckoutSessionResponse,
  GenerateLabelInput,
  GenerateLabelResponse,
  AddTrackingInput,
  GetRatesInput,
  GetRatesResponse,
  SystemConfig,
  UpdateSystemConfigInput,
  AuditLog,
  AuditLogFilters,
  AdminCounts,
} from "@/types";

/**
 * API Response wrapper
 * Standardized response format
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/** Builds Axios instance with baseURL (/api), credentials, and request/response interceptors. */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL:
      process.env.NODE_ENV === "production"
        ? "https://stockly-inventory.vercel.app/api"
        : "http://localhost:3000/api",
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Ensure cookies are sent with requests
    timeout: 30000, // 30 second timeout
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = Cookies.get("session_id");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor - Handle errors globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isAxiosError(error)) {
        // Transform AxiosError to ApiError for consistent error handling
        return Promise.reject(createApiError(error));
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

/**
 * API Client class
 * Provides type-safe methods for all API endpoints
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createAxiosInstance();
  }

  /**
   * Authentication API methods
   */
  auth = {
    /**
     * Login user
     * Returns: { userId, userName, userEmail, sessionId }
     */
    login: async (data: LoginInput): Promise<ApiResponse<LoginResponse>> => {
      const response = await this.client.post<LoginResponse>(
        API_ENDPOINTS.auth.login,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Register new user
     */
    register: async (
      data: RegisterInput,
    ): Promise<ApiResponse<{ id: string; name: string; email: string }>> => {
      const response = await this.client.post<{
        id: string;
        name: string;
        email: string;
      }>(API_ENDPOINTS.auth.register, data);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Logout user
     */
    logout: async (): Promise<ApiResponse<void>> => {
      const response = await this.client.post<void>(API_ENDPOINTS.auth.logout);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get current session
     */
    getSession: async (): Promise<
      ApiResponse<{
        id: string;
        name: string;
        email: string;
      }>
    > => {
      const response = await this.client.get<{
        id: string;
        name: string;
        email: string;
      }>(API_ENDPOINTS.auth.session);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Products API methods
   */
  products = {
    /**
     * Get all products
     */
    getAll: async (): Promise<ApiResponse<Product[]>> => {
      const response = await this.client.get<Product[]>(
        API_ENDPOINTS.products.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get product by ID
     */
    getById: async (id: string): Promise<ApiResponse<Product>> => {
      const response = await this.client.get<Product>(
        `${API_ENDPOINTS.products.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Create new product
     */
    create: async (data: CreateProductInput): Promise<ApiResponse<Product>> => {
      const response = await this.client.post<Product>(
        API_ENDPOINTS.products.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update existing product
     * Note: API expects { id, ...productData } in body
     */
    update: async (data: UpdateProductInput): Promise<ApiResponse<Product>> => {
      const response = await this.client.put<Product>(
        API_ENDPOINTS.products.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete product
     * Note: App Router API uses query parameter ?id=...
     */
    delete: async (
      id: string,
    ): Promise<ApiResponse<{ success: boolean; mode?: "soft" | "hard" }>> => {
      const response = await this.client.delete<{
        success: boolean;
        mode?: "soft" | "hard";
      }>(`${API_ENDPOINTS.products.base}?id=${id}`);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Categories API methods
   */
  categories = {
    /**
     * Get all categories
     */
    getAll: async (): Promise<ApiResponse<Category[]>> => {
      const response = await this.client.get<Category[]>(
        API_ENDPOINTS.categories.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get category by ID
     */
    getById: async (id: string): Promise<ApiResponse<Category>> => {
      const response = await this.client.get<Category>(
        `${API_ENDPOINTS.categories.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Create new category
     */
    create: async (
      data: CreateCategoryInput,
    ): Promise<ApiResponse<Category>> => {
      const response = await this.client.post<Category>(
        API_ENDPOINTS.categories.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update existing category
     * Note: API expects { id, name } in body
     */
    update: async (
      data: UpdateCategoryInput,
    ): Promise<ApiResponse<Category>> => {
      const response = await this.client.put<Category>(
        API_ENDPOINTS.categories.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete category
     * Note: App Router API uses query parameter ?id=...
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await this.client.delete<void>(
        `${API_ENDPOINTS.categories.base}?id=${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Suppliers API methods
   */
  suppliers = {
    /**
     * Get all suppliers
     */
    getAll: async (): Promise<ApiResponse<Supplier[]>> => {
      const response = await this.client.get<Supplier[]>(
        API_ENDPOINTS.suppliers.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get supplier by ID
     */
    getById: async (id: string): Promise<ApiResponse<Supplier>> => {
      const response = await this.client.get<Supplier>(
        `${API_ENDPOINTS.suppliers.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Create new supplier
     */
    create: async (
      data: CreateSupplierInput,
    ): Promise<ApiResponse<Supplier>> => {
      const response = await this.client.post<Supplier>(
        API_ENDPOINTS.suppliers.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update existing supplier
     * Note: API expects { id, name } in body
     */
    update: async (
      data: UpdateSupplierInput,
    ): Promise<ApiResponse<Supplier>> => {
      const response = await this.client.put<Supplier>(
        API_ENDPOINTS.suppliers.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete supplier
     * Note: App Router API uses query parameter ?id=...
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await this.client.delete<void>(
        `${API_ENDPOINTS.suppliers.base}?id=${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Warehouses API methods
   */
  warehouses = {
    getAll: async (): Promise<ApiResponse<Warehouse[]>> => {
      const response = await this.client.get<Warehouse[]>(
        API_ENDPOINTS.warehouses.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getById: async (id: string): Promise<ApiResponse<Warehouse>> => {
      const response = await this.client.get<Warehouse>(
        `${API_ENDPOINTS.warehouses.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    create: async (
      data: CreateWarehouseInput,
    ): Promise<ApiResponse<Warehouse>> => {
      const response = await this.client.post<Warehouse>(
        API_ENDPOINTS.warehouses.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    update: async (
      data: UpdateWarehouseInput,
    ): Promise<ApiResponse<Warehouse>> => {
      const response = await this.client.put<Warehouse>(
        API_ENDPOINTS.warehouses.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await this.client.delete<void>(
        `${API_ENDPOINTS.warehouses.base}?id=${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Import History (Admin History) API methods
   */
  importHistory = {
    getAll: async (): Promise<ApiResponse<ImportHistoryForPage[]>> => {
      const response = await this.client.get<ImportHistoryForPage[]>(
        API_ENDPOINTS.importHistory.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getById: async (id: string): Promise<ApiResponse<ImportHistoryForPage>> => {
      const response = await this.client.get<ImportHistoryForPage>(
        `${API_ENDPOINTS.importHistory.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Support Tickets API methods
   */
  supportTickets = {
    getAll: async (params?: {
      view?: "all" | "assigned_to_me" | "created_by_me";
    }): Promise<ApiResponse<SupportTicket[]>> => {
      const url =
        params?.view && params.view !== "all"
          ? `${API_ENDPOINTS.supportTickets.base}?view=${params.view}`
          : API_ENDPOINTS.supportTickets.base;
      const response = await this.client.get<SupportTicket[]>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getById: async (id: string): Promise<ApiResponse<SupportTicket>> => {
      const response = await this.client.get<SupportTicket>(
        `${API_ENDPOINTS.supportTickets.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    create: async (
      data: CreateSupportTicketInput,
    ): Promise<ApiResponse<SupportTicket>> => {
      const response = await this.client.post<SupportTicket>(
        API_ENDPOINTS.supportTickets.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    update: async (
      id: string,
      data: UpdateSupportTicketInput,
    ): Promise<ApiResponse<SupportTicket>> => {
      const response = await this.client.put<SupportTicket>(
        `${API_ENDPOINTS.supportTickets.base}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await this.client.delete<{ success: boolean }>(
        `${API_ENDPOINTS.supportTickets.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getReplies: async (
      id: string,
    ): Promise<ApiResponse<SupportTicketReply[]>> => {
      const response = await this.client.get<SupportTicketReply[]>(
        `${API_ENDPOINTS.supportTickets.base}/${id}/replies`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    createReply: async (
      id: string,
      data: CreateSupportTicketReplyInput,
    ): Promise<ApiResponse<SupportTicketReply>> => {
      const response = await this.client.post<SupportTicketReply>(
        `${API_ENDPOINTS.supportTickets.base}/${id}/replies`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Product Reviews API methods
   */
  productReviews = {
    getAll: async (): Promise<ApiResponse<ProductReview[]>> => {
      const response = await this.client.get<ProductReview[]>(
        API_ENDPOINTS.productReviews.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getById: async (id: string): Promise<ApiResponse<ProductReview>> => {
      const response = await this.client.get<ProductReview>(
        `${API_ENDPOINTS.productReviews.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getEligibility: async (
      productId: string,
      orderId?: string,
    ): Promise<
      ApiResponse<{ eligible: boolean; slots: ReviewEligibilitySlot[] }>
    > => {
      const params: { productId: string; orderId?: string } = { productId };
      if (orderId) params.orderId = orderId;
      const response = await this.client.get<{
        eligible: boolean;
        slots: ReviewEligibilitySlot[];
      }>(`${API_ENDPOINTS.productReviews.base}/eligibility`, {
        params,
      });
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getByProductId: async (
      productId: string,
      status?: "approved" | "pending" | "all",
    ): Promise<ApiResponse<ProductReview[]>> => {
      const params = status ? { status } : {};
      const response = await this.client.get<ProductReview[]>(
        `${API_ENDPOINTS.productReviews.base}/by-product/${productId}`,
        { params },
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    create: async (
      data: CreateProductReviewInput,
    ): Promise<ApiResponse<ProductReview>> => {
      const response = await this.client.post<ProductReview>(
        API_ENDPOINTS.productReviews.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    update: async (
      id: string,
      data: UpdateProductReviewInput,
    ): Promise<ApiResponse<ProductReview>> => {
      const response = await this.client.put<ProductReview>(
        `${API_ENDPOINTS.productReviews.base}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await this.client.delete<{ success: boolean }>(
        `${API_ENDPOINTS.productReviews.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Dashboard (admin overview) API methods
   */
  dashboard = {
    getOverview: async (): Promise<ApiResponse<DashboardStats>> => {
      const response = await this.client.get<DashboardStats>(
        API_ENDPOINTS.dashboard.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Users (admin User Management) API methods
   */
  users = {
    getAll: async (): Promise<ApiResponse<UserForAdmin[]>> => {
      const response = await this.client.get<UserForAdmin[]>(
        API_ENDPOINTS.users.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getById: async (id: string): Promise<ApiResponse<UserForAdmin>> => {
      const response = await this.client.get<UserForAdmin>(
        `${API_ENDPOINTS.users.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    update: async (
      id: string,
      data: UpdateUserAdminInput,
    ): Promise<ApiResponse<UserForAdmin>> => {
      const response = await this.client.put<UserForAdmin>(
        `${API_ENDPOINTS.users.base}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    create: async (
      data: CreateUserAdminInput,
    ): Promise<ApiResponse<UserForAdmin>> => {
      const response = await this.client.post<UserForAdmin>(
        API_ENDPOINTS.users.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    delete: async (id: string): Promise<ApiResponse<UserForAdmin>> => {
      const response = await this.client.delete<UserForAdmin>(
        `${API_ENDPOINTS.users.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Admin Client Portal API methods
   */
  clientPortal = {
    getOverview: async (): Promise<ApiResponse<ClientPortalStats>> => {
      const response = await this.client.get<ClientPortalStats>(
        API_ENDPOINTS.clientPortal.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Admin Supplier Portal API methods
   */
  supplierPortal = {
    getOverview: async (): Promise<ApiResponse<SupplierPortalStats>> => {
      const response = await this.client.get<SupplierPortalStats>(
        API_ENDPOINTS.supplierPortal.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Stock Allocations API methods
   */
  stockAllocations = {
    getAll: async (): Promise<ApiResponse<StockAllocation[]>> => {
      const response = await this.client.get<StockAllocation[]>(
        API_ENDPOINTS.stockAllocations.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getSummary: async (): Promise<ApiResponse<WarehouseStockSummary[]>> => {
      const response = await this.client.get<WarehouseStockSummary[]>(
        `${API_ENDPOINTS.stockAllocations.base}?summary=true`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getByWarehouse: async (
      warehouseId: string,
    ): Promise<ApiResponse<StockAllocation[]>> => {
      const response = await this.client.get<StockAllocation[]>(
        `${API_ENDPOINTS.stockAllocations.base}?warehouseId=${warehouseId}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getByProduct: async (
      productId: string,
    ): Promise<ApiResponse<StockAllocation[]>> => {
      const response = await this.client.get<StockAllocation[]>(
        `${API_ENDPOINTS.stockAllocations.base}?productId=${productId}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    create: async (
      data: CreateStockAllocationInput,
    ): Promise<ApiResponse<StockAllocation>> => {
      const response = await this.client.post<StockAllocation>(
        API_ENDPOINTS.stockAllocations.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Stock Transfers API methods
   */
  stockTransfers = {
    create: async (
      data: CreateStockTransferInput,
    ): Promise<ApiResponse<StockTransfer>> => {
      const response = await this.client.post<StockTransfer>(
        API_ENDPOINTS.stockTransfers.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Forecasting API methods
   */
  forecasting = {
    getSummary: async (): Promise<ApiResponse<ForecastingSummary>> => {
      const response = await this.client.get<ForecastingSummary>(
        API_ENDPOINTS.forecasting.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Portal API methods (external supplier/client portals)
   */
  portal = {
    getSupplierDashboard: async (): Promise<
      ApiResponse<SupplierPortalDashboard>
    > => {
      const response = await this.client.get<SupplierPortalDashboard>(
        API_ENDPOINTS.portal.supplier,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getClientDashboard: async (): Promise<
      ApiResponse<ClientPortalDashboard>
    > => {
      const response = await this.client.get<ClientPortalDashboard>(
        API_ENDPOINTS.portal.client,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getClientCatalog: async (): Promise<
      ApiResponse<ClientCatalogOverview>
    > => {
      const response = await this.client.get<ClientCatalogOverview>(
        API_ENDPOINTS.portal.clientCatalog,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getClientBrowseMeta: async (): Promise<ApiResponse<ClientBrowseMeta>> => {
      const response = await this.client.get<ClientBrowseMeta>(
        API_ENDPOINTS.portal.clientBrowseMeta,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    getClientBrowseProducts: async (
      params: { ownerId: string; supplierId?: string; categoryId?: string },
    ): Promise<ApiResponse<ClientBrowseProductsResponse>> => {
      const searchParams = new URLSearchParams();
      searchParams.set("ownerId", params.ownerId);
      if (params.supplierId) searchParams.set("supplierId", params.supplierId);
      if (params.categoryId) searchParams.set("categoryId", params.categoryId);
      const url = `${API_ENDPOINTS.portal.clientBrowseProducts}?${searchParams.toString()}`;
      const response = await this.client.get<ClientBrowseProductsResponse>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Payments API methods
   */
  payments = {
    createCheckout: async (
      data: CreateCheckoutInput,
    ): Promise<ApiResponse<CheckoutSessionResponse>> => {
      const response = await this.client.post<CheckoutSessionResponse>(
        API_ENDPOINTS.payments.checkout,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Shipping API methods
   */
  shipping = {
    getRates: async (
      data: GetRatesInput,
    ): Promise<ApiResponse<GetRatesResponse>> => {
      const response = await this.client.post<GetRatesResponse>(
        API_ENDPOINTS.shipping.rates,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    generateLabel: async (
      data: GenerateLabelInput,
    ): Promise<ApiResponse<GenerateLabelResponse>> => {
      const response = await this.client.post<GenerateLabelResponse>(
        API_ENDPOINTS.shipping.labels,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    addTracking: async (
      data: AddTrackingInput,
    ): Promise<ApiResponse<GenerateLabelResponse>> => {
      const response = await this.client.post<GenerateLabelResponse>(
        API_ENDPOINTS.shipping.tracking,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * System Configuration API methods
   */
  systemConfig = {
    getAll: async (): Promise<
      ApiResponse<{
        configs: SystemConfig[];
        categories: Record<string, string>;
      }>
    > => {
      const response = await this.client.get<{
        configs: SystemConfig[];
        categories: Record<string, string>;
      }>(API_ENDPOINTS.systemConfig.base);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    update: async (
      configs: UpdateSystemConfigInput[],
    ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
      const response = await this.client.put<{
        success: boolean;
        message: string;
      }>(API_ENDPOINTS.systemConfig.base, { configs });
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Audit Logs API methods
   */
  auditLogs = {
    getAll: async (
      filters?: AuditLogFilters & { page?: number; limit?: number },
    ): Promise<
      ApiResponse<{
        logs: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    > => {
      const params = new URLSearchParams();
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));
      if (filters?.userId) params.append("userId", filters.userId);
      if (filters?.action) params.append("action", filters.action);
      if (filters?.entityType) params.append("entityType", filters.entityType);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if ((filters as { period?: string })?.period)
        params.append("period", (filters as { period?: string }).period!);

      const url = `${API_ENDPOINTS.auditLogs.base}${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await this.client.get<{
        logs: AuditLog[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * User API methods
   */
  user = {
    /**
     * Get email preferences
     */
    getEmailPreferences: async (): Promise<ApiResponse<EmailPreferences>> => {
      const response = await this.client.get<
        { success: boolean; data: EmailPreferences } | EmailPreferences
      >(API_ENDPOINTS.user.emailPreferences);
      // Handle both response formats (with wrapper or direct)
      const data =
        (response.data as { success?: boolean; data?: EmailPreferences })
          .data || (response.data as EmailPreferences);
      return {
        data: data as EmailPreferences,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update email preferences
     */
    updateEmailPreferences: async (
      data: UpdateEmailPreferencesInput,
    ): Promise<ApiResponse<EmailPreferences>> => {
      const response = await this.client.put<
        { success: boolean; data: EmailPreferences } | EmailPreferences
      >(API_ENDPOINTS.user.emailPreferences, data);
      // Handle both response formats (with wrapper or direct)
      const responseData =
        (response.data as { success?: boolean; data?: EmailPreferences })
          .data || (response.data as EmailPreferences);
      return {
        data: responseData as EmailPreferences,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Orders API methods
   */
  orders = {
    /**
     * Get all orders
     */
    getAll: async (): Promise<ApiResponse<Order[]>> => {
      const response = await this.client.get<Order[]>(
        API_ENDPOINTS.orders.base,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get order by ID
     */
    getById: async (id: string): Promise<ApiResponse<Order>> => {
      const response = await this.client.get<Order>(
        `${API_ENDPOINTS.orders.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Create new order
     */
    create: async (data: CreateOrderInput): Promise<ApiResponse<Order>> => {
      const response = await this.client.post<Order>(
        API_ENDPOINTS.orders.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update existing order
     */
    update: async (
      id: string,
      data: UpdateOrderInput,
    ): Promise<ApiResponse<Order>> => {
      const response = await this.client.put<Order>(
        `${API_ENDPOINTS.orders.base}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete/Cancel order
     */
    delete: async (id: string): Promise<ApiResponse<Order>> => {
      const response = await this.client.delete<Order>(
        `${API_ENDPOINTS.orders.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Admin API methods (client orders = orders containing my products)
   */
  admin = {
    getClientOrders: async (): Promise<ApiResponse<Order[]>> => {
      const response = await this.client.get<Order[]>(
        API_ENDPOINTS.admin.clientOrders,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
    getClientInvoices: async (
      filters?: InvoiceFilters,
    ): Promise<ApiResponse<Invoice[]>> => {
      const params = new URLSearchParams();
      if (filters?.searchTerm) {
        params.append("searchTerm", filters.searchTerm);
      }
      if (filters?.status && filters.status.length > 0) {
        filters.status.forEach((status) => params.append("status", status));
      }
      if (filters?.orderId) {
        params.append("orderId", filters.orderId);
      }
      if (filters?.clientId) {
        params.append("clientId", filters.clientId);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters?.dueDateStart) {
        params.append("dueDateStart", filters.dueDateStart);
      }
      if (filters?.dueDateEnd) {
        params.append("dueDateEnd", filters.dueDateEnd);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.admin.clientInvoices}?${queryString}`
        : API_ENDPOINTS.admin.clientInvoices;

      const response = await this.client.get<Invoice[]>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
    getCounts: async (): Promise<ApiResponse<AdminCounts>> => {
      const response = await this.client.get<AdminCounts>(
        API_ENDPOINTS.admin.counts,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Notifications API methods
   */
  notifications = {
    /**
     * Get all notifications for the authenticated user
     */
    getAll: async (
      filters?: NotificationFilters,
    ): Promise<ApiResponse<Notification[]>> => {
      const params = new URLSearchParams();
      if (filters?.read !== undefined) {
        params.append("read", filters.read.toString());
      }
      if (filters?.type && filters.type.length > 0) {
        filters.type.forEach((type) => params.append("type", type));
      }
      if (filters?.limit) {
        params.append("limit", filters.limit.toString());
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.notifications.inApp}?${queryString}`
        : API_ENDPOINTS.notifications.inApp;

      const response = await this.client.get<Notification[]>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
      const response = await this.client.get<{ count: number }>(
        API_ENDPOINTS.notifications.unreadCount,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get notification by ID
     */
    getById: async (id: string): Promise<ApiResponse<Notification>> => {
      const response = await this.client.get<Notification>(
        `${API_ENDPOINTS.notifications.inApp}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update notification (mark as read/unread)
     */
    update: async (
      id: string,
      data: UpdateNotificationInput,
    ): Promise<ApiResponse<Notification>> => {
      const response = await this.client.put<Notification>(
        `${API_ENDPOINTS.notifications.inApp}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
      const response = await this.client.put<{ count: number }>(
        `${API_ENDPOINTS.notifications.inApp}/mark-all-read`,
        {},
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete notification
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await this.client.delete<void>(
        `${API_ENDPOINTS.notifications.inApp}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };

  /**
   * Invoices API methods
   */
  invoices = {
    /**
     * Get all invoices for the authenticated user
     */
    getAll: async (
      filters?: InvoiceFilters,
    ): Promise<ApiResponse<Invoice[]>> => {
      const params = new URLSearchParams();
      if (filters?.searchTerm) {
        params.append("searchTerm", filters.searchTerm);
      }
      if (filters?.status && filters.status.length > 0) {
        filters.status.forEach((status) => params.append("status", status));
      }
      if (filters?.orderId) {
        params.append("orderId", filters.orderId);
      }
      if (filters?.clientId) {
        params.append("clientId", filters.clientId);
      }
      if (filters?.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters?.dueDateStart) {
        params.append("dueDateStart", filters.dueDateStart);
      }
      if (filters?.dueDateEnd) {
        params.append("dueDateEnd", filters.dueDateEnd);
      }
      if (filters?.scope) {
        params.append("scope", filters.scope);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.invoices.base}?${queryString}`
        : API_ENDPOINTS.invoices.base;

      const response = await this.client.get<Invoice[]>(url);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Get invoice by ID
     */
    getById: async (id: string): Promise<ApiResponse<Invoice>> => {
      const response = await this.client.get<Invoice>(
        `${API_ENDPOINTS.invoices.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Create new invoice from order
     */
    create: async (data: CreateInvoiceInput): Promise<ApiResponse<Invoice>> => {
      const response = await this.client.post<Invoice>(
        API_ENDPOINTS.invoices.base,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Update existing invoice
     */
    update: async (
      id: string,
      data: UpdateInvoiceInput,
    ): Promise<ApiResponse<Invoice>> => {
      const response = await this.client.put<Invoice>(
        `${API_ENDPOINTS.invoices.base}/${id}`,
        data,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Delete invoice
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await this.client.delete<void>(
        `${API_ENDPOINTS.invoices.base}/${id}`,
      );
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },

    /**
     * Send invoice via email
     */
    send: async (
      id: string,
    ): Promise<
      ApiResponse<{ success: boolean; message: string; invoice: Invoice }>
    > => {
      const response = await this.client.post<{
        success: boolean;
        message: string;
        invoice: Invoice;
      }>(`${API_ENDPOINTS.invoices.base}/${id}/send`, {});
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    },
  };
}

/**
 * Singleton API client instance
 * Export single instance for use throughout the application
 */
export const apiClient = new ApiClient();

/**
 * Export error utilities for use in components
 */
export {
  getErrorMessage,
  isAuthError,
  isNetworkError,
  type ApiError,
} from "./errors";
