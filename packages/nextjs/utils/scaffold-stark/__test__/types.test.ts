import { describe, it, expect } from "vitest";
import {
  isCairoInt,
  isCairoBigInt,
  isCairoU256,
  isCairoContractAddress,
  isCairoEthAddress,
  isCairoClassHash,
  isCairoFunction,
  isCairoVoid,
  isCairoBool,
  isCairoBytes31,
  isCairoByteArray,
  isCairoSecp256k1Point,
  isCairoFelt,
  isCairoTuple,
  isCairoType,
  isStructOrEnum,
  isCairoArray,
  isCairoOption,
  isCairoResult,
  parseGenericType,
} from "../../../utils/scaffold-stark/types";
import { AbiParameter } from "../contract";

describe("Cairo Type Checks", () => {
  describe("isCairoInt", () => {
    it("should return true for valid Cairo integer types", () => {
      expect(isCairoInt("core::integer::u8")).toBe(true);
      expect(isCairoInt("core::integer::u16")).toBe(true);
      expect(isCairoInt("core::integer::u32")).toBe(true);
      expect(isCairoInt("core::integer::i8")).toBe(true);
      expect(isCairoInt("core::integer::i16")).toBe(true);
      expect(isCairoInt("core::integer::i32")).toBe(true);
    });

    it("should return false for invalid Cairo integer types", () => {
      expect(isCairoInt("core::integer::u64")).toBe(false);
      expect(isCairoInt("core::integer::u256")).toBe(false);
      expect(isCairoInt("core::felt252")).toBe(false);
      expect(isCairoInt("")).toBe(false);
    });
  });

  describe("isCairoBigInt", () => {
    it("should return true for valid Cairo big integer types", () => {
      expect(isCairoBigInt("core::integer::u64")).toBe(true);
      expect(isCairoBigInt("core::integer::u128")).toBe(true);
      expect(isCairoBigInt("core::integer::i64")).toBe(true);
      expect(isCairoBigInt("core::integer::i128")).toBe(true);
    });

    it("should return false for invalid Cairo big integer types", () => {
      expect(isCairoBigInt("core::integer::u32")).toBe(false);
      expect(isCairoBigInt("core::integer::u256")).toBe(false);
      expect(isCairoBigInt("")).toBe(false);
    });
  });

  describe("isCairoU256", () => {
    it("should return true for Cairo u256 type", () => {
      expect(isCairoU256("core::integer::u256")).toBe(true);
    });

    it("should return false for non-u256 types", () => {
      expect(isCairoU256("core::integer::u128")).toBe(false);
      expect(isCairoU256("")).toBe(false);
    });
  });

  describe("isCairoContractAddress", () => {
    it("should return true for Cairo contract address type", () => {
      expect(
        isCairoContractAddress(
          "core::starknet::contract_address::ContractAddress",
        ),
      ).toBe(true);
    });

    it("should return false for non-contract address types", () => {
      expect(
        isCairoContractAddress("core::starknet::eth_address::EthAddress"),
      ).toBe(false);
      expect(isCairoContractAddress("")).toBe(false);
    });
  });

  describe("isCairoFelt", () => {
    it("should return true for Cairo felt252 type", () => {
      expect(isCairoFelt("core::felt252")).toBe(true);
    });

    it("should return false for non-felt types", () => {
      expect(isCairoFelt("core::integer::u256")).toBe(false);
      expect(isCairoFelt("")).toBe(false);
    });
  });

  describe("isCairoTuple", () => {
    it("should return true for Cairo tuple types", () => {
      expect(isCairoTuple("(core::felt252, core::integer::u256)")).toBe(true);
      expect(isCairoTuple("(core::felt252)")).toBe(true);
    });

    it("should return false for empty tuple and non-tuple types", () => {
      expect(isCairoTuple("()")).toBe(false);
      expect(isCairoTuple("core::felt252")).toBe(false);
      expect(isCairoTuple("")).toBe(false);
    });
  });

  describe("isStructOrEnum", () => {
    it("should return true for struct types", () => {
      expect(
        isStructOrEnum({
          type: "struct",
          name: "MyStruct",
          members: [] as readonly AbiParameter[],
        }),
      ).toBe(true);
    });

    it("should return true for enum types", () => {
      expect(
        isStructOrEnum({
          type: "enum",
          name: "MyEnum",
          members: [] as readonly AbiParameter[],
        }),
      ).toBe(true);
    });

    it("should return false for other types", () => {
      expect(isStructOrEnum({ type: "other" })).toBe(false);
      expect(isStructOrEnum({})).toBe(false);
    });
  });

  describe("Collection Types", () => {
    it("should identify Cairo array types", () => {
      expect(isCairoArray("core::array<felt252>")).toBe(true);
      expect(isCairoArray("other::type")).toBe(false);
    });

    it("should identify Cairo option types", () => {
      expect(isCairoOption("core::option<felt252>")).toBe(true);
      expect(isCairoOption("other::type")).toBe(false);
    });

    it("should identify Cairo result types", () => {
      expect(isCairoResult("core::result<felt252>")).toBe(true);
      expect(isCairoResult("other::type")).toBe(false);
    });
  });

  describe("parseGenericType", () => {
    it("should parse simple generic types", () => {
      expect(parseGenericType("Option<felt252>")).toEqual(["felt252"]);
    });

    it("should parse tuple types within generics", () => {
      expect(parseGenericType("Option<(felt252, u256)>")).toEqual(
        "(felt252, u256)",
      );
    });

    it("should parse multiple type parameters", () => {
      expect(parseGenericType("Result<felt252, u256>")).toEqual([
        "felt252",
        "u256",
      ]);
    });

    it("should handle nested generic types", () => {
      expect(parseGenericType("Option<Array<felt252>>")).toEqual([
        "Array<felt252",
      ]);
      expect(parseGenericType("Array<felt252>")).toEqual(["felt252"]);
    });

    it("should return original string if no generic parameters", () => {
      expect(parseGenericType("felt252")).toBe("felt252");
    });
  });

  describe("isCairoType", () => {
    it("should return true for all valid Cairo types", () => {
      const validTypes = [
        "core::integer::u8",
        "core::integer::u64",
        "core::integer::u256",
        "core::starknet::contract_address::ContractAddress",
        "core::starknet::eth_address::EthAddress",
        "core::starknet::class_hash::ClassHash",
        "function",
        "()",
        "core::bool",
        "core::bytes_31::bytes31",
        "core::byte_array::ByteArray",
        "core::starknet::secp256k1::Secp256k1Point",
        "core::felt252",
        "(core::felt252, core::integer::u256)",
      ];

      validTypes.forEach((type) => {
        expect(isCairoType(type)).toBe(true);
      });
    });

    it("should return false for invalid Cairo types", () => {
      const invalidTypes = [
        "",
        "invalid_type",
        "core::unknown",
        "string",
        "number",
      ];

      invalidTypes.forEach((type) => {
        expect(isCairoType(type)).toBe(false);
      });
    });
  });
});
