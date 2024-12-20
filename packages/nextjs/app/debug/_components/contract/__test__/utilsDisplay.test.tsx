import { describe, expect, it } from "vitest";
import { decodeContractResponse } from "../utilsDisplay";
import { abi } from "./mock/mockABI";
import {
  CairoOption,
  CairoOptionVariant,
  CairoResult,
  CairoResultVariant,
} from "starknet";

describe("utilsDisplay", () => {
  it("should parse basic integer response successfully", () => {
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u8" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u16" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u32" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u64" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u128" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u256" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10,
        abi,
        functionOutputs: [{ type: "core::integer::u256" }],
        asText: true,
      }),
    ).toEqual("10");
    expect(
      decodeContractResponse({
        resp: 10000000000000000000000000000000000n,
        abi,
        functionOutputs: [{ type: "core::integer::u256" }],
        asText: true,
      }),
    ).toEqual("Ξ 10000000000000000.0");
  });

  it("should parse boolean response successfully", () => {
    expect(
      decodeContractResponse({
        resp: true,
        abi,
        functionOutputs: [{ type: "core::bool" }],
        asText: true,
      }),
    ).toEqual("true");
    expect(
      decodeContractResponse({
        resp: false,
        abi,
        functionOutputs: [{ type: "core::bool" }],
        asText: true,
      }),
    ).toEqual("false");
  });

  it("should parse address response successfully", () => {
    expect(
      decodeContractResponse({
        resp: 18n,
        abi,
        functionOutputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        asText: true,
      }),
    ).toEqual(
      "0x0000000000000000000000000000000000000000000000000000000000000012",
    );
  });

  it("should parse hex response successfully", () => {
    expect(
      decodeContractResponse({
        resp: 10n,
        abi,
        functionOutputs: [
          {
            type: "core::felt252",
          },
        ],
        asText: true,
      }),
    ).toEqual("0xa");
  });

  it("should parse hex response successfully", () => {
    expect(
      decodeContractResponse({
        resp: "0x68656C6C6F776F726C64",
        abi,
        functionOutputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        asText: true,
        showAsString: true,
      }),
    ).toEqual("helloworld");
  });

  it("should parse tuple response successfully", () => {
    expect(
      decodeContractResponse({
        resp: { 0: 1n, 1: 2n },
        abi,
        functionOutputs: [
          {
            type: "(core::integer::u128, core::integer::u256)",
          },
        ],
        asText: true,
      }),
    ).toEqual("(1,2)");
    expect(
      decodeContractResponse({
        resp: { 0: 1n, 1: 2n },
        abi,
        functionOutputs: [
          {
            type: "(core::integer::u128, core::starknet::contract_address::ContractAddress)",
          },
        ],
        asText: true,
      }),
    ).toEqual(
      "(1,0x0000000000000000000000000000000000000000000000000000000000000002)",
    );
  });

  it("should parse array response successfully", () => {
    expect(
      decodeContractResponse({
        resp: [1n, 2n],
        abi,
        functionOutputs: [
          {
            type: "core::array::Array::<core::felt252>",
          },
        ],
        asText: true,
      }),
    ).toEqual('["0x1","0x2"]');
  });

  it("should parse struct response successfully", () => {
    expect(
      decodeContractResponse({
        resp: { addr: 18n, val: 128n },
        abi,
        functionOutputs: [
          {
            type: "contracts::YourContract::SomeStruct",
          },
        ],
        asText: true,
      }),
    ).toEqual(
      '{"addr":"0x0000000000000000000000000000000000000000000000000000000000000012","val":128}',
    );
  });

  it("should parse complex nested response successfully", () => {
    expect(
      decodeContractResponse({
        resp: {
          variant: {
            val2: [
              { 0: 256n, 1: 0n },
              {
                0: 128n,
                1: 2328777502463415453645897272792840718675077970106206613616409252789146022521n,
              },
            ],
          },
        },
        abi,
        functionOutputs: [
          {
            type: "contracts::YourContract::ComplexStruct",
          },
        ],
        asText: true,
      }),
    ).toEqual(
      '{"val2":["(256,0x0000000000000000000000000000000000000000000000000000000000000000)","(128,0x05260a965b7152B18D953a68BAbae359E423e083650AFdA2052Eae8F4C22F279)"]}',
    );

    expect(
      decodeContractResponse({
        resp: {
          variant: {
            val3: [
              { addr: 0n, val: 256n },
              {
                addr: 2328777502463415453645897272792840718675077970106206613616409252789146022521n,
                val: 128n,
              },
            ],
          },
        },
        abi,
        functionOutputs: [
          {
            type: "contracts::YourContract::ComplexStruct",
          },
        ],
        asText: true,
      }),
    ).toEqual(
      '{"val3":[{"addr":"0x0000000000000000000000000000000000000000000000000000000000000000","val":256},{"addr":"0x05260a965b7152B18D953a68BAbae359E423e083650AFdA2052Eae8F4C22F279","val":128}]}',
    );
  });

  it("should parse option correctly", () => {
    expect(
      decodeContractResponse({
        resp: new CairoOption(CairoOptionVariant.Some, 123),
        abi,
        functionOutputs: [
          {
            type: "core::option::Option::<core::integer::u256>",
          },
        ],
        asText: true,
      }),
    ).toEqual('{"Some":123}');

    expect(
      decodeContractResponse({
        resp: new CairoOption(CairoOptionVariant.None),
        abi,
        functionOutputs: [
          {
            type: "core::option::Option::<core::integer::u256>",
          },
        ],
        asText: true,
      }),
    ).toEqual('{"None":true}');
  });

  it("should parse result correctly", () => {
    expect(
      decodeContractResponse({
        resp: new CairoResult(CairoResultVariant.Ok, true),
        abi,
        functionOutputs: [
          {
            type: "core::result::Result::<core::bool, core::integer::u64>",
          },
        ],
        asText: true,
      }),
    ).toEqual('{"Ok":true}');

    expect(
      decodeContractResponse({
        resp: new CairoResult(CairoResultVariant.Err, 12),
        abi,
        functionOutputs: [
          {
            type: "core::result::Result::<core::bool, core::integer::u64>",
          },
        ],
        asText: true,
      }),
    ).toEqual('{"Err":12}');
  });
});
