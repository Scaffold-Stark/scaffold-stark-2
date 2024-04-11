import React from 'react';
import Image from 'next/image';
import Button from "~~/components/Button/Button";

interface ChallengeCardProps {
    challenge: string;
    title: string;
    description:string;
    imageUrl: string;
    buttonText: string;
    onButtonClick: () => void;
    border?:boolean;
    end?:boolean

}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, title, imageUrl, buttonText, onButtonClick,description,border=true, end=false  }) => {
    return (

        <div className={`flex max-w-[1280px] w-full sm:text-sm  lg:text-sm ${border ? 'border-b-2 border-base-300' : ''}`}>
            <div className="flex">
                <div className={`w-[34px] ${end? "h-[50%] self-end":"flex"}  border-l-[5px] border-base-300`}>
                    <div
                        className="w-[30px] h-[30px] rounded-full border-base-300 border-[5px] self-center traslate-circule bg-base-100 sm:w-[15px] sm:h-[15px]"></div>
                </div>
            </div>
            <div className=" flex flex-1 justify-between py-[20px] sm:flex-col-reverse sm:gap-3 items-center ">
                <div className="max-w-[500px] flex flex-col gap-4">
                    <span>{challenge}</span>
                    <h2 className="text-2xl">{title}</h2>
                    <p className="sm:text-justify ">{description}</p>
                    <div>
                        <Button onClick={onButtonClick}>{buttonText}</Button>
                    </div>
                </div>
                <div>
                    <Image src={imageUrl} alt="image challenge" width={490} height={300} className="sm:max-w-[350px] sm:w-full lg:max-w-[350px]"/>
                </div>
            </div>

        </div>
    );
};

export default ChallengeCard;
