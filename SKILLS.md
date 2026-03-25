# Scaffold-Stark 2 — Agent Skills Reference

Practical recipes, FAQ, and pitfalls for building on Scaffold-Stark 2 (Cairo smart contracts + Next.js frontend).

---

## Table of Contents

- [Smart Contracts (Cairo / Starknet Foundry)](#smart-contracts-cairo--starknet-foundry)
  - [Project Structure](#contract-project-structure)
  - [Recipes](#contract-recipes)
  - [FAQ](#contract-faq)
  - [Common Pitfalls](#contract-pitfalls)
- [Frontend (Next.js / Starknet-React)](#frontend-nextjs--starknet-react)
  - [Project Structure](#frontend-project-structure)
  - [Recipes](#frontend-recipes)
  - [FAQ](#frontend-faq)
  - [Common Pitfalls](#frontend-pitfalls)
- [Deploy Scripts & Commands](#deploy-scripts--commands)
  - [How the Deploy Pipeline Works](#how-the-deploy-pipeline-works)
  - [All Deploy Commands](#all-deploy-commands)
  - [deploy.ts — Writing the Deploy Script](#deployts--writing-the-deploy-script)
  - [networks.ts — Env Vars & Credentials](#networksts--env-vars--credentials)
  - [Deploy FAQ](#deploy-faq)
  - [Deploy Pitfalls](#deploy-pitfalls)
- [Testing](#testing)

---

## Smart Contracts (Cairo / Starknet Foundry)

### Contract Project Structure

```
packages/snfoundry/
├── contracts/
│   └── src/
│       ├── lib.cairo           # Module declarations
│       └── your_contract.cairo # Your contract(s)
├── scripts-ts/
│   ├── deploy.ts               # Deployment entry point
│   └── helpers/
│       ├── deploy-wrapper.ts   # Deploy helper utilities
│       └── networks.ts         # Network configuration
├── Scarb.toml                  # Scarb/Cairo package config
└── .env                        # Deployer credentials (never commit)
```

---

### Contract Recipes

#### 1. Minimal contract skeleton with OpenZeppelin Ownable

```cairo
use openzeppelin_access::ownable::OwnableComponent;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::{ContractAddress, get_caller_address};

#[starknet::interface]
pub trait IMyContract<TContractState> {
    fn get_value(self: @TContractState) -> u256;
    fn set_value(ref self: TContractState, value: u256);
}

#[starknet::contract]
pub mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::IMyContract;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        ValueChanged: ValueChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct ValueChanged {
        #[key]
        caller: ContractAddress,
        value: u256,
    }

    #[storage]
    struct Storage {
        value: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
        self.value.write(0);
    }

    #[abi(embed_v0)]
    impl MyContractImpl of IMyContract<ContractState> {
        fn get_value(self: @ContractState) -> u256 {
            self.value.read()
        }

        fn set_value(ref self: ContractState, value: u256) {
            self.ownable.assert_only_owner();
            self.value.write(value);
            self.emit(ValueChanged { caller: get_caller_address(), value });
        }
    }
}
```

#### 2. ERC20 token transfer from caller (requires prior `approve`)

```cairo
// STRK mainnet: 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
// ETH mainnet:  0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7

use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, get_caller_address, get_contract_address};

fn receive_strk(ref self: ContractState, amount: u256) {
    let strk: ContractAddress =
        0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d_felt252
            .try_into()
            .unwrap();
    let erc20 = IERC20Dispatcher { contract_address: strk };
    // Caller must have called erc20.approve(this_contract, amount) first
    erc20.transfer_from(get_caller_address(), get_contract_address(), amount);
}
```

#### 3. Using a `Map` (mapping) in storage

```cairo
use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
use starknet::ContractAddress;

#[storage]
struct Storage {
    balances: Map<ContractAddress, u256>,
}

// Read
let bal = self.balances.read(some_address);

// Write
self.balances.write(some_address, bal + amount);
```

#### 4. Emitting an event with indexed keys

```cairo
#[derive(Drop, starknet::Event)]
struct Transfer {
    #[key]        // indexed — filterable in useScaffoldEventHistory
    from: ContractAddress,
    #[key]
    to: ContractAddress,
    value: u256,  // not indexed — stored in data field only
}

self.emit(Transfer { from: get_caller_address(), to: recipient, value: amount });
```

#### 5. Deploying a new contract in `deploy.ts`

```typescript
// packages/snfoundry/scripts-ts/deploy.ts
import { deployContract } from "./helpers/deploy-wrapper";

const deployScript = async (): Promise<void> => {
  await deployContract(
    {
      contract: "MyContract",
      constructorArgs: {
        owner: deployer.address,
      },
    },
    deployer,
  );
};

deployScript();
```

The deploy wrapper auto-writes the result to `packages/nextjs/contracts/deployedContracts.ts`.

#### 6. Reading contract address in a second contract (cross-contract call)

```cairo
use starknet::ContractAddress;

#[starknet::interface]
pub trait ICounter<TContractState> {
    fn increment(ref self: TContractState);
    fn get_count(self: @TContractState) -> u256;
}

// In the calling contract:
use super::{ICounterDispatcher, ICounterDispatcherTrait};

fn call_counter(ref self: ContractState, counter_address: ContractAddress) {
    let counter = ICounterDispatcher { contract_address: counter_address };
    counter.increment();
    let count = counter.get_count();
}
```

---

### Contract FAQ

**Q: How do I declare and deploy to devnet?**

```bash
yarn chain          # starts local devnet (katana)
yarn deploy         # declare + deploy to devnet, updates deployedContracts.ts
```

**Q: How do I deploy to Sepolia?**

```bash
# 1. Add credentials to packages/snfoundry/.env
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...

# 2. Deploy
yarn deploy --network sepolia

# 3. Update scaffold.config.ts
targetNetworks: [chains.sepolia]
```

**Q: How do I add a new contract to the project?**

1. Create `packages/snfoundry/contracts/src/my_contract.cairo`
2. Add `pub mod my_contract;` to `packages/snfoundry/contracts/src/lib.cairo`
3. Add deploy call in `packages/snfoundry/scripts-ts/deploy.ts`
4. Run `yarn deploy`

**Q: How do I verify a contract on Starkscan / Voyager?**

```bash
yarn verify --network sepolia
```

**Q: How does Scarb.toml control Cairo dependencies?**

```toml
[dependencies]
starknet = ">=2.8.2"
openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v0.20.0" }
```

**Q: How do I run Cairo tests?**

```bash
cd packages/snfoundry
snforge test
# or a specific test
snforge test test_my_function
```

---

### Contract Pitfalls

1. **Missing storage import** — `StoragePointerReadAccess` / `StoragePointerWriteAccess` / `StorageMapReadAccess` / `StorageMapWriteAccess` must be imported explicitly; the compiler will give cryptic "trait not found" errors without them.

2. **`felt252` arithmetic overflow** — `felt252` wraps modulo the Stark field prime. Use `u256` or `u128` for token amounts to avoid silent overflows.

3. **Forgetting `approve` before `transfer_from`** — Contracts that pull ERC-20 funds via `transfer_from` require the caller to first call `approve` on the token contract. Document this clearly in your interface and in the UI flow.

4. **Event key fields must be `Copy` types or `ContractAddress`** — Complex types like `ByteArray` cannot be `#[key]`. Index only primitive types (`felt252`, `u256`, `ContractAddress`, etc.). Non-indexable data still goes in the event body without `#[key]`.

5. **`#[substorage(v0)]` for every component** — Each OpenZeppelin component needs its own `#[substorage(v0)]` entry in `Storage` and a matching entry in `Event`. Missing either causes compilation errors.

6. **`pub mod` in `lib.cairo`** — Every new `.cairo` file must be declared with `pub mod file_name;` (without `.cairo` extension) in `lib.cairo` or it won't be compiled.

7. **`constructorArgs` key names must match Cairo parameter names** — In `deploy.ts`, the `constructorArgs` keys are mapped to Cairo constructor parameters by name. Mismatched names cause silent deployment failures or incorrect calldata encoding.

8. **`try_into().unwrap()` on address literals** — Converting a `felt252` address literal to `ContractAddress` via `try_into()` will panic if the value is zero. Guard zero-address cases explicitly.

9. **Starknet Foundry vs Scarb version mismatch** — Always keep `snforge` / `sncast` versions aligned with the `starknet-foundry` entry in `Scarb.toml`. Check compatibility at https://foundry-rs.github.io/starknet-foundry/

10. **Do NOT commit `packages/nextjs/contracts/deployedContracts.ts`** unless Scaffold-Stark is used as a project template. This file is auto-generated on each `yarn deploy`. If not used as a template, DO NOT COMMIT, as it causes conflicts when the same contract is deployed to different addresses across environments.

---

## Frontend (Next.js / Starknet-React)

### Frontend Project Structure

```
packages/nextjs/
├── app/                        # Next.js App Router pages
├── components/
│   └── scaffold-stark/         # Reusable UI components (Address, Balance, etc.)
├── contracts/
│   ├── deployedContracts.ts    # Auto-generated — do NOT edit manually
│   └── externalContracts.ts    # Manually add non-deployed contract ABIs here
├── hooks/
│   └── scaffold-stark/         # Custom hooks (read, write, events, etc.)
├── services/web3/
│   ├── connectors.tsx          # Wallet connector config
│   └── provider.ts             # RPC provider setup
├── scaffold.config.ts          # Target networks, polling interval, burner wallet
└── .env.local                  # RPC URLs (never commit)
```

---

### Frontend Recipes

#### 1. Read a contract value (reactive)

```tsx
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const { data: greeting, isLoading } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "greeting",
  // args: [] — omit if no args
});

return <span>{isLoading ? "Loading..." : greeting?.toString()}</span>;
```

#### 2. Write to a contract

```tsx
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const { sendAsync, isPending } = useScaffoldWriteContract({
  contractName: "YourContract",
  functionName: "set_greeting",
  args: ["Hello, Starknet!", undefined], // pass undefined for Option::None
});

return (
  <button onClick={() => sendAsync()} disabled={isPending}>
    {isPending ? "Sending..." : "Set Greeting"}
  </button>
);
```

#### 3. Multi-call (batch multiple writes in one transaction)

```tsx
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";

const { sendAsync } = useScaffoldMultiWriteContract({
  calls: [
    {
      contractName: "TokenA",
      functionName: "approve",
      args: [spenderAddress, amount],
    },
    {
      contractName: "YourContract",
      functionName: "deposit",
      args: [amount],
    },
  ],
});
```

#### 4. Listen to contract events (real-time)

```tsx
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-stark/useScaffoldWatchContractEvent";

useScaffoldWatchContractEvent({
  contractName: "YourContract",
  eventName: "GreetingChanged",
  onLogs: (logs) => {
    console.log("New greeting:", logs);
  },
});
```

#### 5. Fetch historical events

```tsx
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

const { data: events, isLoading } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "GreetingChanged",
  fromBlock: 0n,
  watch: true,
  filters: { greeting_setter: "0x..." }, // only works on #[key] fields
  blockData: true,
  transactionData: false,
  receiptData: false,
});
```

#### 6. Add an external (non-deployed) contract

```typescript
// packages/nextjs/contracts/externalContracts.ts
const externalContracts = {
  "0x534e5f4d41494e": {  // Starknet Mainnet chainId hex
    STRK: {
      address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      abi: [
        // paste ABI from Starkscan/Voyager
      ],
    },
  },
} as const;

export default externalContracts;
```

Then use `useScaffoldReadContract({ contractName: "STRK", ... })` normally.

#### 7. Get connected account address

```tsx
import { useAccount } from "@starknet-start/react";

const { address, status } = useAccount();
// status: "connected" | "disconnected" | "connecting" | "reconnecting"
```

#### 8. Display a Starknet address

```tsx
import { Address } from "~~/components/scaffold-stark";

<Address address={someAddress} format="short" />
// format="long" for full address
```

#### 9. Display STRK balance

```tsx
import { Balance } from "~~/components/scaffold-stark";

<Balance address={someAddress} />
```

#### 10. Switch/check current network

```tsx
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";

const { targetNetwork } = useTargetNetwork();
// targetNetwork.id, targetNetwork.name
```

#### 11. Show a toast notification after a transaction

```tsx
import { notification } from "~~/utils/scaffold-stark/notification";

try {
  await sendAsync();
  notification.success("Transaction confirmed!");
} catch (e) {
  notification.error("Transaction failed");
}
```

---

### Frontend FAQ

**Q: How do I add a new page?**

Create `packages/nextjs/app/my-page/page.tsx` — Next.js App Router picks it up automatically at `/my-page`.

**Q: How do I import components and hooks with the `~~` alias?**

`~~` maps to `packages/nextjs/` (configured in `tsconfig.json`). Always use this alias rather than relative paths from deep in the tree.

```tsx
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { Address } from "~~/components/scaffold-stark";
```

**Q: How do I change the target network?**

Edit `packages/nextjs/scaffold.config.ts`:

```typescript
import { supportedChains as chains } from "./supportedChains";

const scaffoldConfig = {
  targetNetworks: [chains.sepolia], // devnet | sepolia | mainnet
  ...
};
```

**Q: How do I configure the RPC URL?**

Edit `packages/nextjs/.env.local`:

```
NEXT_PUBLIC_DEVNET_PROVIDER_URL=http://127.0.0.1:5050
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.infura.io/rpc/v0_7/YOUR_KEY
NEXT_PUBLIC_MAINNET_PROVIDER_URL=https://starknet-mainnet.infura.io/rpc/v0_7/YOUR_KEY
```

**Q: How do I enable the burner wallet on testnets?**

```typescript
// scaffold.config.ts
onlyLocalBurnerWallet: false, // default: true (devnet only)
```

**Q: How do I add a new wallet connector?**

Edit `packages/nextjs/services/web3/connectors.tsx` to add connectors from `@starknet-start/react`.

**Q: Why are my hook TypeScript types not autocompleting?**

The types are derived from `deployedContracts.ts`. After each `yarn deploy`, types regenerate. If types are stale: re-run `yarn deploy` (even against devnet).

**Q: How do I pass `Option<T>` to a Cairo function?**

Pass `undefined` for `Option::None`, or the actual value for `Option::Some(value)`:

```tsx
// Option::None
args: ["my greeting", undefined]

// Option::Some(1000n)
args: ["my greeting", 1000n]
```

**Q: How do I format a `u256` value from a read call?**

Values are returned as `bigint`. Use standard JS bigint utilities or `formatUnits` from `ethers` / `starknet.js`:

```ts
import { formatUnits } from "ethers";
const formatted = formatUnits(data as bigint, 18); // 18 decimals for STRK
```

---

### Frontend Pitfalls

1. **`deployedContracts.ts` out of sync** — If you redeploy (new contract address), the frontend still points to the old address until you `yarn deploy` again. Always re-run deploy after Cairo changes.

2. **Using `useScaffoldContract` instead of `useScaffoldReadContract` for reads** — `useScaffoldContract` returns a raw instance; it does not cache or auto-refresh. Prefer `useScaffoldReadContract` for reactive reads.

3. **`BigInt` serialization in `JSON.stringify`** — Starknet values are `bigint`. `JSON.stringify` throws on `bigint`. Use `.toString()` or a custom replacer before serializing.

4. **Missing `"use client"` directive** — Hooks and wallet-interaction components must be in Client Components. Add `"use client"` at the top of any file that uses React state, effects, or Scaffold-Stark hooks.

5. **Chain ID mismatch in `externalContracts.ts`** — Chain IDs are hex strings, not numbers. Starknet Mainnet is `"0x534e5f4d41494e"`, Sepolia is `"0x534e5f5345504f4c4941"`. Using the wrong key means the hook can't find the contract.

6. **`args` array order must match Cairo function parameter order exactly** — There is no named argument mapping on the frontend. If you swap `args` positions, you'll pass the wrong values silently.

7. **Polling interval applies only to non-local networks** — On devnet, data is always fetched immediately. The `pollingInterval` in `scaffold.config.ts` only affects Sepolia/Mainnet.

8. **Stale `useScaffoldEventHistory` on first render** — Pass a reasonable `fromBlock` (e.g., the block your contract was deployed at) rather than `0n` on mainnet/sepolia to avoid fetching the entire chain history.

9. **Wallet not injected during SSR** — Wallet detection is browser-only. Never call wallet hooks in a Server Component. Any component that uses `useAccount`, `useConnect`, or `useScaffoldWriteContract` must be `"use client"`.

10. **`notification` utility vs `react-hot-toast` directly** — Use `notification` from `~~/utils/scaffold-stark/notification` (which wraps `react-hot-toast`) to stay consistent with the app's toast styling. Calling `toast()` directly bypasses the configured styles.

---

## Deploy Scripts & Commands

### How the Deploy Pipeline Works

Every `yarn deploy` call runs this exact sequence:

```
yarn deploy [--network <net>] [--no-reset]
  └── ts-node scripts-ts/helpers/deploy-wrapper.ts   ← CLI arg parsing + smartCompile()
        ├── scarb build  (or skips if Sierra/CASM unchanged)
        ├── ts-node scripts-ts/deploy.ts              ← your deploy script runs here
        │     ├── assertDeployerDefined()             ← checks .env credentials
        │     ├── assertRpcNetworkActive()            ← pings the RPC, prints block #
        │     ├── assertDeployerSignable()            ← signs test message to validate key pair
        │     ├── deployContract(...)                 ← declare class (skips if already on-chain)
        │     │     └── deployContract_NotWait()      ← queues a UDC call (does NOT send yet)
        │     └── executeDeployCalls()                ← sends ONE multicall tx for all queued deploys
        │           └── exportDeployments()           ← writes deployments/<network>_latest.json
        └── ts-node scripts-ts/helpers/parse-deployments.ts
              └── writes packages/nextjs/contracts/deployedContracts.ts
```

Key points:
- **Declare is idempotent** — if the class hash already exists on-chain, the declare step is silently skipped. Re-deploying the same bytecode costs nothing extra.
- **All contracts are deployed in a single multicall** — `deployContract()` only queues a UDC call; `executeDeployCalls()` sends them all at once. This means if `executeDeployCalls()` fails, **no** contracts get deployed even if `deployContract()` returned an address.
- **The returned address from `deployContract()` is deterministic** (salt + class hash + deployer address), computed locally before the tx is sent.
- **`deployedContracts.ts` is updated last** by `parse-deployments.ts`. If the process crashes after `exportDeployments()` but before parsing, run `yarn deploy` again — the declare will be skipped and only the parse step will re-run.

---

### All Deploy Commands

| Command | What it does |
|---|---|
| `yarn chain` | Start local devnet (`starknet-devnet --seed 0`) |
| `yarn deploy` | Compile + declare + deploy to **devnet** (resets `devnet_latest.json`) |
| `yarn deploy --network sepolia` | Deploy to Sepolia testnet |
| `yarn deploy --network mainnet` | Deploy to Mainnet |
| `yarn deploy --no-reset` | Deploy without overwriting `<network>_latest.json` (timestamps the old file, keeps history) |
| `yarn deploy:no-reset` | Alias for `yarn deploy --no-reset` |
| `yarn deploy:clear` | Delete all `deployments/*.json` files first, then deploy fresh |
| `yarn workspace @ss-2/snfoundry compile` | Compile Cairo contracts only (no deploy) |
| `yarn workspace @ss-2/snfoundry verify --network sepolia` | Verify source on block explorer |
| `yarn workspace @ss-2/snfoundry test` | Run `snforge test` |
| `yarn workspace @ss-2/snfoundry clean` | `scarb clean` + delete all deployment JSONs |

---

### deploy.ts — Writing the Deploy Script

`packages/snfoundry/scripts-ts/deploy.ts` is the only file you edit for each project. It is called with the `deployer` account already resolved from `.env` for the target network.

#### Minimal — single contract, owner constructor

```typescript
import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
} from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract({
    contract: "YourContract",        // must match the Cairo module name (case-sensitive)
    constructorArgs: {
      owner: deployer.address,       // key names must match Cairo constructor param names exactly
    },
  });
};

const main = async (): Promise<void> => {
  assertDeployerDefined();
  await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);
  await deployScript();
  await executeDeployCalls();
  exportDeployments();
};

main();
```

#### Multiple contracts

```typescript
const deployScript = async (): Promise<void> => {
  // All calls are queued; they execute in a single multicall tx in executeDeployCalls()
  await deployContract({
    contract: "TokenContract",
    constructorArgs: { owner: deployer.address, initial_supply: 1000000n },
  });

  await deployContract({
    contract: "MarketplaceContract",
    contractName: "Marketplace",    // optional: overrides the export name in deployedContracts.ts
    constructorArgs: {
      owner: deployer.address,
      fee_bps: 250,                 // u16 → pass as number
    },
    options: {
      maxFee: BigInt(2_000_000_000_000), // override fee cap
    },
  });
};
```

#### `deployContract` parameter reference

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contract` | `string` | Yes | Cairo `mod` name — must match a file in `contracts/target/dev/` |
| `constructorArgs` | `object` | If constructor exists | Keys = Cairo param names; values = JS equivalents (see type mapping below) |
| `contractName` | `string` | No | Export name in `deployedContracts.ts`. Defaults to `contract`. Use when deploying the same class twice under different names. |
| `options` | `UniversalDetails` | No | Starknet.js deploy options (e.g. `maxFee`) |

#### Cairo → JS type mapping for `constructorArgs`

| Cairo type | JS value |
|---|---|
| `ContractAddress` | hex string `"0x..."` or `deployer.address` |
| `felt252` | hex string `"0x..."`, decimal string `"123"`, or number |
| `u8` / `u16` / `u32` / `u64` / `u128` | number or `bigint` |
| `u256` | `bigint`, number, hex string, or `{ low: "123", high: "0" }` |
| `bool` | `true` / `false` / `0` / `1` |
| `ByteArray` (Cairo string) | JS `string` |
| `Array<T>` | JS array `[item1, item2]` |
| `Option::None` | omit the key, or `undefined` — **do not pass `null`** |
| `Option::Some(v)` | pass `v` directly |

---

### networks.ts — Env Vars & Credentials

`packages/snfoundry/scripts-ts/helpers/networks.ts` loads from `packages/snfoundry/.env`.

#### Devnet defaults (no `.env` needed)

```
PRIVATE_KEY_DEVNET  → 0x71d7bb07b9a64f6f78ac4c816aff4da9      (Katana predeployed account)
ACCOUNT_ADDRESS_DEVNET → 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
RPC_URL_DEVNET      → http://127.0.0.1:5050
```

These defaults only work with `yarn chain` (Katana with `--seed 0`). Override in `.env` if using a different seed or external devnet.

#### Sepolia / Mainnet `.env` required keys

```bash
# packages/snfoundry/.env
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...
RPC_URL_SEPOLIA=https://starknet-sepolia.infura.io/rpc/v0_7/YOUR_KEY

ACCOUNT_ADDRESS_MAINNET=0x...
PRIVATE_KEY_MAINNET=0x...
RPC_URL_MAINNET=https://starknet-mainnet.infura.io/rpc/v0_7/YOUR_KEY
```

> The deployer account **must already be deployed on-chain** (funded + initialized). `assertDeployerSignable()` will catch an undeployed account before any fee is spent.

#### Frontend RPC — separate file

```bash
# packages/nextjs/.env.local
NEXT_PUBLIC_DEVNET_PROVIDER_URL=http://127.0.0.1:5050
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.infura.io/rpc/v0_7/YOUR_KEY
NEXT_PUBLIC_MAINNET_PROVIDER_URL=https://starknet-mainnet.infura.io/rpc/v0_7/YOUR_KEY
```

These are **independent** of `packages/snfoundry/.env`. Both must be set for a full-stack deployment.

---

### Deploy FAQ

**Q: Why does my contract address change on every deploy even with the same code?**

`deployContract` uses a random salt (`stark.randomAddress()`). The address is `hash(salt, classHash, deployerAddress, constructorCalldata)`. Use `--no-reset` to keep the previous deployment if you need a stable address, or set a fixed salt by modifying the deploy script.

**Q: How do I re-deploy without re-declaring?**

You can't skip declaration through the CLI — but it's free because `declareIfNot_NotWait` checks if the class hash exists on-chain and skips if so. Just run `yarn deploy` normally.

**Q: How do I deploy the same Cairo class as two separate contracts?**

Call `deployContract` twice with different `contractName` values:

```typescript
await deployContract({ contract: "ERC20", contractName: "TokenA", constructorArgs: { ... } });
await deployContract({ contract: "ERC20", contractName: "TokenB", constructorArgs: { ... } });
```

Both will appear in `deployedContracts.ts` under their respective names.

**Q: What is `--no-reset` for?**

By default (`--reset`, which is on), `yarn deploy` overwrites `deployments/<network>_latest.json`. With `--no-reset`, the old file is renamed to `deployments/<network>_<timestamp>.json` before writing. Use this to keep deployment history across multiple deploys to the same network.

**Q: Where does `deployedContracts.ts` come from?**

It is written by `packages/snfoundry/scripts-ts/helpers/parse-deployments.ts` after each deploy. It reads all `*_latest.json` files in `packages/snfoundry/deployments/` and merges them by chain ID. **Never edit it manually.**

**Q: My `assertDeployerSignable` fails — what does that mean?**

Either: (a) the account at `ACCOUNT_ADDRESS_*` is not deployed on that network yet, or (b) `ACCOUNT_ADDRESS_*` and `PRIVATE_KEY_*` don't belong to the same account. Deploy the account first using `starkli account deploy` or a faucet + ArgentX/Braavos setup.

**Q: Can I use a hardware wallet / Ledger as the deployer?**

Not with the current scripts — they use a raw private key via `Account` from starknet.js. For hardware wallet signing you'd need to replace the `Account` instantiation with a custom signer.

---

### Deploy Pitfalls

1. **`constructorArgs` key names are case-sensitive and must match Cairo** — Cairo uses `snake_case`. `{ Owner: deployer.address }` silently fails with a "missing argument" error; it must be `{ owner: deployer.address }`.

2. **`executeDeployCalls()` must always be called** — `deployContract()` only queues UDC calls. If you return early without calling `executeDeployCalls()`, nothing is deployed on-chain despite seeing "Contract Deployed at" logs.

3. **`exportDeployments()` must be called before `parse-deployments.ts` runs** — `deploy-wrapper.ts` handles this for you, but if you run `deploy.ts` directly (not via the wrapper), you must call `exportDeployments()` manually.

4. **`deployer.address` resolves to the devnet default on Sepolia/Mainnet if `.env` is missing** — The devnet hardcoded address (`0x64b48...`) is used as fallback. The deploy will fail at `assertDeployerDefined` or `assertDeployerSignable`, but the error may be confusing. Always check `.env` first.

5. **Using `null` for `Option::None` breaks calldata compilation** — Pass `undefined` (or omit the key). `null` passes through `compile()` and produces an invalid calldata array.

6. **`contract` field is the Cairo `mod` name, not the filename** — If your file is `my_token.cairo` but the module is `pub mod ERC20Mintable`, use `contract: "ERC20Mintable"`. The deploy script searches `target/dev/` for `*ERC20Mintable.contract_class.json`.

7. **Declare succeeds but deploy multicall fails** — The class is now on-chain but the contract instance is not. Re-running `yarn deploy` will skip the declare (class already exists) and retry the deploy. This is safe.

8. **Don't run multiple `yarn deploy` simultaneously** — Both processes write to the same `deployments/<network>_latest.json` and will race/corrupt the file.

9. **`deploy:clear` deletes all deployment history** — `deployments/clear.mjs` removes every JSON file in the `deployments/` directory, not just `_latest`. Use `--no-reset` instead if you want to preserve history.

10. **Mainnet deployer is missing `cairoVersion: "1"`** in `networks.ts** — Unlike devnet/sepolia, the mainnet `Account` constructor omits `cairoVersion`. If you're deploying Cairo 1 contracts to mainnet and see unexpected signature errors, patch `networks.ts` to add `cairoVersion: "1"` to the mainnet `Account` instantiation.

---

## Deployment

> For full deploy script internals, CLI flags, `deploy.ts` recipes, `.env` reference, and deploy pitfalls see [Deploy Scripts & Commands](#deploy-scripts--commands) above.

### Full devnet workflow

```bash
# Terminal 1 — start local devnet (Katana, seed 0)
yarn chain

# Terminal 2 — compile + declare + deploy contracts → writes deployedContracts.ts
yarn deploy

# Terminal 3 — start Next.js dev server
yarn start
```

### Deploy to Sepolia

```bash
# 1. packages/snfoundry/.env
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...
RPC_URL_SEPOLIA=https://starknet-sepolia.infura.io/rpc/v0_7/YOUR_KEY

# 2. packages/nextjs/.env.local
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.infura.io/rpc/v0_7/YOUR_KEY

# 3. Deploy contracts
yarn deploy --network sepolia

# 4. Update scaffold.config.ts
# targetNetworks: [chains.sepolia]

# 5. Start or deploy frontend
yarn start                # local
yarn vercel --prod        # Vercel
```

### Deploy to Mainnet

Identical to Sepolia — use `--network mainnet`, `ACCOUNT_ADDRESS_MAINNET`, `PRIVATE_KEY_MAINNET`, `RPC_URL_MAINNET`.

> **Known issue:** The mainnet `Account` in `networks.ts` is missing `cairoVersion: "1"`. If you get signature errors on mainnet, add it manually. See [Deploy Pitfalls](#deploy-pitfalls) #10.

### Vercel deployment

```bash
yarn vercel --prod        # production
yarn vercel               # preview URL
yarn vercel:yolo          # skip lint/type checks
```

Set `NEXT_PUBLIC_IGNORE_BUILD_ERROR=true` in Vercel environment variables to disable build-time checks permanently.

---

## Testing

### Cairo unit tests (snforge)

```bash
cd packages/snfoundry
snforge test                        # run all tests
snforge test test_increment         # run specific test
snforge test --coverage             # coverage report
```

Test file convention:

```cairo
#[cfg(test)]
mod tests {
    use super::MyContract;
    use starknet::testing::set_caller_address;

    #[test]
    fn test_initial_value() {
        // deploy and assert
    }
}
```

### Frontend unit tests (Vitest)

```bash
cd packages/nextjs
yarn test              # watch mode
yarn test:coverage     # with coverage
```

### Useful sncast commands

```bash
# Declare a contract class
sncast --account myaccount declare --contract-name MyContract

# Deploy a declared class
sncast --account myaccount deploy --class-hash 0x...

# Call a read function
sncast call --contract-address 0x... --function "get_value"

# Invoke a write function
sncast --account myaccount invoke --contract-address 0x... --function "set_value" --calldata 42
```
