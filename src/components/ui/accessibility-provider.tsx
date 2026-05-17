"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface AccessibilitySettings {
  fontSize: "normal" | "large" | "extra-large";
  reduceAnimations: boolean;
  highContrast: boolean;
}

const defaults: AccessibilitySettings = {
  fontSize: "normal",
  reduceAnimations: false,
  highContrast: false,
};

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
}>({ settings: defaults, updateSetting: () => {} });

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaults);

  useEffect(() => {
    const saved = localStorage.getItem("bergspace-accessibility");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("bergspace-accessibility", JSON.stringify(settings));

    // Apply font size to html
    const html = document.documentElement;
    html.style.fontSize = settings.fontSize === "large" ? "17px" : settings.fontSize === "extra-large" ? "19px" : "15px";

    // Apply reduce animations
    if (settings.reduceAnimations) {
      html.classList.add("reduce-motion");
    } else {
      html.classList.remove("reduce-motion");
    }

    // Apply high contrast
    if (settings.highContrast) {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }
  }, [settings]);

  function updateSetting<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
