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

/**
 * Fetches Starknet profile information for a given address.
 * This hook is a workaround that re-implements the starknet-react profile hook with conditional rendering.
 * It only works on mainnet and sepolia networks (not devnet) and fetches profile data from the Starknet ID API.
 * Use this hook instead of the starknet-react version when conditional rendering or specific network support is needed.
 *
 * @param address - The Starknet address to fetch profile information for, typed as chains.Address | undefined
 * @returns {Object} An object containing:
 *   - data: StarkProfile | undefined - The profile data with name and profilePicture, or undefined if an error occurred; defaults to { name: "", profilePicture: "" } if disabled or no address
 *   - isLoading: boolean - Boolean indicating if the profile is currently loading
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldStarkProfile}
 */
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
