import { cn } from "../Uikit/lib/utils";

const SkeletonShort = () => {
  return (
    <div className="flex animate-pulse space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

const SkeletonLong = () => {
  return (
    <div className="flex animate-pulse space-x-4">
      <div className="flex w-full items-center space-y-6">
        <div className="h-8 w-full rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

const SkeletonHeader = () => {
  return (
    <div className="flex h-full animate-pulse space-x-4">
      <div className="flex w-full items-center space-y-6">
        <div className="h-full w-full rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

export function BetOverviewSkeletons() {
  return (
    <div
      className={cn(
        "group/bento relative row-span-1 flex h-full w-full flex-col justify-between space-y-4 rounded-xl border border-border bg-background p-4 shadow-input transition duration-200 hover:shadow-xl dark:shadow-none",
      )}
    >
      {<SkeletonLong />}
      {<SkeletonShort />}
      <div className="flex h-[5rem] animate-pulse space-x-4">
        <div className="flex w-full items-center space-y-6">
          <div className="h-full w-full rounded bg-slate-300"></div>
        </div>
      </div>
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        <div className="mb-2 mt-2 font-sans font-bold text-neutral-600 dark:text-neutral-200"></div>
        <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
          {<SkeletonLong />}
        </div>
      </div>
    </div>
  );
}

function BetsOverviewSkeletons() {
  return (
    <div
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-10 md:auto-rows-[18rem]",
      )}
    >
      {new Array(3).fill(0).map((_, i) => (
        <div
          key={i}
          className={cn(
            "group/bento relative row-span-1 flex h-full w-full flex-col justify-between space-y-4 rounded-xl border border-border bg-background p-4 shadow-input transition duration-200 hover:shadow-xl dark:shadow-none",
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

export default BetsOverviewSkeletons;
