import { describe, expect, it } from "vitest";
import { buildStripeCheckoutReturnUrls } from "./stripe-checkout-return-urls";

describe("buildStripeCheckoutReturnUrls", () => {
  it("returns store order paths when not under /admin", () => {
    const urls = buildStripeCheckoutReturnUrls({
      origin: "https://app.example.com",
      pathname: "/orders/abc",
      type: "order",
      id: "abc",
    });
    expect(urls.successUrl).toBe(
      "https://app.example.com/orders/abc?payment=success&session_id={CHECKOUT_SESSION_ID}",
    );
    expect(urls.cancelUrl).toBe(
      "https://app.example.com/orders/abc?payment=cancelled",
    );
  });

  it("returns admin order paths when pathname starts with /admin", () => {
    const urls = buildStripeCheckoutReturnUrls({
      origin: "https://app.example.com/",
      pathname: "/admin/orders/abc",
      type: "order",
      id: "abc",
    });
    expect(urls.successUrl).toBe(
      "https://app.example.com/admin/orders/abc?payment=success&session_id={CHECKOUT_SESSION_ID}",
    );
    expect(urls.cancelUrl).toBe(
      "https://app.example.com/admin/orders/abc?payment=cancelled",
    );
  });

  it("returns admin invoice paths from admin invoice detail", () => {
    const urls = buildStripeCheckoutReturnUrls({
      origin: "http://localhost:3000",
      pathname: "/admin/invoices/inv1",
      type: "invoice",
      id: "inv1",
    });
    expect(urls.successUrl).toContain("/admin/invoices/inv1?");
    expect(urls.cancelUrl).toBe(
      "http://localhost:3000/admin/invoices/inv1?payment=cancelled",
    );
  });
});
