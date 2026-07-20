import { describe, expect, it } from "vitest";
import { enrichPartyPerson } from "@/lib/navigation/enrich-party-person";

describe("enrichPartyPerson", () => {
  it("attaches owner-products href and no self gray override", () => {
    const enriched = enrichPartyPerson(
      {
        userId: "u1",
        name: "Self User",
        email: "self@test.com",
        image: null,
      },
      { isAdminRole: false, viewerUserId: "u1" },
    );
    expect(enriched?.href).toBe("/products?ownerId=u1");
    expect(enriched?.linkClassName).toBeUndefined();
  });

  it("uses admin products path for admin viewers", () => {
    const enriched = enrichPartyPerson(
      { userId: "u2", name: "Other", email: "o@test.com" },
      { isAdminRole: true, viewerUserId: "u1" },
    );
    expect(enriched?.href).toBe("/admin/products?ownerId=u2");
    expect(enriched?.linkClassName).toBeUndefined();
  });
});
