import { describe, expect, it } from "vitest";
import {
  getRoboHashAvatarUrl,
  resolveAvatarSourcesFromSeed,
  resolveUserAvatarSources,
} from "@/lib/ui/user-avatar-sources";

describe("user-avatar-sources", () => {
  it("getRoboHashAvatarUrl encodes seed and uses set1", () => {
    expect(getRoboHashAvatarUrl("alice")).toBe(
      "https://robohash.org/alice?set=set1&size=80x80",
    );
    expect(getRoboHashAvatarUrl("a b")).toBe(
      "https://robohash.org/a%20b?set=set1&size=80x80",
    );
  });

  it("resolveAvatarSourcesFromSeed uses Google image as src with robohash fallback", () => {
    const google =
      "https://lh3.googleusercontent.com/a/example-photo";
    const result = resolveAvatarSourcesFromSeed("user-abc", google);
    expect(result.src).toBe(google);
    expect(result.fallbackSrc).toBe(
      "https://robohash.org/user-abc?set=set1&size=80x80",
    );
  });

  it("resolveAvatarSourcesFromSeed uses robohash for both when no image", () => {
    const result = resolveAvatarSourcesFromSeed("user-xyz");
    expect(result.src).toBe(result.fallbackSrc);
    expect(result.src).toBe(
      "https://robohash.org/user-xyz?set=set1&size=80x80",
    );
  });

  it("resolveAvatarSourcesFromSeed treats empty/whitespace image as absent", () => {
    const result = resolveAvatarSourcesFromSeed("user-3", "   ");
    expect(result.src).toBe(result.fallbackSrc);
    expect(result.src).toBe(
      "https://robohash.org/user-3?set=set1&size=80x80",
    );
  });

  it("resolveUserAvatarSources uses Google image as src with robohash fallback", () => {
    const google =
      "https://lh3.googleusercontent.com/a/example-photo";
    const result = resolveUserAvatarSources({
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      image: google,
    });
    expect(result).not.toBeNull();
    expect(result!.src).toBe(google);
    expect(result!.fallbackSrc).toBe(
      "https://robohash.org/Alice?set=set1&size=80x80",
    );
  });

  it("resolveUserAvatarSources uses robohash for both when no image", () => {
    const result = resolveUserAvatarSources({
      id: "u2",
      name: "Bob",
      email: "bob@example.com",
    });
    expect(result).not.toBeNull();
    expect(result!.src).toBe(result!.fallbackSrc);
    expect(result!.src).toBe(
      "https://robohash.org/Bob?set=set1&size=80x80",
    );
  });

  it("resolveUserAvatarSources treats empty/whitespace image as absent", () => {
    const result = resolveUserAvatarSources({
      id: "u3",
      email: "c@example.com",
      image: "   ",
    });
    expect(result).not.toBeNull();
    expect(result!.src).toBe(result!.fallbackSrc);
    expect(result!.src).toBe(
      "https://robohash.org/u3?set=set1&size=80x80",
    );
  });

  it("resolveUserAvatarSources returns null when user is null", () => {
    expect(resolveUserAvatarSources(null)).toBeNull();
  });
});
