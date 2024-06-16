"use client";



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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Crash = () => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [cashoutAt, setCashoutAt] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [cashedOutMultiplier, setCashedOutMultiplier] = useState<number>(1.0);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [roundActive, setRoundActive] = useState<boolean>(false);
  const [randomCrash, setRandomCrash] = useState<number>(Math.random() * 5 + 1);
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
  }, [currentMultiplier]);

  const startRound = () => {
    setCurrentMultiplier(1.0);
    setIsCrashed(false);
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
  };

  const stopRound = () => {
    setCashedOutMultiplier(currentMultiplier);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-md w-full max-w-4xl mx-auto flex flex-col md:flex-row md:space-x-4">
      <div className="w-full md:w-1/3 mb-4 md:mb-0">
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
            onClick={stopRound}
            disabled={!roundActive}
          >
            Cashout
          </button>
        </div>

        { cashedOutMultiplier == 1.0 ? (
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
            <li>Hidden - ₹25.00</li>
            <li>Hidden - ₹62.19</li>
            <li>Hidden - ₹62.50</li>
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
      </div>
    </div>
  );
};

export default Crash;
