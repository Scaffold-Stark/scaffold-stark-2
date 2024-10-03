"use client";

import { useState } from "react";
import { useScaffoldTx } from "~~/hooks/scaffold-stark/useScaffoldTx";
import { useScaffoldTxBatch } from "~~/hooks/scaffold-stark/useScaffoldTxBatch";
import { InputBase } from "~~/components/scaffold-stark/";

const HooksExample: React.FC = () => {
  const [blockNumber1, setBlockNumber1] = useState<string>("0");
  const [blockNumber2, setBlockNumber2] = useState<string>("1");
  const [startBlock, setStartBlock] = useState<string>("0");

  // Módulo 1: Transacciones de dos bloques individuales
  const {
    transactionsCount: txCount1,
    starknetVersion: starknetVersion1,
    blockNumber: fetchedBlockNumber1,
    isLoading: isLoadingTx1,
    error: txError1,
  } = useScaffoldTx({
    blockNumber: blockNumber1 ? parseInt(blockNumber1) : undefined,
    watch: true,
  });

  const {
    transactionsCount: txCount2,
    starknetVersion: starknetVersion2,
    blockNumber: fetchedBlockNumber2,
    isLoading: isLoadingTx2,
    error: txError2,
  } = useScaffoldTx({
    blockNumber: blockNumber2 ? parseInt(blockNumber2) : undefined,
    watch: true,
  });

  // Funciones para obtener el bloque ganador entre dos bloques
  const getWinningBlock = () => {
    if (txCount1 === undefined || txCount2 === undefined) return null;

    if (txCount1 > txCount2) {
      return { blockNumber: fetchedBlockNumber1, transactionsCount: txCount1 };
    }
    if (txCount2 > txCount1) {
      return { blockNumber: fetchedBlockNumber2, transactionsCount: txCount2 };
    }
    return { blockNumber: null, transactionsCount: txCount1 };
  };

  const winningBlock = getWinningBlock();

  // Módulo 2: Transacciones de bloques consecutivos de 10
  const startBlockNum = parseInt(startBlock);
  const endBlockNum10 = startBlockNum + 10;
  const {
    transactionCounts: blockTxCounts10,
    isLoading: isLoadingBlocks10,
    error: blockError10,
  } = useScaffoldTxBatch({
    startBlock: startBlockNum,
    endBlock: endBlockNum10,
    watch: false,
    enabled: startBlockNum >= 0,
  });

  const getWinningBlockIn10 = () => {
    if (blockTxCounts10.length === 0) return null;

    const maxTransactions = Math.max(...blockTxCounts10);
    const winningIndex = blockTxCounts10.indexOf(maxTransactions);
    return {
      blockNumber: winningIndex + startBlockNum,
      transactionsCount: maxTransactions,
    };
  };

  const winningBlockIn10 = getWinningBlockIn10();

  // Módulo 3: Transacciones de bloques consecutivos de 100
  const endBlockNum100 = startBlockNum + 100;
  const {
    transactionCounts: blockTxCounts100,
    isLoading: isLoadingBlocks100,
    error: blockError100,
  } = useScaffoldTxBatch({
    startBlock: startBlockNum,
    endBlock: endBlockNum100,
    watch: false,
    enabled: startBlockNum >= 0,
  });

  const getWinningBlockIn100 = () => {
    if (blockTxCounts100.length === 0) return null;

    const maxTransactions = Math.max(...blockTxCounts100);
    const winningIndex = blockTxCounts100.indexOf(maxTransactions);
    return {
      blockNumber: winningIndex + startBlockNum,
      transactionsCount: maxTransactions,
    };
  };

  const winningBlockIn100 = getWinningBlockIn100();

  // Módulo 4: Transacciones de bloques consecutivos de 1000
  const endBlockNum1000 = startBlockNum + 1000;
  const {
    transactionCounts: blockTxCounts1000,
    isLoading: isLoadingBlocks1000,
    error: blockError1000,
  } = useScaffoldTxBatch({
    startBlock: startBlockNum,
    endBlock: endBlockNum1000,
    watch: false,
    enabled: startBlockNum >= 0,
  });

  const getWinningBlockIn1000 = () => {
    if (blockTxCounts1000.length === 0) return null;

    const maxTransactions = Math.max(...blockTxCounts1000);
    const winningIndex = blockTxCounts1000.indexOf(maxTransactions);
    return {
      blockNumber: winningIndex + startBlockNum,
      transactionsCount: maxTransactions,
    };
  };

  const winningBlockIn1000 = getWinningBlockIn1000();

  // Manejo de cambios
  const handleBlockNumberChange1 = (newValue: string) =>
    setBlockNumber1(newValue);
  const handleBlockNumberChange2 = (newValue: string) =>
    setBlockNumber2(newValue);
  const handleStartBlockChange = (newValue: string) => setStartBlock(newValue);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transactions from Two Blocks</h1>

      {/* Módulo 1 */}
      <div className="flex space-x-4">
        <div className="w-1/2 rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <h2 className="text-xl font-semibold mb-4">
            Transactions from Block 1 (useScaffoldTx)
          </h2>
          {isLoadingTx1 ? (
            <p>Loading transaction info...</p>
          ) : txError1 ? (
            <p>Error loading transaction info: {txError1}</p>
          ) : (
            <div>
              <p>StarkNet Version: {starknetVersion1 || "N/A"}</p>
              <p>Block Number: {fetchedBlockNumber1?.toString() || "N/A"}</p>
              <p>
                Transactions Count:{" "}
                {txCount1 !== undefined ? txCount1.toString() : "N/A"}
              </p>
            </div>
          )}
          <label className="block text-sm font-medium mb-2">
            From Block 1 (Enter Block Number):
          </label>
          <InputBase
            value={blockNumber1}
            onChange={handleBlockNumberChange1}
            placeholder="Enter first block number"
          />
        </div>

        <div className="w-1/2 rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <h2 className="text-xl font-semibold mb-4">
            Transactions from Block 2 (useScaffoldTx)
          </h2>
          {isLoadingTx2 ? (
            <p>Loading transaction info...</p>
          ) : txError2 ? (
            <p>Error loading transaction info: {txError2}</p>
          ) : (
            <div>
              <p>StarkNet Version: {starknetVersion2 || "N/A"}</p>
              <p>Block Number: {fetchedBlockNumber2?.toString() || "N/A"}</p>
              <p>
                Transactions Count:{" "}
                {txCount2 !== undefined ? txCount2.toString() : "N/A"}
              </p>
            </div>
          )}
          <label className="block text-sm font-medium mb-2">
            From Block 2 (Enter Block Number):
          </label>
          <InputBase
            value={blockNumber2}
            onChange={handleBlockNumberChange2}
            placeholder="Enter second block number"
          />
        </div>
      </div>

      <div className="mt-8 rounded-[5px] bg-base-100 border border-gradient p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">
          Winning Block Information (Block 1 vs Block 2)
        </h2>
        {winningBlock ? (
          winningBlock.blockNumber !== null ? (
            <div>
              <p>
                Block Number with Highest Transactions:{" "}
                {winningBlock.blockNumber?.toString()}
              </p>
              <p>
                Transactions Count: {winningBlock.transactionsCount.toString()}
              </p>
            </div>
          ) : (
            <p>
              It's a tie! Both blocks have the same number of transactions:{" "}
              {winningBlock.transactionsCount.toString()}
            </p>
          )
        ) : (
          <p>Please enter block numbers to compare.</p>
        )}
      </div>

      {/* Módulo 2: Transacciones en bloques consecutivos de 10 */}
      <div className="mt-8 rounded-[5px] bg-base-100 border border-gradient p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">
          Winning Block in the Next 10 Blocks (useScaffoldTxBatch)
        </h2>
        <label className="block text-sm font-medium mb-2">
          From Block (Starting Block Number):
        </label>
        <InputBase
          value={startBlock}
          onChange={handleStartBlockChange}
          placeholder="Enter starting block number"
        />
        {isLoadingBlocks10 ? (
          <p>Loading transaction info for blocks...</p>
        ) : blockError10 ? (
          <p>Error loading transaction info: {blockError10}</p>
        ) : winningBlockIn10 ? (
          <div>
            <p>
              Block Number with Highest Transactions:{" "}
              {winningBlockIn10.blockNumber}
            </p>
            <p>Transactions Count: {winningBlockIn10.transactionsCount}</p>
          </div>
        ) : (
          <p>Please enter a block number to fetch transactions.</p>
        )}
      </div>

      {/* Módulo 3: Transacciones en bloques consecutivos de 100 */}
      <div className="mt-8 rounded-[5px] bg-base-100 border border-gradient p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">
          Winning Block in the Next 100 Blocks (useScaffoldTxBatch)
        </h2>
        {isLoadingBlocks100 ? (
          <p>Loading transaction info for blocks...</p>
        ) : blockError100 ? (
          <p>Error loading transaction info: {blockError100}</p>
        ) : winningBlockIn100 ? (
          <div>
            <p>
              Block Number with Highest Transactions:{" "}
              {winningBlockIn100.blockNumber}
            </p>
            <p>Transactions Count: {winningBlockIn100.transactionsCount}</p>
          </div>
        ) : (
          <p>Please enter a block number to fetch transactions.</p>
        )}
      </div>

      {/* Módulo 4: Transacciones en bloques consecutivos de 1000 */}
      <div className="mt-8 rounded-[5px] bg-base-100 border border-gradient p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">
          Winning Block in the Next 1000 Blocks (useScaffoldTxBatch)
        </h2>
        {isLoadingBlocks1000 ? (
          <p>Loading transaction info for blocks...</p>
        ) : blockError1000 ? (
          <p>Error loading transaction info: {blockError1000}</p>
        ) : winningBlockIn1000 ? (
          <div>
            <p>
              Block Number with Highest Transactions:{" "}
              {winningBlockIn1000.blockNumber}
            </p>
            <p>Transactions Count: {winningBlockIn1000.transactionsCount}</p>
          </div>
        ) : (
          <p>Please enter a block number to fetch transactions.</p>
        )}
      </div>
    </div>
  );
};

export default HooksExample;
