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
        <div className={`flex max-w-[1280px] w-full  ${border ? 'border-b border-[#191972]' : ''}`}>
            <div className="flex">
                <div className={`w-[34px] ${end? "h-[50%] self-end":"flex"}  border-l-[5px] border-[#191972]`}>
                    <div
                        className="w-[30px] h-[30px] rounded-full border-[#191972] border-[5px] self-center traslate-circule bg-white"></div>
                </div>
            </div>
            <div className=" flex flex-1 justify-between py-10 px-10 ">
                <div className="max-w-[500px] flex flex-col gap-4">
                    <span>{challenge}</span>
                    <h2 className="text-2xl">{title}</h2>
                    <p>{description}</p>
                    <div>
                        <Button onClick={onButtonClick}>{buttonText}</Button>
                    </div>
                </div>
                <div>
                    <Image src={imageUrl} alt="image challenge" width={500} height={340}/>
                </div>
            </div>

        </div>
    );
};

export default ChallengeCard;
