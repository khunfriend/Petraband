import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PETRAband — ระบบจัดการวงดนตรีไทย";

// design-only.md §2 palette
const NAVY_900 = "#0B2540";
const NAVY_800 = "#122E55";
const NAVY_700 = "#1B3A6B";
const BLUE_500 = "#3A6FA8";
const CORAL_500 = "#DD5085";
const PARCHMENT = "#F1ECDF";
const PARCHMENT_SOFT = "#C5D5E5";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: NAVY_900,
          position: "relative",
          padding: "80px",
          color: PARCHMENT,
          fontFamily: "sans-serif",
        }}
      >
        {/* Wave layers — บอกเรื่องคลื่นตาม metaphor */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M0 380 Q 300 320 600 380 T 1200 380 V 630 H 0 Z"
            fill={NAVY_800}
          />
          <path
            d="M0 450 Q 300 400 600 450 T 1200 450 V 630 H 0 Z"
            fill={NAVY_700}
          />
          <path
            d="M0 520 Q 300 490 600 520 T 1200 520 V 630 H 0 Z"
            fill={BLUE_500}
            opacity="0.5"
          />
          {/* ริบบิ้น coral 500 — 1 จุด/viewport */}
          <path
            d="M -50 300 Q 300 200 700 300 T 1250 280"
            fill="none"
            stroke={CORAL_500}
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>

        {/* Foreground */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "820px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: CORAL_500,
            }}
          >
            PETRAband · Design
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.05,
              color: PARCHMENT,
            }}
          >
            ระบบจัดการวงดนตรีไทย
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.5,
              color: PARCHMENT_SOFT,
              maxWidth: "720px",
            }}
          >
            เรือไวกิ้งแล่นผ่านคลื่นหลายชั้น ร้อยด้วยดนตรีไทย
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
