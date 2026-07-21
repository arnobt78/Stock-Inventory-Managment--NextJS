import { describe, expect, it } from "vitest";
import { resolveTicketReplyTarget } from "./ticket-reply-target";

const ticket = {
  userId: "creator-1",
  creatorName: "Ada Client",
  creatorEmail: "ada@example.com",
  assignedToId: "owner-1",
  assignedToName: "Omar Owner",
  assignedToEmail: "omar@example.com",
};

describe("resolveTicketReplyTarget", () => {
  it("creator → assignee", () => {
    expect(
      resolveTicketReplyTarget(ticket, "creator-1", false),
    ).toEqual({ name: "Omar Owner", userId: "owner-1" });
  });

  it("creator with no assignee → Support", () => {
    expect(
      resolveTicketReplyTarget(
        { ...ticket, assignedToId: null, assignedToName: null },
        "creator-1",
        false,
      ),
    ).toEqual({ name: "Support", userId: null });
  });

  it("assignee → creator", () => {
    expect(
      resolveTicketReplyTarget(ticket, "owner-1", true),
    ).toEqual({ name: "Ada Client", userId: "creator-1" });
  });

  it("admin who is not creator → creator", () => {
    expect(
      resolveTicketReplyTarget(ticket, "other-admin", true),
    ).toEqual({ name: "Ada Client", userId: "creator-1" });
  });

  it("admin who is also creator → assignee", () => {
    expect(
      resolveTicketReplyTarget(ticket, "creator-1", true),
    ).toEqual({ name: "Omar Owner", userId: "owner-1" });
  });

  it("admin who is also assignee → creator", () => {
    expect(
      resolveTicketReplyTarget(ticket, "owner-1", true),
    ).toEqual({ name: "Ada Client", userId: "creator-1" });
  });
});
