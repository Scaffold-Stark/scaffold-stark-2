import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  fetchProfileFromApi,
  useScaffoldStarkProfile,
} from "../useScaffoldStarkProfile";
import scaffoldConfig from "~~/scaffold.config";

const createMockResponse = (data: any): Response => {
  return {
    ok: true,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    status: 200,
    statusText: "OK",
    type: "basic",
    url: "",
    clone: () => createMockResponse(data),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
};

global.fetch = vi.fn((url) => {
  if (url.includes("addr_to_domain")) {
    return Promise.resolve(createMockResponse({ domain: "testuser" }));
  } else if (url.includes("domain_to_data")) {
    return Promise.resolve(
      createMockResponse({ id: "123", domain: { domain: "Test User" } }),
    );
  } else if (url.includes("/uri")) {
    return Promise.resolve(createMockResponse({ image: "test.jpg" }));
  }
  return Promise.reject(new Error("Unknown URL"));
});

//Mock the fetchProfileFromApi function
vi.mock("../useScaffoldStarkProfile", async () => {
  const actual = await import("../useScaffoldStarkProfile");
  return {
    ...(typeof actual === "object" ? actual : {}),
    fetchProfileFromApi: vi.fn().mockResolvedValue({
      name: "Test User",
      profilePicture: "test.jpg",
    }),
    shouldUseProfile: vi.fn().mockReturnValue(true),
  };
});

// Mock the scaffoldConfig
vi.mock(
  "~~/scaffold.config",
  async (importOriginal: () => Promise<{ default: any }>) => {
    const actual = await importOriginal();
    return {
      ...(typeof actual === "object" ? actual : {}),
      default: {
        targetNetworks: [
          {
            network: "mainnet",
          },
        ],
      },
    };
  },
);

describe("useScaffoldStarkProfile", () => {
  it("should fetch and return profile data successfully", async () => {
    const testAddress = "0x123";

    // Render the hook
    const { result } = renderHook(() => useScaffoldStarkProfile(testAddress));

    // Wait for the hook to fetch and resolve the data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Validate that the data matches the mock profile
    expect(result.current.data).toEqual({
      name: "Test User",
      profilePicture: "test.jpg",
    });
  });
  it("should handle undefined address", async () => {
    const { result } = renderHook(() => useScaffoldStarkProfile(undefined));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Since address is undefined, data should be undefined
    expect(result.current.data).toEqual({
      name: "",
      profilePicture: "",
    });
  });
  it("should handle invalid address", async () => {
    const invalidAddress = "";

    // Render the hook
    const { result } = renderHook(() =>
      // @ts-ignore
      useScaffoldStarkProfile(invalidAddress),
    );

    // Wait for the hook to fetch and resolve the data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Validate that the data is undefined due to invalid address
    expect(result.current.data).toEqual({
      name: "",
      profilePicture: "",
    });
  });
  it("should skip profile fetch if shouldUseProfile returns false", async () => {
    // Override the network to a non-supported network for this test
    vi.spyOn(scaffoldConfig, "targetNetworks", "get").mockReturnValue([
      {
        // @ts-ignore
        network: "testnet",
      },
    ]);

    const testAddress = "0x123";

    const { result } = renderHook(() => useScaffoldStarkProfile(testAddress));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Since the network is not supported, no profile should be fetched
    expect(result.current.data).toEqual({
      name: "",
      profilePicture: "",
    });
  });

  it("should handle API failure and return empty profile data", async () => {
    // Mocking the fetch function to simulate a failed API call
    global.fetch = vi.fn().mockRejectedValue(new Error("API error"));

    const testAddress = "0x123";

    // Render the hook
    const { result } = renderHook(() => useScaffoldStarkProfile(testAddress));

    // Wait for the hook to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Validate that the profile data is empty due to API failure
    expect(result.current.data).toEqual({
      name: "",
      profilePicture: "",
    });
  });
});
