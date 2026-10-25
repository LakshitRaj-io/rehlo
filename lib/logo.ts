/**
 * The REHLO logo as SVG: heavy black "REHL" and the lime door "O" (black arch, lime
 * panel, black knob). Used for the favicon, the Apple touch icon and the link-preview
 * image, and mirrored in public/logo.svg.
 */
const INK = "#171717";
const LIME = "#c6ff3d";

const LETTERS = [
  // R (outer shape with the bowl's counter cut out)
  "M0 0H112C160 0 190 30 190 70C190 100 176 121 151 131L193 243H125L92 141H62V243H0ZM62 50V95H105C121 95 129 85 129 72C129 59 121 50 105 50Z",
  // E
  "M205 0H355V48H267V97H345V145H267V195H355V243H205Z",
  // H
  "M366 0H428V95H496V0H558V243H496V145H428V243H366Z",
  // L
  "M569 0H631V193H705V243H569Z",
].join("");

/** The door: black arch outline, lime panel, knob. Drawn at x = dx. */
function door(dx: number): string {
  return [
    `<path fill="${INK}" d="M${dx} 243V110A110 110 0 0 1 ${dx + 220} 110V243Z"/>`,
    `<path fill="${LIME}" d="M${dx + 32} 211V110A78 78 0 0 1 ${dx + 188} 110V211Z"/>`,
    `<circle fill="${INK}" cx="${dx + 142}" cy="161" r="19"/>`,
  ].join("");
}

/** Full wordmark, 937 × 243. */
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 937 243"><path fill="${INK}" fill-rule="evenodd" d="${LETTERS}"/>${door(717)}</svg>`;

/** Door mark alone, square, for the browser tab. */
export const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -18 276 276">${door(0)}</svg>`;

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
