"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { StarknetConfig, starkscan } from "@starknet-react/core";
import { Header } from "~~/components/Header";
import { Footer } from "~~/components/Footer";
import { ProgressBar } from "~~/components/scaffold-stark/ProgressBar";
import { appChains, connectors } from "~~/services/web3/connectors";
import provider from "~~/services/web3/provider";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-stark/useNativeCurrencyPrice";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomHeader } from "./CustomHeader";

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
  /* useNativeCurrencyPrice(); */

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  return (
    <>
      <div className="bg-main relative flex min-h-screen flex-col">
        {/*  <Header /> */}
        <CustomHeader />
        <main className="relative flex flex-1 flex-col">{children}</main>
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
  const queryClient = new QueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={appChains}
        provider={provider}
        connectors={connectors}
        explorer={starkscan}
      >
        <ProgressBar />
        <ScaffoldStarkApp>{children}</ScaffoldStarkApp>
      </StarknetConfig>
    </QueryClientProvider>
  );
};
