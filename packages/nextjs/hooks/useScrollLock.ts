import { useEffect } from "react";

/**
 * Locks or unlocks scrolling on the page, useful for modals and overlays.
 *
 * @param isLocked - Boolean to lock (true) or unlock (false) scrolling
 *
 * @see https://scaffoldstark.com/docs/hooks/
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      const scrollPos = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPos}px`;
      document.body.style.width = "100%";
    } else {
      const scrollPos = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollPos || "0") * -1);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isLocked]);
};
