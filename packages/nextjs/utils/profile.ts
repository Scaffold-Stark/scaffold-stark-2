export const getStarknetPFPIfExists = (profilePicture: string | undefined) => {
  return profilePicture !== "https://starknet.id/api/identicons/0"
    ? profilePicture
    : undefined;
};
