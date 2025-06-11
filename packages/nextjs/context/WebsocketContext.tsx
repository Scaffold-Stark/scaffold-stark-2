import React, {
  createContext,
  RefObject,
  useContext,
  useRef,
  useState,
} from "react";
import { WebSocketChannel } from "starknet";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";

type WebsocketContextType = {
  createWsChannel: () => Promise<WebSocketChannel | null>;
  cleanUpWebsocket: () => Promise<void>;
  isWebsocketConnected: boolean;
  wsChannelRef: RefObject<WebSocketChannel | null>;
  subscriptionIdRef: RefObject<string | null>;
  setIsWebsocketConnected: React.Dispatch<React.SetStateAction<boolean>>;
};

const WebsocketContext = createContext<WebsocketContextType | null>(null);

export const useWebsocket = () => {
  const context = useContext(WebsocketContext);

  if (!context) {
    throw new Error("useWebsocket must be used within a WebsocketProvider");
  }

  return context;
};

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { targetNetwork } = useTargetNetwork();
  const [isWebsocketConnected, setIsWebsocketConnected] = useState(false);

  const wsChannelRef = useRef<WebSocketChannel | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);

  const wsUrl = targetNetwork.rpcUrls.public.websocket?.[0];

  const createWsChannel = async () => {
    if (!wsUrl) {
      throw new Error("Websocket Url Not found");
    }

    try {
      const wsChannel = new WebSocketChannel({
        nodeUrl: wsUrl,
      });

      await wsChannel.waitForConnection();
      setIsWebsocketConnected(true);
      wsChannelRef.current = wsChannel;

      return wsChannel;
    } catch (err) {
      console.error("Error in connection: ", err);
      return null;
    }
  };

  const cleanUpWebsocket = async () => {
    if (!wsChannelRef.current) return;

    try {
      if (subscriptionIdRef.current) {
        await wsChannelRef.current.unsubscribeEvents();
        subscriptionIdRef.current = null;
      }

      wsChannelRef.current.disconnect();

      await wsChannelRef.current.waitForDisconnection();
      wsChannelRef.current = null;
      setIsWebsocketConnected(false);
    } catch (err) {
      console.error("Error cleaning up websocket: ", err);
    }
  };

  const context = {
    createWsChannel,
    cleanUpWebsocket,
    isWebsocketConnected,
    setIsWebsocketConnected,
    wsChannelRef,
    subscriptionIdRef,
    // useWebsocket
  };

  return (
    <WebsocketContext.Provider value={context}>
      {children}
    </WebsocketContext.Provider>
  );
};
