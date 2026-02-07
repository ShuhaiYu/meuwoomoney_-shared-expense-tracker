import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#F4A261",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Cat paw icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="none"
        >
          {/* Main pad */}
          <ellipse cx="12" cy="16" rx="4.5" ry="5" fill="white" />
          {/* Top-left toe */}
          <ellipse cx="6" cy="7.5" rx="2.2" ry="2.8" fill="white" />
          {/* Top-right toe */}
          <ellipse cx="18" cy="7.5" rx="2.2" ry="2.8" fill="white" />
          {/* Middle-left toe */}
          <ellipse cx="4" cy="12.5" rx="2.2" ry="2.8" fill="white" />
          {/* Middle-right toe */}
          <ellipse cx="20" cy="12.5" rx="2.2" ry="2.8" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
