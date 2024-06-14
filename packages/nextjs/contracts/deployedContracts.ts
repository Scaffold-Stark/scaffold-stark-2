/**
 * This file is autogenerated by Scaffold-Stark.
 * You should not edit it manually or your changes might be overwritten.
 */

const deployedContracts = {
  devnet: {
    StarkPrice: {
      address:
        "0x0449c7c91757ca068b00a2f2f227b18f52b9de08e3c2c624e6495bf2e4a0122a",
      abi: [
        {
          type: "impl",
          name: "StarkImpl",
          interface_name: "contracts::cryptos::StarkPrice::IStarkPrice",
        },
        {
          type: "interface",
          name: "contracts::cryptos::StarkPrice::IStarkPrice",
          items: [],
        },
        {
          type: "constructor",
          name: "constructor",
          inputs: [],
        },
        {
          type: "event",
          name: "contracts::cryptos::StarkPrice::StarkPrice::Event",
          kind: "enum",
          variants: [],
        },
      ],
    },
    BitcoinPrice: {
      address:
        "0x06b31d92f1cf52ccad0154e2f758e05996aa81b6aeb9f09fc0d7897c3b13d588",
      abi: [
        {
          type: "impl",
          name: "BitcoinImpl",
          interface_name: "contracts::cryptos::BitcoinPrice::IBitcoinPrice",
        },
        {
          type: "interface",
          name: "contracts::cryptos::BitcoinPrice::IBitcoinPrice",
          items: [],
        },
        {
          type: "constructor",
          name: "constructor",
          inputs: [],
        },
        {
          type: "event",
          name: "contracts::cryptos::BitcoinPrice::BitcoinPrice::Event",
          kind: "enum",
          variants: [],
        },
      ],
    },
    EtherPrice: {
      address:
        "0x02de4499f60bd3d0e498757ee113e554a38649cc938bb507d205ecf1467011f1",
      abi: [
        {
          type: "impl",
          name: "EtherImpl",
          interface_name: "contracts::cryptos::EtherPrice::IEtherPrice",
        },
        {
          type: "interface",
          name: "contracts::cryptos::EtherPrice::IEtherPrice",
          items: [],
        },
        {
          type: "constructor",
          name: "constructor",
          inputs: [],
        },
        {
          type: "event",
          name: "contracts::cryptos::EtherPrice::EtherPrice::Event",
          kind: "enum",
          variants: [],
        },
      ],
    },
  },
} as const;

export default deployedContracts;
