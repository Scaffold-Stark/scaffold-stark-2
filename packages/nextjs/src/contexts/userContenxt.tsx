"use client";
import {
  StarknetWindowObject,
  connect,
  disconnect,
} from "starknetkit";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Account, Contract, RpcProvider, constants, num } from "starknet";
export enum UserMode {
  OWNER = "owner",
  MULTIOWNER = "multiowner",
}

export const strapex_factory_address = "0x06aeD73C614D8ee9A9e08C6852f1715c7C4C73D4f391D4be64726E75202207c8";

interface UserContextType {
  isLoggedIn: boolean;
  userMode: UserMode;
  login: () => void;
  logout: () => void;
  toggleMode: () => void;
  connection: StarknetWindowObject | null;
  account: Account | null;
  address: string | null;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>(UserMode.OWNER);
  const [connection, setConnection] = useState<StarknetWindowObject | null>(
    null
  );
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  


  useEffect(() => {
    // This effect runs only on the client side
    if (typeof window !== 'undefined') {
      const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
      if (storedIsLoggedIn !== null) {
        setIsLoggedIn(JSON.parse(storedIsLoggedIn));
      }

      const storedUserMode = localStorage.getItem("userMode");
      if (storedUserMode !== null) {
        setUserMode(storedUserMode as UserMode);
      }
    }
  }, []);

  // Effect to persist isLoggedIn state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn));
    }
  }, [isLoggedIn]);

  // Effect to persist userMode state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("userMode", userMode);
    }
  }, [userMode]);

  const login = async () => {
  
    console.log("startedLogin");
    const { wallet } = await connect( { modalMode: "canAsk" } )

    if (wallet && wallet.isConnected) {
      setConnection(wallet);
      setAccount(wallet.account);
      setAddress(wallet.selectedAddress);
      setIsLoggedIn(true);
    }
  };

  const logout = async () => {
    await disconnect({
      clearLastWallet: true,
    });
    setIsLoggedIn(false);
    setConnection(null);
    setAccount(null);
    setAddress(null);
  };
  const getBizOwnerContract = async () => {
    

    
    if (!address) {
      console.warn("Wallet address is not available.");
      return;
    }
    if (!strapex_factory_address) {
      alert("Factory contact missing in env");
      return;
    }  
  };

  useEffect(() => {
    if (isLoggedIn) {
      getBizOwnerContract();
    }
  }, [isLoggedIn, address]);
  const toggleMode = () =>
    setUserMode(userMode === UserMode.OWNER ? UserMode.MULTIOWNER : UserMode.OWNER);

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        userMode,
        login,
        logout,
        toggleMode,
        connection,
        account,
        address,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
