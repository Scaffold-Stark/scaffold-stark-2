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
    process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL = "http://127.0.0.1:5050";
    expect(getRpcUrl("devnet")).toBe("http://127.0.0.1:5050");
  });

  it("should return sepolia RPC URL when available", () => {
    process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL =
      "https://starknet-sepolia.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8";
    expect(getRpcUrl("sepolia")).toBe(
      "https://starknet-sepolia.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8",
    );
  });

  it("should return mainnet RPC URL when available", () => {
    process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL =
      "https://starknet-mainnet.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8";
    expect(getRpcUrl("mainnet")).toBe(
      "https://starknet-mainnet.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8",
    );
  });

  it("should fallback to NEXT_PUBLIC_PROVIDER_URL for devnet when specific URL not set", () => {
    process.env.NEXT_PUBLIC_PROVIDER_URL = "http://127.0.0.1:5050";
    delete process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
    expect(getRpcUrl("devnet")).toBe("http://127.0.0.1:5050");
  });

  it("should return public url when no URLs are configured in env", () => {
    delete process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL;
    delete process.env.NEXT_PUBLIC_PROVIDER_URL;

    expect(getRpcUrl("devnet")).toBe("http://127.0.0.1:5050");
    expect(getRpcUrl("sepolia")).toBe(
      "https://starknet-sepolia.public.blastapi.io/rpc/v0_8",
    );
    expect(getRpcUrl("mainnet")).toBe(
      "https://starknet-mainnet.public.blastapi.io/rpc/v0_8",
    );
  });

  it("should prioritize network-specific URL over fallback", () => {
    process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL =
      "https://starknet-sepolia.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8";
    process.env.NEXT_PUBLIC_PROVIDER_URL =
      "https://starknet-sepolia.public.blastapi.io";

    expect(getRpcUrl("sepolia")).toBe(
      "https://starknet-sepolia.blastapi.io/64168c77-3fa5-4e1e-9fe4-41675d212522/rpc/v0_8",
    );
  });

  it("should return devnet rpc url for unknown networks", () => {
    process.env.NEXT_PUBLIC_PROVIDER_URL =
      "https://starknet-sepolia.public.blastapi.io";

    expect(getRpcUrl("unknown_network")).toBe("http://127.0.0.1:5050");
    expect(getRpcUrl("testnet")).toBe("http://127.0.0.1:5050");
    expect(getRpcUrl("")).toBe("http://127.0.0.1:5050");
  });
});
