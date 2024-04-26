import { useGlobalState } from "~~/services/store/store";
import { useEffect, useState } from "react";
import { useContractRead } from "@starknet-react/core";
import ethAbi, { ethContractAddress, ethDecimals } from "~~/utils/eth";
import { BlockNumber, uint256 } from "starknet";
import { Address } from "@starknet-react/chains";

type UseScaffoldEthBalanceProps = {
  address?: Address | string;
};

const useScaffoldEthBalance = ({ address }: UseScaffoldEthBalanceProps) => {
  const price = useGlobalState((state) => state.nativeCurrencyPrice);
  const [balance, setBalance] = useState("0");

  const { data, ...props } = useContractRead({
    address: ethContractAddress,
    watch: true,
    abi: ethAbi,
    functionName: "balanceOf",
    args: [address as string],
    blockIdentifier: "pending" as BlockNumber,
  });

  useEffect(() => {
    // @ts-ignore
    if (data && data.balance !== undefined) {
      // @ts-ignore
      const balanceBigInt = uint256.uint256ToBN(data.balance);
      const integerPart = balanceBigInt / ethDecimals;
      const remainder = balanceBigInt % ethDecimals;

      const remainderStr = remainder
        .toString()
        .padStart(ethDecimals.toString().length, "0");
      const decimalPart = remainderStr.slice(0, 4);

      setBalance(`${integerPart}.${decimalPart}`);
    }
  }, [data]);

  return {
    price,
    balance,
    usdValue: parseFloat(balance) * price,
    ...props,
  };
};

export default useScaffoldEthBalance;
