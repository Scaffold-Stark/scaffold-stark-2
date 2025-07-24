"use client";

import dynamic from "next/dynamic";

const DebugContracts = dynamic(
  () =>
    import("./_components/DebugContracts").then((mod) => mod.DebugContracts),
  { ssr: false }
);

export default function DebugContractsClient() {
  return <DebugContracts />;
}
