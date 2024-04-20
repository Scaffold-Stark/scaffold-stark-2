import React, { useState } from "react";
import Image from "next/image";
import Button from "~~/components/Button/Button";

interface ChallengeCardProps {
  challenge: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  onButtonClick: () => void;
  border?: boolean;
  end?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  title,
  imageUrl,
  buttonText,
  onButtonClick,
  description,
  border = true,
  end = false,
}) => {
  return (
    <div
      className={`flex max-w-[1280px] w-full lg:text-[12px] sm:text-[12px] lg:text-sm ${border ? "border-b-2 border-base-300 sm:border-b-[1px]" : ""}`}
    >
      <div className="flex">
        <div
          className={`w-[34px] ${end ? "h-[50%] self-end" : "flex"}  border-l-[5px] border-base-300 lg:border-l-[3px] sm:border-l-[3px]`}
        >
          <div className="w-[30px] h-[30px] rounded-full border-base-300 border-[5px] self-center traslate-circule bg-base-100 sm:w-[15px] sm:h-[15px] lg:border-[3px] lg:h-[15px] lg:w-[15px] sm:border-[3px] "></div>
        </div>
      </div>
      <div className=" flex flex-1 justify-between py-[20px] sm:flex-col-reverse sm:gap-2 items-center ">
        <div className="max-w-[500px] flex flex-col gap-4 ">
          <span>{challenge}</span>
          <h2 className="text-2xl sm:text-[16px] sm:m-0">{title}</h2>
          <p className="sm:m-0 leading-7 sm:text-xs">{description}</p>
          <div className="sm:pt-[10px]">
            <Button
              onClick={onButtonClick}
              isDisable={buttonText === "COMING SOON"}
            >
              {buttonText}
            </Button>
          </div>
        </div>
        <div>
          <Image
            src={imageUrl}
            alt="image challenge"
            width={490}
            height={300}
            className="sm:max-w-[350px] sm:w-full lg:max-w-[350px]"
          />
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
