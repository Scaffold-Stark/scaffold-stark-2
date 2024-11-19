import {
  useProvider,
  useStarkName,
  useStarkProfile,
} from "@starknet-react/core";
import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import { useEffect, useMemo, useState } from "react";
import { constants, Provider, StarkProfile } from "starknet";
import { StarknetIdNavigator } from "starknetid.js";

const useConditionalStarkProfile = (address: chains.Address | undefined) => {
  const shouldUseProfile =
    scaffoldConfig.targetNetworks[0].id !== chains.devnet.id;

  const [profile, setProfile] = useState<StarkProfile | undefined>();

  // Conditional hooks are not recommended, but in this case, it's the best approach to avoid issues on devnet.

  const { provider } = useProvider();

  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // const profile = shouldUseProfile
  //   ? // eslint-disable-next-line react-hooks/rules-of-hooks
  //     useStarkProfile({ address })
  //   : { data: undefined };

  // const name = useStarkName({ address });

  useEffect(() => {
    const wrappedProvider = new StarknetIdNavigator(
      provider as any,
      constants.StarknetChainId.SN_MAIN,
    );
    if (shouldUseProfile && !!address)
      wrappedProvider.getStarkProfiles([address]).then((profileData) => {
        if (profileData.length > 0) setProfile(profileData[0]);
      });
  }, [address, provider, shouldUseProfile]);

  useEffect(() => {
    console.log({ profile, address });
  }, [profile, address]);

  return { data: profile };
};

export default useConditionalStarkProfile;
