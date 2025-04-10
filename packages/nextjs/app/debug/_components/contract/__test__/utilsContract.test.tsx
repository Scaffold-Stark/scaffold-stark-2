import { describe, expect, it } from "vitest";
import { getArgsAsStringInputFromForm } from "../utilsContract";

describe("utilsContract", () => {
  it("should parse integer form correctly", () => {
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u8": "10" }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::u16": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::u32": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::u64": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::u128": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::u256": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::felt252": "10" }),
    ).toEqual([10n]);

    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i8": "10" }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::i16": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::i32": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::i64": "10",
      }),
    ).toEqual([10n]);
    expect(
      getArgsAsStringInputFromForm({
        "echo_u8_input_core::integer::i128": "10",
      }),
    ).toEqual([10n]);
  });

  it("should parse bool form correctly", () => {
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "true" }),
    ).toEqual([true]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "1" }),
    ).toEqual([true]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x1" }),
    ).toEqual([true]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x01" }),
    ).toEqual([true]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x001" }),
    ).toEqual([true]);

    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "false" }),
    ).toEqual([false]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0" }),
    ).toEqual([false]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x0" }),
    ).toEqual([false]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x00" }),
    ).toEqual([false]);
    expect(
      getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": "0x000" }),
    ).toEqual([false]);
  });

  it("should parse tuple input correctly", () => {
    const form = {
      "echo_tuple_input_(core::integer::u8, core::integer::u16)": "(1,2)",
    };
    const result = getArgsAsStringInputFromForm(form);
    expect(result).toEqual([
      {
        "0": 1n,
        "1": 2n,
      },
    ]);
  });

  it("should parse enum input correctly", () => {
    const form = {
      "echo_enum_u_input_u8_core::integer::u8": "1",
      "echo_enum_u_input_contracts::YourModel::Message": {
        variant: {
          Quit: {
            type: "()",
            value: "",
          },
          Echo: {
            type: "core::felt252",
            value: "32",
          },
          Move: {
            type: "(core::integer::u128, core::integer::u128)",
            value: "",
          },
        },
      },
      "echo_enum_u_input_u16_core::integer::u16": "3",
      "echo_enum_u_input_u32_core::integer::i32": "4",
    };
    const result = getArgsAsStringInputFromForm(form);
    expect(result).toEqual([
      1n,
      {
        variant: {
          Echo: 32n,
        },
      },
      3n,
      4n,
    ]);
  });

  it("should parse complex struct with enum & tuple inside correctly", () => {
    const form = {
      "echo_struct_input_contracts::YourModel::User": {
        name: {
          type: "core::byte_array::ByteArray",
          value: "john",
        },
        age: {
          type: "core::integer::u8",
          value: "24",
        },
        msg: {
          type: "contracts::YourModel::Message",
          value: {
            variant: {
              Quit: {
                type: "()",
                value: "",
              },
              Echo: {
                type: "core::felt252",
                value: "",
              },
              Move: {
                type: "(core::integer::u128, core::integer::u128)",
                value: "(1,2)",
              },
            },
          },
        },
      },
    };
    const result = getArgsAsStringInputFromForm(form);
    expect(result).toEqual([
      {
        name: "john",
        age: 24n,
        msg: {
          variant: {
            Move: {
              "0": 1n,
              "1": 2n,
            },
          },
        },
      },
    ]);
  });
});
