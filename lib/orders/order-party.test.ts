import { describe, expect, it } from "vitest";
import {
  formatStoreOwnerLabel,
  isClientBuyerOrder,
  isSelfOrder,
  resolveBuyerDisplayFromUsers,
  resolveBuyerUserId,
  resolveStoreOwnerUserId,
} from "./order-party";

describe("order-party", () => {
  it("isSelfOrder when clientId null or equals owner", () => {
    expect(isSelfOrder({ userId: "admin", clientId: null })).toBe(true);
    expect(isSelfOrder({ userId: "admin", clientId: undefined })).toBe(true);
    expect(isSelfOrder({ userId: "admin", clientId: "admin" })).toBe(true);
    expect(isSelfOrder({ userId: "admin", clientId: "client" })).toBe(false);
  });

  it("isClientBuyerOrder only for distinct buyer", () => {
    expect(isClientBuyerOrder({ userId: "admin", clientId: "client" })).toBe(
      true,
    );
    expect(isClientBuyerOrder({ userId: "admin", clientId: null })).toBe(false);
    expect(isClientBuyerOrder({ userId: "admin", clientId: "admin" })).toBe(
      false,
    );
  });

  it("resolveStoreOwnerUserId majority then first", () => {
    expect(resolveStoreOwnerUserId([])).toBeNull();
    expect(resolveStoreOwnerUserId(["a"])).toBe("a");
    expect(resolveStoreOwnerUserId(["a", "b", "a"])).toBe("a");
    expect(resolveStoreOwnerUserId(["b", "a", "a", "b"])).toBe("b");
  });

  it("resolveBuyerUserId prefers client", () => {
    expect(resolveBuyerUserId({ userId: "admin", clientId: "client" })).toBe(
      "client",
    );
    expect(resolveBuyerUserId({ userId: "admin", clientId: null })).toBe(
      "admin",
    );
  });

  it("resolveBuyerDisplayFromUsers Self → owner, Client → buyer", () => {
    const userMap = new Map([
      ["admin", { id: "admin", name: "Test Admin", email: "admin@test.com" }],
      [
        "client",
        { id: "client", name: "Test Client", email: "client@test.com" },
      ],
    ]);
    expect(
      resolveBuyerDisplayFromUsers(
        { userId: "admin", clientId: null },
        userMap,
      ),
    ).toEqual({
      userId: "admin",
      name: "Test Admin",
      email: "admin@test.com",
    });
    expect(
      resolveBuyerDisplayFromUsers(
        { userId: "admin", clientId: "client" },
        userMap,
      ),
    ).toEqual({
      userId: "client",
      name: "Test Client",
      email: "client@test.com",
    });
  });

  it("formatStoreOwnerLabel prefixes Store", () => {
    expect(formatStoreOwnerLabel("Test Admin")).toBe("Store · Test Admin");
    expect(formatStoreOwnerLabel(null, "a@test.com")).toBe("Store · a@test.com");
    expect(formatStoreOwnerLabel(null, null)).toBe("Store · Store");
  });
});
