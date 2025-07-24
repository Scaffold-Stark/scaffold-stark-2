import DebugContractsClient from "./DebugContractsClient";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-stark/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description:
    "Debug your deployed 🏗 Scaffold-Stark 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return <DebugContractsClient />;
};

export default Debug;
