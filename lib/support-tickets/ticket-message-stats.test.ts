import { describe, expect, it } from "vitest";
import {
  computeTicketMessageStats,
  ticketMessageTotal,
} from "./ticket-message-stats";

describe("ticketMessageTotal", () => {
  it("counts opening description alone", () => {
    expect(ticketMessageTotal(0)).toBe(1);
    expect(ticketMessageTotal(undefined)).toBe(1);
    expect(ticketMessageTotal(null)).toBe(1);
  });

  it("adds replyCount", () => {
    expect(ticketMessageTotal(1)).toBe(2);
    expect(ticketMessageTotal(2)).toBe(3);
  });
});

describe("computeTicketMessageStats", () => {
  const creator = "creator-1";

  it("0 replies → total 1 / creator 1 / staff 0", () => {
    expect(computeTicketMessageStats(creator, [])).toEqual({
      total: 1,
      fromCreator: 1,
      fromStaff: 0,
    });
  });

  it("1 staff reply → total 2 / creator 1 / staff 1", () => {
    expect(
      computeTicketMessageStats(creator, [{ userId: "staff-1" }]),
    ).toEqual({
      total: 2,
      fromCreator: 1,
      fromStaff: 1,
    });
  });

  it("1 creator reply → total 2 / creator 2 / staff 0", () => {
    expect(
      computeTicketMessageStats(creator, [{ userId: creator }]),
    ).toEqual({
      total: 2,
      fromCreator: 2,
      fromStaff: 0,
    });
  });
});
