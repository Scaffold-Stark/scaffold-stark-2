import React, { useEffect } from "react";

/**
 * Handles clicks outside of a referenced element.
 * This hook adds a click event listener to the document and calls the provided callback
 * function when a click occurs outside the referenced element.
 *
 * @param ref - React ref of the element to monitor for outside clicks, typed as React.RefObject<HTMLElement | null>
 * @param callback - Function to call when a click occurs outside the referenced element
 * @returns {void} This hook doesn't return any value
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
