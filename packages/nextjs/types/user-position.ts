import { Bet } from "./bet";
import { CairoCustomEnum } from "starknet";

export type UserPostion = {
  market: Bet;
  position_id: bigint;
  user: string;
  position: {
    amount: bigint;
    bought_amount: bigint;
    has_claimed: boolean;
    position_type: CairoCustomEnum;
  };
};
