"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  const isDarkMode = useMemo(() => {
    return resolvedTheme === "dark";
  }, [resolvedTheme]);

  return (
    <div
      className={`flex space-x-2 h-5 items-center justify-center text-sm border-l border-neutral px-4 ${className}`}
    >
      {
        <label
          htmlFor="theme-toggle"
          className={`swap swap-rotate ${!isDarkMode ? "swap-active" : ""}`}
          onClick={handleToggle}
        >
          <SunIcon className="swap-on h-5 w-5" />
          <MoonIcon className="swap-off h-5 w-5" />
        </label>
      }
    </div>
  );
};
