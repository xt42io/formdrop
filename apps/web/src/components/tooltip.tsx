import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        const newPosition =
          spaceAbove < 100 && spaceBelow > spaceAbove ? "bottom" : "top";
        setPosition(newPosition);

        setCoords({
          left: rect.left + rect.width / 2,
          top: newPosition === "top" ? rect.top : rect.bottom,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: coords.left,
              top: coords.top,
              transform: `translateX(-50%) ${
                position === "top"
                  ? "translateY(-100%) translateY(-8px)"
                  : "translateY(8px)"
              }`,
            }}
          >
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg relative">
              {content}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
                  position === "top" ? "-bottom-1" : "-top-1"
                }`}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
