"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  starkscan,
} from "@starknet-react/core";
import { Header } from "~~/components/Header";
import { Footer } from "~~/components/Footer";
import { ProgressBar } from "~~/components/scaffold-stark/ProgressBar";
import { appChains } from "~~/services/web3/connectors";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import provider from "~~/services/web3/provider";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-stark/useNativeCurrencyPrice";

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
  useNativeCurrencyPrice();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  return (
    <>
      <div className="flex relative flex-col min-h-screen bg-main">
        {!isDarkMode && (
          <>
            <div className="circle-gradient w-[330px] h-[330px]"></div>
            <div className="circle-gradient-blue w-[330px] h-[630px]"></div>
          </>
        )}
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos(), new BurnerConnector()],
    order: "random",
  });

  if (!mounted) return null;

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
