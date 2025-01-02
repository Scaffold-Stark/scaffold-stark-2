import { describe, it, expect } from "vitest";
import { parseEventData } from "../eventsData";

const args = {
  addresses: [
    2846891009026995430665703316224827616914889274105712248413538305735679628945n,
    405386444695910825517307108962404693786634169326753577785483362897284225196n,
  ],
  arr: [1n, 2n],
  greeting_setter:
    2846891009026995430665703316224827616914889274105712248413538305735679628945n,
  greeting: "hello world",
  premium: true,

  tup: {
    0: 1n,
    1: 2n,
    2: true,
    3: 2846891009026995430665703316224827616914889274105712248413538305735679628945n,
  },
  value: 256n,
};

const types = [
  {
    name: "greeting_setter",
    type: "core::starknet::contract_address::ContractAddress",
    kind: "key",
  },
  {
    name: "new_greeting",
    type: "core::byte_array::ByteArray",
    kind: "key",
  },
  {
    name: "premium",
    type: "core::bool",
    kind: "data",
  },
  {
    name: "value",
    type: "core::integer::u256",
    kind: "data",
  },
  {
    name: "addresses",
    type: "core::array::Array::<core::starknet::contract_address::ContractAddress>",
    kind: "data",
  },
  {
    name: "arr",
    type: "core::array::Array::<core::integer::u256>",
    kind: "data",
  },
  {
    name: "tup",
    type: "(core::integer::u32, core::integer::u64, core::bool, core::starknet::contract_address::ContractAddress)",
    kind: "data",
  },
];

describe("parseEventData", () => {
  it("should parse event data correctly", () => {
    expect(parseEventData(args, types)).toEqual({
      addresses: [
        "0x064b48806902a367c8598f4F95C305e8c1a1aCbA5f082D294a43793113115691",
        "0x00E570CAf0d29E62DbCA6449342e4258Bc3E5f236D8A776a828d5a6Bcf7ED8Ac",
      ],
      arr: [1n, 2n],
      greeting_setter:
        "0x064b48806902a367c8598f4F95C305e8c1a1aCbA5f082D294a43793113115691",
      greeting: "hello world",
      premium: true,
      tup: {
        0: 1n,
        1: 2n,
        2: true,
        3: "0x064b48806902a367c8598f4F95C305e8c1a1aCbA5f082D294a43793113115691",
      },
      value: 256n,
    });
  });
});
