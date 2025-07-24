import React, { useEffect } from "react";

/**
 * Detects clicks outside a specified element and triggers a callback.
 *
 * @param ref - React ref to the element to monitor
 * @param handler - Callback function to call on outside click
 *
 * @see https://scaffoldstark.com/docs/
 */
export const useOutsideClick = (
  ref: React.RefObject<HTMLElement | null>,
  callback: { (): void },
) => {
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [ref, callback]);
};
