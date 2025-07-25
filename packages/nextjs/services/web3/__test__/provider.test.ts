import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { getRpcUrl } from "../provider";

describe("getRpcUrl", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should return devnet RPC URL when available", () => {
    process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL = "https://devnet.example.com";
    expect(getRpcUrl("devnet")).toBe("https://devnet.example.com");
  });

  it("should return sepolia RPC URL when available", () => {
    process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL =
      "https://sepolia.example.com";
    expect(getRpcUrl("sepolia")).toBe("https://sepolia.example.com");
  });

  it("should return mainnet RPC URL when available", () => {
    process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL =
      "https://mainnet.example.com";
    expect(getRpcUrl("mainnet")).toBe("https://mainnet.example.com");
  });

  it("should fallback to NEXT_PUBLIC_PROVIDER_URL for devnet when specific URL not set", () => {
    process.env.NEXT_PUBLIC_PROVIDER_URL = "https://fallback.example.com";
    expect(getRpcUrl("devnet")).toBe("https://fallback.example.com");
  });

  it("should return empty string when no URLs are configured", () => {
    delete process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_PROVIDER_URL;

    expect(getRpcUrl("devnet")).toBe("");
    expect(getRpcUrl("sepolia")).toBe("");
    expect(getRpcUrl("mainnet")).toBe("");
  });

  it("should prioritize network-specific URL over fallback", () => {
    process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL =
      "https://specific.example.com";
    process.env.NEXT_PUBLIC_PROVIDER_URL = "https://fallback.example.com";

    expect(getRpcUrl("devnet")).toBe("https://specific.example.com");
  });

  it("should return empty string for unknown networks", () => {
    process.env.NEXT_PUBLIC_PROVIDER_URL = "https://fallback.example.com";

    expect(getRpcUrl("unknown_network")).toBe("");
    expect(getRpcUrl("testnet")).toBe("");
    expect(getRpcUrl("")).toBe("");
  });
});
