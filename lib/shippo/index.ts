/**
 * Shippo module exports
 */

export {
  getShippo,
  isShippoConfigured,
  isShippoTestMode,
  getTrackingUrl,
  DEFAULT_FROM_ADDRESS,
  DEFAULT_TEST_TO_ADDRESS,
  resolveShippoLabelAddresses,
  selectShippoRateForLabel,
  SUPPORTED_CARRIERS,
  CARRIER_TRACKING_URLS,
} from "./server";

export type { ShippingCarrier, ShippoAddressPayload } from "./server";
