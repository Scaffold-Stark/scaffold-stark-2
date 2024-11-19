import {
  hash,
  uint256,
  shortString,
  num,
} from "https://cdn.jsdelivr.net/npm/starknet@5.14/+esm";
export { formatUnits } from "https://esm.sh/viem@1.4.2";



export const config = {
  streamUrl: "http://localhost:7171/",
  startingBlock: 898565,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter: {
    header: {
      weak: true,
    },
    events: [
      {
        fromAddress:
          "0x04fecF8bd087edF963B678940c1484525A01B93B4676b1486c9e83477b530Fe8",
        keys: [hash.getSelectorFromName("CryptoBetCreated")],
        includeReceipt: false,
      },
    ],
  },
  sinkType: "postgres",
  sinkOptions: {
    connectionString: "<CONNECTION_STRING>",
    tlsAcceptInvalidCertificates: true,
    tableName: "bets",
    //invalidate: [{ column: "bet_type", value: "CRYPTO" }],
    entityMode: true,
    
  },
};

// This transform does nothing.
export default function transform(block) {
  const { events } = block;

  return (events ?? []).map(({ event }) => {
    if (!event.data) return;

    const yield_strategy_type = Number(num.hexToDecimalString(event.data[20])); // Check YieldStrategy enum in BetMaker

    if (yield_strategy_type === 0) {
      const cryptoBet = {
        id: uint256
        .uint256ToBN({ low: event.data[0], high: event.data[1] })
        .toString(),
        bet_id: uint256
          .uint256ToBN({ low: event.data[0], high: event.data[1] })
          .toString(),
        bet_type: "CRYPTO",
        name: shortString.decodeShortString(
          event.data[3].replace(/0x0+/, "0x"),
        ),
        image: shortString.decodeShortString(
          event.data[6].replace(/0x0+/, "0x"),
        ),
        category: shortString.decodeShortString(
          event.data[8].replace(/0x0+/, "0x"),
        ),
        description: shortString.decodeShortString(
          event.data[10].replace(/0x0+/, "0x"),
        ),
        is_settled: Boolean(parseInt(event.data[12], 16)),
        is_active: Boolean(parseInt(event.data[13], 16)),
        deadline: uint256
          .uint256ToBN({ low: event.data[14], high: event.data[15] })
          .toString(),
        vote_deadline: uint256
          .uint256ToBN({ low: event.data[16], high: event.data[17] })
          .toString(),
        total_money_betted: uint256
          .uint256ToBN({ low: event.data[18], high: event.data[19] })
          .toString(),
        yield_strategy_type: Number(num.hexToDecimalString(event.data[20])), // Check YieldStrategy enum in BetMaker,
        yield_strategy_name: null,
        yield_strategy_symbol: null,
        yield_strategy_address: null,
        reference_price_key: shortString.decodeShortString(
          event.data[21].replace(/0x0+/, "0x"),
        ),
        reference_price: uint256
          .uint256ToBN({ low: event.data[22], high: event.data[23] })
          .toString(),
        bet_condition: uint256
          .uint256ToBN({ low: event.data[24], high: event.data[25] })
          .toString(),
        bet_token_name: shortString.decodeShortString(
          event.data[26].replace(/0x0+/, "0x"),
        ),
        bet_token_address: event.data[27],
        outcome_yes_name: shortString.decodeShortString(
          event.data[28].replace(/0x0+/, "0x"),
        ),
        outcome_yes_bought_amount: uint256
          .uint256ToBN({ low: event.data[30], high: event.data[31] })
          .toString(),
        outcome_yes_bought_amount_with_yield: uint256
          .uint256ToBN({ low: event.data[32], high: event.data[33] })
          .toString(),
        outcome_no_name: shortString.decodeShortString(
          event.data[34].replace(/0x0+/, "0x"),
        ),
        outcome_no_bought_amount: uint256
          .uint256ToBN({ low: event.data[36], high: event.data[37] })
          .toString(),
        outcome_no_bought_amount_with_yield: uint256
          .uint256ToBN({ low: event.data[38], high: event.data[39] })
          .toString(),
        winner_outcome: null,
      };
      return {
        insert: cryptoBet
      };
  
    }

    const cryptoBet = {
      id: uint256
      .uint256ToBN({ low: event.data[0], high: event.data[1] })
      .toString(),
      bet_id: uint256
        .uint256ToBN({ low: event.data[0], high: event.data[1] })
        .toString(),
      bet_type: "CRYPTO",
      name: shortString.decodeShortString(event.data[3].replace(/0x0+/, "0x")),
      image: shortString.decodeShortString(event.data[6].replace(/0x0+/, "0x")),
      category: shortString.decodeShortString(
        event.data[8].replace(/0x0+/, "0x"),
      ),
      description: shortString.decodeShortString(
        event.data[10].replace(/0x0+/, "0x"),
      ),
      is_settled: Boolean(parseInt(event.data[12], 16)),
      is_active: Boolean(parseInt(event.data[13], 16)),
      deadline: uint256
        .uint256ToBN({ low: event.data[14], high: event.data[15] })
        .toString(),
      vote_deadline: uint256
        .uint256ToBN({ low: event.data[16], high: event.data[17] })
        .toString(),
      total_money_betted: uint256
        .uint256ToBN({ low: event.data[18], high: event.data[19] })
        .toString(),
      yield_strategy_type: Number(num.hexToDecimalString(event.data[20])), // Check YieldStrategy enum in BetMaker,
      yield_strategy_name: shortString.decodeShortString(
        event.data[21].replace(/0x0+/, "0x"),
      ),
      yield_strategy_symbol: shortString.decodeShortString(
        event.data[22].replace(/0x0+/, "0x"),
      ),
      yield_strategy_address: event.data[23],
      reference_price_key: shortString.decodeShortString(
        event.data[26].replace(/0x0+/, "0x"),
      ),
      reference_price: uint256
        .uint256ToBN({ low: event.data[27], high: event.data[28] })
        .toString(),
      bet_condition: uint256
        .uint256ToBN({ low: event.data[29], high: event.data[30] })
        .toString(),
      bet_token_name: shortString.decodeShortString(
        event.data[31].replace(/0x0+/, "0x"),
      ),
      bet_token_address: event.data[32],
      outcome_yes_name: shortString.decodeShortString(
        event.data[33].replace(/0x0+/, "0x"),
      ),
      outcome_yes_bought_amount: uint256
        .uint256ToBN({ low: event.data[35], high: event.data[36] })
        .toString(),
      outcome_yes_bought_amount_with_yield: uint256
        .uint256ToBN({ low: event.data[37], high: event.data[38] })
        .toString(),
      outcome_no_name: shortString.decodeShortString(
        event.data[39].replace(/0x0+/, "0x"),
      ),
      outcome_no_bought_amount: uint256
        .uint256ToBN({ low: event.data[41], high: event.data[42] })
        .toString(),
      outcome_no_bought_amount_with_yield: uint256
        .uint256ToBN({ low: event.data[43], high: event.data[44] })
        .toString(),
      winner_outcome: null,
    };

    return {
      insert: cryptoBet
    };
  });
}
