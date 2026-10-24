import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "REHLO — Student Housing near SRM KTR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#171717",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              background: "#c6ff3d",
              color: "#171717",
              padding: "8px 20px",
              fontSize: "20px",
              fontWeight: 800,
              textTransform: "uppercase" as const,
              letterSpacing: "0.04em",
            }}
          >
            Student Housing Platform
          </div>
        </div>
        <div
          style={{
            color: "#fffdf7",
            fontSize: "80px",
            fontWeight: 800,
            lineHeight: 0.95,
            textTransform: "uppercase" as const,
            letterSpacing: "-0.03em",
          }}
        >
          REHLO
        </div>
        <div
          style={{
            color: "#c6ff3d",
            fontSize: "48px",
            fontWeight: 800,
            marginTop: "12px",
            textTransform: "uppercase" as const,
            letterSpacing: "-0.02em",
          }}
        >
          Find your place near SRM KTR
        </div>
        <div
          style={{
            color: "#fffdf7",
            fontSize: "24px",
            marginTop: "32px",
            opacity: 0.8,
          }}
        >
          PGs · Flats · Rooms · Flatmates · Home Services · Kattankulathur, Chennai
        </div>
      </div>
    ),
    { ...size }
  );
}
