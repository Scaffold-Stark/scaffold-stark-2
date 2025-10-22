import { useCallback, useEffect, useRef, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { getSharedWebSocketChannel } from "~~/services/web3/websocket";
import type {
  SubscribeNewHeadsParams,
  SubscribeNewTransactionReceiptsParams,
  SubscribeTransactionStatusParams,
  WebSocketChannel,
} from "starknet";

export type Topic = "newHeads" | "newTransactionReceipts" | "transactionStatus";

type TopicParams =
  | { topic: "newHeads"; params?: SubscribeNewHeadsParams }
  | {
      topic: "newTransactionReceipts";
      params?: SubscribeNewTransactionReceiptsParams;
    }
  | { topic: "transactionStatus"; params: SubscribeTransactionStatusParams };

export type UseWebSocketDataConfig = TopicParams & {
  enabled?: boolean;
  onMessage?: (msg: any) => void;
};

export const useWebSocketData = ({
  topic,
  params,
  enabled = true,
  onMessage,
}: UseWebSocketDataConfig) => {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any[]>([]);
  const subscriptionRef = useRef<any>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { targetNetwork } = useTargetNetwork();

  const start = useCallback(async () => {
    if (!enabled) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch {}
      subscriptionRef.current = null;
    }

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }

    const startTs = Date.now();
    setStatus("connecting");
    setError(null);

    try {
      const channel: WebSocketChannel | null =
        await getSharedWebSocketChannel(targetNetwork);
      if (!channel) throw new Error("WebSocket channel unavailable");

      let sub: any;
      if (topic === "newHeads") {
        sub = await channel.subscribeNewHeads(
          (params as SubscribeNewHeadsParams) || {},
        );
      } else if (topic === "newTransactionReceipts") {
        sub = await channel.subscribeNewTransactionReceipts(
          (params as SubscribeNewTransactionReceiptsParams) || {},
        );
      } else if (topic === "transactionStatus") {
        sub = await channel.subscribeTransactionStatus(
          params as SubscribeTransactionStatusParams,
        );
      }

      if (!sub) throw new Error("Unsupported subscription topic");

      subscriptionRef.current = sub;

      // Add minimum connection time to prevent UI flicker
      const elapsed = Date.now() - startTs;
      const minConnecting = 150; // ms
      const setConnected = () => setStatus("connected");

      if (elapsed < minConnecting) {
        connectTimeoutRef.current = setTimeout(
          setConnected,
          minConnecting - elapsed,
        );
      } else {
        setConnected();
      }

      sub.on((msg: any) => {
        setData((prev) => [msg, ...prev]);
        onMessage?.(msg);
      });
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus("error");
    }
  }, [enabled, targetNetwork, topic, params, onMessage]);

  useEffect(() => {
    start();
    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch {}
        subscriptionRef.current = null;
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, enabled, targetNetwork]);

  // Reset data when topic or params change to avoid mixing streams
  useEffect(() => {
    setData([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, JSON.stringify(params)]);

  const isConnected = status === "connected";
  const isLoading = status === "connecting";
  return { isConnected, isLoading, status, error, data } as const;
};
