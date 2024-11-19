import CustomModal from "./CustomModal";
import { useState } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import ConnectModal from "~~/components/scaffold-stark/CustomConnectButton/ConnectModal";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { SkeletonLong, SkeletonShort, SkeletonHeader } from "./skeletons";

export const BentoGrid = ({
  isLoading,
  className,
  children,
}: {
  isLoading: boolean;
  className?: string;
  children?: React.ReactNode;
}) => {
  const arr = new Array(3).fill(0);
  if (isLoading) {
    return (
      <div
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-1 gap-10 md:auto-rows-[18rem]",
          className,
        )}
      >
        {arr.map((_, i) => (
          <div
            key={i}
            className={cn(
              "group/bento relative row-span-1 flex h-full w-full flex-col justify-between space-y-4 rounded-xl border border-border bg-background p-4 shadow-input transition duration-200 hover:shadow-xl dark:shadow-none",
              className,
            )}
          >
            {<SkeletonLong />}
            {<SkeletonShort />}
            {<SkeletonHeader />}
            <div className="transition duration-200 group-hover/bento:translate-x-2">
              <div className="mb-2 mt-2 font-sans font-bold text-neutral-600 dark:text-neutral-200"></div>
              <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                {<SkeletonLong />}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-10 md:auto-rows-[18rem]",
        className,
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

  return (
    <>
      <div
        className={cn(
          "group/bento relative row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-6 shadow-input transition duration-200 hover:shadow-xl",
          className,
        )}
      >
        <div className="space-y-2">
          <div className="font-sans text-xl font-bold text-foreground">
            {title}
          </div>
          <div className="!mb-6 font-sans text-xs font-normal text-muted-foreground">
            {description}
          </div>
        </div>
        {headerTitle}

        {header}
        <div className="duration-20 w-[160%] self-center transition">
          {/*  {icon} */}
          <div className="flex w-full justify-evenly">
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
