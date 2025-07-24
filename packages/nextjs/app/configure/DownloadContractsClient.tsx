"use client";

import dynamic from "next/dynamic";

const DownloadContracts = dynamic(
  () => import("./_components/DownloadContracts"),
  { ssr: false },
);

export default function DownloadContractsClient() {
  return <DownloadContracts />;
}
