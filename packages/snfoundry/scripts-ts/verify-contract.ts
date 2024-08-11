import axios from "axios";
import { green, red } from "./helpers/colorize-log";

export const verifyContract = async (
  contractAddress: string,
  classHash: string
): Promise<void> => {
  try {
    const response = await axios.post(
      `https://starknet-mainnet.public.blastapi.io`,
      {
        classHash: classHash,
      }
    );

    if (response.status === 200) {
      console.log(
        green(`Contract verified successfully at ${contractAddress}`)
      );
    } else {
      console.error(red("Contract verification failed:"), response.data);
    }
  } catch (error) {
    console.error(red("Error verifying contract:"), error);
  }
};
