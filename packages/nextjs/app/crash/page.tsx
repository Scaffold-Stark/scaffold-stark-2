"use client";


import { useState, useEffect } from 'react';

const Crash = () => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [cashoutAt, setCashoutAt] = useState<number>(2.00);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [roundActive, setRoundActive] = useState<boolean>(false);
  const [randomCrash, setRandomCrash] = useState<number>(Math.random() * 5 + 1);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (roundActive && !isCrashed) {
      interval = setInterval(() => {
        setCurrentMultiplier((prev) => {
          if (prev >= randomCrash) {
            setIsCrashed(true);
            clearInterval(interval as NodeJS.Timeout);
            return prev;
          }
          return prev + 0.01;
        });
      }, 100);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [roundActive, isCrashed, randomCrash]);

  const startRound = () => {
    setBetAmount(0);
    setCurrentMultiplier(1.0);
    setIsCrashed(false);
    setRandomCrash(Math.random() * 5 + 1);
    setRoundActive(true);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-md w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button className="bg-gray-700 py-2 px-4 rounded-md">Manual</button>
        <button className="bg-gray-800 py-2 px-4 rounded-md">Auto</button>
      </div>

      <div className="mb-4">
        <label className="block text-sm">Bet Amount</label>
        <input
          type="number"
          className="w-full p-2 bg-gray-800 rounded-md"
          value={betAmount}
          onChange={(e) => setBetAmount(parseFloat(e.target.value))}
          disabled={roundActive}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm">Cashout At</label>
        <input
          type="number"
          className="w-full p-2 bg-gray-800 rounded-md"
          value={cashoutAt}
          onChange={(e) => setCashoutAt(parseFloat(e.target.value))}
          disabled={roundActive}
        />
      </div>

      <button
        className="w-full bg-green-600 py-2 mb-3 rounded-md"
        onClick={startRound}
        disabled={roundActive}
      >
        Bet
      </button>

      <button
        className="w-full bg-red-600 py-2 rounded-md"
        onClick={startRound}
        disabled={roundActive}
      >
        Stop
      </button>

      <div className="mt-4 bg-gray-800 p-2 rounded-md">
        <h3 className="text-lg mb-2">Profit on Win</h3>
        <div className="text-xl">{(betAmount * cashoutAt).toFixed(8)} ETH</div>
      </div>

      <div className="mt-4 bg-gray-800 p-2 rounded-md">
        <h3 className="text-lg mb-2">Bet History</h3>
        <ul className="text-sm">
          <li>Hidden - ₹25.00</li>
          <li>Hidden - ₹62.19</li>
          <li>Hidden - ₹62.50</li>
        </ul>
      </div>

      <div className="mt-4">
        <div className="flex items-center">
          <div className={`h-2 flex-grow ${isCrashed ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <div className="ml-2">{currentMultiplier.toFixed(2)}x</div>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span>0s</span>
          <span>4s</span>
        </div>
      </div>
    </div>
  );
};

export default Crash;
