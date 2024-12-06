import {
  useProvider,
  useStarkName,
  useStarkProfile,
} from "@starknet-react/core";
import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import { useEffect, useMemo, useState } from "react";
import { constants, Provider, RpcProvider, StarkProfile } from "starknet";
import { StarknetIdNavigator } from "starknetid.js";
import { useTargetNetwork } from "./useTargetNetwork";

const shouldUseProfile = () => {
  const set = new Set(["mainnet", "sepolia"]);
  return (
    set.has(scaffoldConfig.targetNetworks[0].network) &&
    scaffoldConfig.targetNetworks[0].network !== chains.devnet.network
  );
};

// this hook is a workaround, basically a re-implement of the starknet react hook with conditional rendering.
const useScaffoldStarkProfile = (address: chains.Address | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<StarkProfile | undefined>();
  const { targetNetwork } = useTargetNetwork();
  const publicNodeUrl = targetNetwork.rpcUrls.public.http[0];

  const provider = useMemo(() => {
    return new RpcProvider({
      nodeUrl: publicNodeUrl,
    });
  }, [publicNodeUrl]);

  useEffect(() => {
    if (!shouldUseProfile()) {
      return;
    }

    const wrappedProvider = new StarknetIdNavigator(
      provider as any,
      targetNetwork.network === chains.sepolia.network
        ? constants.StarknetChainId.SN_SEPOLIA
        : constants.StarknetChainId.SN_MAIN,
    );

    if (!!address) {
      setIsLoading(true);
      wrappedProvider.getProfileData(address).then((profileData) => {
        setProfile(profileData);
        setIsLoading(false);
      });
    }
  }, [address, provider, targetNetwork]);

  return { data: profile, isLoading };
};

export default useScaffoldStarkProfile;
