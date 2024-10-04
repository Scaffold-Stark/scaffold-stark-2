import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { Contract, RpcProvider } from "starknet";

import type { Mock } from "vitest";
import { ContractName } from "~~/utils/scaffold-stark/contract";

vi.mock("~~/hooks/scaffold-stark/useDeployedContractInfo");
vi.mock("~~/hooks/scaffold-stark/useTargetNetwork");
vi.mock("~~/hooks/useAccount");
vi.mock("starknet", () => {
  const actualStarknet = vi.importActual("starknet");
  return {
    ...actualStarknet,
    Contract: vi.fn(),
    RpcProvider: vi.fn(),
  };
});
