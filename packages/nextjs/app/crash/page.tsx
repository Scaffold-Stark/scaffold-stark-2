"use client";


import type { NextPage } from "next";
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { notification } from "~~/utils/scaffold-stark";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Crash: NextPage = () => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [cashoutAt, setCashoutAt] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [cashedOutMultiplier, setCashedOutMultiplier] = useState<number>(1.0);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [roundActive, setRoundActive] = useState<boolean>(false);
  const [randomCrash, setRandomCrash] = useState<number>(Math.random() * 2 + 1);
  const [betHistory, setBetHistory] = useState<number[]>([]);
  const [time, setTime] = useState<number>(0);
  const [data, setData] = useState<{ labels: number[]; datasets: any[] }>({
    labels: [],
    datasets: [
      {
        label: 'Multiplier',
        data: [],
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
      },
    ],
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (roundActive && !isCrashed) {
      interval = setInterval(() => {
        setCurrentMultiplier((prev) => {
          if (prev >= randomCrash) {
            setIsCrashed(true);
            clearInterval(interval as NodeJS.Timeout);
            setRoundActive(false);
            return prev;
          }
          return prev + 0.01;
        });
        setTime((prev) => prev + 0.1);
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

  useEffect(() => {
    if (roundActive) {
      setData((prevData) => ({
        labels: [...prevData.labels, time],
        datasets: [
          {
            ...prevData.datasets[0],
            data: [...prevData.datasets[0].data, currentMultiplier.toFixed(2)],
          },
        ],
      }));
    }
    if (currentMultiplier >= cashoutAt) {
      cashoutRound();
    }
  }, [currentMultiplier]);

  useEffect(() => {
    if (isCrashed) {
      setBetHistory((prev) => [...prev, betAmount]);
    }
  }, [isCrashed]);

  const startRound = () => {
    if (betAmount > 0) {
      setCurrentMultiplier(1.0);
      setIsCrashed(false);
      setIsCashedOut(false);
      setRandomCrash(Math.random() * 5 + 1);
      setRoundActive(true);
      setTime(0);
      setData({
        labels: [],
        datasets: [
          {
            label: 'Multiplier',
            data: [],
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
          },
        ],
      });
    } else {
      notification.warning('Please enter a valid bet amount');
    }
  };

  const cashoutRound = () => {
    if (!isCashedOut) {
      setIsCashedOut(true);
      setCashedOutMultiplier(currentMultiplier);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 mt-12 rounded-md w-full max-w-5xl mx-auto flex flex-col md:flex-row md:space-x-8">
      <div className="w-full md:w-1/3 mb-4 md:mb-0">
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
            disabled={roundActive}
            required
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

        <div className="flex justify-between">
          <button
            className="w-1/2 bg-green-600 py-2 rounded-md mr-2"
            onClick={startRound}
            disabled={roundActive}
          >
            Bet
          </button>

          <button
            className="w-1/2 bg-red-600 py-2 rounded-md ml-2"
            onClick={cashoutRound}
            disabled={!roundActive || isCashedOut || isCrashed}
          >
            Cashout
          </button>
        </div>

        { !isCashedOut ? (
            <div className="mt-4 bg-gray-800 p-2 rounded-md">
              <h3 className="text-lg mb-2">Profit on Win</h3>
              <div className="text-xl">{(betAmount * (currentMultiplier - 1)).toFixed(8)} ETH</div>
            </div>
          ):
            <div className="mt-4 bg-gray-800 p-2 rounded-md">
              <h3 className="text-lg mb-2">Profit Won</h3>
              <div className="text-xl">{(betAmount * (cashedOutMultiplier - 1)).toFixed(8)} ETH</div>
            </div>
        }

        <div className="mt-4 bg-gray-800 p-2 rounded-md">
          <h3 className="text-lg mb-2">Bet History</h3>
          <ul className="text-sm">
            {betHistory.map((bet, index) => (
              <li key={index}>Bet {index + 1}: {bet.toFixed(8)} ETH</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full md:w-2/3">
        <div className="relative h-64">
          <Line data={data} options={{ 
            maintainAspectRatio: false, 
            scales: {
              x: {
                ticks: {
                  display: false
                }
              }
            } 
          }}/>
        </div>
        <div className="mt-4">
          <div className="flex items-center">
            <div className={`h-2 flex-grow ${isCrashed ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <div className="ml-2">{currentMultiplier.toFixed(2)}x</div>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>0s</span>
            <span>{time.toFixed(1)}s</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-3xl pt-3 mt-4 mb-3">
            <div className="ml-2">{currentMultiplier.toFixed(2)}x</div>
          </div>
          <br/>
          { isCashedOut && (
            <div className="flex items-center">
              <div className="ml-2 text-lg">Cashed out at {cashedOutMultiplier.toFixed(2)}x</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Crash;
