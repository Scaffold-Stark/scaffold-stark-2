export const SkeletonShort = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex items-center space-y-6">
        <div className="h-3 w-28 bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};

export const SkeletonLong = () => {
  return (
    <div className="animate-pulse flex space-x-4">
      <div className="flex items-center space-y-6 w-full">
        <div className="h-8 w-full bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};

export const SkeletonHeader = () => {
  return (
    <div className="animate-pulse flex space-x-4 h-full">
      <div className="flex items-center space-y-6 w-full">
        <div className="h-full w-full bg-slate-300 rounded"></div>
      </div>
    </div>
  );
};
