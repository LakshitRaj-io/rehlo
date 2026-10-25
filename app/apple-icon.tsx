import { ImageResponse } from "next/og";
import { MARK_SVG, svgDataUri } from "@/lib/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon on iPhone / iPad: the door mark on white (iOS doesn't allow transparency). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ background: "#ffffff", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={svgDataUri(MARK_SVG)} width={150} height={150} alt="" />
      </div>
    ),
    { ...size },
  );
}
