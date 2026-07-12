"use client";

import React, { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileJson,
  Zap,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  FileText,
  Warehouse,
  BarChart3,
  Activity,
  Server,
  Code2,
  Key,
  Database,
  BookOpen,
  Package,
  Users,
} from "lucide-react";
import Navbar from "@/components/layouts/Navbar";
import {
  PageContentWrapper,
  PageSectionHeader,
  SectionCardHeader,
} from "@/components/shared";
import { CopyCodeButton } from "@/components/shared";
import type { SectionHeaderTone } from "@/lib/ui/section-header-tones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";

/** Slug for tab value from section name */
function getTabValue(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+&\s+/g, "-")
    .replace(/\s+/g, "-");
}

/**
 * Color variants for glassmorphic cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
  },
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
  },
  orange: {
    border: "border-orange-400/20",
    gradient:
      "bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(249,115,22,0.15)] dark:shadow-[0_15px_40px_rgba(249,115,22,0.1)]",
    hoverBorder: "hover:border-orange-300/40",
  },
  teal: {
    border: "border-teal-400/20",
    gradient:
      "bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(20,184,166,0.15)] dark:shadow-[0_15px_40px_rgba(20,184,166,0.1)]",
    hoverBorder: "hover:border-teal-300/40",
  },
};

/**
 * Glassmorphic Card component for API docs
 */
function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "rounded-[20px] border backdrop-blur-md transition overflow-hidden",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

