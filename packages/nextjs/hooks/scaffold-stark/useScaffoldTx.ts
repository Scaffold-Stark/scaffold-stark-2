import { useEffect, useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { BigNumberish, RpcProvider } from "starknet";

/**
 * Hook para obtener transacciones y número de transacciones en un bloque específico de StarkNet
 * @param blockNumber - El número de bloque del cual se quieren obtener transacciones
 * @param watch - Si está en true, actualiza las transacciones cada pollingInterval milisegundos
 * @param enabled - Si está en false, deshabilita el hook
 */
export const useScaffoldTx = ({
  blockNumber, // Cambiado para aceptar el número de bloque como parámetro
  watch = false,
  enabled = true,
}: {
  blockNumber?: number; // Añadido como opción
  watch?: boolean;
  enabled?: boolean;
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [transactionCount, setTransactionCount] = useState<number | undefined>(
    undefined,
  );
  const [starknetVersion, setStarknetVersion] = useState<string | undefined>(
    undefined,
  );

  const { targetNetwork } = useTargetNetwork();

  // Inicializamos el proveedor con la URL del nodo RPC
  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  // Función para obtener las transacciones de un bloque
  const readTransactionsFromBlock = async (blockNumber: number) => {
    setIsLoading(true);
    setError(undefined); // Limpiar error antes de la nueva solicitud

    try {
      console.log("Reading Block Number:", blockNumber);

      // Llamada para obtener el bloque con las transacciones
      const block = await publicClient.getBlockWithTxHashes(blockNumber);

      // Confirmar si obtuvimos el bloque
      if (block) {
        console.log("Block data:", block);

        // Si el bloque tiene transacciones, las establecemos
        if ("transactions" in block) {
          const transactionCount = block.transactions.length;
          console.log(
            `Found ${transactionCount} transactions in block ${blockNumber}`,
          );
          setTransactions(block.transactions);
          setTransactionCount(transactionCount); // Guardar el número de transacciones

          // Extraer la versión de StarkNet
          if ("starknet_version" in block) {
            setStarknetVersion(block.starknet_version); // Extraer la versión de StarkNet
          } else {
            console.warn("StarkNet version is not available.");
          }
        } else {
          throw new Error(`Block ${blockNumber} does not have transactions.`);
        }
      } else {
        throw new Error(`Block ${blockNumber} not found.`);
      }
    } catch (e: any) {
      console.error("Error fetching transactions:", e);
      setError(
        e.message || "Unknown error occurred while fetching transactions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && blockNumber !== undefined) {
      console.log("Fetching data for block:", blockNumber);
      readTransactionsFromBlock(blockNumber);

      if (watch) {
        const interval = setInterval(() => {
          console.log("Polling block data for block:", blockNumber);
          readTransactionsFromBlock(blockNumber);
        }, 30000);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [enabled, publicClient, watch, blockNumber]); // Añadido blockNumber como dependencia

  return {
    transactions,
    transactionsCount: transactionCount || transactions.length, // Devuelve el conteo de transacciones correctamente
    blockNumber,
    starknetVersion,
    isLoading,
    error,
  };
};
