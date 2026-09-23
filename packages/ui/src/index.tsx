import type { CSSProperties } from "react";

export { LessonExperiencePreview } from "./lesson-experience-preview";

export function DraftwiseBrand({
  className,
  href = "/",
  inverted = false,
  suffix,
}: {
  className?: string;
  href?: string;
  inverted?: boolean;
  suffix?: string;
}) {
  const markStyle: CSSProperties = {
    alignItems: "center",
    background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
    borderRadius: "12px",
    boxShadow: "0 4px 14px rgb(2 132 199 / 20%)",
    color: "#ffffff",
    display: "inline-flex",
    fontSize: "16px",
    fontWeight: 900,
    height: "36px",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "36px",
  };

  return (
    <a
      className={className}
      href={href}
      style={{
        alignItems: "center",
        color: inverted ? "#FFFFFF" : "#0f172a",
        display: "inline-flex",
        fontSize: "20px",
        fontWeight: 800,
        gap: "10px",
        letterSpacing: "-0.04em",
        textDecoration: "none",
      }}
    >
      <span style={markStyle}>
        D
        <span
          style={{
            background: "#10b981",
            borderRadius: "999px",
            height: "10px",
            position: "absolute",
            right: "-2px",
            top: "-2px",
            width: "10px",
          }}
        />
      </span>
      <span style={{ color: inverted ? "#FFFFFF" : "#0f172a" }}>Draftwise{suffix ? ` ${suffix}` : ""}</span>
    </a>
  );
}
