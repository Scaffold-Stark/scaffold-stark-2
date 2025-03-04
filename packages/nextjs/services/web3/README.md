## RPC Provider Configuration  

This module sets up the RPC provider for Starknet by centralizing configuration through `scaffoldConfig.ts`. It determines the correct network and assigns the appropriate provider based on environment variables.  

### 🛠 Features  

- **Centralized Configuration**: Uses `scaffoldConfig.ts` to manage network selection and RPC URLs.  
- **Flexible Provider Selection**: Automatically chooses between a public provider or a JSON-RPC provider based on the configured RPC URL.  
- **Environment Variable Support**: Fetches RPC settings from environment variables to allow easy customization.  

### 📌 How It Works  

1. **Network Selection**  
   - The first network in `scaffoldConfig.targetNetworks` is considered the active network.  
   - The `currentNetwork` and `currentNetworkName` are derived from this selection.  

2. **RPC URL Handling**  
   - The system retrieves the RPC URL from `scaffoldConfig.rpcProviderUrl[currentNetworkName]`.  
   - If no RPC URL is found, it defaults to using a public provider.  

3. **Provider Setup**  
   - If no valid RPC URL is present or the target network is a **devnet**, it uses `publicProvider()`.  
   - Otherwise, it sets up a **JSON-RPC provider** with the appropriate `nodeUrl` and `chainId`.  

### 🔄 Changing Networks  

To switch networks, update the **environment variables** or modify `scaffoldConfig.ts`.  

- **Via `.env`** (Recommended for deployment)  
  Update the `NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL` in your `.env` file:  
  ```env
  NEXT_PUBLIC_CHAIN_ID=1
  NEXT_PUBLIC_RPC_URL=https://alpha-mainnet.starknet.io
  ```  
  Then restart the application to apply the changes.  

- **Via `scaffoldConfig.ts`** (For local testing or static configuration)  
  Modify the `targetNetworks` array to change the active network:  
  ```ts
  targetNetworks: [chains.mainnet], // Switch to Starknet Mainnet
  ```  

### 📝 Notes  

- Ensure `scaffoldConfig.ts` correctly maps environment variables to avoid conflicts.  
- Devnet detection prevents accidental use of an RPC provider when running on local test networks.  
- For production, always prefer configuring networks via `.env` to maintain flexibility and avoid hardcoding values.  
