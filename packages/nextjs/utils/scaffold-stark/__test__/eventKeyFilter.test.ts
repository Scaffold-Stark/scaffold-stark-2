import { describe, it, expect } from "vitest";
import { composeEventFilterKeys, serializeEventKey } from "../eventKeyFilter";
import {
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CallData,
} from "starknet";
import { mockDeployedContractAbi } from "./mockDeployedContractAbi";

const abiEnum = CallData.getAbiEnum(mockDeployedContractAbi.abi);
const abiStruct = CallData.getAbiStruct(mockDeployedContractAbi.abi);
const event = mockDeployedContractAbi.abi.find(
  (part) =>
    part.type === "event" &&
    part.name === "contracts::YourContract::YourContract::GreetingChanged",
);

describe("serializeEventKey", () => {
  it("should serialize event string key correctly", () => {
    expect(
      serializeEventKey(
        "hello world",
        { name: "", type: "core::byte_array::ByteArray" },
        {},
        {},
      ),
    ).toEqual(["0x0", "0x68656c6c6f20776f726c64", "0xb"]);
  });

  it("should serialize event long string event key correctly", () => {
    expect(
      serializeEventKey(
        "Long string, more than 31 characters.",
        { name: "", type: "core::byte_array::ByteArray" },
        {},
        {},
      ),
    ).toEqual([
      "0x1",
      "0x4c6f6e6720737472696e672c206d6f7265207468616e203331206368617261",
      "0x63746572732e",
      "0x6",
    ]);
  });

  it("should serialize u256 event key correctly", () => {
    expect(
      serializeEventKey(
        9986n,
        { name: "", type: "core::integer::u256" },
        abiStruct,
        abiEnum,
      ),
    ).toEqual(["0x2702", "0x0"]);
  });

  it("should serialize u512 event key correctly", () => {
    expect(
      serializeEventKey(
        9986n,
        { name: "", type: "core::integer::u512" },
        abiStruct,
        abiEnum,
      ),
    ).toEqual(["0x2702", "0x0", "0x0", "0x0"]);
  });

  it("should serialize ContractAddress event key correctly", () => {
    expect(
      serializeEventKey(
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        { name: "", type: "core::starknet::contract_address::ContractAddress" },
        abiStruct,
        abiEnum,
      ),
    ).toEqual([
      "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    ]);
  });

  it("should serialize ContractAddress array event key correctly", () => {
    expect(
      serializeEventKey(
        [
          "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
        ],
        {
          name: "",
          type: "core::array::Array::<core::starknet::contract_address::ContractAddress>",
        },
        abiStruct,
        abiEnum,
      ),
    ).toEqual([
      "0x2",
      "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
    ]);
  });

  it("should serialize tuple event key correctly", () => {
    expect(
      serializeEventKey(
        {
          0: 1n,
          1: 2n,
          2: true,
          3: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        },
        {
          name: "",
          type: "(core::integer::u32, core::integer::u64, core::bool, core::starknet::contract_address::ContractAddress)",
        },
        abiStruct,
        abiEnum,
      ),
    ).toEqual([
      "0x1",
      "0x2",
      "0x1",
      "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    ]);
  });

  it("should serialize struct event key correctly", () => {
    expect(
      serializeEventKey(
        {
          addr: new CairoOption(
            CairoOptionVariant.Some,
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          ),
          val: new CairoOption(CairoOptionVariant.None),
        },
        {
          name: "test",
          type: "contracts::YourContract::SomeStruct",
        },
        abiStruct,
        abiEnum,
      ),
    ).toEqual([
      "0x0",
      "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      "0x1",
    ]);
  });

  it("should handle simple enum variant", () => {
    const simpleEnum = new CairoCustomEnum({
      val1: "123",
    });

    const result = serializeEventKey(
      simpleEnum,
      { name: "enum_param", type: "contracts::YourContract::SimpleEnum" },
      abiStruct,
      abiEnum,
    );

    expect(result).toEqual(["0x0", "0x7b"]);
  });

  it("should serialize enum event key correctly", () => {
    const simpleEnum = new CairoCustomEnum({
      val1: 12,
    });

    const someEnum = new CairoCustomEnum({
      val1: simpleEnum,
    });
    expect(
      serializeEventKey(
        someEnum,
        {
          name: "test",
          type: "contracts::YourContract::SomeEnum",
        },
        abiStruct,
        abiEnum,
      ),
    ).toEqual(["0x0", "0x0", "0xc"]);
  });
});

describe("composeEventFilterKeys", () => {
  it("should compose event filter keys correctly", () => {
    expect(
      composeEventFilterKeys(
        {
          greeting_setter:
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          new_greeting: "hello world",
          event_type: 9987n,
          addresses: [
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
          ],
          tup: {
            0: 1n,
            1: 2n,
            2: true,
            3: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          },
          st: {
            addr: new CairoOption(
              CairoOptionVariant.Some,
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            ),
            val: new CairoOption(CairoOptionVariant.None),
          },
          enum_val: new CairoCustomEnum({
            val1: new CairoCustomEnum({
              val1: 12,
            }),
          }),
          bool_val: true,
        },
        event as any,
        mockDeployedContractAbi.abi,
      ),
    ).toEqual([
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x0"],
      ["0x68656c6c6f20776f726c64"],
      ["0xb"],
      ["0x2703"],
      ["0x0"],
      ["0x2"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3"],
      ["0x1"],
      ["0x2"],
      ["0x1"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x0"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x1"],
      ["0x0"],
      ["0x0"],
      ["0xc"],
      ["0x1"],
    ]);
  });

  it("should compose event filter keys with any filter correctly", () => {
    expect(
      composeEventFilterKeys(
        {
          greeting_setter:
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          new_greeting: "hello world",
          addresses: [
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
          ],
          tup: {
            0: 1n,
            1: 2n,
            2: true,
            3: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          },
          st: {
            addr: new CairoOption(
              CairoOptionVariant.Some,
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            ),
            val: new CairoOption(CairoOptionVariant.None),
          },
          enum_val: new CairoCustomEnum({
            val1: new CairoCustomEnum({
              val1: 12,
            }),
          }),
          bool_val: true,
        },
        event as any,
        mockDeployedContractAbi.abi,
      ),
    ).toEqual([
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x0"],
      ["0x68656c6c6f20776f726c64"],
      ["0xb"],
      [],
      [],
      ["0x2"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3"],
      ["0x1"],
      ["0x2"],
      ["0x1"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x0"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x1"],
      ["0x0"],
      ["0x0"],
      ["0xc"],
      ["0x1"],
    ]);
  });

  it("should compose event filter keys break when include any for uncertain length type", () => {
    expect(
      composeEventFilterKeys(
        {
          greeting_setter:
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          new_greeting: "hello world",
          event_type: 9987n,
          addresses: [
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
          ],
          tup: {
            0: 1n,
            1: 2n,
            2: true,
            3: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          },
          enum_val: new CairoCustomEnum({
            val1: new CairoCustomEnum({
              val1: 12,
            }),
          }),
          bool_val: true,
        },
        event as any,
        mockDeployedContractAbi.abi,
      ),
    ).toEqual([
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x0"],
      ["0x68656c6c6f20776f726c64"],
      ["0xb"],
      ["0x2703"],
      ["0x0"],
      ["0x2"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
      ["0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3"],
      ["0x1"],
      ["0x2"],
      ["0x1"],
      ["0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"],
    ]);
  });

  it("should compose event filter keys with multiple matching keys correctly", () => {
    expect(
      composeEventFilterKeys(
        {
          greeting_setter: [
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
          ],
          new_greeting: "hello world",
          event_type: [9987n, 9988n, 9989n],
          addresses: [
            [
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
            ],
            [
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            ],
            [
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115695",
            ],
          ],
        },
        event as any,
        mockDeployedContractAbi.abi,
      ),
    ).toEqual([
      [
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
      ],
      ["0x0"],
      ["0x68656c6c6f20776f726c64"],
      ["0xb"],
      ["0x2703", "0x2704", "0x2705"],
      ["0x0", "0x0", "0x0"],
      ["0x2", "0x2", "0x2"],
      [
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
      ],
      [
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115695",
      ],
    ]);
  });

  it("should compose event filter keys with multiple matching keys when 2d array is not uniform length", () => {
    expect(
      composeEventFilterKeys(
        {
          greeting_setter: [
            "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
            "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
          ],
          new_greeting: "hello world",
          event_type: [9987n, 9988n, 9989n],
          addresses: [
            [
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
            ],
            [
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
              "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
            ],
            [
              "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
            ],
          ],
          tup: {
            0: 1n,
            1: 2n,
            2: true,
            3: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
          },
        },
        event as any,
        mockDeployedContractAbi.abi,
      ),
    ).toEqual([
      [
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b3",
        "0x6a1991c289bda4d029f9acee45b37c0f4ed86d0c35d977ed320f8594afaa0b4",
      ],
      ["0x0"],
      ["0x68656c6c6f20776f726c64"],
      ["0xb"],
      ["0x2703", "0x2704", "0x2705"],
      ["0x0", "0x0", "0x0"],
    ]);
  });
});
