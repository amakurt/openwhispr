// The control panel loads with "control" in the path (packaged) or ?panel=true
// (dev server); the dictation panel is the plain URL.
export const isControlPanelWindow = (): boolean => {
  if (typeof window === "undefined") return false;
  const { search, pathname } = window.location;
  return pathname.includes("control") || search.includes("panel=true");
};

export const isDictationPanelWindow = (): boolean =>
  typeof window !== "undefined" && !isControlPanelWindow();
