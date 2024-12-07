import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import { useEffect, useState } from "react";
import { StarkProfile } from "starknet";

const shouldUseProfile = () => {
  const set = new Set(["mainnet", "sepolia"]);
  return (
    set.has(scaffoldConfig.targetNetworks[0].network) &&
    // @ts-expect-error program thinks this is constant
    scaffoldConfig.targetNetworks[0].network !== chains.devnet.network
  );
};

const starknetIdApiBaseUrl =
  // @ts-expect-error program thinks this is constant
  scaffoldConfig.targetNetworks[0].network === chains.mainnet.network
    ? "https://api.starknet.id"
    : "https://sepolia.api.starknet.id";

const fetchProfileFromApi = async (address: string) => {
  const addrToDomainRes = await fetch(
    `${starknetIdApiBaseUrl}/addr_to_domain?addr=${address}`,
  );

  const addrToDomainJson = await addrToDomainRes.json();

  const domain = addrToDomainJson.domain;

  const profileRes = await fetch(
    `${starknetIdApiBaseUrl}/domain_to_data?domain=${domain}`,
  );

  const profileData = await profileRes.json();

  return {
    name: profileData.domain.domain,

    // TODO: figure out where these go in case we have PFP, because its a bit complex to parse the data
    // profilePicture?: string;
    // discord?: string;
    // twitter?: string;
    // github?: string;
    // proofOfPersonhood?: boolean;
  };
};

// this hook is a workaround, basically a re-implement of the starknet react hook with conditional rendering.
const useScaffoldStarkProfile = (address: chains.Address | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<StarkProfile | undefined>();
  const isEnabled = shouldUseProfile();

  useEffect(() => {
    if (!isEnabled || !address) {
      setProfile(undefined);
      return;
    }

    setIsLoading(true);

    fetchProfileFromApi(address)
      .then((data) => {
        setProfile(data);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isEnabled]);

  return { data: profile, isLoading };
};

export default useScaffoldStarkProfile;
