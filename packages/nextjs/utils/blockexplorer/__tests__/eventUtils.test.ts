import { describe, it, expect } from "vitest";
import {
  getDisplayValue,
  getCairoType,
  getCopyValue,
  hasMeaningfulDecodedArgs,
  extractEventKeys,
  extractEventData,
} from "../eventUtils";

describe("utils/blockexplorer/eventUtils", () => {
  it("getDisplayValue formats bigint, boolean, string (hex vs text)", () => {
    expect(getDisplayValue(10n)).toBe("0xa");
    expect(getDisplayValue(true)).toBe("true");
    expect(getDisplayValue(false)).toBe("false");
    expect(getDisplayValue("0xabc"))?.toBe("0xabc");
    expect(getDisplayValue("hello")).toBe('"hello"');
    expect(getDisplayValue(42)).toBe("42");
  });

  it("getCairoType honors argTypes mapping when provided", () => {
    const argTypes = { amount: "core::integer::u128" };
    expect(getCairoType(123n, "amount", argTypes)).toBe("core::integer::u128");
  });

  it("getCairoType infers types when mapping not present", () => {
    expect(getCairoType(true)).toBe("core::bool");
    // address length 66 with 0x prefix
    const address = "0x" + "a".repeat(64);
    expect(getCairoType(address)).toBe(
      "core::starknet::contract_address::ContractAddress",
    );
    expect(getCairoType("0xabc")).toBe("core::felt252");
    expect(getCairoType("hello")).toBe("core::byte_array::ByteArray");
    expect(getCairoType(5n)).toBe("core::integer::u256");
    expect(getCairoType(123)).toBe("core::felt252");
  });

  it("getCopyValue returns hex for bigint and string for others", () => {
    expect(getCopyValue(255n)).toBe("0xff");
    expect(getCopyValue("abc")).toBe("abc");
  });

  it("hasMeaningfulDecodedArgs checks that not only key*/data* fields exist", () => {
    expect(hasMeaningfulDecodedArgs({})).toBe(false);
    expect(hasMeaningfulDecodedArgs({ key0: "x", data0: "y" })).toBe(false);
    expect(hasMeaningfulDecodedArgs({ key0: "x", name: "bob" })).toBe(true);
  });

  it("extractEventKeys returns selector and key* in order", () => {
    const args = { selector: "0x1", key0: "0xa", key1: "0xb", data0: "0xc" };
    expect(extractEventKeys(args)).toEqual(["0x1", "0xa", "0xb"]);
  });

  it("extractEventData returns only data* fields in order", () => {
    const args = { selector: "0x1", data0: "0xa", data1: "0xb", key0: "0xc" };
    expect(extractEventData(args)).toEqual(["0xa", "0xb"]);
  });
});
