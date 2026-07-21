import { describe, expect, it } from "vitest";
import {
  canMutateSupportTicket,
  resolveAssignedToUpdate,
  resolveStatusUpdate,
} from "./ticket-assignee-policy";

const ticket = { userId: "creator-1", assignedToId: "assignee-1" as string | null };

describe("canMutateSupportTicket", () => {
  it("allows creator", () => {
    expect(
      canMutateSupportTicket({ id: "creator-1", role: "client" }, ticket),
    ).toBe(true);
  });

  it("allows assignee", () => {
    expect(
      canMutateSupportTicket({ id: "assignee-1", role: "admin" }, ticket),
    ).toBe(true);
  });

  it("allows admin who is neither", () => {
    expect(
      canMutateSupportTicket({ id: "other-admin", role: "admin" }, ticket),
    ).toBe(true);
  });

  it("denies unrelated client", () => {
    expect(
      canMutateSupportTicket({ id: "stranger", role: "client" }, ticket),
    ).toBe(false);
  });
});

describe("resolveAssignedToUpdate", () => {
  it("admin may set or clear assignee", () => {
    expect(
      resolveAssignedToUpdate({ id: "a", role: "admin" }, "owner-2"),
    ).toBe("owner-2");
    expect(resolveAssignedToUpdate({ id: "a", role: "admin" }, null)).toBe(
      null,
    );
  });

  it("non-admin assignee changes are ignored", () => {
    expect(
      resolveAssignedToUpdate({ id: "creator-1", role: "client" }, "owner-2"),
    ).toBeUndefined();
    expect(
      resolveAssignedToUpdate({ id: "assignee-1", role: "supplier" }, null),
    ).toBeUndefined();
  });

  it("undefined body field stays undefined for all roles", () => {
    expect(
      resolveAssignedToUpdate({ id: "a", role: "admin" }, undefined),
    ).toBeUndefined();
    expect(
      resolveAssignedToUpdate({ id: "c", role: "client" }, undefined),
    ).toBeUndefined();
  });
});

describe("resolveStatusUpdate", () => {
  it("admin may set status", () => {
    expect(
      resolveStatusUpdate({ id: "a", role: "admin" }, "resolved"),
    ).toBe("resolved");
  });

  it("non-admin status changes are ignored", () => {
    expect(
      resolveStatusUpdate({ id: "creator-1", role: "client" }, "closed"),
    ).toBeUndefined();
    expect(
      resolveStatusUpdate({ id: "s1", role: "supplier" }, "in_progress"),
    ).toBeUndefined();
  });

  it("undefined body status stays undefined for all roles", () => {
    expect(
      resolveStatusUpdate({ id: "a", role: "admin" }, undefined),
    ).toBeUndefined();
    expect(
      resolveStatusUpdate({ id: "c", role: "client" }, undefined),
    ).toBeUndefined();
  });
});
