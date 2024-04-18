"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
  starkscan,
  jsonRpcProvider,
  starknetChainId,
} from "@starknet-react/core";
import { Header } from "~~/components/Header";
import { Footer } from "~~/components/Footer";
import { ProgressBar } from "~~/components/scaffold-stark/ProgressBar";
import { appChains } from "~~/services/web3/connectors";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import { Space_Grotesk } from "@next/font/google";
import scaffoldConfig from "~~/scaffold.config";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
});

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className={`relative flex flex-col flex-1 ${spaceGrotesk.className}`}>{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};
export const ScaffoldStarkAppWithProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  const provider =
    scaffoldConfig.rpcProviderUrl == ""
      ? publicProvider()
      : jsonRpcProvider({
          rpc: () => ({
            nodeUrl: scaffoldConfig.rpcProviderUrl,
            chainId: starknetChainId(scaffoldConfig.targetNetworks[0].id),
          }),
        });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos(), new BurnerConnector()],
  });

  return (
    <StarknetConfig
      chains={appChains}
      provider={provider}
      connectors={connectors}
      explorer={starkscan}
    >
      <ProgressBar />
      <ScaffoldStarkApp>{children}</ScaffoldStarkApp>
    </StarknetConfig>
  );
};
