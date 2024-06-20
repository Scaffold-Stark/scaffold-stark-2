import CustomModal from "./CustomModal";
import { useState } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import ConnectModal from "~~/components/scaffold-stark/CustomConnectButton/ConnectModal";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const SkeletonShort = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};

const SkeletonLong = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex items-center space-y-6 w-full">
        <div className="h-3 w-full bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};

const SkeletonHeader = () => {
  return (
    <div className="animate-pulse flex space-x-4 h-full">
      <div className="flex items-center space-y-6 w-full">
        <div className="h-full w-full bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};
export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 gap-10 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  headerTitle,
  className,
  title,
  description,
  header,
  icon,
  isLoading,
  modelTitle,
  modalContent,
}: {
  headerTitle?: string | React.ReactNode;
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  modelTitle?: string;
  modalContent?: React.ReactNode;
}) => {
  const { address, status, chainId, ...props } = useAccount();
  const [modalOpen, setModalOpen] = useState(false);
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-[#141438] dark:border-white/[0.2] bg-white border-transparent justify-between flex flex-col space-y-4 h-full",
          className
        )}
        style={{ backgroundColor: "#20204f" }}
      >
        {<SkeletonHeader />}
        <div className="group-hover/bento:translate-x-2 transition duration-200">
          {icon}
          <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
            {<SkeletonShort />}
          </div>
          <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
            {<SkeletonLong />}
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div
        className={cn(
          "relative row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input bg-card border border-border justify-between flex flex-col space-y-4 p-6",
          className
        )}
      >
        <div className="space-y-2">
          <div className="font-sans font-bold text-xl text-foreground">
            {title}
          </div>
          <div className="font-sans font-normal text-xs text-muted-foreground !mb-6">
            {description}
          </div>
        </div>
        {headerTitle}

        {header}
        <div className="transition duration-20 self-center w-[160%]">
          {/*  {icon} */}
          <div className="w-full flex justify-evenly">
            <span className="font-bold">Yes</span>
            <span className="font-bold">No</span>
          </div>
        </div>
        <Button
          variant={"secondary"}
          className="cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          Make Your Move
        </Button>
      </div>
      {status === "disconnected" ? (
        <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      ) : (
        <CustomModal
          title={modelTitle}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        >
          {modalContent}
        </CustomModal>
      )}
    </>
  );
};
