import { describe, it, expect } from "vitest";
import {
  replacer,
  isAddress,
  feltToHex,
  isJsonString,
  isValidContractArgs,
} from "../common";

describe("Common Utility Functions", () => {
  describe("replacer", () => {
    it("should convert bigint to string", () => {
      expect(replacer("", BigInt(123))).toBe("123");
    });

    it("should return other values unchanged", () => {
      expect(replacer("", "test")).toBe("test");
      expect(replacer("", 123)).toBe(123);
      expect(replacer("", null)).toBe(null);
    });
  });

  describe("isAddress", () => {
    it("should return true for valid Ethereum addresses", () => {
      expect(isAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
        true,
      );
    });

    it("should return false for invalid Ethereum addresses", () => {
      expect(isAddress("invalid_address")).toBe(false);
      expect(isAddress("0x123")).toBe(false);
      expect(isAddress("0x1234567890abcdef1234567890abcdef123456789")).toBe(
        false,
      );
    });
  });

  describe("feltToHex", () => {
    it("should convert bigint to hex string", () => {
      expect(feltToHex(BigInt(255))).toBe("0xff");
      expect(feltToHex(BigInt(0))).toBe("0x0");
    });
  });

  describe("isJsonString", () => {
    it("should return true for valid JSON strings", () => {
      expect(isJsonString('{"key": "value"}')).toBe(true);
      expect(isJsonString("[]")).toBe(true);
    });

    it("should return false for invalid JSON strings", () => {
      expect(isJsonString("{key: value}")).toBe(false);
      expect(isJsonString("invalid_json")).toBe(false);
    });
  });
  describe("isValidContractArgs", () => {
    it("should return true for valid arguments with correct length", () => {
      expect(isValidContractArgs([1, "test", true], 3)).toBe(true);
    });

    it("should return false if not an array", () => {
      expect(isValidContractArgs("not-an-array", 3)).toBe(false);
      expect(isValidContractArgs(null, 3)).toBe(false);
    });

    it("should return false if length does not match", () => {
      expect(isValidContractArgs([1, 2], 3)).toBe(false);
      expect(isValidContractArgs([1, 2, 3, 4], 3)).toBe(false);
    });

    it("should return false if any element is undefined, null, or empty string", () => {
      expect(isValidContractArgs([1, undefined, 3], 3)).toBe(false);
      expect(isValidContractArgs([1, null, 3], 3)).toBe(false);
      expect(isValidContractArgs([1, "", 3], 3)).toBe(false);
    });
  });
});
