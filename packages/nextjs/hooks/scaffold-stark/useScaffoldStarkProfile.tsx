import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import { useEffect, useState } from "react";
import { StarkProfile } from "starknet";

type network = "mainnet" | "sepolia" | "devnet";

const shouldUseProfile = () => {
  const set = new Set(["mainnet", "sepolia"]);
  return (
    set.has(scaffoldConfig.targetNetworks[0].network) &&
    (scaffoldConfig.targetNetworks[0].network as network) !==
      chains.devnet.network
  );
};

const starknetIdApiBaseUrl =
  (scaffoldConfig.targetNetworks[0].network as network) ===
  chains.mainnet.network
    ? "https://api.starknet.id"
    : "https://sepolia.api.starknet.id";

export const fetchProfileFromApi = async (address: string) => {
  try {
    const addrToDomainRes = await fetch(
      `${starknetIdApiBaseUrl}/addr_to_domain?addr=${address}`,
    );

    if (!addrToDomainRes.ok) {
      throw new Error(await addrToDomainRes.text());
    }

    const addrToDomainJson = await addrToDomainRes.json();

    const domain = addrToDomainJson.domain;

    const profileRes = await fetch(
      `${starknetIdApiBaseUrl}/domain_to_data?domain=${domain}`,
    );

    if (!profileRes.ok) throw new Error(await profileRes.text());

    const profileData = await profileRes.json();

    const id = BigInt(profileData.id).toString();

    const uriRes = await fetch(`${starknetIdApiBaseUrl}/uri?id=${id}`);

    const uriData = await uriRes.json();

    return {
      name: profileData.domain.domain,
      profilePicture: uriData.image,
      // TODO: figure out where these go in case we have PFP, because its a bit complex to parse the data
      // discord?: string;
      // twitter?: string;
      // github?: string;
      // proofOfPersonhood?: boolean;
    };
  } catch (e) {
    const error = e as Error;

    // Suppress known "no data" error, log all others
    if (error.message.includes("No data found")) {
      console.log(
        `The above error is because there is no profile for address: ${address}`,
      );
    } else {
      console.error("Error fetching profile from API: ", error);
    }

    return {
      name: "",
      profilePicture: "",
    };
  }
};

// this hook is a workaround, basically a re-implement of the starknet react hook with conditional rendering.
export const useScaffoldStarkProfile = (
  address: chains.Address | undefined,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<StarkProfile | undefined>();
  const isEnabled = shouldUseProfile();

  useEffect(() => {
    if (!isEnabled || !address) {
      setProfile({ name: "", profilePicture: "" });
      return;
    }

    setIsLoading(true);

    fetchProfileFromApi(address)
      .then((data) => {
        setProfile(data);
      })
      .catch((e) => {
        console.error(`[useScaffoldStarkProfile] ` + e.message);
        setProfile(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address, isEnabled]);

  return { data: profile, isLoading };
};
