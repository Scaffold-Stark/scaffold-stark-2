import { describe, expect, it } from "vitest";
import { getArgsAsStringInputFromForm } from "../utilsContract";

describe("utilsContract", () => {
  it("should parse integer form correctly", () => {
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u8": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u16": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u32": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u64": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u128": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::u256": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::felt252": '10' }, false, true)).toEqual([10]);

    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i8": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i16": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i32": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i64": '10' }, false, true)).toEqual([10]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::integer::i128": '10' }, false, true)).toEqual([10]);
  });

  it("should parse bool form correctly", () => {
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": 'true' }, false, true)).toEqual([true]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '1' }, false, true)).toEqual([true]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x1' }, false, true)).toEqual([true]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x01' }, false, true)).toEqual([true]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x001' }, false, true)).toEqual([true]);

    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": 'false' }, false, true)).toEqual([false]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0' }, false, true)).toEqual([false]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x0' }, false, true)).toEqual([false]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x00' }, false, true)).toEqual([false]);
    expect(getArgsAsStringInputFromForm({ "echo_u8_input_core::bool": '0x000' }, false, true)).toEqual([false]);
  });

  it("should parse struct correctly", () => {
    const form = {
      "echo_struct_input_contracts::YourModel::User": {
        "name": {
          "type": "core::byte_array::ByteArray",
          "value": "john"
        },
        "age": {
          "type": "core::integer::u8",
          "value": "24"
        },
        "msg": {
          "type": "contracts::YourModel::Message",
          "value": {
            "variant": {
              "Quit": {
                "type": "()",
                "value": ""
              },
              "Echo": {
                "type": "core::felt252",
                "value": ""
              },
              "Move": {
                "type": "(core::integer::u128, core::integer::u128)",
                "value": "(1,2)"
              }
            }
          }
        }
      }
    }
    const result = getArgsAsStringInputFromForm(form, false, true);
    expect(result).toEqual([
      {
        "name": "john",
        "age": 24,
        "msg": {
          "variant": {
            "Move": {
              "0": 1,
              "1": 2
            },
          }
        }
      }
    ])
  });

  it("should parse multi input correctly", () => {
    const form = {
      "echo_enum_u_input_u8_core::integer::u8": "1",
      "echo_enum_u_input_contracts::YourModel::Message": {
        "variant": {
          "Quit": {
            "type": "()",
            "value": ""
          },
          "Echo": {
            "type": "core::felt252",
            "value": "32"
          },
          "Move": {
            "type": "(core::integer::u128, core::integer::u128)",
            "value": ""
          }
        }
      },
      "echo_enum_u_input_u16_core::integer::u16": "3",
      "echo_enum_u_input_u32_core::integer::i32": "4"
    }
    const result = getArgsAsStringInputFromForm(form, false, true);
    expect(result).toEqual([
      1,
      {
        "variant": {
          "Echo": 32
        }
      },
      3,
      4
    ])
  });
});