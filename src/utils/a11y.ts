import { useRef } from "react";

/**
 * Announce a message for screen readers (ARIA live region).
 * Usage:
 *   const announce = useA11yAnnouncement();
 *   announce("This is an important message");
 */
export function useA11yAnnouncement() {
  // Use a ref so the component doesn't rerender on every announce
  const regionId = "mapsearch-announcement";

  return (message: string) => {
    const region = document.getElementById(regionId);
    if (region) {
      // Clear previous content so repeat announcements work
      region.textContent = "";
      // Delay to ensure screen readers announce repeated values
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  };
}