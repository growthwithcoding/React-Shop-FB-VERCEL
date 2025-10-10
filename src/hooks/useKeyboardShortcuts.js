import { useEffect } from "react";

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const keys = s.keys.split("+").map(k => k.trim().toLowerCase());
        const hasCtrlOrCmd = keys.includes("ctrl") || keys.includes("cmd") || keys.includes("⌘");
        const hasShift = keys.includes("shift");
        const hasAlt = keys.includes("alt");
        const mainKey = keys.find(k => !["ctrl", "cmd", "⌘", "shift", "alt"].includes(k));
        
        const ctrlMatch = hasCtrlOrCmd ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = hasShift ? e.shiftKey : !e.shiftKey;
        const altMatch = hasAlt ? e.altKey : !e.altKey;
        const keyMatch = mainKey ? e.key.toLowerCase() === mainKey : true;
        
        return ctrlMatch && shiftMatch && altMatch && keyMatch;
      });
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
