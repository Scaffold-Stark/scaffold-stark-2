import React from "react";

interface StepInstructionProps {
  number: number;
  text: string;
}

const StepInstruction: React.FC<StepInstructionProps> = ({ number, text }) => {
  return (
    <div className=" flex flex-col items-center gap-3 max-w-[500px] justify-center sm:text-[12px] sm:gap-1">
      <div className="w-6 h-6 rounded-full bg-gradient-linear text-white text-center sm:w-5 sm:h-5">
        {number}
      </div>
      <span className="text-center text-[16px] sm:text-xs ">{text}</span>
    </div>
  );
};

export default StepInstruction;
