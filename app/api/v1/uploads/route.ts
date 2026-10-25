import { z } from "zod";
import { apiError, checkApiKey } from "@/lib/api";
import { createUploadTicket } from "@/lib/db/uploads";
import { fieldErrors } from "@/lib/validation";
import { readJson } from "../listings/shared";

const body = z.object({
  kind: z.enum(["image", "video"]),
  contentType: z.string(),
  size: z.number().int().positive(),
});

/**
 * POST /api/v1/uploads — get a one-off signed URL, then PUT the file bytes to it
 * (with the same Content-Type) and use `publicUrl` in a listing's images/videos.
 * Files go straight to Supabase Storage, so videos aren't limited by Vercel's
 * request size cap.
 */
export async function POST(req: Request) {
  const denied = checkApiKey(req);
  if (denied) return denied;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return apiError(400, "Send { kind, contentType, size }", fieldErrors(parsed.error));
  const ticket = await createUploadTicket("listings", parsed.data.kind, parsed.data.contentType, parsed.data.size);
  return ticket.ok ? Response.json(ticket) : apiError(400, ticket.error);
}
