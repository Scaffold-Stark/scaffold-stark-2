import { CairoCustomEnum, CairoOption } from "starknet";

export type Bet = {
  bet_condition: bigint;
  bet_id: bigint;
  bet_token: { name: string; dispatcher: { address: string } };
  category: string;
  deadline: bigint;
  description: string;
  image: string;
  is_active: boolean;
  is_settled: boolean;
  name: string;
  outcomes: {
    outcome_yes: {
      bought_amount: bigint;
      bought_amount_with_yield: bigint;
      name: bigint;
    };
    outcome_no: {
      bought_amount: bigint;
      bought_amount_with_yield: bigint;
      name: bigint;
    };
  };
  reference_price: bigint;
  reference_price_key: bigint;
  total_money_betted: bigint;
  vote_deadline: bigint;
  winner_outcome: CairoOptionType;
  yield_strategy: CairoCustomEnumType;
};

type CairoOptionType = InstanceType<typeof CairoOption>;
type CairoCustomEnumType = InstanceType<typeof CairoCustomEnum>;
