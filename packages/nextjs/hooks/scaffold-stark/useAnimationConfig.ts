import { useEffect, useState } from "react";

const ANIMATION_TIME = 2000;

/**
 * Provides animation state for UI elements when the input data changes.
 *
 * @param data - The data to watch for changes
 * @returns {Object} An object containing:
 *   - showAnimation: Boolean indicating if the animation should be shown
 *
 * @see https://scaffoldstark.com/docs/
 */
export function useAnimationConfig(data: any) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [prevData, setPrevData] = useState();

  useEffect(() => {
    if (prevData !== undefined && prevData !== data) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), ANIMATION_TIME);
    }
    setPrevData(data);
  }, [data, prevData]);

  return {
    showAnimation,
  };
}
