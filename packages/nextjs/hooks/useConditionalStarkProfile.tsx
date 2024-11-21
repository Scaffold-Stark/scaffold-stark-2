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
import { useTargetNetwork } from "./scaffold-stark/useTargetNetwork";

// this hook is a workaround, basically a re-implement of the starknet react hook with conditional rendering.
const useConditionalStarkProfile = (address: chains.Address | undefined) => {
  const shouldUseProfile =
    scaffoldConfig.targetNetworks[0].id !== chains.devnet.id;

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
    const wrappedProvider = new StarknetIdNavigator(
      provider as any,
      constants.StarknetChainId.SN_MAIN,
    );
    if (shouldUseProfile && !!address) {
      setIsLoading(true);
      wrappedProvider.getStarkProfiles([address]).then((profileData) => {
        if (profileData.length > 0) setProfile(profileData[0]);
        setIsLoading(false);
      });
    }
  }, [address, provider, shouldUseProfile]);

  useEffect(() => {
    console.log({ profile, address });
  }, [profile, address]);

  return { data: profile };
};

export default useConditionalStarkProfile;
