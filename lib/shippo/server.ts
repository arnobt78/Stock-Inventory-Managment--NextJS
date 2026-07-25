/**
 * Shippo Server-Side Client
 * Use this for server-side Shippo operations (shipping labels, rates, tracking)
 */

import { Shippo } from "shippo";

// Lazy initialization to avoid issues during build
let shippoInstance: Shippo | null = null;

/**
 * Default sender address (warehouse/store)
 * Can be overridden via environment variables
 */
export const DEFAULT_FROM_ADDRESS = {
  name: process.env.SHIPPO_FROM_NAME || "Stock Inventory Store",
  street1: process.env.SHIPPO_FROM_STREET1 || "123 Main St",
  street2: process.env.SHIPPO_FROM_STREET2 || "",
  city: process.env.SHIPPO_FROM_CITY || "New York",
  state: process.env.SHIPPO_FROM_STATE || "NY",
  zip: process.env.SHIPPO_FROM_ZIP || "10001",
  country: process.env.SHIPPO_FROM_COUNTRY || "US",
  phone: process.env.SHIPPO_FROM_PHONE || "+1 555 123 4567",
  email: process.env.SHIPPO_FROM_EMAIL || "store@example.com",
};

/**
 * REQ-0211 — Shippo free-tier test keys (`shippo_test_*`) only return reliable
 * domestic USPS rates. Auto Generate uses this recipient silently; order UI / email
 * still show the customer's shipping address from the order record.
 */
export const DEFAULT_TEST_TO_ADDRESS = {
  name: "Test Recipient",
  street1: "215 Clayton St",
  street2: "",
  city: "San Francisco",
  state: "CA",
  zip: "94117",
  country: "US",
  phone: "+1 555 987 6543",
  email: "recipient@example.com",
};

export type ShippoAddressPayload = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

/**
 * REQ-0211 — Resolve from/to for label purchase.
 * Test API key → always DEFAULT_FROM + DEFAULT_TEST_TO (ignore order UI address).
 * Live key → real from defaults + order/request to-address.
 */
export function resolveShippoLabelAddresses(options: {
  testMode: boolean;
  fromOverride?: Partial<ShippoAddressPayload> | null;
  toFromRequest?: Partial<ShippoAddressPayload> | null;
  orderShipping?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
  } | null;
}): { addressFrom: ShippoAddressPayload; addressTo: ShippoAddressPayload } {
  const addressFrom: ShippoAddressPayload = {
    name: options.fromOverride?.name || DEFAULT_FROM_ADDRESS.name,
    street1: options.fromOverride?.street1 || DEFAULT_FROM_ADDRESS.street1,
    street2: options.fromOverride?.street2 || DEFAULT_FROM_ADDRESS.street2,
    city: options.fromOverride?.city || DEFAULT_FROM_ADDRESS.city,
    state: options.fromOverride?.state || DEFAULT_FROM_ADDRESS.state,
    zip: options.fromOverride?.zip || DEFAULT_FROM_ADDRESS.zip,
    country: options.fromOverride?.country || DEFAULT_FROM_ADDRESS.country,
    phone: options.fromOverride?.phone || DEFAULT_FROM_ADDRESS.phone,
    email: options.fromOverride?.email || DEFAULT_FROM_ADDRESS.email,
  };

  if (options.testMode) {
    return {
      addressFrom,
      addressTo: { ...DEFAULT_TEST_TO_ADDRESS },
    };
  }

  const ship = options.orderShipping;
  const reqTo = options.toFromRequest;
  const addressTo: ShippoAddressPayload = {
    name: reqTo?.name || ship?.name || "Customer",
    street1: reqTo?.street1 || ship?.street || "123 Test St",
    street2: reqTo?.street2 || "",
    city: reqTo?.city || ship?.city || "New York",
    state: reqTo?.state || ship?.state || "NY",
    zip: reqTo?.zip || ship?.zipCode || "10001",
    country: reqTo?.country || ship?.country || "US",
    phone: reqTo?.phone || ship?.phone || "",
    email: reqTo?.email || "",
  };

  return { addressFrom, addressTo };
}

/**
 * REQ-0211 — Prefer USPS in test mode (UPS/FedEx/DHL need carrier accounts).
 * Falls back to cheapest rate when preferred provider missing.
 */
export function selectShippoRateForLabel<
  T extends {
    provider?: string | null;
    amount?: string | null;
    servicelevel?: { token?: string | null } | null;
  },
>(
  rates: T[] | undefined,
  preferredCarrier: string | undefined,
  options?: { testMode?: boolean; service?: string },
): T | undefined {
  if (!rates?.length) return undefined;
  const service = options?.service;
  const preferUsps = options?.testMode === true;

  const matchPreferred = (carrier: string) =>
    rates.find(
      (r) =>
        r.provider?.toLowerCase() === carrier.toLowerCase() &&
        (!service || r.servicelevel?.token === service),
    );

  if (preferUsps) {
    const usps =
      matchPreferred("usps") ||
      rates.find((r) => r.provider?.toLowerCase() === "usps");
    if (usps) return usps;
  }

  if (preferredCarrier) {
    const hit = matchPreferred(preferredCarrier);
    if (hit) return hit;
  }

  return rates.reduce((min, r) =>
    parseFloat(r.amount || "0") < parseFloat(min?.amount || "0") ? r : min,
  );
}

/**
 * Carrier tracking URLs
 */
export const CARRIER_TRACKING_URLS: Record<
  string,
  (trackingNumber: string) => string
> = {
  usps: (trackingNumber) =>
    `https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=${trackingNumber}`,
  ups: (trackingNumber) =>
    `https://www.ups.com/track?tracknum=${trackingNumber}`,
  fedex: (trackingNumber) =>
    `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
  dhl: (trackingNumber) =>
    `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
};

/**
 * Get Shippo client instance
 */
export function getShippo(): Shippo {
  if (!shippoInstance) {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) {
      throw new Error("SHIPPO_API_KEY is not configured");
    }
    shippoInstance = new Shippo({
      apiKeyHeader: apiKey,
    });
  }
  return shippoInstance;
}

/**
 * Check if Shippo is configured
 */
export function isShippoConfigured(): boolean {
  return !!process.env.SHIPPO_API_KEY;
}

/**
 * Check if Shippo is in test mode
 */
export function isShippoTestMode(): boolean {
  const apiKey = process.env.SHIPPO_API_KEY || "";
  return apiKey.startsWith("shippo_test_");
}

/**
 * Generate tracking URL for a carrier
 */
export function getTrackingUrl(
  carrier: string,
  trackingNumber: string,
): string | null {
  const carrierLower = carrier.toLowerCase();
  const urlGenerator = CARRIER_TRACKING_URLS[carrierLower];
  return urlGenerator ? urlGenerator(trackingNumber) : null;
}

/**
 * Supported carriers
 */
export const SUPPORTED_CARRIERS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
] as const;

export type ShippingCarrier = (typeof SUPPORTED_CARRIERS)[number]["value"];
