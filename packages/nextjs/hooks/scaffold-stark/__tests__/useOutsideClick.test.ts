import { renderHook } from "@testing-library/react";
import { useOutsideClick } from "../useOutsideClick";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useOutsideClick", () => {
  let refElement: HTMLElement;
  let callback: () => void;

  beforeEach(() => {
    // Create a mock div element to be used as the ref
    refElement = document.createElement("div");
    document.body.appendChild(refElement);

    // Create a mock callback function
    callback = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(refElement);
    vi.clearAllMocks();
  });

  it("should call the callback when clicking outside the ref element", () => {
    const ref = { current: refElement };
    renderHook(() => useOutsideClick(ref, callback));

    // Simulate a click outside the element
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);

    outsideElement.click();

    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it("should not call the callback when clicking inside the ref element", () => {
    const ref = { current: refElement };
    renderHook(() => useOutsideClick(ref, callback));

    // Simulate a click inside the ref element
    refElement.click();

    expect(callback).not.toHaveBeenCalled();
  });

  it("should remove event listener on unmount", () => {
    const ref = { current: refElement };
    const { unmount } = renderHook(() => useOutsideClick(ref, callback));

    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    // Unmount the hook
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });
});
