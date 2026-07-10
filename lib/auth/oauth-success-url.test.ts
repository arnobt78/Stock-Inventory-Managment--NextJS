import { describe, expect, it } from "vitest";
import {
  buildPathWithoutOAuthSuccess,
  isOAuthSuccessSearch,
} from "@/lib/auth/oauth-success-url";

describe("oauth-success-url", () => {
  it("isOAuthSuccessSearch returns true when oauth_success=true", () => {
    expect(isOAuthSuccessSearch("?oauth_success=true")).toBe(true);
  });

  it("isOAuthSuccessSearch returns false without param", () => {
    expect(isOAuthSuccessSearch("")).toBe(false);
    expect(isOAuthSuccessSearch("?foo=1")).toBe(false);
  });

  it("buildPathWithoutOAuthSuccess removes oauth_success and keeps other params", () => {
    expect(
      buildPathWithoutOAuthSuccess(
        "/supplier",
        "?oauth_success=true&foo=1",
      ),
    ).toBe("/supplier?foo=1");
  });

  it("buildPathWithoutOAuthSuccess returns pathname only when no params left", () => {
    expect(
      buildPathWithoutOAuthSuccess("/client", "?oauth_success=true"),
    ).toBe("/client");
  });
});