export default function ApiDocsPage() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => setBaseUrl(window.location.origin));
    }
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const endpoints = [
    {
      name: "Authentication",
      icon: Key,
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/register",
          description: "Register a new user",
          parameters: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "User's full name",
            },
            {
              name: "email",
              type: "string",
              required: true,
              description: "User's email address",
            },
            {
              name: "password",
              type: "string",
              required: true,
              description: "User's password (min 6 characters)",
            },
          ],
          response: {
            success: {
              status: 201,
              data: "{ id: string, name: string, email: string }",
            },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Authenticate user and get session token",
          parameters: [
            {
              name: "email",
              type: "string",
              required: true,
              description: "User's email address",
            },
            {
              name: "password",
              type: "string",
              required: true,
              description: "User's password",
            },
          ],
          response: {
            success: {
              status: 200,
              data: "{ token: string, user: { id: string, name: string, email: string } }",
            },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Logout user and clear session",
          parameters: [],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 500, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/auth/session",
          description: "Get current user session",
          parameters: [],
          response: {
            success: {
              status: 200,
              data: "{ id: string, name: string, email: string }",
            },
            error: { status: 401, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Products",
      icon: Package,
      endpoints: [
        {
          method: "GET",
          path: "/api/products",
          description: "Get all products for the authenticated user",
          parameters: [],
          response: {
            success: { status: 200, data: "Product[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/products",
          description: "Create a new product",
          parameters: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Product name",
            },
            {
              name: "sku",
              type: "string",
              required: true,
              description: "Unique SKU",
            },
            {
              name: "price",
              type: "number",
              required: true,
              description: "Product price",
            },
            {
              name: "quantity",
              type: "number",
              required: true,
              description: "Product quantity",
            },
            {
              name: "status",
              type: "string",
              required: true,
              description: "Product status",
            },
            {
              name: "categoryId",
              type: "string",
              required: true,
              description: "Category ID",
            },
            {
              name: "supplierId",
              type: "string",
              required: true,
              description: "Supplier ID",
            },
          ],
          response: {
            success: { status: 201, data: "Product" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/products",
          description: "Update an existing product",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Product ID",
            },
            {
              name: "name",
              type: "string",
              required: true,
              description: "Product name",
            },
            {
              name: "sku",
              type: "string",
              required: true,
              description: "Unique SKU",
            },
            {
              name: "price",
              type: "number",
              required: true,
              description: "Product price",
            },
            {
              name: "quantity",
              type: "number",
              required: true,
              description: "Product quantity",
            },
            {
              name: "status",
              type: "string",
              required: true,
              description: "Product status",
            },
            {
              name: "categoryId",
              type: "string",
              required: true,
              description: "Category ID",
            },
            {
              name: "supplierId",
              type: "string",
              required: true,
              description: "Supplier ID",
            },
          ],
          response: {
            success: { status: 200, data: "Product" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "DELETE",
          path: "/api/products",
          description: "Delete a product",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Product ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Categories",
      icon: Database,
      endpoints: [
        {
          method: "GET",
          path: "/api/categories",
          description: "Get all categories for the authenticated user",
          parameters: [],
          response: {
            success: { status: 200, data: "Category[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/categories",
          description: "Create a new category",
          parameters: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Category name",
            },
          ],
          response: {
            success: { status: 201, data: "Category" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/categories",
          description: "Update an existing category",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Category ID",
            },
            {
              name: "name",
              type: "string",
              required: true,
              description: "Category name",
            },
          ],
          response: {
            success: { status: 200, data: "Category" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "DELETE",
          path: "/api/categories",
          description: "Delete a category",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Category ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Suppliers",
      icon: Users,
      endpoints: [
        {
          method: "GET",
          path: "/api/suppliers",
          description: "Get all suppliers for the authenticated user",
          parameters: [],
          response: {
            success: { status: 200, data: "Supplier[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/suppliers",
          description: "Create a new supplier",
          parameters: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Supplier name",
            },
            {
              name: "email",
              type: "string",
              required: false,
              description: "Supplier email",
            },
            {
              name: "phone",
              type: "string",
              required: false,
              description: "Supplier phone",
            },
          ],
          response: {
            success: { status: 201, data: "Supplier" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/suppliers",
          description: "Update an existing supplier",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Supplier ID",
            },
            {
              name: "name",
              type: "string",
              required: true,
              description: "Supplier name",
            },
            {
              name: "email",
              type: "string",
              required: false,
              description: "Supplier email",
            },
            {
              name: "phone",
              type: "string",
              required: false,
              description: "Supplier phone",
            },
          ],
          response: {
            success: { status: 200, data: "Supplier" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "DELETE",
          path: "/api/suppliers",
          description: "Delete a supplier",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Supplier ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Orders",
      icon: ShoppingCart,
      endpoints: [
        {
          method: "GET",
          path: "/api/orders",
          description:
            "List orders for the authenticated user (or client/supplier filtered)",
          parameters: [],
          response: {
            success: { status: 200, data: "Order[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/orders",
          description: "Create a new order with line items",
          parameters: [
            {
              name: "items",
              type: "array",
              required: true,
              description: "Order line items (productId, quantity, price)",
            },
            {
              name: "shippingAddress",
              type: "object",
              required: false,
              description: "Shipping address",
            },
          ],
          response: {
            success: { status: 201, data: "Order" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/orders/[id]",
          description: "Get order by ID",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Order ID",
            },
          ],
          response: {
            success: { status: 200, data: "Order" },
            error: { status: 404, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/orders/[id]",
          description: "Update order (status, etc.)",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Order ID",
            },
          ],
          response: {
            success: { status: 200, data: "Order" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "DELETE",
          path: "/api/orders/[id]",
          description: "Cancel order",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Order ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Invoices",
      icon: FileText,
      endpoints: [
        {
          method: "GET",
          path: "/api/invoices",
          description: "List invoices for the authenticated user",
          parameters: [],
          response: {
            success: { status: 200, data: "Invoice[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/invoices",
          description: "Create invoice (e.g. from order)",
          parameters: [],
          response: {
            success: { status: 201, data: "Invoice" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/invoices/[id]",
          description: "Get invoice by ID",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Invoice ID",
            },
          ],
          response: {
            success: { status: 200, data: "Invoice" },
            error: { status: 404, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/invoices/[id]",
          description: "Update invoice",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Invoice ID",
            },
          ],
          response: {
            success: { status: 200, data: "Invoice" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/invoices/[id]/send",
          description: "Send invoice to customer",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Invoice ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/invoices/[id]/pdf",
          description: "Get invoice PDF",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Invoice ID",
            },
          ],
          response: {
            success: { status: 200, data: "PDF binary" },
            error: { status: 404, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Warehouses",
      icon: Warehouse,
      endpoints: [
        {
          method: "GET",
          path: "/api/warehouses",
          description: "List warehouses for the authenticated user",
          parameters: [],
          response: {
            success: { status: 200, data: "Warehouse[]" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "POST",
          path: "/api/warehouses",
          description: "Create a warehouse",
          parameters: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Warehouse name",
            },
            {
              name: "type",
              type: "string",
              required: false,
              description: "Type (main, storage, etc.)",
            },
            {
              name: "status",
              type: "boolean",
              required: false,
              description: "Active status",
            },
          ],
          response: {
            success: { status: 201, data: "Warehouse" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/warehouses/[id]",
          description: "Get warehouse by ID",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Warehouse ID",
            },
          ],
          response: {
            success: { status: 200, data: "Warehouse" },
            error: { status: 404, data: "{ error: string }" },
          },
        },
        {
          method: "PUT",
          path: "/api/warehouses/[id]",
          description: "Update warehouse",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Warehouse ID",
            },
          ],
          response: {
            success: { status: 200, data: "Warehouse" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
        {
          method: "DELETE",
          path: "/api/warehouses/[id]",
          description: "Delete warehouse",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Warehouse ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ message: string }" },
            error: { status: 400, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Dashboard",
      icon: BarChart3,
      endpoints: [
        {
          method: "GET",
          path: "/api/dashboard",
          description:
            "Get store dashboard stats (counts, revenue, analytics, trends). Admin/store owner only.",
          parameters: [],
          response: {
            success: { status: 200, data: "DashboardStats" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "Health & System",
      icon: Activity,
      endpoints: [
        {
          method: "GET",
          path: "/api/health",
          description:
            "Service health (database, redis, imagekit, brevo). No auth required.",
          parameters: [],
          response: {
            success: { status: 200, data: "{ status, services, uptime }" },
            error: { status: 503, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/performance",
          description:
            "API performance summary (endpoints, response times, error rates)",
          parameters: [],
          response: {
            success: { status: 200, data: "{ summary }" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/system-metrics",
          description: "Cache, database, and process metrics",
          parameters: [],
          response: {
            success: { status: 200, data: "{ cache, database, resources }" },
            error: { status: 401, data: "{ error: string }" },
          },
        },
        {
          method: "GET",
          path: "/api/openapi",
          description: "OpenAPI 3.0 specification (JSON)",
          parameters: [],
          response: {
            success: { status: 200, data: "OpenAPI spec object" },
            error: { status: 500, data: "{ error: string }" },
          },
        },
      ],
    },
    {
      name: "More APIs",
      icon: Server,
      endpoints: [
        {
          method: "GET",
          path: "/api/notifications/in-app",
          description: "List in-app notifications",
          parameters: [],
          response: {
            success: { status: 200, data: "Notification[]" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/notifications/in-app/unread-count",
          description: "Unread notification count",
          parameters: [],
          response: {
            success: { status: 200, data: "{ count }" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/support-tickets",
          description: "List support tickets",
          parameters: [],
          response: {
            success: { status: 200, data: "Ticket[]" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/support-tickets/[id]",
          description: "Get ticket by ID",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Ticket ID",
            },
          ],
          response: {
            success: { status: 200, data: "Ticket" },
            error: { status: 404, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/product-reviews",
          description: "List product reviews",
          parameters: [],
          response: {
            success: { status: 200, data: "Review[]" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/product-reviews/[id]",
          description: "Get review by ID",
          parameters: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "Review ID",
            },
          ],
          response: {
            success: { status: 200, data: "Review" },
            error: { status: 404, data: "{}" },
          },
        },
        {
          method: "POST",
          path: "/api/payments/checkout",
          description: "Create Stripe checkout session",
          parameters: [
            {
              name: "type",
              type: "string",
              required: true,
              description: "order | invoice",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "Order or invoice ID",
            },
          ],
          response: {
            success: { status: 200, data: "{ url }" },
            error: { status: 400, data: "{}" },
          },
        },
        {
          method: "POST",
          path: "/api/products/import",
          description: "Bulk import products (CSV/Excel)",
          parameters: [],
          response: {
            success: { status: 200, data: "{ success, failed }" },
            error: { status: 400, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/import-history",
          description: "List import history",
          parameters: [],
          response: {
            success: { status: 200, data: "ImportHistory[]" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/user/email-preferences",
          description: "Get email preferences",
          parameters: [],
          response: {
            success: { status: 200, data: "EmailPreferences" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "PUT",
          path: "/api/user/email-preferences",
          description: "Update email preferences",
          parameters: [],
          response: {
            success: { status: 200, data: "EmailPreferences" },
            error: { status: 400, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/ai/insights",
          description: "AI-generated business insights",
          parameters: [],
          response: {
            success: { status: 200, data: "object" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/forecasting",
          description: "Demand/forecast data",
          parameters: [],
          response: {
            success: { status: 200, data: "object" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/audit-logs",
          description: "Audit log entries",
          parameters: [],
          response: {
            success: { status: 200, data: "AuditLog[]" },
            error: { status: 401, data: "{}" },
          },
        },
        {
          method: "GET",
          path: "/api/system-config",
          description: "System configuration",
          parameters: [],
          response: {
            success: { status: 200, data: "object" },
            error: { status: 401, data: "{}" },
          },
        },
      ],
    },
  ];

  const dataTypes = [
    {
      name: "Product",
      fields: [
        { name: "id", type: "string", description: "Unique identifier" },
        { name: "name", type: "string", description: "Product name" },
        { name: "sku", type: "string", description: "Stock Keeping Unit" },
        { name: "price", type: "number", description: "Product price" },
        { name: "quantity", type: "number", description: "Available quantity" },
        { name: "status", type: "string", description: "Product status" },
        {
          name: "categoryId",
          type: "string",
          description: "Category reference",
        },
        {
          name: "supplierId",
          type: "string",
          description: "Supplier reference",
        },
        { name: "userId", type: "string", description: "Owner user ID" },
        { name: "createdAt", type: "Date", description: "Creation timestamp" },
        { name: "category", type: "string", description: "Category name" },
        { name: "supplier", type: "string", description: "Supplier name" },
      ],
    },
    {
      name: "Category",
      fields: [
        { name: "id", type: "string", description: "Unique identifier" },
        { name: "name", type: "string", description: "Category name" },
        { name: "userId", type: "string", description: "Owner user ID" },
        { name: "createdAt", type: "Date", description: "Creation timestamp" },
      ],
    },
    {
      name: "Supplier",
      fields: [
        { name: "id", type: "string", description: "Unique identifier" },
        { name: "name", type: "string", description: "Supplier name" },
        { name: "email", type: "string", description: "Supplier email" },
        { name: "phone", type: "string", description: "Supplier phone" },
        { name: "userId", type: "string", description: "Owner user ID" },
        { name: "createdAt", type: "Date", description: "Creation timestamp" },
      ],
    },
    {
      name: "User",
      fields: [
        { name: "id", type: "string", description: "Unique identifier" },
        { name: "name", type: "string", description: "User's full name" },
        { name: "email", type: "string", description: "User's email address" },
        { name: "username", type: "string", description: "Unique username" },
        {
          name: "createdAt",
          type: "Date",
          description: "Account creation timestamp",
        },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30";
      case "POST":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30";
      case "PUT":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30";
      case "DELETE":
        return "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-400/30";
    }
  };

  // Map endpoint sections to color variants
  const sectionVariants: Record<string, CardVariant> = {
    Authentication: "violet",
    Products: "emerald",
    Categories: "sky",
    Suppliers: "orange",
    Orders: "blue",
    Invoices: "rose",
    Warehouses: "teal",
    Dashboard: "amber",
    "Health & System": "emerald",
    "More APIs": "sky",
  };

  const getFetchExample = (method: string, path: string): string => {
    const url = `${baseUrl}${path}`;
    if (method === "GET") {
      return `fetch(\`${url}\`, {\n  credentials: "include",\n})\n  .then((res) => res.json())\n  .then((data) => console.log(data));`;
    }
    return `fetch(\`${url}\`, {\n  method: "${method}",\n  credentials: "include",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ /* your payload */ }),\n})\n  .then((res) => res.json())\n  .then((data) => console.log(data));`;
  };

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="flex flex-col gap-6">
          {/* Header — PageSectionHeader parity (REQ-0075 AC3) */}
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            icon={BookOpen}
            tone="blue"
            title="Stock API Documentation"
            description="Comprehensive API documentation for the Stock inventory management system. All endpoints require authentication via JWT token."
          />

          {/* Quick Info Cards — skeleton until mounted to avoid hydration mismatch and match loading UX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {!isMounted ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <article
                    key={i}
                    className="rounded-[20px] border border-gray-300/30 dark:border-white/10 bg-gradient-to-br from-gray-100/50 via-gray-100/30 to-gray-100/20 dark:from-white/5 dark:via-white/5 dark:to-white/5 min-h-[120px] p-2 sm:p-4 animate-pulse"
                  >
                    <Skeleton className="h-9 w-9 rounded-xl mb-3" />
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </article>
                ))}
              </>
            ) : (
              <>
                {/* Base URL */}
                <GlassCard variant="blue">
                  <div className="p-2 sm:p-4">
                    <SectionCardHeader
                      icon={Code2}
                      tone="blue"
                      title="Base URL"
                      className="mb-3"
                    />
                    <code className="block bg-white/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/10 px-2 py-2 rounded-xl text-sm font-mono text-gray-700 dark:text-white/90 break-all">
                      {baseUrl}
                    </code>
                  </div>
                </GlassCard>

                {/* Authentication */}
                <GlassCard variant="violet">
                  <div className="p-2 sm:p-4">
                    <SectionCardHeader
                      icon={Key}
                      tone="violet"
                      title="Auth"
                      className="mb-3"
                    />
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      Session cookie (HTTP-only). Send{" "}
                      <code className="text-xs bg-violet-500/10 px-1 py-0.5 rounded">
                        credentials: &quot;include&quot;
                      </code>
                    </p>
                  </div>
                </GlassCard>

                {/* Rate Limiting */}
                <GlassCard variant="amber">
                  <div className="p-2 sm:p-4">
                    <SectionCardHeader
                      icon={Zap}
                      tone="amber"
                      title="Rate Limit"
                      className="mb-3"
                    />
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      100 req/min (standard), 10 req/min (import), 5 req/min
                      (auth)
                    </p>
                  </div>
                </GlassCard>

                {/* OpenAPI */}
                <GlassCard variant="teal">
                  <div className="p-2 sm:p-4">
                    <SectionCardHeader
                      icon={FileJson}
                      tone="teal"
                      title="OpenAPI 3.0"
                      className="mb-3"
                    />
                    <a
                      href={`${baseUrl}/api/openapi`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                    >
                      Download spec
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </GlassCard>
              </>
            )}
          </div>

          {/* API Docs — grouped in tabs to avoid long scroll */}
          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-2 bg-muted/50 dark:bg-muted/20 border border-border rounded-lg w-full">
              {endpoints.map((section) => (
                <TabsTrigger
                  key={section.name}
                  value={getTabValue(section.name)}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {section.name}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="data-types"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Data Types
              </TabsTrigger>
              <TabsTrigger
                value="error-codes"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Error Codes
              </TabsTrigger>
            </TabsList>

            {endpoints.map((section) => {
              const variant = sectionVariants[section.name] || "blue";
              return (
                <TabsContent
                  key={section.name}
                  value={getTabValue(section.name)}
                  className="mt-4 focus-visible:outline-none"
                >
                  <GlassCard variant={variant}>
                    <div className="p-2 sm:p-4">
                      <SectionCardHeader
                        icon={section.icon}
                        tone={variant as SectionHeaderTone}
                        title={section.name}
                        className="mb-4"
                      />

                      <div className="space-y-4">
                        {section.endpoints.map((endpoint, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 p-4 space-y-2 backdrop-blur-md"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={cn(
                                  "font-mono text-xs border",
                                  getMethodColor(endpoint.method),
                                )}
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="bg-gray-100/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/10 px-2 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-white/90">
                                {endpoint.path}
                              </code>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-white/70">
                              {endpoint.description}
                            </p>

                            {endpoint.parameters.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2 text-gray-700 dark:text-white">
                                  Parameters:
                                </h5>
                                <div className="">
                                  {endpoint.parameters.map(
                                    (param, paramIndex) => (
                                      <div
                                        key={paramIndex}
                                        className="flex flex-wrap items-center gap-2 text-sm"
                                      >
                                        <code className="bg-gray-100/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 px-2 py-0.5 rounded-lg text-xs font-mono text-gray-700 dark:text-white/90">
                                          {param.name}
                                        </code>
                                        <span className="text-gray-500 dark:text-white/50">
                                          ({param.type})
                                        </span>
                                        {param.required && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                          >
                                            Required
                                          </Badge>
                                        )}
                                        <span className="text-gray-500 dark:text-white/60">
                                          - {param.description}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            <div>
                              <h5 className="font-medium text-sm mb-2 text-gray-700 dark:text-white">
                                Response:
                              </h5>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                                    Success
                                  </Badge>
                                  <span className="text-sm text-gray-600 dark:text-white/70">
                                    Status: {endpoint.response.success.status}
                                  </span>
                                </div>
                                <code className="block bg-gray-100/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 px-2 py-1 rounded-lg text-xs font-mono text-gray-700 dark:text-white/90">
                                  {endpoint.response.success.data}
                                </code>

                                <div className="flex items-center gap-2">
                                  <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30">
                                    Error
                                  </Badge>
                                  <span className="text-sm text-gray-600 dark:text-white/70">
                                    Status: {endpoint.response.error.status}
                                  </span>
                                </div>
                                <code className="block bg-gray-100/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 px-2 py-1 rounded-lg text-xs font-mono text-gray-700 dark:text-white/90">
                                  {endpoint.response.error.data}
                                </code>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center justify-between text-gray-700 dark:text-white">
                                Code example
                                <CopyCodeButton
                                  text={getFetchExample(
                                    endpoint.method,
                                    endpoint.path,
                                  )}
                                  ariaLabel={`Copy ${endpoint.method} ${endpoint.path} example`}
                                />
                              </h5>
                              <pre className="bg-gray-900/90 dark:bg-black/50 p-2 rounded-xl text-xs font-mono overflow-x-auto border border-gray-700/50">
                                <code className="text-emerald-400">
                                  {getFetchExample(
                                    endpoint.method,
                                    endpoint.path,
                                  )}
                                </code>
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </TabsContent>
              );
            })}

            <TabsContent
              value="data-types"
              className="mt-4 focus-visible:outline-none"
            >
              <GlassCard variant="sky">
                <div className="p-2 sm:p-4">
                  <SectionCardHeader
                    icon={Database}
                    tone="sky"
                    title="Data Types"
                    description="Common data structures used throughout the API"
                    className="mb-4"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dataTypes.map((type, typeIndex) => {
                      const typeVariants: CardVariant[] = [
                        "emerald",
                        "violet",
                        "orange",
                        "teal",
                      ];
                      const typeVariant =
                        typeVariants[typeIndex % typeVariants.length];
                      return (
                        <div
                          key={type.name}
                          className={cn(
                            "rounded-xl border p-4 backdrop-blur-md",
                            typeVariant === "emerald" &&
                              "border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent",
                            typeVariant === "violet" &&
                              "border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent",
                            typeVariant === "orange" &&
                              "border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent",
                            typeVariant === "teal" &&
                              "border-teal-400/20 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent",
                          )}
                        >
                          <h4 className="font-medium mb-3 text-gray-700 dark:text-white">
                            {type.name}
                          </h4>
                          <div className="space-y-2">
                            {type.fields.map((field, fieldIndex) => (
                              <div
                                key={fieldIndex}
                                className="flex flex-wrap items-center gap-2 text-sm"
                              >
                                <code className="bg-white/50 dark:bg-white/5 border border-gray-300/20 dark:border-white/10 px-2 py-0.5 rounded-lg text-xs font-mono text-gray-700 dark:text-white/90">
                                  {field.name}
                                </code>
                                <span className="text-gray-500 dark:text-white/50">
                                  ({field.type})
                                </span>
                                <span className="text-gray-500 dark:text-white/60">
                                  - {field.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent
              value="error-codes"
              className="mt-4 focus-visible:outline-none"
            >
              <GlassCard variant="rose">
                <div className="p-2 sm:p-4">
                  <SectionCardHeader
                    icon={AlertCircle}
                    tone="rose"
                    title="Error Codes"
                    description="Common HTTP status codes and their meanings"
                    className="mb-4"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Success Codes */}
                    <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 backdrop-blur-md space-y-2">
                      <h4 className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">
                        Success Codes
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 font-mono">
                            200
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            OK - Request successful
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30 font-mono">
                            201
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            Created - Resource created
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Error Codes */}
                    <div className="rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent p-4 backdrop-blur-md space-y-2">
                      <h4 className="font-medium text-rose-700 dark:text-rose-300 text-sm">
                        Error Codes
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30 font-mono">
                            400
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            Bad Request - Invalid input
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30 font-mono">
                            401
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            Unauthorized - Auth required
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 font-mono">
                            429
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            Too Many Requests
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30 font-mono">
                            500
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-white/80">
                            Internal Server Error
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
