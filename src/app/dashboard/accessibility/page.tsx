"use client";

import { useAccessibility } from "@/components/ui/accessibility-provider";

export default function AccessibilityPage() {
  const { settings, updateSetting } = useAccessibility();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Accessibility</h1>
      <p className="text-[#8C8578]">Customize your BergSpace experience for better readability and comfort.</p>

      <div className="bg-white border border-[#E8E2D6] rounded-xl divide-y divide-[#E8E2D6]">
        {/* Text Size */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-[#1A1A1A]">Text Size</p>
            <p className="text-sm text-[#8C8578] mt-1">Adjust font size across the portal</p>
          </div>
          <div className="flex gap-2">
            {(["normal", "large", "extra-large"] as const).map(size => (
              <button
                key={size}
                onClick={() => updateSetting("fontSize", size)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  settings.fontSize === size ? "text-white" : "bg-[#F5F1EA] text-[#5C564C] hover:bg-[#E8E2D6]"
                }`}
                style={settings.fontSize === size ? { backgroundColor: "#C45A2D" } : {}}
              >
                {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </div>
        {/* Reduce Animations */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-[#1A1A1A]">Reduce Animations</p>
            <p className="text-sm text-[#8C8578] mt-1">Minimize motion for comfort</p>
          </div>
          <button
            onClick={() => updateSetting("reduceAnimations", !settings.reduceAnimations)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: settings.reduceAnimations ? "#C45A2D" : "#E8E2D6" }}
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ left: settings.reduceAnimations ? "24px" : "4px" }} />
          </button>
        </div>
        {/* High Contrast */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-[#1A1A1A]">High Contrast</p>
            <p className="text-sm text-[#8C8578] mt-1">Stronger borders and darker text</p>
          </div>
          <button
            onClick={() => updateSetting("highContrast", !settings.highContrast)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: settings.highContrast ? "#C45A2D" : "#E8E2D6" }}
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ left: settings.highContrast ? "24px" : "4px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
