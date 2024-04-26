import { useGlobalState } from "~~/services/store/store";
import { useEffect, useState } from "react";
import { BlockNumber } from "starknet";
import { Address } from "@starknet-react/chains";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";
import { ethDecimals } from "~~/utils/scaffold-stark/common";

type UseScaffoldEthBalanceProps = {
  address?: Address | string;
  amount?: bigint;
};

const useScaffoldEthBalance = ({
  address,
  amount,
}: UseScaffoldEthBalanceProps) => {
  const price = useGlobalState((state) => state.nativeCurrencyPrice);
  const [balance, setBalance] = useState(
    amount !== undefined ? formatBalance(amount) : "0",
  );

  const { data, ...props } = useScaffoldContractRead({
    contractName: "Eth",
    functionName: "balance_of",
    args: [address as string],
    blockIdentifier: "pending" as BlockNumber,
    watch: true,
  });

  useEffect(() => {
    // @ts-ignore
    if (data !== undefined) {
      // @ts-ignore
      setBalance(formatBalance(data));
    }
  }, [data]);

  function formatBalance(balanceBigInt: bigint) {
    const integerPart = balanceBigInt / ethDecimals;
    const remainder = balanceBigInt % ethDecimals;

    const remainderStr = remainder.toString().padStart(18, "0");
    const decimalPart = remainderStr.slice(0, 4);
    return `${integerPart}.${decimalPart}`;
  }

  return {
    price,
    balance,
    usdValue: parseFloat(balance) * price,
    ...props,
  };
};

export default useScaffoldEthBalance;
