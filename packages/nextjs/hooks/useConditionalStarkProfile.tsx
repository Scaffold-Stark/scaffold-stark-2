import { useStarkProfile } from "@starknet-react/core";
import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

const shouldUseProfile = () => {
  const set = new Set(["mainnet", "sepolia"]);
  return (
    set.has(scaffoldConfig.targetNetworks[0].network) &&
    scaffoldConfig.targetNetworks[0].id !== chains.devnet.id
  );
};

const useConditionalStarkProfile = (address: chains.Address | undefined) => {
  // Conditional hooks are not recommended, but in this case, it's the best approach to avoid issues on devnet.
  const profile = shouldUseProfile()
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useStarkProfile({ address })
    : { data: undefined };
  return profile;
};

export default useConditionalStarkProfile;
