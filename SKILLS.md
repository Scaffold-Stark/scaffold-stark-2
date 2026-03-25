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
- [Deployment](#deployment)
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

10. **Do NOT commit `packages/nextjs/contracts/deployedContracts.ts`** — This file is auto-generated on each `yarn deploy`. Committing it causes conflicts when the same contract is deployed to different addresses across environments.

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

## Deployment

### Full devnet workflow

```bash
# Terminal 1 — start local devnet
yarn chain

# Terminal 2 — compile + declare + deploy contracts
yarn deploy

# Terminal 3 — start Next.js dev server
yarn start
```

### Deploy to Sepolia

```bash
# 1. Set credentials
# packages/snfoundry/.env
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...

# 2. Deploy contracts
yarn deploy --network sepolia

# 3. Update scaffold.config.ts
targetNetworks: [chains.sepolia]

# 4. Set RPC in packages/nextjs/.env.local
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://...

# 5. Start or redeploy frontend
yarn start
# or
yarn vercel --prod
```

### Deploy to Mainnet

Same as Sepolia — use `--network mainnet` and `ACCOUNT_ADDRESS_MAINNET` / `PRIVATE_KEY_MAINNET`.

### Vercel deployment

```bash
# Link repo to Vercel and set env vars in Vercel dashboard, then:
yarn vercel --prod

# Deploy ignoring lint/type errors:
yarn vercel:yolo
```

Set `NEXT_PUBLIC_IGNORE_BUILD_ERROR=true` in Vercel environment variables to disable build-time checks.

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
