import { describe, expect, it } from "vitest";
import {
  buildWelcomePayloadFromUser,
  getWelcomeToastContent,
} from "@/lib/auth/auth-welcome-toast";

describe("auth-welcome-toast", () => {
  it("buildWelcomePayloadFromUser prefers name over email local part", () => {
    expect(
      buildWelcomePayloadFromUser({
        name: "Test Admin",
        email: "test@admin.com",
        role: "admin",
      }),
    ).toEqual({ userName: "Test Admin", role: "admin" });
  });

  it("getWelcomeToastContent includes userName in title", () => {
    const content = getWelcomeToastContent({
      userName: "Client",
      role: "client",
    });
    expect(content.title).toContain("Client");
    expect(content.description.length).toBeGreaterThan(0);
  });
});
