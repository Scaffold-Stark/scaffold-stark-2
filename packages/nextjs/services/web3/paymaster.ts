import { avnuPaymasterProvider } from "@starknet-react/core";

// Configure paymaster provider
const paymasterProvider = avnuPaymasterProvider({
  apiKey: process.env.NEXT_PUBLIC_AVNU_PAYMASTER_API_KEY || "",
});

export default paymasterProvider;
