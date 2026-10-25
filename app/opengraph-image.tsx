import { ImageResponse } from "next/og";
import { LOGO_SVG, svgDataUri } from "@/lib/logo";

export const alt = "REHLO — verified flats, PGs and rooms near SRM KTR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "Verified flats, PGs and rooms near SRM KTR";

/** Link preview (WhatsApp, LinkedIn, X…): the REHLO logo on white with a short tagline. */
export default async function Image() {
  const logoWidth = 820;
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "48px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={svgDataUri(LOGO_SVG)} width={logoWidth} height={Math.round((logoWidth * 243) / 937)} alt="" />
        <div
          style={{
            display: "flex",
            background: "#c6ff3d",
            color: "#171717",
            border: "4px solid #171717",
            padding: "12px 28px",
            fontSize: "34px",
            gap: "10px",
          }}
        >
          {/* One span per word with a fixed gap: the image renderer's own word spacing is uneven. */}
          {TAGLINE.split(" ").map((word, i) => (
            <span key={i}>{word}</span>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
