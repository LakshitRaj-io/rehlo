// Usage: npm run admin:hash -- "your-new-password"
// Prints a SHA-256 hash to place in .env.local (and Vercel env vars) as ADMIN_PASSWORD_HASH.
import { createHash } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Pass a password: npm run admin:hash -- "your-new-password"');
  process.exit(1);
}
const hash = createHash("sha256").update(password).digest("hex");
console.log(`\nADMIN_PASSWORD_HASH=${hash}\n`);
console.log("Add that line to .env.local and to Vercel → Settings → Environment Variables, then restart / redeploy.");
