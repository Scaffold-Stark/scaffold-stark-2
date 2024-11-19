export const SkeletonShort = () => {
  return (
    <div className="flex animate-pulse space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

export const SkeletonLong = () => {
  return (
    <div className="flex animate-pulse space-x-4">
      <div className="flex w-full items-center space-y-6">
        <div className="h-8 w-full rounded bg-slate-300"></div>
      </div>
    </div>
  );
};

export const SkeletonHeader = () => {
  return (
    <div className="flex h-full animate-pulse space-x-4">
      <div className="flex w-full items-center space-y-6">
        <div className="h-full w-full rounded bg-slate-300"></div>
      </div>
    </div>
  );
};
