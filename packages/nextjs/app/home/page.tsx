import React from "react";
import Image from "next/image";
import LinearGradient from "~~/Uikit/components/ui/linear-gradient";
import { BentoGrid, BentoGridItem } from "~~/Uikit/components/ui/bento-grid";
import { Clipboard, Copy, FileIcon, FileSignature, Table } from "lucide-react";
import { WobbleCard } from "~~/Uikit/components/ui/wobble-card";

const Noise = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-10 [mask-image:radial-gradient(#fff,transparent,75%)]"
      style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "30%",
      }}
    ></div>
  );
};
const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl   dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]  border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black"></div>
);
const items = [
  {
    title: "The Dawn of Innovation",
    description: "Explore the birth of groundbreaking ideas and inventions.",
    header: <Noise />,
    className: "md:col-span-2",
    icon: <Clipboard className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Digital Revolution",
    description: "Dive into the transformative power of technology.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <FileIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Art of Design",
    description: "Discover the beauty of thoughtful and functional design.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <FileSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Power of Communication",
    description:
      "Understand the impact of effective communication in our lives.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <Table className="h-4 w-4 text-neutral-500" />,
  },
];

function Home() {
  return (
    <div className="bg-[#141438] min-h-screen flex justify-center px-4">
      <LinearGradient />
      <div className=" mx-auto w-full max-w-7xl pt-12">
        {/* <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={item.className}
              icon={item.icon}
            />
          ))}
        </BentoGrid> */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
          <WobbleCard
            containerClassName="col-span-1 lg:col-span-2 h-full bg-[#f2a900e3] min-h-[500px] lg:min-h-[300px]"
            className=""
          >
            <div className="max-w-xs">
              <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                OP_CAT Myth or reality?
              </h2>
              <p className="mt-4 text-left  text-base/6 text-neutral-200">
                The one thing required to make Starknet the first L2. Will It
                really happen and when?
              </p>
            </div>
            <Image
              src="/bitcoin1.png"
              width={500}
              height={500}
              alt="bitcoin token image"
              className="absolute -right-4 lg:-right-[30%] grayscale filter -bottom-52 object-contain rounded-2xl"
            />
          </WobbleCard>
          <WobbleCard containerClassName="col-span-1 min-h-[300px]">
            <h2 className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
              Will we have more than 8 users on Starknet ?
            </h2>
            <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
              If someone yells ”SCAM”, <br /> Then say ”Want to bet?”
            </p>
          </WobbleCard>
          <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
            <div className="max-w-sm">
              <h2 className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Is there going to be the Stark token ETF?
              </h2>
              <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
                As main tokens starts to get their ETFs validated, everyone is
                waiting for the stark token so that the token will pump.
              </p>
            </div>
            <Image
              src="/stark.png"
              width={400}
              height={400}
              alt="stark token image"
              className="absolute -right-10 md:-right-[40%] lg:-right-[15%] -bottom-44 object-contain rounded-2xl"
            />
          </WobbleCard>
        </div>
      </div>
    </div>
  );
}

export default Home;
