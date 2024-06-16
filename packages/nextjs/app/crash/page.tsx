"use client";


import { useState } from 'react';

const Crash = () => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [cashoutAt, setCashoutAt] = useState<number>(2.00);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-md w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button className="bg-gray-700 py-2 px-4 rounded-md">Manual</button>
        {/* <button className="bg-gray-800 py-2 px-4 rounded-md">Auto</button> */}
      </div>

      <div className="mb-4">
        <label className="block text-sm">Bet Amount</label>
        <input
          type="number"
          className="w-full p-2 bg-gray-800 rounded-md"
          value={betAmount}
          onChange={(e) => setBetAmount(parseFloat(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm">Cashout At</label>
        <input
          type="number"
          className="w-full p-2 bg-gray-800 rounded-md"
          value={cashoutAt}
          onChange={(e) => setCashoutAt(parseFloat(e.target.value))}
        />
      </div>

      <button className="w-full bg-green-600 py-2 rounded-md">Bet</button>

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
          <div className="bg-yellow-500 h-2 flex-grow"></div>
          <div className="ml-2">1.25x</div>
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
