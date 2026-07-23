# Stock & Warehouse Inventory Management System - Next.js, TypeScript, Prisma, MongoDB FullStack Project (including Business-Insights & Admin Panel, Client, Supplier Role-based Dashboard)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

A full-stack warehouse and stock inventory management system built with Next.js, React, Prisma, and MongoDB. It helps store owners, suppliers, and clients manage products, orders, invoices, warehouses, and support tickets with role-based access, analytics dashboards, QR codes, payments (Stripe), shipping (Shippo), and email (Brevo). This README is written for learning, reuse, and deployment—with project structure, API reference, environment setup, and usage walkthroughs.

- **Live Demo:** [https://stockly-inventory.vercel.app/](https://stockly-inventory.vercel.app/)
- **Security:** Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

![Screenshot 2026-03-07 at 12 16 27](https://github.com/user-attachments/assets/f00d8441-4c1c-467d-b9fa-f5505a48feb0)
![Screenshot 2026-03-07 at 12 16 46](https://github.com/user-attachments/assets/64b0dd00-126f-4740-9ab4-fb2a8bc5fca5)
![Screenshot 2026-03-07 at 12 16 58](https://github.com/user-attachments/assets/6f617e37-934c-484f-a554-11e5db02a53f)
![Screenshot 2026-03-07 at 12 17 07](https://github.com/user-attachments/assets/68418911-c445-4e49-8167-77715ea6a4d1)
![Screenshot 2026-03-07 at 12 17 20](https://github.com/user-attachments/assets/95e1c857-3663-46e5-b7fa-1da051a88392)
![Screenshot 2026-03-07 at 12 17 28](https://github.com/user-attachments/assets/9b03b936-6748-40f9-b30c-abcb8534e543)
![Screenshot 2026-03-07 at 12 17 41](https://github.com/user-attachments/assets/d8403bf0-965f-4e8b-936c-dbff3b4f0b53)
![Screenshot 2026-03-07 at 12 18 19](https://github.com/user-attachments/assets/3d9e9c99-43a9-43a6-9580-87084ace7aea)
![Screenshot 2026-03-07 at 12 18 28](https://github.com/user-attachments/assets/af509a48-0178-483e-8e36-20855570fd28)
![Screenshot 2026-03-07 at 12 18 39](https://github.com/user-attachments/assets/281193e0-c15a-4675-b163-5142da066fde)
![Screenshot 2026-03-07 at 12 18 54](https://github.com/user-attachments/assets/33bf5fc3-95a4-4343-9978-bf59c4507a3c)
![Screenshot 2026-03-07 at 12 19 05](https://github.com/user-attachments/assets/51442c1e-894c-41aa-8b81-a2efea8ae844)
![Screenshot 2026-03-07 at 12 19 20](https://github.com/user-attachments/assets/ce686e12-2a28-4207-9a0e-fb68fff45420)
![Screenshot 2026-03-07 at 12 19 36](https://github.com/user-attachments/assets/67fcce8c-c674-4a29-bb1b-eec1603e47ae)
![Screenshot 2026-03-07 at 12 19 44](https://github.com/user-attachments/assets/6a828ce8-3483-42cd-9790-23c83ba27515)
![Screenshot 2026-03-07 at 12 19 55](https://github.com/user-attachments/assets/3957ffb5-cd2c-452a-b4e3-7388ea76c874)
![Screenshot 2026-03-07 at 12 20 03](https://github.com/user-attachments/assets/d2b95ede-4100-498f-9900-a581969f8ba3)
![Screenshot 2026-03-07 at 12 20 30](https://github.com/user-attachments/assets/f7253b40-2e9c-4786-b264-175202d8ee7d)
![Screenshot 2026-03-07 at 12 20 39](https://github.com/user-attachments/assets/14c29c77-0ee8-489b-bf99-f4ea43935395)
![Screenshot 2026-03-07 at 12 20 48](https://github.com/user-attachments/assets/e74645f6-29f7-4960-8833-4af6d36e7580)
![Screenshot 2026-03-07 at 12 20 57](https://github.com/user-attachments/assets/8206a920-3a68-4937-a71a-3450729a560c)
![Screenshot 2026-03-07 at 12 21 20](https://github.com/user-attachments/assets/92152502-7fac-431f-ae98-607099981262)
![Screenshot 2026-03-07 at 12 21 53](https://github.com/user-attachments/assets/2c2e6398-c019-4ac3-acda-9f7f02214e55)
![Screenshot 2026-03-07 at 12 22 06](https://github.com/user-attachments/assets/fa2e0942-86a2-4e18-8062-52bea4a26b26)
![Screenshot 2026-03-07 at 12 22 24](https://github.com/user-attachments/assets/1db9c3ca-1e44-414e-a7d6-cc17ad4f210a)
![Screenshot 2026-03-07 at 12 22 44](https://github.com/user-attachments/assets/4c7dbf4d-2c41-496b-83d8-1c873512b098)
![Screenshot 2026-03-07 at 12 23 06](https://github.com/user-attachments/assets/ba0b10dc-359b-457b-8f68-65b93d1b8d47)

## Table of Contents

- [Project Overview](#project-overview)
- [Features & Functionality](#features--functionality)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Application Routes](#application-routes)
- [API Endpoints](#api-endpoints)
- [Backend & Database](#backend--database)
- [Key Components & Reuse](#key-components--reuse)
- [Keywords](#keywords)
- [Security](#security)
- [License](#license)

---

## Project Overview

Stockly is a **role-based inventory and order management platform**. It supports three roles:

- **Admin (store owner):** Full access to products, categories, suppliers, warehouses, orders, invoices, analytics, user management, support tickets, and client/supplier portal views.
- **Supplier:** Own products, orders containing their products, revenue, and support tickets.
- **Client:** Browse catalog, place orders, view invoices, pay via Stripe, and open support tickets.

The app uses **Next.js 16 App Router**, **Prisma** with **MongoDB**, **JWT** auth, **TanStack Query** for server state, **shadcn/ui** + **Tailwind** for UI, and optional integrations: **Stripe** (payments), **Shippo** (shipping), **Brevo** (email), **ImageKit** (images), **Upstash Redis** (cache), **Sentry** (monitoring), and **OpenRouter** (AI insights). All features are designed so you can run the core app with minimal env vars and add integrations as needed.

---

## Features & Functionality

### Core

- **Products:** CRUD, SKU, categories, suppliers, stock levels, status (available / stock low / out), QR codes, import (CSV/Excel), export.
- **Categories & Suppliers:** CRUD with status; used for filtering and reporting.
- **Orders:** Create/edit orders with line items, per-warehouse stock picking, reactive availability validation (`committedQuantity` + allocation caps), tax/shipping/discount rules, status and payment status; client vs admin views.
- **Invoices:** One per order; status (draft, sent, paid, overdue, cancelled); PDF, send email, Stripe payment link.
- **Warehouses:** CRUD, types, status; stock allocations per product, transfers, order-line warehouse picks, catalog quantity reconcile on product edits.
- **Payments:** Stripe Checkout for orders/invoices; webhook for fulfillment.
- **Shipping:** Shippo labels, rates, tracking; webhook for status.

### Role-Based Experience

- **Admin:** Dashboard (counts, revenue, trends), business insights (charts), admin panel (orders, invoices, products, categories, suppliers, warehouses, users, support tickets, activity history, import history, product reviews, settings). Client and supplier portal “overview” pages for monitoring.
- **Supplier:** Supplier dashboard (products, orders, revenue, low stock), products/orders/support scoped to their data.
- **Client:** Client dashboard (orders, spending, invoices), catalog (suppliers, categories, products), orders, invoices, support tickets; checkout and payment flows.

### Additional

- **Support tickets:** Create, reply, status/priority; assigned to product owner (admin); client/supplier see their own.
- **Product reviews:** Customers can leave reviews; admin approves/rejects; eligibility by order.
- **Analytics & insights:** Charts (revenue, orders, categories, etc.), forecasting section, AI insights (optional OpenRouter).
- **API docs & status:** In-app API documentation and health/status page.
- **Notifications:** In-app notifications; optional email (Brevo) for invoices and reminders.
- **Theme:** Light/dark with system preference; persisted.

---

## Technology Stack

| Layer          | Technologies                                            |
| -------------- | ------------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router), React 19                       |
| **Language**   | TypeScript 5                                            |
| **Database**   | MongoDB via Prisma ORM                                  |
| **Auth**       | JWT (cookie), bcryptjs; optional Google OAuth           |
| **State**      | TanStack Query (server), Zustand (client), React state  |
| **UI**         | Tailwind CSS, shadcn/ui (Radix), Lucide icons, Recharts |
| **Forms**      | React Hook Form, Zod                                    |
| **Payments**   | Stripe (Checkout, Payment Intents, webhooks)            |
| **Shipping**   | Shippo (labels, rates, tracking)                        |
| **Email**      | Brevo (transactional, reminders)                        |
| **Images**     | ImageKit (optional)                                     |
| **Cache**      | Upstash Redis (optional)                                |
| **Monitoring** | Sentry (optional)                                       |
| **AI**         | OpenRouter + Groq fallback (optional, insights)         |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended 20+)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)

### Install & Run

```bash
# Clone the repository
git clone <your-repo-url>
cd stock-inventory

# Install dependencies
npm install

# Copy environment template and set the three required variables (see below)
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, and NEXT_PUBLIC_API_URL (e.g. http://localhost:3000)

# Generate Prisma client (runs automatically on postinstall)
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All other variables in `.env.example` are optional and enable extra features (Stripe, Brevo, etc.).

Default scripts:

| Script | Command         | Description                        |
| ------ | --------------- | ---------------------------------- |
| Dev    | `npm run dev`   | Next.js dev server (Turbopack)     |
| Build  | `npm run build` | Prisma generate + production build |
| Start  | `npm run start` | Production server                  |
| Lint   | `npm run lint`  | ESLint                             |

---

## Environment Variables

The app uses **three required** variables (validated in `lib/env.ts`). Everything else is optional and enables specific features. Use `.env.example` as a template: copy it to `.env` and set at least the required ones to run locally.

### Required (must set to run the project)

| Variable              | Description                                       | Example for localhost                                                                                                 |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | MongoDB connection string                         | `mongodb://localhost:27017/stockly` or Atlas `mongodb+srv://user:pass@cluster.../stockly?retryWrites=true&w=majority` |
| `JWT_SECRET`          | Secret for signing JWT session cookies            | Any long random string (e.g. 32+ characters)                                                                          |
| `NEXT_PUBLIC_API_URL` | Base URL of the app (emails, redirects, API base) | `http://localhost:3000` for local; your production URL in prod                                                        |

### Optional (listed in `.env.example` with comments)

Uncomment and set in `.env` only if you need the feature:

| Variable          | Purpose                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ImageKit**      | `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` — Product image uploads                                                                     |
| **Google OAuth**  | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Sign in with Google                                                                                                                                           |
| **Brevo**         | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_ADMIN_EMAIL` — Transactional email (invoice send, reminders)                                                                                                            |
| **Sentry**        | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` — Error monitoring                                                                                                                                                                                  |
| **Upstash Redis** | `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) — Caching, rate limiting                                                                                                             |
| **QStash**        | `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` — Background job queue (e.g. email)                                                                                                                  |
| **OpenRouter**    | `OPENROUTER_API_KEY` — AI insights (primary LLM)                                                                                                                                                                                           |
| **Groq**          | `GROQ_API_KEY`, optional `GROQ_MODEL` (default fast-first chain: `openai/gpt-oss-20b` → `qwen/qwen3.6-27b` → `openai/gpt-oss-120b`) — fallback when OpenRouter fails                                                                       |
| **Stripe**        | `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Payments (checkout, webhooks)                                                                                                                            |
| **Shippo**        | `SHIPPO_API_KEY`, and optionally `SHIPPO_FROM_NAME`, `SHIPPO_FROM_STREET1`, `SHIPPO_FROM_CITY`, `SHIPPO_FROM_STATE`, `SHIPPO_FROM_ZIP`, `SHIPPO_FROM_COUNTRY`, `SHIPPO_FROM_PHONE`, `SHIPPO_FROM_EMAIL` — Shipping labels, rates, tracking |
| **App URL**       | `NEXT_PUBLIC_APP_URL` — Metadata and some redirects (defaults to Vercel URL if unset)                                                                                                                                                      |
| **Internal API**  | `INTERNAL_API_KEY` — Bearer token for server-to-server calls (e.g. cron hitting `/api/invoices/reminders`)                                                                                                                                 |

### Minimal `.env` to run on localhost

```env
DATABASE_URL="mongodb://localhost:27017/stockly"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Full `.env.example` reference

Below is the complete `.env.example` file so you can see exactly what to set. Copy the repo’s `.env.example` to `.env`, then fill in the **required** values (first three). Optional variables are commented out; uncomment and set them only if you need those features.

```env
# =============================================================================
# REQUIRED – Set these three so the app can start (see lib/env.ts).
# Copy this file to .env and fill in your values. Never commit .env to git.
# =============================================================================

# MongoDB connection string (local or Atlas).
# Local: mongodb://localhost:27017/stockly
# Atlas: mongodb+srv://USER:PASSWORD@cluster.mongodb.net/stockly?retryWrites=true&w=majority
DATABASE_URL="mongodb://localhost:27017/stockly"

# Secret used to sign JWT session tokens. Use a long random string in production.
JWT_SECRET="your_super_secret_jwt_key_here_change_this_in_production"

# Base URL of this app (used for emails, redirects, API base). Use http://localhost:3000 for local.
NEXT_PUBLIC_API_URL="http://localhost:3000"

# =============================================================================
# OPTIONAL – App works without these. Uncomment and set to enable features.
# =============================================================================

# Environment (development | production). Usually set by the runner.
# NODE_ENV="development"

# Used in metadata and some redirects. Defaults to Vercel URL if unset.
# NEXT_PUBLIC_APP_URL="http://localhost:3000"

# --- ImageKit (product images, uploads) - https://imagekit.io ---
# IMAGEKIT_PUBLIC_KEY=
# IMAGEKIT_PRIVATE_KEY=
# IMAGEKIT_URL_ENDPOINT=
# NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
# NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=

# --- Google OAuth - https://console.cloud.google.com/apis/credentials ---
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# --- Brevo (transactional email, invoice send, reminders) - https://www.brevo.com ---
# BREVO_API_KEY=
# BREVO_SENDER_EMAIL=
# BREVO_SENDER_NAME=
# BREVO_ADMIN_EMAIL=

# --- Sentry (error monitoring) - https://sentry.io ---
# SENTRY_DSN=
# NEXT_PUBLIC_SENTRY_DSN=
# NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE=false  # optional prod-only; see "Browser translation" below

# --- Upstash Redis (caching, rate limit) - https://upstash.com ---
# UPSTASH_REDIS_URL=
# UPSTASH_REDIS_TOKEN=
# Or: UPSTASH_REDIS_REST_URL= and UPSTASH_REDIS_REST_TOKEN=

# --- QStash (background jobs, e.g. email queue) - https://upstash.com/qstash ---
# QSTASH_URL=
# QSTASH_TOKEN=
# QSTASH_CURRENT_SIGNING_KEY=
# QSTASH_NEXT_SIGNING_KEY=

# --- OpenRouter (AI insights) - https://openrouter.ai ---
# OPENROUTER_API_KEY=

# --- Groq (AI fallback) - https://console.groq.com ---
# GROQ_API_KEY=
# GROQ_MODEL=     # optional single-model override; omit to use code chain

# --- Stripe (payments – checkout, webhooks) - https://dashboard.stripe.com/test/apikeys ---
# STRIPE_API_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...  (Stripe Dashboard → Webhooks → add /api/payments/webhook)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# --- Shippo (shipping labels, rates, tracking) - https://goshippo.com/dashboard/apikeys ---
# SHIPPO_API_KEY=shippo_test_...
# Sender address for labels (optional):
# SHIPPO_FROM_NAME=
# SHIPPO_FROM_STREET1=
# SHIPPO_FROM_STREET2=
# SHIPPO_FROM_CITY=
# SHIPPO_FROM_STATE=
# SHIPPO_FROM_ZIP=
# SHIPPO_FROM_COUNTRY=
# SHIPPO_FROM_PHONE=
# SHIPPO_FROM_EMAIL=

# --- Internal API (e.g. cron calling /api/invoices/reminders with Bearer token) ---
# INTERNAL_API_KEY=

# =============================================================================
# Instructions:
# 1. cp .env.example .env
# 2. Set DATABASE_URL, JWT_SECRET, and NEXT_PUBLIC_API_URL at minimum.
# 3. Uncomment and set any optional vars you need. Never commit .env.
# =============================================================================
```

Or copy the project’s `.env.example` to `.env` and leave the optional variables commented out; the app will start with only the three required ones set.

### Where to get values

- **MongoDB:** Local: `mongodb://localhost:27017/stockly`. Cloud: [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **Stripe:** [dashboard.stripe.com](https://dashboard.stripe.com) → API keys; Webhooks → add endpoint for `/api/payments/webhook`
- **Shippo:** [goshippo.com](https://goshippo.com) → API keys (use test key for development)
- **Brevo:** [brevo.com](https://www.brevo.com) → API key and sender/admin email settings
- **ImageKit:** [imagekit.io](https://imagekit.io) → keys and URL endpoint
- **Upstash Redis / QStash:** [upstash.com](https://upstash.com)
- **Sentry:** [sentry.io](https://sentry.io)
- **OpenRouter:** [openrouter.ai](https://openrouter.ai)

### Browser translation (Chrome / Edge)

The UI is **English**. Contributors worldwide may use the browser **“Translate this page”** feature; that mutates the DOM and can trigger React `removeChild` errors (caught by ErrorBoundary). This is a known browser + React limitation, not bad inventory logic.

- **QA:** Prefer Incognito with extensions off and **do not** translate the page when testing navigation or tables.
- **Sentry:** `scrubSentryEvent` drops `removeChild` events when translation is detected (`translated-ltr` / `translated-rtl`).
- **Optional prod hardening:** Set `NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE=true` on your deployment only (adds `translate="no"` on `<html>`; forks stay translatable by default).

---

## Project Structure

```bash
stock-inventory/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, metadata, providers
│   ├── page.tsx            # Home (store overview for admin)
│   ├── login/              # Login page
│   ├── register/           # Registration
│   ├── products/           # Products list & detail
│   ├── orders/             # Orders list & detail
│   ├── invoices/           # Invoices list & detail
│   ├── categories/         # Categories list & detail
│   ├── suppliers/          # Suppliers list & detail
│   ├── warehouses/         # Warehouses list & detail
│   ├── client/             # Client portal dashboard
│   ├── supplier/           # Supplier portal dashboard
│   ├── support-tickets/    # Support tickets (all roles)
│   ├── business-insights/  # Business insights (charts)
│   ├── api-docs/           # API documentation page
│   ├── api-status/        # API status page
│   ├── settings/          # User settings (e.g. email preferences)
│   ├── admin/             # Admin panel (layout + nested routes)
│   │   ├── dashboard-overall-insights/
│   │   ├── products/, orders/, invoices/, categories/, suppliers/, warehouses/
│   │   ├── client-orders/, client-invoices/, client-portal/, supplier-portal/
│   │   ├── support-tickets/, user-management/, activity-history/
│   │   ├── history/ (import history), product-reviews/, my-activity/
│   │   └── settings/
│   └── api/               # API route handlers (see API Endpoints)
├── components/            # React components
│   ├── ui/                # shadcn-style primitives (button, dialog, table, etc.)
│   ├── layouts/           # Navbar, AdminSidebar, PageWithSidebar, etc.
│   ├── Pages/             # Page-level components (HomePage, LoginPage, etc.)
│   ├── home/              # Statistics cards, sections for home
│   ├── products/          # ProductList, ProductTable, dialogs, filters
│   ├── orders/            # OrderList, OrderDialog, filters, shipping
│   ├── invoices/          # InvoiceList, InvoiceDialog, filters
│   ├── category/, supplier/, warehouses/  # List, table, dialog, filters
│   ├── payments/          # PaymentButton, PaymentDialog
│   ├── support-tickets/   # Ticket list, detail, dialog
│   ├── product-reviews/   # Reviews section, dialogs
│   ├── admin/             # Admin-only content (tables, details, settings)
│   ├── shared/            # ErrorBoundary, PaginationSelector, etc.
│   ├── providers/         # ThemeProvider, KeyboardShortcutsProvider
│   ├── forms/, dialogs/   # Shared form and dialog building blocks
│   └── ...
├── lib/                   # Shared backend/utility code
│   ├── api/               # API client, endpoints, CORS, rate limit
│   ├── auth/              # OAuth helpers
│   ├── cache/             # Redis cache utils
│   ├── email/             # Brevo send, templates, queue
│   ├── server/            # Server-side data (dashboard, invoices, orders, etc.)
│   ├── react-query/       # Query client, keys, provider, invalidate-all
│   ├── validations/       # Zod schemas (product, order, invoice, etc.)
│   ├── stripe/, shippo/   # Payment & shipping
│   ├── imagekit.ts        # ImageKit client
│   ├── env.ts             # Env validation
│   └── ...
├── hooks/queries/         # TanStack Query hooks (useProducts, useOrders, etc.)
├── contexts/              # Auth context
├── types/                 # TypeScript types (dashboard, product, order, etc.)
├── prisma/
│   ├── schema.prisma     # MongoDB models (User, Product, Order, Invoice, etc.)
│   ├── client.ts         # Prisma client singleton
│   └── *.ts               # Repository-style helpers (product, order, invoice, etc.)
├── utils/                 # auth (JWT, session), axiosInstance
├── middleware.ts          # Next.js middleware (e.g. auth redirects)
└── public/                # Static assets (favicon, SVGs)
```

---

## Application Routes

| Path                                        | Who      | Description                                                      |
| ------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `/`                                         | Admin    | Store overview (state cards)                                     |
| `/login`, `/register`                       | All      | Auth                                                             |
| `/products`, `/products/[id]`               | All      | Products list & detail                                           |
| `/orders`, `/orders/[id]`                   | All      | Orders list & detail                                             |
| `/invoices`, `/invoices/[id]`               | All      | Invoices list & detail                                           |
| `/categories`, `/categories/[id]`           | All      | Categories                                                       |
| `/suppliers`, `/suppliers/[id]`             | All      | Suppliers                                                        |
| `/warehouses`, `/warehouses/[id]`           | All      | Warehouses                                                       |
| `/client`                                   | Client   | Client dashboard                                                 |
| `/supplier`                                 | Supplier | Supplier dashboard                                               |
| `/support-tickets`, `/support-tickets/[id]` | All      | Support tickets                                                  |
| `/business-insights`                        | Admin    | Business charts                                                  |
| `/api-docs`, `/api-status`                  | All      | API docs & status                                                |
| `/settings/email-preferences`               | All      | Email preferences                                                |
| `/admin/*`                                  | Admin    | Admin panel (dashboard, products, orders, invoices, users, etc.) |

---

## API Endpoints

All under `/api`, authenticated via cookie `session_id` (JWT) unless noted.

### Auth

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/session` — Current session
- `GET /api/auth/oauth/google`, `GET /api/auth/oauth/google/callback` — Google OAuth

### Core resources (CRUD + list)

- `GET|POST /api/products`, `GET|PATCH|DELETE /api/products/[id]`
- `GET|POST /api/categories`, `GET|PATCH|DELETE /api/categories/[id]`
- `GET|POST /api/suppliers`, `GET|PATCH|DELETE /api/suppliers/[id]`
- `GET|POST /api/orders`, `GET|PATCH|DELETE /api/orders/[id]`
- `GET|POST /api/invoices`, `GET|PATCH|DELETE /api/invoices/[id]`
- `GET|POST /api/warehouses`, `GET|PATCH|DELETE /api/warehouses/[id]`

### Products extras

- `GET /api/products/import` — Import (CSV/Excel)
- `POST /api/products/image` — Image upload (e.g. ImageKit)
- `GET /api/products/qr-code` — QR code for product

### Invoices

- `GET /api/invoices/[id]/pdf` — PDF
- `POST /api/invoices/[id]/send` — Send email
- `POST /api/invoices/reminders` — Send reminders (optional `INTERNAL_API_KEY`)

### Payments & shipping

- `POST /api/payments/checkout` — Create Stripe Checkout session
- `POST /api/payments/webhook` — Stripe webhook
- `POST /api/shipping/labels` — Shippo label
- `GET /api/shipping/rates` — Shippo rates
- `GET /api/shipping/tracking` — Tracking

### Portal & dashboard

- `GET /api/dashboard` — Admin dashboard stats
- `GET /api/portal/client` — Client dashboard (client only)
- `GET /api/portal/client/catalog` — Client catalog (client only)
- `GET /api/portal/client/browse-meta`, `GET /api/portal/client/browse-products` — Browse (client)
- `GET /api/portal/supplier` — Supplier dashboard (supplier only)
- `GET /api/admin/client-orders`, `GET /api/admin/client-invoices` — Admin client data
- `GET /api/client-portal`, `GET /api/supplier-portal` — Admin overview (admin only)
- `GET /api/admin/counts` — Admin sidebar counts

### Support & reviews

- `GET|POST /api/support-tickets`, `GET|PATCH /api/support-tickets/[id]`
- `POST /api/support-tickets/[id]/replies`
- `GET /api/support-tickets/product-owners`
- `GET|POST /api/product-reviews`, `GET|PATCH|DELETE /api/product-reviews/[id]`
- `GET /api/product-reviews/by-product/[productId]`, `GET /api/product-reviews/eligibility`

### User & system

- `GET|POST /api/users`, `GET|PATCH|DELETE /api/users/[id]` — Admin only
- `GET|PUT /api/user/email-preferences`
- `GET|PATCH /api/notifications/in-app`, `GET /api/notifications/in-app/unread-count`, etc.
- `GET /api/import-history`, `GET /api/import-history/[id]`
- `GET /api/audit-logs` — Admin only
- `GET|PATCH /api/system-config` — Admin only
- `GET /api/forecasting`, `GET /api/ai/insights`
- `GET /api/stock-allocations`
- `GET /api/health` — Health check
- `GET /api/openapi` — OpenAPI spec

---

## Backend & Database

### Prisma + MongoDB

- **Schema:** `prisma/schema.prisma` (datasource `mongodb`).
- **Models:** User, Category, Supplier, Product, Order, OrderItem, Invoice, Warehouse, SupportTicket, SupportTicketReply, ProductReview, ImportHistory, Notification, etc. Relations and indexes are defined in the schema.
- **Client:** Singleton in `prisma/client.ts`; used by API routes and `lib/server/*` and `prisma/*.ts` helpers.

### Server-side data

- **Dashboard:** `lib/server/dashboard-data.ts` — admin dashboard aggregates (counts, revenue, trends, recent activity).
- **Client dashboard:** `lib/server/client-dashboard.ts` — client stats and catalog.
- **Supplier dashboard:** `lib/server/supplier-dashboard.ts` — supplier stats.
- **Invoices/orders:** `lib/server/invoices-data.ts`, `lib/server/orders-data.ts`, etc. — used for SSR and API.

### Auth flow

- Login/register set a JWT in cookie `session_id`.
- `utils/auth.ts`: `getSessionFromRequest(request)` reads cookie, verifies JWT, loads user from DB.
- API routes call `getSessionFromRequest(request)` and check `session.role` and `session.id` for authorization.

---

## Key Components & Reuse

### Using a shared UI component

Most UI primitives live under `components/ui/` (button, dialog, input, table, badge, etc.). They are built for Tailwind and can be reused in any page or component.

```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Button variant="default">Save</Button>
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>...</DialogContent>
</Dialog>
```

### Using TanStack Query hooks

Data fetching is centralized in `hooks/queries/`. Use the hooks in components; they handle loading, error, and cache.

```tsx
import { useProducts, useCategories } from "@/hooks/queries";

function MyComponent() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  // ...
}
```

### Using auth context

```tsx
import { useAuth } from "@/contexts";

function MyComponent() {
  const { user, isLoggedIn, logout, isCheckingAuth } = useAuth();
  if (isCheckingAuth) return <Skeleton />;
  if (!isLoggedIn) return <Redirect to="/login" />;
  return <div>Hello, {user?.name}</div>;
}
```

### Reusing in another project

- Copy `components/ui/*` and any Tailwind/shadcn config and dependencies.
- Copy `lib/utils.ts` (e.g. `cn()`).
- Copy specific feature folders (e.g. `components/products/`, `hooks/queries/use-products.ts`) and adapt API client and types to your backend.
- Reuse `lib/validations/*` (Zod schemas) and align with your API payloads.

### Example: Using StatisticsCard on another page

```tsx
import { StatisticsCard } from "@/components/home/StatisticsCard";

<StatisticsCard
  title="Total Products"
  value={count}
  description="Products in catalog"
  variant="violet"
  badges={[
    { label: "Active", value: activeCount },
    { label: "Inactive", value: inactiveCount },
  ]}
/>;
```

### Example: Form with Zod and React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: "" },
});
```

---

## Walkthrough: Run and Test

1. **Setup:** Set `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_API_URL` in `.env`, then run `npm install` and `npm run dev`.
2. **Register:** Open `/register`, create an admin user (first user can act as store owner).
3. **Login:** Go to `/login`, sign in; you land on `/` (store overview).
4. **Products:** Go to `/products`, add categories and suppliers, then add products.
5. **Orders & invoices:** Create an order at `/orders`, then create or view its invoice at `/invoices`.
6. **Roles:** Create users with roles `client` or `supplier` (e.g. via admin user management); log in as them to see client portal (`/client`) or supplier portal (`/supplier`).
7. **Optional:** Add Stripe, Shippo, or Brevo env vars to enable payments, shipping, or email.

---

## Conclusion

Stockly is a full-stack example of a role-based inventory and order management app with Next.js 16, React 19, Prisma, and MongoDB. It demonstrates App Router structure, API route design, JWT auth, TanStack Query, and optional third-party integrations. Use this README as a map to the codebase, env setup, APIs, and components so you can run, extend, or reuse parts of the project in your own applications.

---

## Keywords

stock inventory, inventory management, warehouse management, stock management system, Next.js, React, Prisma, MongoDB, product catalog, orders, invoices, suppliers, categories, JWT authentication, Stripe payments, Shippo shipping, Brevo email, role-based access, admin dashboard, client portal, supplier portal, TanStack Query, TypeScript, Tailwind CSS, shadcn/ui, Arnob Mahmud

---

## Security

To report a security vulnerability privately, see **[SECURITY.md](SECURITY.md)** (email: contact@arnobmahmud.com). Please do not file public GitHub issues for security bugs.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as per the terms of the license.

---

## Happy Coding! 🎉

This is an **open-source project** — feel free to use, enhance, and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://www.arnobmahmud.com](https://www.arnobmahmud.com).

**Enjoy building and learning!** 🚀

Thank you! 😊
