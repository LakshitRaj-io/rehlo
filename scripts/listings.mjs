// Manage REHLO listings through the /api/v1 listings API.
//
//   npm run listings -- add listings/estancia.json   create every listing in the file
//   npm run listings -- list                          show all listings
//   npm run listings -- publish <id>                  / unpublish <id>
//   npm run listings -- delete <id>                   also removes its photos and videos
//
// Settings come from the environment or .env.local:
//   LISTINGS_API_KEY  must match the server's key
//   REHLO_API_URL     defaults to http://localhost:3000 (use your Vercel URL for production)
//
// JSON file format ("defaults" are merged into every listing; paths are relative to the file):
//   { "defaults": { "locality": "Potheri", ... },
//     "listings": [ { "title": "...", "monthlyRent": 6400, "photos": ["img/1.jpg"], "videos": ["tour.mp4"] } ] }
// Field names match lib/api.ts. Each listing gets its own copy of every file, so deleting
// one listing never breaks another's photos.
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, resolve } from "node:path";

const TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
};

function loadEnv() {
  const env = { ...process.env };
  const file = resolve(process.cwd(), ".env.local");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

const env = loadEnv();
const BASE = (env.REHLO_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const KEY = env.LISTINGS_API_KEY;
if (!KEY) {
  console.error("Set LISTINGS_API_KEY in .env.local (it must match the server's).");
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { authorization: `Bearer ${KEY}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = json.errors ? ` ${JSON.stringify(json.errors)}` : "";
    throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? res.statusText}${details}`);
  }
  return json;
}

async function uploadFile(path) {
  const contentType = TYPES[extname(path).toLowerCase()];
  if (!contentType) throw new Error(`Unsupported file type: ${path}`);
  const bytes = readFileSync(path);
  const kind = contentType.startsWith("video/") ? "video" : "image";
  const ticket = await api("POST", "/uploads", { kind, contentType, size: statSync(path).size });
  const put = await fetch(ticket.signedUrl, {
    method: "PUT",
    headers: { "content-type": contentType, "cache-control": "max-age=31536000", "x-upsert": "false" },
    body: bytes,
  });
  if (!put.ok) throw new Error(`Upload of ${path} failed: ${put.status} ${await put.text()}`);
  return ticket.publicUrl;
}

async function resolveMedia(list, baseDir) {
  const out = [];
  for (const item of list ?? []) {
    if (/^https?:\/\//.test(item) || item.startsWith("/")) out.push(item);
    else out.push(await uploadFile(isAbsolute(item) ? item : resolve(baseDir, item)));
  }
  return out;
}

async function add(file) {
  const path = resolve(file);
  const spec = JSON.parse(readFileSync(path, "utf8"));
  const baseDir = dirname(path);
  const entries = Array.isArray(spec) ? spec : spec.listings;
  for (const entry of entries) {
    const { photos, videos, ...fields } = { ...(spec.defaults ?? {}), ...entry };
    process.stdout.write(`• ${fields.title}: uploading ${photos?.length ?? 0} photo(s), ${videos?.length ?? 0} video(s)… `);
    const body = {
      ...fields,
      images: [...(fields.images ?? []), ...(await resolveMedia(photos, baseDir))],
      videos: [...(fields.videos ?? []), ...(await resolveMedia(videos, baseDir))],
    };
    const res = await api("POST", "/listings", body);
    console.log(`created ${res.listing.id}${res.url ? `  ${res.url}` : " (draft)"}`);
  }
}

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === "add" && arg) await add(arg);
  else if (cmd === "list") {
    const { listings } = await api("GET", "/listings");
    for (const l of listings) console.log(`${l.id}  ${l.published ? "live " : "draft"}  ₹${l.monthlyRent}/person  ${l.title}`);
  } else if ((cmd === "publish" || cmd === "unpublish") && arg) {
    const { url } = await api("PATCH", `/listings/${arg}`, { published: cmd === "publish" });
    console.log(cmd === "publish" ? `live: ${url}` : "unpublished");
  } else if (cmd === "delete" && arg) {
    await api("DELETE", `/listings/${arg}`);
    console.log("deleted");
  } else {
    console.log("Usage: npm run listings -- add <file.json> | list | publish <id> | unpublish <id> | delete <id>");
  }
} catch (e) {
  console.error(`\n${e.message}`);
  process.exit(1);
}
